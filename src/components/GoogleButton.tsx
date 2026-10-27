import { useEffect, useRef, useState } from 'react'
import { loadGoogle, onGoogleError } from '../lib/google'

export default function GoogleButton() {
  const ref = useRef<HTMLDivElement>(null)
  const [error, setError] = useState('')

  useEffect(() => onGoogleError(setError), [])

  useEffect(() => {
    let live = true
    loadGoogle()
      .then(() => {
        if (!live || !ref.current) return
        ref.current.innerHTML = ''
        window.google.accounts.id.renderButton(ref.current, {
          type: 'standard',
          theme: 'filled_blue',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left',
          width: 280,
        })
      })
      .catch(() => live && setError('Google sign-in could not load.'))
    return () => {
      live = false
    }
  }, [])

  return (
    <div className="google-btn">
      <div ref={ref} className="google-slot" />
      {error && <p className="notice error">{error}</p>}
    </div>
  )
}
