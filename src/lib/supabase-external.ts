// Cliente para el proyecto Supabase EXTERNO de MarketingHub AI.
// La publishable key es pública por diseño (RLS protege los datos).
// No pongas aquí nunca la service role key ni la connection string.
import { createClient } from "@supabase/supabase-js";

const EXTERNAL_SUPABASE_URL =
  (import.meta.env["VITE_EXTERNAL_SUPABASE_URL"] as string | undefined) ??
  "https://cqwzsscffxhthtdbogfh.supabase.co";

const EXTERNAL_SUPABASE_PUBLISHABLE_KEY =
  (import.meta.env["VITE_EXTERNAL_SUPABASE_PUBLISHABLE_KEY"] as string | undefined) ??
  "sb_publishable_BCFeB01I-GF4iwPdsjBQ7Q_Gp5zPsoe";

function isNewSupabaseApiKey(value: string) {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

// Las claves nuevas de Supabase son opacas (no son JWT): deben ir en `apikey`,
// no como `Authorization: Bearer <key>`.
function createSupabaseFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) {
      new Headers(init.headers).forEach((value, name) => headers.set(name, value));
    }
    if (isNewSupabaseApiKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function createExternalClient() {
  return createClient(EXTERNAL_SUPABASE_URL, EXTERNAL_SUPABASE_PUBLISHABLE_KEY, {
    global: { fetch: createSupabaseFetch(EXTERNAL_SUPABASE_PUBLISHABLE_KEY) },
    auth: {
      storage: typeof window !== "undefined" ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _client: ReturnType<typeof createExternalClient> | undefined;

// Uso: import { supabaseExterno } from "@/lib/supabase-external";
export const supabaseExterno = new Proxy({} as ReturnType<typeof createExternalClient>, {
  get(_, prop, receiver) {
    if (!_client) _client = createExternalClient();
    return Reflect.get(_client, prop, receiver);
  },
});
