import { useState } from 'react'
import { api, type ShareRow, type Submission } from '../lib/api'
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

function Shares() {
  const { data, error, loading, reload } = useAsync(() => api.adminShares(), [])
  const [open, setOpen] = useState<string | null>(null)
  if (loading) return <Loading rows={4} />
  if (error) return <ErrorBox message={error} retry={reload} />
  if (!data?.length) return <Empty>No shares yet.</Empty>
  const total = data.reduce((n, r) => n + r.opens, 0)
  const sharers = Object.entries(
    data.reduce<Record<string, { shares: number; opens: number }>>((m, r) => {
      const x = (m[r.email] ??= { shares: 0, opens: 0 })
      x.shares += 1
      x.opens += r.opens
      return m
    }, {}),
  ).sort((a, b) => b[1].opens - a[1].opens)
  return (
    <>
      <p className="muted">
        {data.length} shared links, {total} opens
      </p>
      <h3 className="mini-title">By person</h3>
      <ul className="list">
        {sharers.slice(0, 10).map(([email, v]) => (
          <li className="item" key={email}>
            <p className="item-body">{email}</p>
            <div className="meta">
              <span>{v.shares} shared</span>
              <span>{v.opens} opens</span>
            </div>
          </li>
        ))}
      </ul>
      <h3 className="mini-title">All links</h3>
      <ul className="list">
        {data.map((r) => (
          <ShareItem key={r.code} r={r} open={open === r.code} onToggle={() => setOpen(open === r.code ? null : r.code)} />
        ))}
      </ul>
    </>
  )
}

function ShareItem({ r, open, onToggle }: { r: ShareRow; open: boolean; onToggle: () => void }) {
  const opens = useAsync(() => (open ? api.adminShareOpens(r.code) : Promise.resolve([])), [open, r.code])
  return (
    <li className="item">
      <button className="item-toggle" onClick={onToggle} aria-expanded={open}>
        <span className="item-body">{r.path}</span>
        <span className="status">{r.opens} opens</span>
      </button>
      <div className="meta">
        <span>Shared by {r.email}</span>
        <span>{date(r.created_at)}</span>
        <span>{r.people} people</span>
        {r.last_opened && <span>Last opened {date(r.last_opened)}</span>}
      </div>
      {open && (
        <div className="submission">
          {opens.loading ? (
            'Loading'
          ) : (
            <ul className="plain">
              {opens.data?.map((o, i) => (
                <li key={i}>
                  {o.who}, {date(o.opened_at)}
                </li>
              ))}
              {opens.data?.length === 0 && <li>No opens yet</li>}
            </ul>
          )}
        </div>
      )}
    </li>
  )
}

function Queue() {
  const { me } = useAuth()
  const [status, setStatus] = useState('pending')
  const { data, error, loading, reload } = useAsync(() => (me?.admin && status !== 'shares' ? api.adminList(status) : Promise.resolve([])), [status, me?.admin])
  if (!me?.admin) return <Empty>This page is for admins.</Empty>
  const tab = status === 'shares'
  return (
    <>
      <div className="segmented">
        {['pending', 'approved', 'rejected', 'shares'].map((x) => (
          <button key={x} className={status === x ? 'on' : ''} onClick={() => setStatus(x)}>
            {x[0].toUpperCase() + x.slice(1)}
          </button>
        ))}
      </div>
      {tab ? (
        <Shares />
      ) : loading ? (
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
