import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.info('[Supabase init] env check', {
	hasUrl: Boolean(supabaseUrl),
	hasAnonKey: Boolean(supabaseAnonKey),
	urlHost: supabaseUrl ? new URL(supabaseUrl).host : null,
	anonKeyPreview: supabaseAnonKey ? `${supabaseAnonKey.slice(0, 12)}...` : null,
})

if (!supabaseUrl || !supabaseAnonKey) {
	console.error('[Supabase init] missing environment variables', {
		hasUrl: Boolean(supabaseUrl),
		hasAnonKey: Boolean(supabaseAnonKey),
	})
	throw new Error('Missing Supabase env variables. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
