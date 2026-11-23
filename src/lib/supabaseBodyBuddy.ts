import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_BODYBUDDY_SUPABASE_URL
const key = import.meta.env.VITE_BODYBUDDY_SUPABASE_ANON_KEY

/**
 * BodyBuddy's Supabase project — the only backend: nutrition, workouts, body stats and goals live here,
 * under the same user as the BodyBuddy app. Sign-in is Google OAuth with the PKCE flow (`?code=`).
 */
export const supabaseBodyBuddy =
  url && key
    ? createClient(url, key, {
        auth: {
          storageKey: 'bodybuddy-auth',
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          // PKCE callbacks are still handled; this only turns off implicit-flow (`#access_token`) detection
          detectSessionInUrl: () => false,
        },
      })
    : null

/** Throws when the BodyBuddy env vars are missing — data hooks call this */
export function bb() {
  if (!supabaseBodyBuddy) throw new Error('BodyBuddy is not configured (VITE_BODYBUDDY_SUPABASE_URL / _ANON_KEY)')
  return supabaseBodyBuddy
}
