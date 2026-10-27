import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KINDS, api, type Submission } from '../lib/api'
import { Gate } from '../components/ui'
import { Field, ProctorPicker, SubjectSelect } from '../components/fields'

type Kind = Submission['kind']

const initialSubject = () => new URLSearchParams(window.location.search).get('subject')?.toUpperCase() ?? ''

const tabs: { kind: Kind; label: string }[] = [
  { kind: 'session', label: 'Questions' },
  { kind: 'review', label: 'Proctor review' },
  { kind: 'resource', label: 'Resource' },
]

function useSubmit(kind: Kind, onSent: () => void) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const send = async (e: FormEvent, payload: Record<string, unknown>) => {
    e.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      await api.submit(kind, payload)
      onSent()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return { busy, error, send }
}

function Actions({ busy, error, disabled }: { busy: boolean; error: string; disabled?: boolean }) {
  return (
    <>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      <button className="btn primary" type="submit" disabled={busy || disabled}>
        {busy ? 'Sending' : 'Submit for approval'}
      </button>
    </>
  )
}

function LevelSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)} required aria-label="Level">
      <option value="" disabled>
        Choose level
      </option>
      <option value="1">Level 1</option>
      <option value="2">Level 2</option>
      <option value="3">Level 3</option>
    </select>
  )
}

function SessionForm({ onSent }: { onSent: () => void }) {
  const [params] = useSearchParams()
  const [subject, setSubject] = useState(initialSubject)
  const [level, setLevel] = useState('')
  const [proctor, setProctor] = useState(params.get('proctor') ?? '')
  const [heldOn, setHeldOn] = useState('')
  const [items, setItems] = useState<string[]>([''])
  const [advice, setAdvice] = useState('')
  const { busy, error, send } = useSubmit('session', onSent)
  const lines = items.map((l) => l.trim()).filter((l) => l.length >= 3)

  return (
    <form
      className="form"
      onSubmit={(e) =>
        send(e, { subject, level, proctor: proctor.trim(), held_on: heldOn, questions: lines.slice(0, 40), advice: advice.trim() })
      }
    >
      <div className="form-grid">
        <Field label="Subject">
          <SubjectSelect value={subject} onChange={setSubject} required />
        </Field>
        <Field label="Level">
          <LevelSelect value={level} onChange={setLevel} />
        </Field>
        <Field label="Proctor">
          <ProctorPicker subject={subject} value={proctor} onChange={setProctor} />
        </Field>
        <Field label="Viva date">
          <input className="field" type="date" value={heldOn} onChange={(e) => setHeldOn(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
        </Field>
      </div>
      <div className="form-row">
        <span className="label">Questions</span>
        <div className="q-inputs">
          {items.map((text, i) => (
            <div className="q-input" key={i}>
              <textarea
                className="field"
                rows={3}
                value={text}
                onChange={(e) => setItems(items.map((t, j) => (j === i ? e.target.value : t)))}
                maxLength={1000}
                placeholder={`Question ${i + 1}`}
                aria-label={`Question ${i + 1}`}
                required={i === 0}
              />
              {items.length > 1 && (
                <button type="button" className="link danger" onClick={() => setItems(items.filter((_, j) => j !== i))}>
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {items.length < 40 && (
          <button type="button" className="btn small add-q" onClick={() => setItems([...items, ''])}>
            Add another question
          </button>
        )}
      </div>
      <Field label="Advice for others" hint="Optional">
        <textarea className="field" rows={4} value={advice} onChange={(e) => setAdvice(e.target.value)} maxLength={3000} />
      </Field>
      <Actions busy={busy} error={error} disabled={lines.length === 0} />
    </form>
  )
}

function ReviewForm({ onSent }: { onSent: () => void }) {
  const [params] = useSearchParams()
  const [subject, setSubject] = useState(initialSubject)
  const [level, setLevel] = useState('')
  const [proctor, setProctor] = useState(params.get('proctor') ?? '')
  const [body, setBody] = useState('')
  const { busy, error, send } = useSubmit('review', onSent)
  return (
    <form className="form" onSubmit={(e) => send(e, { subject, level, proctor: proctor.trim(), body: body.trim() })}>
      <div className="form-grid">
        <Field label="Subject">
          <SubjectSelect value={subject} onChange={setSubject} required />
        </Field>
        <Field label="Level">
          <LevelSelect value={level} onChange={setLevel} />
        </Field>
        <Field label="Proctor">
          <ProctorPicker subject={subject} value={proctor} onChange={setProctor} />
        </Field>
      </div>
      <Field label="Review" hint="What to expect and how to prepare">
        <textarea className="field" rows={6} value={body} onChange={(e) => setBody(e.target.value)} minLength={10} maxLength={3000} required />
      </Field>
      <Actions busy={busy} error={error} />
    </form>
  )
}

function ResourceForm({ onSent }: { onSent: () => void }) {
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [subject, setSubject] = useState(initialSubject)
  const [kind, setKind] = useState('Guide')
  const { busy, error, send } = useSubmit('resource', onSent)
  return (
    <form className="form" onSubmit={(e) => send(e, { title: title.trim(), url: url.trim(), subject, kind })}>
      <Field label="Title">
        <input className="field" value={title} onChange={(e) => setTitle(e.target.value)} minLength={3} maxLength={120} required />
      </Field>
      <Field label="Link" hint="Must start with https://">
        <input className="field" type="url" value={url} onChange={(e) => setUrl(e.target.value)} maxLength={500} pattern="https://.*" required placeholder="https://" />
      </Field>
      <div className="form-grid">
        <Field label="Subject" hint="Optional">
          <SubjectSelect value={subject} onChange={setSubject} all="Any subject" />
        </Field>
        <Field label="Type">
          <select className="field" value={kind} onChange={(e) => setKind(e.target.value)}>
            {KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
      </div>
      <Actions busy={busy} error={error} />
    </form>
  )
}

function Body() {
  const [params, setParams] = useSearchParams()
  const [sent, setSent] = useState(false)
  const kind = (tabs.find((t) => t.kind === params.get('kind'))?.kind ?? 'session') as Kind

  if (sent)
    return (
      <div className="gate">
        <h2>Sent for approval</h2>
        <p className="muted">It appears on the site once an admin approves it.</p>
        <div className="row-actions">
          <button className="btn primary" onClick={() => setSent(false)}>
            Add another
          </button>
          <Link className="btn" to="/me">
            My submissions
          </Link>
        </div>
      </div>
    )

  const done = () => {
    setSent(true)
    window.scrollTo(0, 0)
  }
  return (
    <>
      <div className="segmented" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.kind}
            role="tab"
            aria-selected={kind === t.kind}
            className={kind === t.kind ? 'on' : ''}
            onClick={() => {
              const next = new URLSearchParams(params)
              next.set('kind', t.kind)
              setParams(next, { replace: true })
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {kind === 'session' && <SessionForm onSent={done} />}
      {kind === 'review' && <ReviewForm onSent={done} />}
      {kind === 'resource' && <ResourceForm onSent={done} />}
    </>
  )
}

export default function Contribute() {
  return (
    <>
      <h1 className="page-title">Add to the bank</h1>
      <Gate what="the form">
        <Body />
      </Gate>
    </>
  )
}
