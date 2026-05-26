import { Link } from 'react-router-dom'

export function LandingPage() {
  return (
    <div className="landing">
      <div className="landing-hero">
        <img src={`${import.meta.env.BASE_URL}hero.jpg`} alt="" className="landing-hero-img" />
        <div className="landing-hero-text">
          <h1>Szpitalik</h1>
          <p className="landing-tagline">Planowanie dyżurów lekarskich — szybko, lokalnie, bez chmury.</p>
          <p className="landing-sub">Twórz miesięczne plany, uwzględniaj preferencje i generuj harmonogramy automatycznie. Dane zostają w Twojej przeglądarce.</p>
          <Link to="/jednostki" className="btn btn-primary btn-lg">Rozpocznij →</Link>
        </div>
      </div>
    </div>
  )
}
