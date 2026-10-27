import { supabase } from './supabase'

declare global {
  interface Window {
    google?: any
  }
}

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID

let loading: Promise<void> | null = null
let rawNonce = ''
const errorListeners = new Set<(message: string) => void>()

export const onGoogleError = (fn: (message: string) => void) => {
  errorListeners.add(fn)
  return () => {
    errorListeners.delete(fn)
  }
}

const hex = (buf: ArrayBuffer) => Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('')

async function setup(): Promise<void> {
  if (!clientId) throw new Error('Missing VITE_GOOGLE_CLIENT_ID')
  await new Promise<void>((resolve, reject) => {
    const s = document.createElement('script')
    s.src = 'https://accounts.google.com/gsi/client'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('Could not load Google sign-in'))
    document.head.appendChild(s)
  })
  rawNonce = hex(crypto.getRandomValues(new Uint8Array(16)).buffer)
  const hashed = hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawNonce)))
  window.google.accounts.id.initialize({
    client_id: clientId,
    nonce: hashed,
    use_fedcm_for_prompt: true,
    callback: async (res: { credential: string }) => {
      const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: res.credential, nonce: rawNonce })
      if (error) errorListeners.forEach((fn) => fn('Sign in failed. Try again.'))
    },
  })
}

export function loadGoogle() {
  loading ??= setup().catch((e) => {
    loading = null
    throw e
  })
  return loading
}
