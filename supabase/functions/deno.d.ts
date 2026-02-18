// Definiciones de tipos para Deno en funciones Edge de Supabase
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
      set(key: string, value: string): void;
      delete(key: string): void;
      toObject(): Record<string, string>;
    };
    readTextFile(path: string | URL): Promise<string>;
    writeTextFile(path: string | URL, data: string): Promise<void>;
    stat(path: string | URL): Promise<Deno.FileInfo>;
    remove(path: string | URL): Promise<void>;
    mkdir(path: string | URL, options?: Deno.MkdirOptions): Promise<void>;
    serve(handler: (request: Request) => Response | Promise<Response>): void;
  };

  // Tipos globales del navegador/Deno
  const console: Console;
  const JSON: JSON;
  const Response: typeof Response;
  const Request: typeof Request;
  const Date: DateConstructor;
  const Promise: PromiseConstructor;
}

// Declaraciones de módulos para imports de URLs de Deno
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (request: Request) => Response | Promise<Response>): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient(url: string, key: string): any;
}

export {};
