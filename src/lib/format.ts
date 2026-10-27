export const date = (d: string | null | undefined) =>
  d
    ? new Date(d.length === 10 ? d + 'T00:00:00' : d).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : ''

export const host = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

export const num = (n: number) => n.toLocaleString('en-IN')


export const chance = (n: number) => (n >= 10 ? 'High chance' : n >= 3 ? 'Medium chance' : 'Low chance')

const brand: Record<string, string> = { appdev: 'AppDev', mlp: 'MLP' }

export function proctorName(code: string) {
  if (/^\d+$/.test(code)) return `Proctor ${code}`
  const m = code.match(/^(.*?)[\s_-]*level\s*(\d)[\s_-]*(?:viva)?\s*(\d+)$/i)
  if (m) {
    const pre = m[1].replace(/[\s_-]+/g, ' ').trim()
    const lead = pre ? (brand[pre.toLowerCase()] ?? pre) + ' ' : ''
    return `${lead}Level ${m[2]} Proctor ${m[3]}`
  }
  const t = code.replace(/[_]+/g, ' ').trim()
  const l = t.toLowerCase()
  return l.startsWith('proctor') || l === 'unknown' ? t : `Proctor ${t}`
}
