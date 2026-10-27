import { useState } from 'react'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'

export default function ShareButton({ path, title, className = 'link' }: { path: string; title?: string; className?: string }) {
  const { session } = useAuth()
  const [state, setState] = useState<'idle' | 'busy' | 'done'>('idle')

  const share = async () => {
    if (state === 'busy') return
    setState('busy')
    try {
      const url = session ? `${window.location.origin}/r/${await api.createShare(path)}` : window.location.origin + path
      if (navigator.share) {
        await navigator.share({ title: title ?? 'Viva', url }).catch(() => undefined)
      } else {
        await navigator.clipboard.writeText(url)
      }
      setState('done')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('idle')
    }
  }

  return (
    <button type="button" className={className} onClick={() => void share()}>
      {state === 'done' ? 'Link copied' : 'Share'}
    </button>
  )
}
