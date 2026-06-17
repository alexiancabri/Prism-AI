import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  // Surfaced early in dev so a missing .env is obvious. We still construct a
  // client with placeholders so the UI renders — only live auth calls fail.
  console.warn(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY — auth will not work until these are set.",
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-anon-key",
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
