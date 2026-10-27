import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/hooks'
import { Loading, SignInButton } from '../components/ui'
import Preview from '../components/Preview'

export default function Home() {
  const { session, me, ready } = useAuth()
  const { data } = useAsync(() => api.stats(), [])
  const subjects = (data?.subjects ?? []).filter((x) => x.questions > 0)

  return (
    <div className="home">
      <section className="hero">
        {me && <p className="greet">Hi, {me.name.split(' ')[0]}</p>}
        <h1>Know what your proctor will ask.</h1>
        {ready && !session && (
          <>
            <p className="lead">Questions from past project viva sessions, with proctor reviews from students who faced them.</p>
            <div className="hero-actions">
              <SignInButton className="btn primary" />
            </div>
          </>
        )}
      </section>

      <section>
        <div className="section-head">
          <h2>Choose your subject</h2>
        </div>
        {!data ? (
          <Loading rows={2} />
        ) : (
          <div className="grid cols-3 subjects">
            {subjects.map((x) =>
              session ? (
                <Link key={x.code} to={`/s/${x.code}`} className="card tile" data-s={x.code}>
                  <span className="tile-code">{x.code}</span>
                  <span className="tile-name">{x.name}</span>
                </Link>
              ) : (
                <div key={x.code} className="card tile" data-s={x.code}>
                  <span className="tile-code">{x.code}</span>
                  <span className="tile-name">{x.name}</span>
                </div>
              ),
            )}
          </div>
        )}
      </section>

      {ready && !session && (
        <section>
          <div className="section-head">
            <h2>Sample questions</h2>
          </div>
          <Preview />
        </section>
      )}
    </div>
  )
}
