import { useEffect, useState } from 'react'
import { Modal } from '@/components/common/Modal'
import { decodeShareLink } from '@/crypto/share'
import { putUnit, putPlan } from '@/storage/db'
import { useUnits } from '@/state/UnitsContext'
import { usePlans } from '@/state/PlansContext'

export function ShareHandler() {
  const [token, setToken] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [imported, setImported] = useState(false)
  const { reload: reloadUnits } = useUnits()
  const { reload: reloadPlans } = usePlans()

  useEffect(() => {
    const hash = window.location.hash
    const match = hash.match(/[#&]share=([^&]+)/)
    if (match?.[1]) {
      setToken(match[1])
      window.history.replaceState(null, '', window.location.pathname)
    }
  }, [])

  async function handleImport() {
    if (!token) return
    setError('')
    try {
      const payload = await decodeShareLink(token, password)
      await putUnit(payload.unit)
      await putPlan(payload.plan)
      await reloadUnits()
      await reloadPlans()
      setImported(true)
    } catch {
      setError('Nieprawidłowe hasło lub uszkodzony token')
    }
  }

  if (!token) return null

  return (
    <Modal
      title="Zaimportuj zaszyfrowany plan"
      onClose={() => setToken(null)}
      footer={
        !imported ? (
          <>
            <button className="btn btn-secondary" onClick={() => setToken(null)}>Anuluj</button>
            <button className="btn btn-primary" onClick={() => void handleImport()}>Importuj</button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => setToken(null)}>Zamknij</button>
        )
      }
    >
      {!imported ? (
        <>
          <p>Wykryto zaszyfrowany link. Podaj hasło, aby odszyfrować i zaimportować plan.</p>
          <div className="form-group">
            <label>Hasło</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') void handleImport() }}
              autoFocus
            />
          </div>
          {error && <p className="error-msg">{error}</p>}
        </>
      ) : (
        <p>Plan został zaimportowany pomyślnie!</p>
      )}
    </Modal>
  )
}
