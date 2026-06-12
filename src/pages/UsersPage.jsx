import React, { useEffect, useState } from 'react'
import { Plus, Save } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { createUser, fetchUsers, hasApiConfigured } from '../services/api.js'

const initialUsers = [
  { id: 'local-1023', name: 'Amostrador Campo', badge: '1023', profile: 'amostrador', active: true, status: 'Ativo' },
  { id: 'local-2001', name: 'Controlador CCO', badge: '2001', profile: 'cco', active: true, status: 'Ativo' },
  { id: 'local-0001', name: 'Administrador', badge: '0001', profile: 'admin', active: true, status: 'Ativo' }
]

const emptyForm = {
  name: '',
  badge: '',
  profile: 'amostrador',
  active: true
}

const profileLabels = {
  amostrador: 'Amostrador',
  cco: 'CCO',
  admin: 'Administrador'
}

function normalizeUser(user) {
  return {
    ...user,
    status: user.active ? 'Ativo' : 'Inativo'
  }
}

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers)
  const [form, setForm] = useState(emptyForm)
  const [message, setMessage] = useState(hasApiConfigured() ? 'Carregando usuários do banco...' : 'API não configurada. Cadastros salvos apenas nesta sessão.')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    async function loadUsers() {
      if (!hasApiConfigured()) return

      try {
        const data = await fetchUsers()
        if (Array.isArray(data)) {
          setUsers(data.map(normalizeUser))
        }
        setMessage('Usuários carregados do banco.')
      } catch (error) {
        console.error(error)
        setMessage(`Não foi possível carregar usuários: ${error.message}`)
      }
    }

    loadUsers()
  }, [])

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function submit(event) {
    event.preventDefault()

    if (!form.name.trim() || !form.badge.trim()) {
      alert('Preencha o nome e o cadastro do usuário.')
      return
    }

    setIsSaving(true)

    try {
      let savedUser = normalizeUser({ ...form, id: `local-${form.badge}` })

      if (hasApiConfigured()) {
        savedUser = normalizeUser(await createUser(form))
        setMessage('Usuário cadastrado no banco.')
      } else {
        setMessage('Usuário cadastrado localmente nesta sessão.')
      }

      setUsers((current) => {
        const exists = current.some((user) => user.badge === savedUser.badge)
        if (exists) return current.map((user) => user.badge === savedUser.badge ? savedUser : user)
        return [...current, savedUser]
      })
      setForm(emptyForm)
    } catch (error) {
      console.error(error)
      alert(`Não foi possível cadastrar usuário: ${error.message}`)
      setMessage(`Erro ao cadastrar usuário: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Cadastros"
        title="Usuários"
        description="Cadastre amostradores, CCO e administradores que registrarão as coletas."
        actions={<span className="inline-status">{message}</span>}
      />

      <form className="panel" onSubmit={submit}>
        <div className="panel__header">
          <div>
            <h3>Novo usuário</h3>
            <span>Informe nome, cadastro e perfil de acesso.</span>
          </div>
          <button className="btn btn--orange" type="submit" disabled={isSaving}>
            {isSaving ? <Save size={17} /> : <Plus size={17} />}
            {isSaving ? 'Salvando...' : 'Cadastrar'}
          </button>
        </div>

        <div className="form-grid">
          <label>Nome<input value={form.name} onChange={(event) => setField('name', event.target.value)} placeholder="Nome completo" /></label>
          <label>Cadastro<input value={form.badge} onChange={(event) => setField('badge', event.target.value)} placeholder="Ex: 12345" /></label>
          <label>Perfil<select value={form.profile} onChange={(event) => setField('profile', event.target.value)}><option value="amostrador">Amostrador</option><option value="cco">CCO</option><option value="admin">Administrador</option></select></label>
          <label>Status<select value={form.active ? 'ativo' : 'inativo'} onChange={(event) => setField('active', event.target.value === 'ativo')}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select></label>
        </div>
      </form>

      <div className="table-card">
        <div className="table-card__header"><div><h3>Usuários cadastrados</h3><span>Dados integrados à tabela usuarios do banco.</span></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Nome</th><th>Cadastro</th><th>Perfil</th><th>Status</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.id || user.badge}><td>{user.name}</td><td>{user.badge}</td><td>{profileLabels[user.profile] || user.profile}</td><td>{user.status}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
