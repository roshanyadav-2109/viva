import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '../lib/auth'
import { api } from '../lib/api'
import { useAsync } from '../lib/hooks'
import { Icon } from './ui'

function Account() {
  const { session, me, signIn } = useAuth()
  if (!session) {
    return (
      <button className="btn small" onClick={() => void signIn()}>
        Sign in
      </button>
    )
  }
  return (
    <Link to="/me" className="avatar" aria-label="Account">
      {me?.avatar ? <img src={me.avatar} alt="" referrerPolicy="no-referrer" /> : <span>{(me?.name ?? '?').slice(0, 1).toUpperCase()}</span>}
    </Link>
  )
}

export default function Layout() {
  const { session } = useAuth()
  const { data: stats } = useAsync(() => api.stats(), [])
  const subjects = (stats?.subjects ?? []).filter((x) => x.questions > 0)
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <>
      <header className="topbar">
        <div className="wrap topbar-inner">
          <Link to="/" className="brand">
            <span className="brand-mark">v</span>
            <span>Viva</span>
          </Link>
          <nav className="desk-nav" aria-label="Main">
            <NavLink to="/" end>
              Home
            </NavLink>
            {subjects.map((x) => (
              <NavLink key={x.code} to={`/s/${x.code}`}>
                {x.code}
              </NavLink>
            ))}
            <NavLink to="/about">About viva</NavLink>
          </nav>
          <div className="topbar-right">
            {session && (
              <Link to="/contribute" className="btn small primary desk-only">
                Add to the bank
              </Link>
            )}
            <Account />
          </div>
        </div>
      </header>

      <main className="wrap page">
        <Outlet />
      </main>

      <footer className="footer wrap">
        <span>Viva</span>
        <nav aria-label="Footer">
          <Link to="/about">About viva</Link>
          {session && <Link to="/contribute">Contribute</Link>}
          {session && <Link to="/me">Account</Link>}
        </nav>
      </footer>

      <nav className="tabbar" aria-label="Main">
        <NavLink to="/" end className="tab">
          {Icon.home}
          <span>Home</span>
        </NavLink>
        {subjects.map((x) => (
          <NavLink key={x.code} to={`/s/${x.code}`} className="tab">
            {Icon.list}
            <span>{x.code}</span>
          </NavLink>
        ))}
        <NavLink to="/contribute" className="tab add">
          {Icon.plus}
          <span>Add</span>
        </NavLink>
      </nav>
    </>
  )
}
