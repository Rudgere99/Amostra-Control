import React, { useState } from 'react'
import { LogIn } from '../components/LocalIcons.jsx'
import TrindadeLogo from '../components/TrindadeLogo.jsx'
import { hasApiConfigured, loginUser } from '../services/api.js'

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ badge: '', name: '' })
  const [status, setStatus] = useState(hasApiConfigured() ? 'Informe seu cadastro para acessar o sistema.' : 'API não configurada. Login local liberado para teste.')
  const [loading, setLoading] = useState(false)
  const [pendingUser, setPendingUser] = useState(null)

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

      setPendingUser(user)
    } catch (error) {
      console.error(error)
      setStatus(`Erro no login: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  function confirmAwareness() {
    localStorage.setItem('amostra-control-user', JSON.stringify(pendingUser))
    onLogin(pendingUser)
  }

  const pendingUserName = pendingUser?.name || 'Usuário'

  return (
    <main className="login-page">
      <TrindadeLogo compact className="login-corner-logo" />
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

      {pendingUser && (
        <section className="awareness-dialog" role="dialog" aria-modal="true" aria-labelledby="awareness-title">
          <div className="awareness-card">
            <span className="eyebrow">Declaração operacional</span>
            <h2 id="awareness-title">Confirmação de ciência</h2>
            <div className="awareness-text">
              <p>
                Eu, <strong>{pendingUserName}</strong>, declaro estar ciente da necessidade de realizar as coletas de amostras nos horários estabelecidos, conforme procedimento operacional vigente.
              </p>
              <p>
                Comprometo-me a executar as coletas de forma adequada, garantindo a veracidade e a precisão das informações registradas, bem como a comunicar qualquer intercorrência que possa impactar a realização das amostragens.
              </p>
              <p>
                Reconheço a importância dessas atividades para o controle de qualidade e para a confiabilidade dos dados utilizados nos processos operacionais da empresa.
              </p>
            </div>
            <button className="btn btn--orange awareness-button" type="button" onClick={confirmAwareness}>
              Estou ciente
            </button>
          </div>
        </section>
      )}
    </main>
  )
}
