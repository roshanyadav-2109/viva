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

export default function Preview({ subject }: { subject?: string }) {
  const { data } = useAsync(() => api.preview(subject), [subject])
  return (
    <div className="preview">
      <ol className="qgrid">
        {data?.map((q, i) => (
          <li className="card qcard" key={i}>
            <div className="qmain">
              <p className="item-body">{q.body}</p>
              <Meta items={[<Chance n={q.times_asked} />]} />
            </div>
          </li>
        ))}
        {!data && [0, 1, 2, 3, 4, 5].map((i) => <li className="skeleton-row" key={i} />)}
      </ol>
      <div className="blur-zone">
        <ol className="qgrid blurred" aria-hidden="true">
          {blurred.map((t, i) => (
            <li className="card qcard" key={i}>
              <div className="qmain">
                <p className="item-body">{t}</p>
                <Meta items={['Medium chance']} />
              </div>
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
