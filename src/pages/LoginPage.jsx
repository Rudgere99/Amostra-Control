import React, { useState } from 'react'
import { LogIn } from '../components/LocalIcons.jsx'
import { hasApiConfigured, loginUser } from '../services/api.js'

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ badge: '', name: '' })
  const [status, setStatus] = useState(hasApiConfigured() ? 'Informe seu cadastro para acessar o sistema.' : 'API não configurada. Login local liberado para teste.')
  const [loading, setLoading] = useState(false)

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()

    if (!form.badge.trim() && !form.name.trim()) {
      alert('Informe o cadastro ou o nome do usuário.')
      return
    }

    setLoading(true)

    try {
      let user

      if (hasApiConfigured()) {
        const result = await loginUser(form)
        user = result.user
      } else {
        user = {
          id: Date.now(),
          name: form.name || 'Usuário Local',
          badge: form.badge || 'local',
          profile: 'admin',
          active: true
        }
      }

      localStorage.setItem('amostra-control-user', JSON.stringify(user))
      onLogin(user)
    } catch (error) {
      console.error(error)
      setStatus(`Erro no login: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand__mark">AC</div>
          <div>
            <h1>Amostra<span>Control</span></h1>
            <p>Controle Operacional de Amostragem</p>
          </div>
        </div>

        <div className="login-title">
          <span className="eyebrow">Acesso operacional</span>
          <h2>Entrar no sistema</h2>
          <p>Use o cadastro/matrícula registrado na página de usuários.</p>
        </div>

        <form className="login-form" onSubmit={submit}>
          <label>
            Cadastro / matrícula
            <input
              value={form.badge}
              onChange={(e) => setField('badge', e.target.value)}
              placeholder="Ex: 1023"
              autoFocus
            />
          </label>

          <label>
            Nome, caso não saiba o cadastro
            <input
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Nome do usuário"
            />
          </label>

          <button className="btn btn--orange login-button" type="submit" disabled={loading}>
            <LogIn size={18} /> {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="api-status-bar login-status">
          <span className={status.includes('Erro') ? 'api-dot' : 'api-dot api-dot--ok'}></span>
          {status}
        </div>
      </section>
    </main>
  )
}
