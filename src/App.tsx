import { Link, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import { SubjectLayout, SubjectQuestions, SubjectProctors, SubjectProctor, SubjectResources } from './pages/Subject'
import Contribute from './pages/Contribute'
import Account from './pages/Account'
import Admin from './pages/Admin'
import About from './pages/About'
import SignIn from './pages/SignIn'

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
        <Route path="signin" element={<SignIn />} />
        <Route path="about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
