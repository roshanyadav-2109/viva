import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from '../lib/auth'
import { chance } from '../lib/format'

const I = ({ d, children }: { d?: string; children?: ReactNode }) => (
  <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {d ? <path d={d} /> : children}
  </svg>
)

export const Icon = {
  home: <I d="M4 11l8-7 8 7M6 10v10h12V10" />,
  list: <I d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />,
  user: (
    <I>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1-4 4-6 8-6s7 2 8 6" />
    </I>
  ),
  book: <I d="M5 4h11a3 3 0 013 3v13H8a3 3 0 01-3-3zM5 17a3 3 0 013-3h11" />,
  plus: <I d="M12 5v14M5 12h14" />,
  search: (
    <I>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M16 16l4.5 4.5" />
    </I>
  ),
  more: <I d="M5 12h.01M12 12h.01M19 12h.01" />,
  up: <I d="M12 19V6M6 11l6-6 6 6" />,
  arrow: <I d="M5 12h14M13 6l6 6-6 6" />,
  back: <I d="M19 12H5M11 6l-6 6 6 6" />,
  link: <I d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5" />,
}

export const Google = () => (
  <svg className="icon" viewBox="0 0 24 24" aria-hidden="true">
    <path fill="#4285F4" d="M22.5 12.3c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 01-2.2 3.3v2.7h3.5c2.1-1.9 3.3-4.7 3.3-8z" />
    <path fill="#34A853" d="M12 23c3 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1-3.7 1-2.8 0-5.2-1.9-6.100-4.500H2.300v2.800A11 11 0 0012 23z" />
    <path fill="#FBBC05" d="M5.900 14.100a6.600 6.600 0 010-4.200V7.100H2.300a11 11 0 000 9.800z" />
    <path fill="#EA4335" d="M12 5.400c1.600 0 3 .6 4.200 1.600l3.100-3.100A11 11 0 002.300 7.100l3.600 2.800C6.800 7.300 9.200 5.400 12 5.400z" />
  </svg>
)

export function SignInButton({ className = 'btn' }: { className?: string }) {
  const { signIn } = useAuth()
  return (
    <button className={className} onClick={() => void signIn()}>
      <Google /> Continue with Google
    </button>
  )
}

export function Gate({ children, what = 'this page' }: { children: ReactNode; what?: string }) {
  const { session, ready } = useAuth()
  if (!ready) return <Loading />
  if (session) return <>{children}</>
  return (
    <div className="gate">
      <h2>Sign in to open {what}</h2>
      <p className="muted">Questions, proctor reviews and resources are for signed-in students.</p>
      <SignInButton className="btn primary" />
    </div>
  )
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div className="skeleton" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton-row" />
      ))}
    </div>
  )
}

export function ErrorBox({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="notice error" role="alert">
      <span>{message}</span>
      {retry && (
        <button className="link" onClick={retry}>
          Retry
        </button>
      )}
    </div>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="empty">{children}</div>
}

export function Pager({ page, pages, onPage }: { page: number; pages: number; onPage: (p: number) => void }) {
  if (pages <= 1) return null
  return (
    <nav className="pager" aria-label="Pages">
      <button className="btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Previous
      </button>
      <span className="muted">
        {page} of {pages}
      </span>
      <button className="btn" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  )
}

export function Meta({ items }: { items: (ReactNode | null | false | undefined)[] }) {
  const list = items.filter(Boolean)
  return (
    <div className="meta">
      {list.map((x, i) => (
        <span key={i}>{x}</span>
      ))}
    </div>
  )
}

export function Chance({ n }: { n: number }) {
  return <span className="chance">{chance(n)}</span>
}

export const levelText = (l: number) => `Level ${l}`

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="back">
      {Icon.back} {children}
    </Link>
  )
}
