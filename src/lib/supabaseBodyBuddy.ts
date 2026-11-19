import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_BODYBUDDY_SUPABASE_URL
const key = import.meta.env.VITE_BODYBUDDY_SUPABASE_ANON_KEY

/**
 * BodyBuddy's Supabase project — nutrition and body stats live here (same user as the BodyBuddy app).
 * Its own session storage + PKCE flow, so its OAuth callback (`?code=`) never collides with the
 * FitnessTracker client's session (implicit flow, `#access_token=`).
 */
export const supabaseBodyBuddy =
  url && key
    ? createClient(url, key, {
        auth: {
          storageKey: 'bodybuddy-auth',
          flowType: 'pkce',
          persistSession: true,
          autoRefreshToken: true,
          // Only handle our own PKCE callback; never treat FitnessTracker's implicit-flow `#access_token` as ours
          detectSessionInUrl: () => false,
        },
      })
    : null

/** Throws when the BodyBuddy env vars are missing — data hooks call this */
export function bb() {
  if (!supabaseBodyBuddy) throw new Error('BodyBuddy is not configured (VITE_BODYBUDDY_SUPABASE_URL / _ANON_KEY)')
  return supabaseBodyBuddy
}
