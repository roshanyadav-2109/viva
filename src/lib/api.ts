import { supabase } from './supabase'

export type Subject = { code: string; name: string; questions: number }
export type Stats = { questions: number; sets: number; proctors: number; reviews: number; subjects: Subject[] }
export type Me = { id: string; email: string; name: string; avatar: string | null; admin: boolean }

export type Question = {
  id: number
  body: string
  subject: string
  level: number
  proctors: string[]
  proctor_count: number
  set_id: number | null
  times_asked: number
  asked_on: string | null
  votes: number
  voted: boolean
  total: number
}

export type ProctorRow = { code: string; questions: number; sets: number; reviews: number; total: number }

export type Proctor = {
  code: string
  questions: number
  sets: { id: number; subject: string; level: number; held_on: string | null; questions: number }[]
  reviews: { id: number; body: string; subject: string; level: number; held_on: string | null; set_id: number | null }[]
  top: { id: number; body: string; times_asked: number; subject: string }[]
}

export type VivaSet = {
  id: number
  subject: string
  level: number
  held_on: string | null
  proctor: string
  questions: { id: number; position: number | null; body: string; times_asked: number }[]
  reviews: { id: number; body: string }[]
}

export type Resource = { id: number; title: string; url: string; subject: string | null; kind: string }

export type Feed = {
  top: { id: number; body: string; subject: string; level: number; times_asked: number; proctor: string }[]
  reviews: { id: number; body: string; subject: string; level: number; held_on: string | null; proctor: string }[]
  resources: Resource[]
}

export type Submission = {
  id: number
  kind: 'session' | 'review' | 'proctor' | 'resource'
  payload: Record<string, any>
  status: 'pending' | 'approved' | 'rejected'
  note: string | null
  created_at: string
  email?: string
}

export type ShareRow = { code: string; path: string; email: string; created_at: string; opens: number; people: number; last_opened: string | null }
export type ShareOpen = { who: string; opened_at: string }

export const KINDS = ['Guide', 'Video', 'Code', 'Tool', 'Notes', 'Other']

async function rpc<T>(name: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(name, args)
  if (error) {
    if (error.code === '54000' || error.code === '22023' || error.code === '22008') throw new Error(error.message)
    if (error.code === '28000' || error.code === '42501') throw new Error('Sign in to continue')
    throw new Error('Something went wrong. Try again.')
  }
  return data as T
}

const clean = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v !== undefined && v !== null))

let statsCache: Promise<Stats> | null = null

export const api = {
  stats: () => (statsCache ??= rpc<Stats>('site_stats').catch((e) => {
    statsCache = null
    throw e
  })),
  preview: () => rpc<{ body: string; times_asked: number }[]>('preview_questions'),
  me: () => rpc<Me | null>('me'),
  subjects: () => rpc<{ code: string; name: string }[]>('list_subjects'),
  feed: () => rpc<Feed>('home_feed'),
  questions: (a: { q?: string; subject?: string; level?: string; proctor?: string; sort?: string; offset?: number }) =>
    rpc<Question[]>('search_questions', {
      p_q: a.q || null,
      p_subject: a.subject || null,
      p_level: a.level ? Number(a.level) : null,
      p_proctor: a.proctor || null,
      p_sort: a.sort || 'asked',
      p_limit: 20,
      p_offset: a.offset ?? 0,
    }),
  subjectProctors: (subject: string) => rpc<{ code: string }[]>('subject_proctors', { p_subject: subject }),
  createShare: (path: string) => rpc<string>('create_share', { p_path: path }),
  openShare: (code: string, visitor: string) => rpc<string | null>('open_share', { p_code: code, p_visitor: visitor }),
  adminShares: () => rpc<ShareRow[]>('admin_shares'),
  adminShareOpens: (code: string) => rpc<ShareOpen[]>('admin_share_opens', { p_code: code }),
  vote: (id: number) => rpc<{ votes: number; voted: boolean }>('toggle_vote', { p_id: id }),
  proctors: (a: { q?: string; subject?: string; sort?: string; offset?: number; limit?: number }) =>
    rpc<ProctorRow[]>('list_proctors', {
      p_q: a.q || null,
      p_subject: a.subject || null,
      p_sort: a.sort || 'questions',
      p_limit: a.limit ?? 24,
      p_offset: a.offset ?? 0,
    }),
  proctor: (code: string) => rpc<Proctor | null>('get_proctor', { p_code: code }),
  set: (id: number) => rpc<VivaSet | null>('get_set', { p_id: id }),
  resources: (subject?: string, kind?: string) =>
    rpc<Resource[]>('list_resources', { p_subject: subject || null, p_kind: kind || null }),
  submit: (kind: Submission['kind'], payload: Record<string, unknown>) =>
    rpc<number>('submit_item', { p_kind: kind, p_payload: clean(payload) }),
  mine: () => rpc<Submission[]>('my_submissions'),
  adminList: (status: string) => rpc<Submission[]>('admin_list', { p_status: status }),
  adminReview: (id: number, approve: boolean, note?: string) =>
    rpc<void>('admin_review', { p_id: id, p_approve: approve, p_note: note || null }),
  adminRemove: (kind: 'question' | 'review' | 'resource', id: number) =>
    rpc<void>('admin_remove', { p_kind: kind, p_id: id }),
}
