import React from 'react'
import PageHeader from '../components/PageHeader.jsx'

const users = [
  { name: 'Amostrador Campo', badge: '1023', profile: 'Amostrador', status: 'Ativo' },
  { name: 'Controlador CCO', badge: '2001', profile: 'CCO', status: 'Ativo' },
  { name: 'Administrador', badge: '0001', profile: 'Admin', status: 'Ativo' }
]

export default function UsersPage() {
  return (
    <div className="page-stack">
      <PageHeader eyebrow="Cadastros" title="Usuários" description="Controle de perfis de acesso para amostrador, CCO e administrador." />
      <div className="table-card">
        <div className="table-card__header"><div><h3>Usuários cadastrados</h3><span>Modelo visual para futura integração com banco</span></div></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Nome</th><th>Cadastro</th><th>Perfil</th><th>Status</th></tr></thead>
            <tbody>{users.map((user) => <tr key={user.badge}><td>{user.name}</td><td>{user.badge}</td><td>{user.profile}</td><td>{user.status}</td></tr>)}</tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
