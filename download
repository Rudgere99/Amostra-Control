import React, { useEffect, useState } from 'react'
import { RefreshCcw, UserPlus } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { createUser, fetchUsers, hasApiConfigured, updateUserStatus } from '../services/api.js'

const fallbackUsers = [
  { id: 1, name: 'Amostrador Campo', badge: '1023', profile: 'amostrador', letter: 'A', active: true },
  { id: 2, name: 'Controlador CCO', badge: '2001', profile: 'cco', letter: 'B', active: true },
  { id: 3, name: 'Administrador', badge: '0001', profile: 'admin', letter: 'C', active: true }
]

export default function UsersPage() {
  const [users, setUsers] = useState(fallbackUsers)
  const [form, setForm] = useState({ name: '', badge: '', profile: 'amostrador', letter: '' })
  const [status, setStatus] = useState(hasApiConfigured() ? 'Conectando ao Railway...' : 'API não configurada. Exibindo modelo local.')
  const [saving, setSaving] = useState(false)

  async function loadUsers() {
    if (!hasApiConfigured()) return

    setSaving(true)
    try {
      const data = await fetchUsers()
      setUsers(Array.isArray(data) ? data : [])
      setStatus('Usuários carregados do Railway')
    } catch (error) {
      console.error(error)
      setStatus(`Erro ao carregar usuários: ${error.message}`)
    } finally {
      setSaving(false)
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

      setForm({ name: '', badge: '', profile: 'amostrador', letter: '' })
    } catch (error) {
      console.error(error)
      alert(`Não foi possível salvar o usuário: ${error.message}`)
      setStatus(`Erro ao salvar usuário: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(user) {
    if (!hasApiConfigured()) {
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, active: !item.active } : item))
      return
    }

    setSaving(true)
    try {
      const updated = await updateUserStatus(user.id, !user.active)
      setUsers((current) => current.map((item) => item.id === user.id ? updated : item))
      setStatus(updated.active ? 'Usuário ativado no Railway' : 'Usuário inativado no Railway')
    } catch (error) {
      console.error(error)
      alert(`Não foi possível alterar o status: ${error.message}`)
      setStatus(`Erro ao alterar status: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Cadastros"
        title="Usuários"
        description="Cadastro real de amostradores, CCO e administradores para login e lançamentos de coleta."
        actions={(
          <button className="btn btn--ghost" type="button" onClick={loadUsers} disabled={saving}>
            <RefreshCcw size={17} /> Atualizar usuários
          </button>
        )}
      />

      <div className="api-status-bar"><span className={status.includes('Railway') ? 'api-dot api-dot--ok' : 'api-dot'}></span>{status}</div>

      <form className="generation-card users-form" onSubmit={submit}>
        <div>
          <h3>Novo usuário</h3>
          <p>O cadastro será usado para entrar no sistema e vincular os lançamentos de coleta.</p>
        </div>
        <label>Nome<input value={form.name} onChange={(e) => setField('name', e.target.value)} placeholder="Nome do usuário" /></label>
        <label>Cadastro<input value={form.badge} onChange={(e) => setField('badge', e.target.value)} placeholder="Matrícula/cadastro" /></label>
        <label>Perfil<select value={form.profile} onChange={(e) => setField('profile', e.target.value)}><option value="amostrador">Amostrador</option><option value="cco">CCO</option><option value="admin">Admin</option></select></label>
        <label>Letra do turno<select value={form.letter} onChange={(e) => setField('letter', e.target.value)}><option value="">Sem letra</option><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select></label>
        <button className="btn btn--orange" type="submit" disabled={saving}><UserPlus size={17} /> {saving ? 'Salvando...' : 'Salvar usuário'}</button>
      </form>

      <div className="table-card">
        <div className="table-card__header"><div><h3>Usuários cadastrados</h3><span>Lista integrada com a API /api/usuarios</span></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Nome</th><th>Cadastro</th><th>Perfil</th><th>Letra</th><th>Status</th><th>Ação</th></tr></thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id || user.badge}>
                  <td>{user.name}</td>
                  <td>{user.badge}</td>
                  <td>{user.profile}</td>
                  <td>{user.letter || '-'}</td>
                  <td><span className={user.active ? 'status status--coletado' : 'status status--nao_realizado'}>{user.active ? 'Ativo' : 'Inativo'}</span></td>
                  <td><button className="table-action" type="button" onClick={() => toggleStatus(user)} disabled={saving}>{user.active ? 'Inativar' : 'Ativar'}</button></td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr><td colSpan="6">Nenhum usuário cadastrado.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
