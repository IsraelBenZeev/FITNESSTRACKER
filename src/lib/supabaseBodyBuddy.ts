import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_BODYBUDDY_SUPABASE_URL
const key = import.meta.env.VITE_BODYBUDDY_SUPABASE_ANON_KEY

export const supabaseBodyBuddy = url && key ? createClient(url, key) : null
