import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { api, type Me } from './api'

type AuthState = {
  ready: boolean
  session: Session | null
  me: Me | null
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthState | null>(null)

const fromSession = (s: Session): Me => {
  const m = s.user.user_metadata ?? {}
  return {
    id: s.user.id,
    email: s.user.email ?? '',
    name: m.full_name ?? m.name ?? (s.user.email ?? '').split('@')[0],
    avatar: m.avatar_url ?? m.picture ?? null,
    admin: false,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [me, setMe] = useState<Me | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      setReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const uid = session?.user.id
  useEffect(() => {
    if (!session) {
      setMe(null)
      return
    }
    setMe(fromSession(session))
    let live = true
    api
      .me()
      .then((m) => live && m && setMe(m))
      .catch(() => undefined)
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid])

  const value: AuthState = {
    ready,
    session,
    me,
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('AuthProvider missing')
  return v
}
