import { supabase } from '@/integrations/supabase/client';
import { authenticator } from 'otplib';

export interface MFASetup {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFASession {
  isEnabled: boolean;
  isVerified: boolean;
  lastUsed?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
}

/**
 * Genera un secreto TOTP para MFA
 */
export async function generateMFASecret(userId: string): Promise<MFASetup> {
  try {
    // Generar secreto único
    const secret = authenticator.generateSecret();
    
    // Generar códigos de respaldo
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 8).toUpperCase()
    );
    
    // Crear URL QR para Google Authenticator
    const serviceName = 'NOMADEV.IO';
    const accountName = userId;
    const qrCodeUrl = authenticator.keyuri(accountName, serviceName, secret);
    
    // Guardar en base de datos (encriptado)
    const { error } = await supabase
      .from('user_mfa_secrets')
      .upsert({
        user_id: userId,
        secret: await encryptSecret(secret),
        backup_codes: await encryptBackupCodes(backupCodes),
        created_at: new Date().toISOString(),
        is_active: false // Se activa después de verificación
      });
    
    if (error) throw error;
    
    return {
      secret,
      qrCodeUrl,
      backupCodes
    };
  } catch (error) {
    console.error('Error generating MFA secret:', error);
    throw new Error('Failed to generate MFA secret');
  }
}

/**
 * Verifica código TOTP
 */
export async function verifyMFACode(
  userId: string, 
  code: string, 
  isBackupCode: boolean = false
): Promise<{ success: boolean; isBackupCode?: boolean }> {
  try {
    // Verificar si el usuario está bloqueado
    const session = await getMFASession(userId);
    if (session.lockedUntil && new Date() < session.lockedUntil) {
      throw new Error('Account temporarily locked due to too many failed attempts');
    }
    
    if (isBackupCode) {
      // Verificar código de respaldo
      const isValidBackup = await verifyBackupCode(userId, code);
      if (isValidBackup) {
        await recordMFAAttempt(userId, true);
        return { success: true, isBackupCode: true };
      }
    } else {
      // Verificar código TOTP
      const secret = await getMFASecret(userId);
      const isValid = authenticator.verify({ token: code, secret });
      
      if (isValid) {
        await recordMFAAttempt(userId, true);
        return { success: true };
      }
    }
    
    // Registro de intento fallido
    await recordMFAAttempt(userId, false);
    
    // Bloquear cuenta si hay muchos intentos fallidos
    const newSession = await getMFASession(userId);
    if (newSession.failedAttempts >= 5) {
      await lockMFA(userId, 15); // Bloquear por 15 minutos
      throw new Error('Too many failed attempts. Account locked for 15 minutes.');
    }
    
    return { success: false };
  } catch (error) {
    console.error('Error verifying MFA code:', error);
    throw error;
  }
}

/**
 * Activa MFA para un usuario
 */
export async function enableMFA(userId: string, verificationCode: string): Promise<boolean> {
  try {
    const isValid = await verifyMFACode(userId, verificationCode);
    
    if (isValid.success) {
      await supabase
        .from('user_mfa_secrets')
        .update({ is_active: true })
        .eq('user_id', userId);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error enabling MFA:', error);
    return false;
  }
}

/**
 * Desactiva MFA para un usuario
 */
export async function disableMFA(userId: string, password: string): Promise<boolean> {
  try {
    // Verificar contraseña antes de desactivar
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');
    
    // Aquí deberías verificar la contraseña
    // Por ahora, asumimos que está autenticado
    
    await supabase
      .from('user_mfa_secrets')
      .update({ is_active: false })
      .eq('user_id', userId);
    
    return true;
  } catch (error) {
    console.error('Error disabling MFA:', error);
    return false;
  }
}

/**
 * Obtiene el estado de MFA de un usuario
 */
export async function getMFAStatus(userId: string): Promise<MFASession> {
  try {
    const { data, error } = await supabase
      .from('user_mfa_sessions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    
    return {
      isEnabled: data?.is_enabled || false,
      isVerified: data?.is_verified || false,
      lastUsed: data?.last_used ? new Date(data.last_used) : undefined,
      failedAttempts: data?.failed_attempts || 0,
      lockedUntil: data?.locked_until ? new Date(data.locked_until) : undefined
    };
  } catch (error) {
    console.error('Error getting MFA status:', error);
    return {
      isEnabled: false,
      isVerified: false,
      failedAttempts: 0
    };
  }
}

// Funciones auxiliares privadas
async function encryptSecret(secret: string): Promise<string> {
  // En producción, usar una librería de encriptación real
  return btoa(secret); // Base64 por ahora
}

async function decryptSecret(encryptedSecret: string): Promise<string> {
  return atob(encryptedSecret);
}

async function encryptBackupCodes(codes: string[]): Promise<string> {
  return btoa(JSON.stringify(codes));
}

async function decryptBackupCodes(encryptedCodes: string): Promise<string[]> {
  return JSON.parse(atob(encryptedCodes));
}

async function getMFASecret(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('user_mfa_secrets')
    .select('secret')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single();
  
  if (error) throw error;
  
  return await decryptSecret(data.secret);
}

async function verifyBackupCode(userId: string, code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_mfa_secrets')
    .select('backup_codes')
    .eq('user_id', userId)
    .single();
  
  if (error) throw error;
  
  const backupCodes = await decryptBackupCodes(data.backup_codes);
  const index = backupCodes.indexOf(code);
  
  if (index !== -1) {
    // Remover código usado
    backupCodes.splice(index, 1);
    await supabase
      .from('user_mfa_secrets')
      .update({ backup_codes: await encryptBackupCodes(backupCodes) })
      .eq('user_id', userId);
    
    return true;
  }
  
  return false;
}

async function getMFASession(userId: string): Promise<MFASession> {
  const { data, error } = await supabase
    .from('user_mfa_sessions')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error && error.code !== 'PGRST116') throw error;
  
  return {
    isEnabled: data?.is_enabled || false,
    isVerified: data?.is_verified || false,
    lastUsed: data?.last_used ? new Date(data.last_used) : undefined,
    failedAttempts: data?.failed_attempts || 0,
    lockedUntil: data?.locked_until ? new Date(data.locked_until) : undefined
  };
}

async function recordMFAAttempt(userId: string, success: boolean): Promise<void> {
  const session = await getMFASession(userId);
  
  const updateData = {
    user_id: userId,
    is_verified: success,
    last_used: success ? new Date().toISOString() : undefined,
    failed_attempts: success ? 0 : (session.failedAttempts + 1),
    locked_until: null
  };
  
  await supabase
    .from('user_mfa_sessions')
    .upsert(updateData);
}

async function lockMFA(userId: string, minutes: number): Promise<void> {
  const lockedUntil = new Date();
  lockedUntil.setMinutes(lockedUntil.getMinutes() + minutes);
  
  await supabase
    .from('user_mfa_sessions')
    .upsert({
      user_id: userId,
      locked_until: lockedUntil.toISOString()
    });
}
