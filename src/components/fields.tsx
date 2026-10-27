import { useEffect, useState, type ReactNode } from 'react'
import { api } from '../lib/api'
import { useAsync } from '../lib/hooks'
import { proctorName } from '../lib/format'

export function SubjectSelect({
  value,
  onChange,
  all,
  id,
  required,
}: {
  value: string
  onChange: (v: string) => void
  all?: string
  id?: string
  required?: boolean
}) {
  const { data } = useAsync(() => api.stats(), [])
  return (
    <select className="field" id={id} value={value} onChange={(e) => onChange(e.target.value)} aria-label="Subject" required={required}>
      {all !== undefined ? <option value="">{all}</option> : <option value="" disabled>Choose subject</option>}
      {data?.subjects.map((s) => (
        <option key={s.code} value={s.code}>
          {s.code} · {s.name}
        </option>
      ))}
    </select>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="form-row">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="hint">{hint}</span>}
    </label>
  )
}

export function ProctorPicker({ subject, value, onChange }: { subject: string; value: string; onChange: (v: string) => void }) {
  const [codes, setCodes] = useState<string[] | null>(null)
  const [fresh, setFresh] = useState(false)

  useEffect(() => {
    if (!subject) {
      setCodes(null)
      return
    }
    let live = true
    api
      .subjectProctors(subject)
      .then((r) => {
        if (!live) return
        const list = r.map((x) => x.code).sort((a, b) => proctorName(a).localeCompare(proctorName(b), undefined, { numeric: true }))
        setCodes(list)
        if (value && !list.includes(value)) setFresh(true)
      })
      .catch(() => live && setCodes([]))
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subject])

  return (
    <>
      <select
        className="field"
        value={fresh ? '__new' : value}
        disabled={!subject || codes === null}
        required
        onChange={(e) => {
          if (e.target.value === '__new') {
            setFresh(true)
            onChange('')
          } else {
            setFresh(false)
            onChange(e.target.value)
          }
        }}
        aria-label="Proctor"
      >
        <option value="" disabled>
          {subject ? 'Choose proctor' : 'Choose subject first'}
        </option>
        {codes?.map((c) => (
          <option key={c} value={c}>
            {proctorName(c)}
          </option>
        ))}
        <option value="__new">Not listed, add new</option>
      </select>
      {fresh && (
        <input
          className="field"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={40}
          minLength={2}
          required
          pattern="[A-Za-z0-9][A-Za-z0-9 ._\-]{1,39}"
          placeholder="New proctor name or ID"
          autoComplete="off"
        />
      )}
    </>
  )
}
