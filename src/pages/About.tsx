import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'

export default function About() {
  const { session } = useAuth()
  return (
    <article className="prose">
      <h1 className="page-title">About viva</h1>

      <h2>The viva</h2>
      <p>
        After you submit your project, a proctor takes a one-to-one video session. You show the app running, then answer questions about
        your code and the choices behind it. The questions depend on your subject, the level, and the proctor.
      </p>

      <h2>How to use this site</h2>
      <ul>
        <li>Pick your subject on the home page.</li>
        <li>Questions: search, filter by level, and see which ones are most likely to come up.</li>
        <li>Proctors: open a proctor to read reviews and see what they asked.</li>
        <li>Resources: links that help with building and explaining your project.</li>
      </ul>

      <h2>Add your own</h2>
      <p>
        After your viva, add the questions you were asked, a review of your proctor, a missing proctor, or a resource that helped. An
        admin checks every submission before it shows up. You can follow the status under <Link to="/me">Account</Link>.
      </p>
      {session && (
        <p>
          <Link className="btn primary" to="/contribute">
            Add to the bank
          </Link>
        </p>
      )}
    </article>
  )
}
