import { Link, useLocation } from 'react-router-dom'

export function NavBar() {
  const location = useLocation()

  return (
    <nav className="navbar no-print" aria-label="Nawigacja główna">
      <div className="navbar-brand">
        <Link to="/" className="navbar-logo">
          🏥 Planer Dyżurów
        </Link>
      </div>
      <div className="navbar-links">
        <Link to="/jednostki" className={location.pathname.startsWith('/jednostki') ? 'nav-link active' : 'nav-link'}>
          Jednostki
        </Link>
      </div>
    </nav>
  )
}
