import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase env vars are missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env.local file.'
  )
}

// RAM tables live in the "ram" schema (separate from PAM's "public" schema
// in the same database), so the client must be pointed there explicitly.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'ram' }
})
