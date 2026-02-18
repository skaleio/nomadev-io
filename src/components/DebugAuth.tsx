import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DebugAuth = () => {
  const { user, isLoading, isAuthenticated, showOnboarding, error } = useAuth();

  return (
    <div className="fixed top-4 right-4 bg-black text-white p-4 rounded-lg text-xs z-50">
      <h3 className="font-bold mb-2">Debug Auth State:</h3>
      <div>isLoading: {isLoading ? 'true' : 'false'}</div>
      <div>isAuthenticated: {isAuthenticated ? 'true' : 'false'}</div>
      <div>showOnboarding: {showOnboarding ? 'true' : 'false'}</div>
      <div>user: {user ? user.email : 'null'}</div>
      <div>error: {error || 'none'}</div>
    </div>
  );
};

export default DebugAuth;
