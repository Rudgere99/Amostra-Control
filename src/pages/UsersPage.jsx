import React, { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { createUser, fetchUsers, hasApiConfigured } from '../services/api.js'

const fallbackUsers = [
  { id: 1, name: 'Amostrador Campo', badge: '1023', profile: 'amostrador', active: true },
  { id: 2, name: 'Controlador CCO', badge: '2001', profile: 'cco', active: true },
  { id: 3, name: 'Administrador', badge: '0001', profile: 'admin', active: true }
]

export default function UsersPage() {
  const [users, setUsers] = useState(fallbackUsers)
  const [form, setForm] = useState({ name: '', badge: '', profile: 'amostrador' })
  const [status, setStatus] = useState(hasApiConfigured() ? 'Conectando ao Railway...' : 'API não configurada. Exibindo modelo local.')
  const [saving, setSaving] = useState(false)

  async function loadUsers() {
    if (!hasApiConfigured()) return

    try {
      const data = await fetchUsers()
      setUsers(Array.isArray(data) ? data : [])
      setStatus('Usuários carregados do Railway')
    } catch (error) {
      console.error(error)
      setStatus(`Erro ao carregar usuários: ${error.message}`)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()

    if (!form.name.trim() || !form.badge.trim()) {
      alert('Informe nome e cadastro.')
      return
    }

    setSaving(true)
    try {
      if (hasApiConfigured()) {
        const saved = await createUser(form)
        setUsers((current) => {
          const exists = current.some((user) => user.badge === saved.badge)
          return exists ? current.map((user) => user.badge === saved.badge ? saved : user) : [saved, ...current]
        })
        setStatus('Usuário salvo no Railway')
      } else {
        setUsers((current) => [{ id: Date.now(), ...form, active: true }, ...current])
      }

      setForm({ name: '', badge: '', profile: 'amostrador' })
    } catch (error) {
      console.error(error)
      alert(`Não foi possível salvar o usuário: ${error.message}`)
      setStatus(`Erro ao salvar usuário: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Cadastros" title="Usuários" description="Cadastro real de amostradores, CCO e administradores para os lançamentos de coleta." />

      <div className="api-status-bar"><span className={status.includes('Railway') ? 'api-dot api-dot--ok' : 'api-dot'}></span>{status}</div>

      <form className="generation-card" onSubmit={submit}>
        <div>
          <h3>Novo usuário</h3>
          <p>O cadastro será usado nos lançamentos de coleta.</p>
        </div>
        <label>Nome<input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Nome do usuário" /></label>
        <label>Cadastro<input value={form.badge} onChange={(e) => setField('badge', e.target.value)} placeholder="Matrícula/cadastro" /></label>
        <label>Perfil<select value={form.profile} onChange={(e) => setField('profile', e.target.value)}><option value="amostrador">Amostrador</option><option value="cco">CCO</option><option value="admin">Admin</option></select></label>
        <button className="btn btn--orange" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar usuário'}</button>
      </form>

      <div className="table-card">
        <div className="table-card__header"><div><h3>Cadastros</h3><span>Lista integrada com a API /api/cadastros</span></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Nome</th><th>Cadastro</th><th>Perfil</th><th>Status</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id || user.badge}>
                  <td>{user.name}</td>
                  <td>{user.badge}</td>
                  <td>{user.profile}</td>
                  <td>{user.active ? 'Ativo' : 'Inativo'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
