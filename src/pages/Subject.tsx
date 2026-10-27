import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { KINDS, api } from '../lib/api'
import { useAuth } from '../lib/auth'
import { useAsync, useDebounced } from '../lib/hooks'
import { proctorName } from '../lib/format'
import { BackLink, Empty, ErrorBox, Loading, Pager } from '../components/ui'
import { AdminRemove, QuestionItem, ReviewCard } from '../components/items'
import Preview from '../components/Preview'
import { host } from '../lib/format'

const PER = 20
const MAX_PAGE = 75

export function SubjectLayout() {
  const { subject = '' } = useParams()
  const { session, ready } = useAuth()
  const onResources = useLocation().pathname.endsWith('/resources')
  const stats = useAsync(() => api.stats(), [])
  const info = stats.data?.subjects.find((s) => s.code === subject.toUpperCase())

  if (stats.loading || !ready) return <Loading rows={3} />
  if (!info) return <Empty>Subject not found.</Empty>

  return (
    <>
      <div className="title-row subject-head" data-s={info.code}>
        <div>
          <h1 className="page-title">{info.code}</h1>
          <p className="muted">{info.name}</p>
        </div>
        {session && (
          <Link to={`/contribute?kind=session&subject=${info.code}`} className="btn small">
            Add questions
          </Link>
        )}
      </div>
      <nav className="segmented tabs" aria-label="Sections">
        <NavLink to={`/s/${info.code}`} end>
          Questions
        </NavLink>
        <NavLink to={`/s/${info.code}/proctors`}>Proctors</NavLink>
        <NavLink to={`/s/${info.code}/resources`}>Resources</NavLink>
      </nav>
      {session || onResources ? <Outlet /> : <Preview />}
    </>
  )
}

function useParamsState() {
  const [params, setParams] = useSearchParams()
  const set = (patch: Record<string, string>, keepPage = false) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(patch)) v ? next.set(k, v) : next.delete(k)
    if (!keepPage) next.delete('page')
    setParams(next, { replace: true })
  }
  return { params, set }
}

