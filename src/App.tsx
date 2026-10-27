import { lazy } from 'react'
import { Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'

const pick = <T extends Record<string, any>>(load: () => Promise<T>, name: keyof T) =>
  lazy(() => load().then((m) => ({ default: m[name] })))

const load = () => import('./pages/Subject')
const SubjectLayout = pick(load, 'SubjectLayout')
const SubjectQuestions = pick(load, 'SubjectQuestions')
const SubjectProctors = pick(load, 'SubjectProctors')
const SubjectProctor = pick(load, 'SubjectProctor')
const SubjectResources = pick(load, 'SubjectResources')
const Contribute = lazy(() => import('./pages/Contribute'))
const Account = lazy(() => import('./pages/Account'))
const Admin = lazy(() => import('./pages/Admin'))
const About = lazy(() => import('./pages/About'))
const SignIn = lazy(() => import('./pages/SignIn'))
const ShareOpen = lazy(() => import('./pages/ShareOpen'))

function NotFound() {
  return (
    <div className="gate">
      <h2>Page not found</h2>
      <Link className="btn primary" to="/">
        Home
      </Link>
    </div>
  )
}

export default function App() {
  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="s/:subject" element={<SubjectLayout />}>
            <Route index element={<SubjectQuestions />} />
            <Route path="proctors" element={<SubjectProctors />} />
            <Route path="proctors/:code" element={<SubjectProctor />} />
            <Route path="resources" element={<SubjectResources />} />
          </Route>
          <Route path="contribute" element={<Contribute />} />
          <Route path="me" element={<Account />} />
          <Route path="admin" element={<Admin />} />
          <Route path="about" element={<About />} />
          <Route path="signin" element={<SignIn />} />
          <Route path="r/:code" element={<ShareOpen />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
