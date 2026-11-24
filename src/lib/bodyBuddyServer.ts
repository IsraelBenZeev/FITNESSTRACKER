import { supabaseBodyBuddy } from './supabaseBodyBuddy'

/**
 * BodyBuddy-Server — the same server the app calls for sign-up, password recovery, account deletion
 * and custom-exercise images. Its CORS list must include this site's origin (localhost:5173 already is).
 */
export const BB_SERVER_URL = (import.meta.env.VITE_BODYBUDDY_SERVER_URL as string | undefined) ?? 'https://bodybuddy-server-eta.vercel.app'

const TIMEOUT_MS = 20_000
export const UPLOAD_TIMEOUT_MS = 60_000

/** fetch to the server with a timeout (utils/fetchWithTimeout in the app) */
export async function serverFetch(path: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(new URL(path, BB_SERVER_URL).toString(), { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

/** Same, with the signed-in user's access token (routes that check the user) */
export async function authedServerFetch(path: string, init: RequestInit = {}, timeoutMs = TIMEOUT_MS): Promise<Response> {
  const { data } = (await supabaseBodyBuddy?.auth.getSession()) ?? { data: { session: null } }
  const token = data.session?.access_token
  if (!token) throw new Error('נדרשת התחברות')
  return serverFetch(path, { ...init, headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}` } }, timeoutMs)
}