export function QuestionList({ subject, proctor }: { subject: string; proctor?: string }) {
  const { params, set } = useParamsState()
  const q = params.get('q') ?? ''
  const level = params.get('level') ?? ''
  const sort = params.get('sort') ?? 'asked'
  const pf = params.get('proctor') ?? ''
  const page = Math.min(Math.max(Number(params.get('page')) || 1, 1), MAX_PAGE)
  const [text, setText] = useState(q)
  const debounced = useDebounced(text)
  const [all, setAll] = useState<string[]>([])

  useEffect(() => {
    if (proctor) return
    let live = true
    api
      .subjectProctors(subject)
      .then((r) => live && setAll(r.map((x) => x.code).sort((x, y) => proctorName(x).localeCompare(proctorName(y), undefined, { numeric: true }))))
      .catch(() => live && setAll([]))
    return () => {
      live = false
    }
  }, [subject, proctor])

  useEffect(() => {
    if (debounced !== q) set({ q: debounced })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const { data, error, loading, reload } = useAsync(
    () => api.questions({ q, subject, level: proctor ? '' : level, proctor: proctor ?? pf, sort, offset: (page - 1) * PER }),
    [q, subject, level, proctor, pf, sort, page],
  )
  const total = data?.[0]?.total ?? 0

  return (
    <>
      <div className={proctor ? 'filters two' : 'filters'}>
        <input className="field grow" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search questions" maxLength={100} aria-label="Search questions" />
        {!proctor && (
          <select className="field" value={level} onChange={(e) => set({ level: e.target.value })} aria-label="Level">
            <option value="">All levels</option>
            <option value="1">Level 1</option>
            <option value="2">Level 2</option>
            <option value="3">Level 3</option>
          </select>
        )}
        {!proctor && (
          <select className="field" value={pf} onChange={(e) => set({ proctor: e.target.value })} aria-label="Proctor">
            <option value="">All proctors</option>
            {all.map((c) => (
              <option key={c} value={c}>
                {proctorName(c)}
              </option>
            ))}
          </select>
        )}
        <select className="field" value={sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort">
          <option value="asked">Most likely first</option>
          <option value="votes">Most upvoted</option>
          <option value="recent">Newest first</option>
        </select>
      </div>
      {loading && !data ? (
        <Loading rows={8} />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : data && data.length === 0 ? (
        <Empty>No questions found.</Empty>
      ) : (
        <>
          <ol className={loading ? 'qgrid dim' : 'qgrid'}>
            {data?.map((x) => <QuestionItem key={x.id} {...x} hideProctor={!!proctor} />)}
          </ol>
          <Pager
            page={page}
            pages={Math.min(Math.ceil(total / PER), MAX_PAGE)}
            onPage={(p) => {
              set({ page: String(p) }, true)
              window.scrollTo(0, 0)
            }}
          />
        </>
      )}
    </>
  )
}

export function SubjectQuestions() {
  const { subject = '' } = useParams()
  return <QuestionList subject={subject.toUpperCase()} />
}

export function SubjectProctors() {
  const { subject = '' } = useParams()
  const sub = subject.toUpperCase()
  const { params, set } = useParamsState()
  const q = params.get('q') ?? ''
  const sort = params.get('sort') ?? 'reviews'
  const page = Math.max(Number(params.get('page')) || 1, 1)
  const [text, setText] = useState(q)
  const debounced = useDebounced(text)
  useEffect(() => {
    if (debounced !== q) set({ q: debounced })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const PER_P = 24
  const { data, error, loading, reload } = useAsync(
    () => api.proctors({ q, subject: sub, sort, offset: (page - 1) * PER_P, limit: PER_P }),
    [q, sub, sort, page],
  )
  const total = data?.[0]?.total ?? 0

  return (
    <>
      <div className="filters two">
        <input className="field grow" type="search" value={text} onChange={(e) => setText(e.target.value)} placeholder="Search proctor" maxLength={40} aria-label="Search proctor" />
        <select className="field" value={sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort">
          <option value="reviews">Most reviewed</option>
          <option value="questions">Most questions</option>
          <option value="name">Name</option>
        </select>
      </div>
      {loading && !data ? (
        <Loading rows={8} />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : data && data.length === 0 ? (
        <Empty>
          No proctor found. <Link to={`/contribute?kind=review&subject=${sub}`}>Add one</Link>
        </Empty>
      ) : (
        <>
          <div className={loading ? 'grid cols-3 blocks dim' : 'grid cols-3 blocks'}>
            {data?.map((p) => (
              <Link key={p.code} to={`/s/${sub}/proctors/${encodeURIComponent(p.code)}`} className="card block-card">
                {proctorName(p.code)}
              </Link>
            ))}
          </div>
          <Pager page={page} pages={Math.min(Math.ceil(total / PER_P), 25)} onPage={(p) => { set({ page: String(p) }, true); window.scrollTo(0, 0) }} />
        </>
      )}
    </>
  )
}

export function SubjectProctor() {
  const { subject = '', code = '' } = useParams()
  const sub = subject.toUpperCase()
  const { data, error, loading, reload } = useAsync(() => api.proctor(code), [code])
  if (loading) return <Loading rows={6} />
  if (error) return <ErrorBox message={error} retry={reload} />
  if (!data) return <Empty>Proctor not found.</Empty>
  const reviews = data.reviews.filter((r) => r.subject === sub)
  return (
    <>
      <BackLink to={`/s/${sub}/proctors`}>All proctors</BackLink>
      <div className="title-row">
        <h2 className="section-title">{proctorName(data.code)}</h2>
        <Link className="btn small" to={`/contribute?kind=review&subject=${sub}&proctor=${encodeURIComponent(data.code)}`}>
          Write a review
        </Link>
      </div>

      <section className="block">
        <h3>Reviews</h3>
        {reviews.length === 0 ? (
          <Empty>No reviews yet.</Empty>
        ) : (
          <div className="stack">
            {reviews.map((r) => (
              <ReviewCard key={r.id} id={r.id} body={r.body} subject={r.subject} level={r.level} held_on={r.held_on} />
            ))}
          </div>
        )}
      </section>

      <section className="block">
        <h3>Questions asked</h3>
        <QuestionList subject={sub} proctor={data.code} />
      </section>
    </>
  )
}

export function SubjectResources() {
  const { subject = '' } = useParams()
  const sub = subject.toUpperCase()
  const [kind, setKind] = useState('')
  const { data, error, loading, reload } = useAsync(() => api.resources(sub, kind), [sub, kind])
  return (
    <>
      <div className="filters two">
        <select className="field" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Type">
          <option value="">All types</option>
          {KINDS.map((k) => (
            <option key={k}>{k}</option>
          ))}
        </select>
        <Link to={`/contribute?kind=resource&subject=${sub}`} className="btn">
          Share a resource
        </Link>
      </div>
      {loading && !data ? (
        <Loading rows={4} />
      ) : error ? (
        <ErrorBox message={error} retry={reload} />
      ) : data && data.length === 0 ? (
        <Empty>No resources yet.</Empty>
      ) : (
        <ul className="list">
          {data?.map((r) => (
            <li className="item" key={r.id}>
              <a href={r.url} target="_blank" rel="noopener noreferrer nofollow ugc" className="item-body res-link">
                {r.title}
              </a>
              <div className="meta">
                <span>{r.kind}</span>
                <span>{host(r.url)}</span>
                <span>
                  <AdminRemove kind="resource" id={r.id} onDone={reload} />
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

export { Outlet }
