import { createClient } from "@supabase/supabase-js"

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

// When the env vars are missing the app runs in local demo mode (see db.js).
export const supabase = url && key ? createClient(url, key) : null
export const isDemo = !supabase
