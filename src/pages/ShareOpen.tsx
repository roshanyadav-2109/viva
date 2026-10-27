import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { api } from '../lib/api'
import { Loading } from '../components/ui'

const visitorId = () => {
  try {
    let v = localStorage.getItem('vv')
    if (!v) {
      v = crypto.randomUUID()
      localStorage.setItem('vv', v)
    }
    return v
  } catch {
    return ''
  }
}

export default function ShareOpen() {
  const { code = '' } = useParams()
  const go = useNavigate()
  useEffect(() => {
    let live = true
    api
      .openShare(code, visitorId())
      .then((path) => live && go(path && path.startsWith('/') && !path.startsWith('//') ? path : '/', { replace: true }))
      .catch(() => live && go('/', { replace: true }))
    return () => {
      live = false
    }
  }, [code, go])
  if (!code) return <Navigate to="/" replace />
  return <Loading rows={2} />
}
