// Supabase client — not yet used by App.jsx (the app currently runs on local mock/demo
// data per the project's current phase). Once you're ready to connect the real backend:
//
//   1. Run supabase/schema.sql in your Supabase project's SQL editor.
//   2. Copy .env.example to .env and fill in your project's URL + anon key.
//   3. Import `supabase` from this file wherever App.jsx currently reads/writes `db`,
//      and replace the localStorage load/save effects with Supabase queries + a
//      realtime subscription. See PROJECT_GUIDE.md → "Supabase setup instructions".

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase env vars are not set — this is expected while the app is still running on mock data. " +
    "Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file when you're ready to connect the backend."
  );
}

export const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;
