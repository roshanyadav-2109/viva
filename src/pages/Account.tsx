import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api, type Submission } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/hooks'
import { date, proctorName } from '../lib/format'
import { Empty, ErrorBox, Gate, Loading } from '../components/ui'

const kindName: Record<Submission['kind'], string> = {
  session: 'Questions',
  review: 'Proctor review',
  proctor: 'Proctor',
  resource: 'Resource',
}

export function Summary({ s }: { s: Submission }) {
  const p = s.payload
  return (
    <div className="submission">
      <div className="meta">
        <span>{kindName[s.kind]}</span>
        {p.subject && <span>{p.subject}</span>}
        {p.level && <span>Level {p.level}</span>}
        {p.proctor && <span>{proctorName(p.proctor)}</span>}
        {s.kind === 'proctor' && <span>{p.code}</span>}
      </div>
      {s.kind === 'session' && (
        <>
          <ol className="plain">
            {(p.questions as string[]).map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ol>
          {p.advice && <p className="muted">Advice: {p.advice}</p>}
        </>
      )}
      {s.kind === 'review' && <p>{p.body}</p>}
      {s.kind === 'resource' && (
        <p>
          {p.title}
          <br />
          <span className="muted">{p.url}</span>
        </p>
      )}
    </div>
  )
}

function Mine() {
  const { data, error, loading, reload } = useAsync(() => api.mine(), [])
  const [open, setOpen] = useState<number | null>(null)
  if (loading) return <Loading rows={3} />
  if (error) return <ErrorBox message={error} retry={reload} />
  if (!data?.length)
    return (
      <Empty>
        Nothing submitted yet. <Link to="/contribute">Add questions</Link>
      </Empty>
    )
  return (
    <ul className="list">
      {data.map((s) => (
        <li className="item" key={s.id}>
          <button className="item-toggle" onClick={() => setOpen(open === s.id ? null : s.id)} aria-expanded={open === s.id}>
            <span className="item-body">{kindName[s.kind]}</span>
            <span className={`status ${s.status}`}>{s.status}</span>
          </button>
          <div className="meta">
            <span>{date(s.created_at)}</span>
            {s.note && <span>{s.note}</span>}
          </div>
          {open === s.id && <Summary s={s} />}
        </li>
      ))}
    </ul>
  )
}

export default function Account() {
  const { me, signOut } = useAuth()
  return (
    <>
      <h1 className="page-title">Account</h1>
      <Gate what="your account">
        <section className="account">
          <div>
            <p className="item-body">{me?.name}</p>
            <p className="muted">{me?.email}</p>
          </div>
          <div className="row-actions">
            {me?.admin && (
              <Link to="/admin" className="btn">
                Approvals
              </Link>
            )}
            <button className="btn" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </section>
        <div className="section-head spaced">
          <h2>My submissions</h2>
        </div>
        <Mine />
      </Gate>
    </>
  )
}
