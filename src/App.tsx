import { HashRouter, Routes, Route } from 'react-router-dom'
import { NavBar } from '@/components/nav/NavBar'
import { HomePage } from '@/routes/HomePage'
import { SetupPage } from '@/routes/SetupPage'
import { PlanPage } from '@/routes/PlanPage'
import { UnitsProvider } from '@/state/UnitsContext'
import { PlansProvider } from '@/state/PlansContext'
import { ShareHandler } from '@/components/ShareHandler'

export default function App() {
  return (
    <UnitsProvider>
      <PlansProvider>
        <HashRouter>
          <ShareHandler />
          <NavBar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/setup/:unitId" element={<SetupPage />} />
              <Route path="/plan/:planId" element={<PlanPage />} />
            </Routes>
          </main>
        </HashRouter>
      </PlansProvider>
    </UnitsProvider>
  )
}
