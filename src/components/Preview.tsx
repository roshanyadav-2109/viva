import { api } from '../lib/api'
import { useAsync } from '../lib/hooks'
import { Chance, Meta, SignInButton } from './ui'

const blurred = [
  'Explain how the request travels from the browser to the server and what comes back',
  'Show where this is handled in your code and describe what happens on failure',
  'What changes if the number of users grows and how would you handle it',
  'Walk through the flow once more and point to the file that does it',
  'Why did you choose this approach over the other options available',
]

export default function Preview() {
  const { data } = useAsync(() => api.preview(), [])
  return (
    <div className="preview">
      <ol className="list">
        {data?.map((q, i) => (
          <li className="item" key={i}>
            <p className="item-body">{q.body}</p>
            <Meta items={[<Chance n={q.times_asked} />]} />
          </li>
        ))}
        {!data && [0, 1].map((i) => <li className="item" key={i}><div className="skeleton-row" /></li>)}
      </ol>
      <div className="blur-zone">
        <ol className="list blurred" aria-hidden="true">
          {blurred.map((t, i) => (
            <li className="item" key={i}>
              <p className="item-body">{t}</p>
              <Meta items={['Level 1 Proctor 12', 'Medium chance']} />
            </li>
          ))}
        </ol>
        <div className="blur-cta">
          <h2>Sign in to see all questions</h2>
          <SignInButton className="btn primary" />
        </div>
      </div>
    </div>
  )
}
