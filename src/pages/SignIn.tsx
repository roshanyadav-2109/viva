import { Navigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import GoogleButton from '../components/GoogleButton'

export default function SignIn() {
  const { session } = useAuth()
  if (session) return <Navigate to="/" replace />
  return (
    <div className="gate">
      <h2>Sign in</h2>
      <p className="muted">Use your Google account.</p>
      <GoogleButton />
    </div>
  )
}
