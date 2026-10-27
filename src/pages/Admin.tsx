import { useState } from 'react'
import { api, type Submission } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useAsync } from '../lib/hooks'
import { date } from '../lib/format'
import { Empty, ErrorBox, Gate, Loading } from '../components/ui'
import { Summary } from './Account'

function Row({ s, onDone }: { s: Submission; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const act = (approve: boolean) => {
    setBusy(true)
    setError('')
    api
      .adminReview(s.id, approve, note)
      .then(onDone)
      .catch((e: Error) => {
        setError(e.message)
        setBusy(false)
      })
  }
  return (
    <li className="item">
      <div className="meta">
        <span>{s.email}</span>
        <span>{date(s.created_at)}</span>
      </div>
      <Summary s={s} />
      {s.status === 'pending' ? (
        <div className="review-actions">
          <input className="field" placeholder="Note to student (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} aria-label="Note" />
          <button className="btn primary" disabled={busy} onClick={() => act(true)}>
            Approve
          </button>
          <button className="btn" disabled={busy} onClick={() => act(false)}>
            Reject
          </button>
        </div>
      ) : (
        s.note && <p className="muted">{s.note}</p>
      )}
      {error && <div className="notice error">{error}</div>}
    </li>
  )
}

function Queue() {
  const { me } = useAuth()
  const [status, setStatus] = useState('pending')
  const { data, error, loading, reload } = useAsync(() => (me?.admin ? api.adminList(status) : Promise.resolve([])), [status, me?.admin])
  if (!me?.admin) return <Empty>This page is for admins.</Empty>
  return (
    <>
      <div className="segmented">
        {['pending', 'approved', 'rejected'].map((x) => (
          <button key={x} className={status === x ? 'on' : ''} onClick={() => setStatus(x)}>
            {x[0].toUpperCase() + x.slice(1)}
          </button>
        ))}
      </div>
      {loading ? (
        <Loading rows={4} />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : !data?.length ? (
        <Empty>Nothing {status}.</Empty>
      ) : (
        <ul className="list">
          {data.map((s) => (
            <Row key={s.id} s={s} onDone={reload} />
          ))}
        </ul>
      )}
    </>
  )
}

export default function Admin() {
  return (
    <>
      <h1 className="page-title">Approvals</h1>
      <Gate what="approvals">
        <Queue />
      </Gate>
    </>
  )
}
