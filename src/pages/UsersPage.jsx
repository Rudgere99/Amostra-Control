import React, { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { createUser, fetchUsers, hasApiConfigured } from '../services/api.js'

const fallbackUsers = [
  { id: 1, name: 'Amostrador Campo', badge: '1023', profile: 'Amostrador', letter: 'A', active: true },
  { id: 2, name: 'Controlador CCO', badge: '2001', profile: 'Controle', letter: 'C', active: true }
]

export default function UsersPage() {
  const [users, setUsers] = useState(fallbackUsers)
  const [form, setForm] = useState({ name: '', badge: '', profile: 'Amostrador', letter: '' })
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
      alert('Informe nome e matrícula.')
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

      setForm({ name: '', badge: '', profile: 'Amostrador', letter: '' })
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
      <PageHeader eyebrow="Cadastros" title="Usuários" description="Cadastro real de amostradores e usuários de controle para os lançamentos de coleta." />

      <div className="api-status-bar"><span className={status.includes('Railway') ? 'api-dot api-dot--ok' : 'api-dot'}></span>{status}</div>

      <form className="generation-card" onSubmit={submit}>
        <div>
          <h3>Novo usuário</h3>
          <p>O cadastro será usado nos lançamentos de coleta.</p>
        </div>
        <label>Nome<input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Nome do usuário" /></label>
        <label>Matrícula<input value={form.badge} onChange={(e) => setField('badge', e.target.value)} placeholder="Matrícula" /></label>
        <label>Perfil<select value={form.profile} onChange={(e) => setField('profile', e.target.value)}><option value="Amostrador">Amostrador</option><option value="Controle">Controle</option></select></label>
        <label>Letra<input value={form.letter} onChange={(e) => setField('letter', e.target.value.toUpperCase())} placeholder="Letra" maxLength={10} /></label>
        <button className="btn btn--orange" type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar usuário'}</button>
      </form>

      <div className="table-card">
        <div className="table-card__header"><div><h3>Usuários cadastrados</h3><span>Lista integrada com a API /api/usuarios</span></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Nome</th><th>Matrícula</th><th>Perfil</th><th>Letra</th><th>Status</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id || user.badge}>
                  <td>{user.name || user.nome}</td>
                  <td>{user.badge || user.matricula || user.cadastro}</td>
                  <td>{user.profile || user.perfil}</td>
                  <td>{user.letter || user.letra || '-'}</td>
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
