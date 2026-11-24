/**
 * Email/password auth, ported from BodyBuddy-Client/src/service/authService.ts.
 * Sign-up and password recovery go through BodyBuddy-Server, which sends its own branded emails.
 * Sent with this site's origin, the links point straight here with a `token_hash`
 * that /auth/confirm-signup and /auth/reset-password verify.
 */
import { bb } from '../../lib/supabaseBodyBuddy'
import { serverFetch } from '../../lib/bodyBuddyServer'

type Result = { error: Error | null }

const asError = (e: unknown) => (e instanceof Error ? e : new Error(String(e)))

/** Creates the (unconfirmed) user on the server, which emails a confirmation link. No session yet. */
export async function signUpWithEmail(email: string, password: string, fullName: string): Promise<Result> {
  try {
    const res = await serverFetch('/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // redirect_origin: the server points the email link back to this site (allow-listed there)
      body: JSON.stringify({ email, password, full_name: fullName, redirect_origin: window.location.origin }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => null)
      throw new Error(body?.detail || `signup request failed: ${res.status}`)
    }
    return { error: null }
  } catch (e) {
    return { error: asError(e) }
  }
}

export async function signInWithEmail(email: string, password: string): Promise<Result> {
  const { error } = await bb().auth.signInWithPassword({ email, password })
  return { error: error ? asError(error) : null }
}

/** After a failed email sign-in: 'google' when the account was created with Google and has no password. Best effort. */
export async function getSignInMethod(email: string): Promise<'google' | 'password' | null> {
  try {
    const res = await serverFetch('/auth/sign-in-method', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!res.ok) return null
    const body = await res.json()
    return body?.method ?? null
  } catch {
    return null
  }
}

export async function sendPasswordRecoveryEmail(email: string): Promise<Result> {
  try {
    const res = await serverFetch('/auth/password-recovery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, redirect_origin: window.location.origin }),
    })
    if (!res.ok) throw new Error(`password recovery request failed: ${res.status}`)
    return { error: null }
  } catch (e) {
    return { error: asError(e) }
  }
}

/** Confirms the sign-up email; on success the user is signed in */
export async function completeSignupConfirmation(tokenHash: string): Promise<Result> {
  const { error } = await bb().auth.verifyOtp({ token_hash: tokenHash, type: 'signup' })
  return { error: error ? asError(error) : null }
}

/** Verifies a recovery link; on success there is a session that may set a new password */
export async function completePasswordRecovery(tokenHash: string): Promise<Result> {
  const { error } = await bb().auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' })
  return { error: error ? asError(error) : null }
}

export async function updatePassword(password: string): Promise<Result> {
  const { error } = await bb().auth.updateUser({ password })
  return { error: error ? asError(error) : null }
}

/** Signs out of this browser only (the app uses scope 'local' too) */
export async function signOut(): Promise<Result> {
  const { error } = await bb().auth.signOut({ scope: 'local' })
  return { error: error ? asError(error) : null }
}

/** Records consent to the latest privacy policy and terms (the app does this after a Google sign-in). Best effort. */
export async function recordLatestConsents(userId: string) {
  await Promise.all(
    (['privacy_policy', 'terms_of_service'] as const).map(async (type) => {
      try {
        const { data } = await bb()
          .from('legal_documents')
          .select('version')
          .eq('document_type', type)
          .order('created_at', { ascending: false })
          .limit(1)
          .single()
        if (!data?.version) return
        await bb()
          .from('user_consents')
          .upsert(
            { user_id: userId, policy_type: type, policy_version: data.version },
            { onConflict: 'user_id,policy_type,policy_version', ignoreDuplicates: true },
          )
      } catch {
        // best effort, like the app
      }
    }),
  )
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
