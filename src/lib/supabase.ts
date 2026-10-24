import { createClient } from "@supabase/supabase-js";
import { offlineFetch, setTokenGetter } from "@/lib/offline";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL and/or Anon Key are missing from environment variables"
  );
}

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  // Local-first: data lives on this computer, Supabase is synced in the background.
  global: { fetch: offlineFetch },
});

// The outbox is replayed with the current session, not the one it was queued with.
setTokenGetter(
  async () => (await supabase.auth.getSession()).data.session?.access_token
);

console.log("Supabase client initialized:", {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey,
});

export { supabase };
