import { createContext, useContext, useEffect, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { supabaseBodyBuddy } from './supabaseBodyBuddy'

interface BodyBuddyAuthValue {
  /** The BodyBuddy user (nutrition + body stats are written under this id) */
  bbUser: User | null
  bbLoading: boolean
  configured: boolean
  connect: () => Promise<void>
  disconnect: () => Promise<void>
}

const Ctx = createContext<BodyBuddyAuthValue | null>(null)

export function BodyBuddyAuthProvider({ children }: { children: React.ReactNode }) {
  const [bbUser, setBbUser] = useState<User | null>(null)
  const [bbLoading, setBbLoading] = useState(!!supabaseBodyBuddy)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!supabaseBodyBuddy) return
    supabaseBodyBuddy.auth.getSession().then(({ data: { session } }) => {
      setBbUser(session?.user ?? null)
      setBbLoading(false)
    })
    const { data: { subscription } } = supabaseBodyBuddy.auth.onAuthStateChange((event, session) => {
      setBbUser(session?.user ?? null)
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        queryClient.invalidateQueries({ queryKey: ['bb'] })
        // Drop the `?code=` left by the OAuth callback
        if (event === 'SIGNED_IN' && window.location.search.includes('code=')) {
          window.history.replaceState(null, '', window.location.pathname + window.location.hash)
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [queryClient])

  const connect = async () => {
    if (!supabaseBodyBuddy) return
    await supabaseBodyBuddy.auth.signInWithOAuth({
      provider: 'google',
      // select_account: lets "switch account" pick a different Google account
      options: { redirectTo: window.location.origin + window.location.pathname, queryParams: { prompt: 'select_account' } },
    })
  }

  const disconnect = async () => {
    await supabaseBodyBuddy?.auth.signOut()
  }

  return (
    <Ctx.Provider value={{ bbUser, bbLoading, configured: !!supabaseBodyBuddy, connect, disconnect }}>
      {children}
    </Ctx.Provider>
  )
}

export function useBodyBuddyAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useBodyBuddyAuth must be used within BodyBuddyAuthProvider')
  return ctx
}
