import { useEffect, useRef, useState } from 'react'

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [state, set] = useState<{ data: T | null; error: string | null; loading: boolean }>({
    data: null,
    error: null,
    loading: true,
  })
  const tick = useRef(0)
  const [nonce, setNonce] = useState(0)

  useEffect(() => {
    const id = ++tick.current
    set((s) => ({ ...s, loading: true, error: null }))
    fn()
      .then((data) => id === tick.current && set({ data, error: null, loading: false }))
      .catch((e: Error) => id === tick.current && set({ data: null, error: e.message, loading: false }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce])

  return { ...state, reload: () => setNonce((n) => n + 1) }
}

export function useDebounced<T>(value: T, ms = 350) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}
