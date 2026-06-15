import React, { useState } from 'react'
import { loginUser, hasApiConfigured } from '../services/api.js'

export default function LoginPage({ onLogin }) {
  const [matricula, setMatricula] = useState('')
  const [status, setStatus] = useState(hasApiConfigured() ? 'Informe sua matrícula para entrar.' : 'API não configurada. Login local liberado por matrícula.')
  const [loading, setLoading] = useState(false)

  async function submit(event) {
    event.preventDefault()

    const badge = matricula.trim()
    if (!badge) {
      setStatus('Informe a matrícula do usuário.')
      return
    }

    setLoading(true)
    try {
      if (hasApiConfigured()) {
        const user = await loginUser({ matricula: badge })
        onLogin(user)
      } else {
        onLogin({ name: 'Controle Local', badge, matricula: badge, profile: 'Controle', perfil: 'Controle', letter: 'L', letra: 'L', active: true })
      }
    } catch (error) {
      console.error(error)
      setStatus(`Não foi possível entrar: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-shell">
      <form className="login-card" onSubmit={submit}>
        <div className="brand login-card__brand">
          <div className="brand__mark">AC</div>
          <div>
            <h1>Amostra<span>Control</span></h1>
            <p>Login operacional</p>
          </div>
        </div>

        <div>
          <span className="eyebrow">Acesso</span>
          <h2>Entrar no sistema</h2>
          <p>Use sua matrícula cadastrada. O perfil controla automaticamente as telas disponíveis.</p>
        </div>

        <label>Matrícula<input value={matricula} onChange={(e) => setMatricula(e.target.value)} placeholder="Ex.: 1023" autoFocus /></label>
        <button className="btn btn--orange" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
        <small>{status}</small>
      </form>
    </main>
  )
}
