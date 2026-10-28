import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { date, proctorName } from '../lib/format'
import { Chance, Icon, Meta } from './ui'
import ShareButton from './ShareButton'

export function AdminRemove({ kind, id, onDone }: { kind: 'question' | 'review' | 'resource'; id: number; onDone?: () => void }) {
  const { me } = useAuth()
  const [state, setState] = useState<'idle' | 'sure' | 'gone'>('idle')
  if (!me?.admin) return null
  if (state === 'gone') return <span className="muted">Removed</span>
  if (state === 'idle')
    return (
      <button className="link danger" onClick={() => setState('sure')}>
        Remove
      </button>
    )
  return (
    <span className="inline-actions">
      <button
        className="link danger"
        onClick={() =>
          api
            .adminRemove(kind, id)
            .then(() => {
              setState('gone')
              onDone?.()
            })
            .catch(() => setState('idle'))
        }
      >
        Confirm remove
      </button>
      <button className="link" onClick={() => setState('idle')}>
        Cancel
      </button>
    </span>
  )
}

export function QuestionItem(q: {
  id: number
  body: string
  subject: string
  level: number
  proctors?: string[]
  proctor_count?: number
  times_asked: number
  votes?: number
  voted?: boolean
  answer?: string
  demo?: string
  tips?: string
  hideProctor?: boolean
}) {
  const [vote, setVote] = useState({ votes: q.votes ?? 0, voted: q.voted ?? false })
  const [busy, setBusy] = useState(false)
  const toggle = () => {
    if (busy) return
    const prev = vote
    setBusy(true)
    setVote({ votes: prev.votes + (prev.voted ? -1 : 1), voted: !prev.voted })
    api
      .vote(q.id)
      .then(setVote)
      .catch(() => setVote(prev))
      .finally(() => setBusy(false))
  }
  return (
    <li className="card qcard">
      <div className="qmain">
      <p className="item-body">{q.body}</p>
      {(q.answer || q.demo || q.tips) && (
        <details className="guidance">
          <summary>Open answer guide <span>Answer · demo · viva tips</span></summary>
          <div className="guidance-grid">
            {q.answer && <section><h4>Suggested answer</h4><p>{q.answer}</p></section>}
            {q.demo && <section><h4>Show a demo</h4><p>{q.demo}</p></section>}
            {q.tips && <section><h4>Pro viva tips</h4><p>{q.tips}</p></section>}
          </div>
        </details>
      )}
      <Meta
        items={[
          <Chance n={q.times_asked} />,
          !q.hideProctor && q.proctors && q.proctors.length > 0 && (
            <span>
              Asked by{' '}
              {q.proctors.map((c, i) => (
                <span key={c}>
                  {i > 0 && ', '}
                  <Link to={`/s/${q.subject}/proctors/${encodeURIComponent(c)}`}>{proctorName(c)}</Link>
                </span>
              ))}
              {(q.proctor_count ?? 0) > q.proctors.length && ` and ${(q.proctor_count ?? 0) - q.proctors.length} more`}
            </span>
          ),
          <ShareButton path={`/s/${q.subject}?q=${encodeURIComponent(q.body.slice(0, 120))}`} title={q.body} />,
          <AdminRemove kind="question" id={q.id} />,
        ]}
      />
      </div>
      <button className={vote.voted ? 'vote on' : 'vote'} onClick={toggle} aria-pressed={vote.voted} aria-label="Upvote">
        {Icon.up}
        <span>{vote.votes}</span>
      </button>
    </li>
  )
}

export function ReviewCard(r: { id: number; body: string; subject: string; level: number; held_on: string | null; proctor?: string; set_id?: number | null }) {
  return (
    <article className="card review">
      <p>{r.body}</p>
      <Meta
        items={[
          r.proctor && <Link to={`/s/${r.subject}/proctors/${encodeURIComponent(r.proctor)}`}>{proctorName(r.proctor)}</Link>,
          r.held_on && date(r.held_on),
          <AdminRemove kind="review" id={r.id} />,
        ]}
      />
    </article>
  )
}
