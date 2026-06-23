import React from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock3, Target } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'

export default function Dashboard({ stats }) {
  const safeStats = {
    total: stats?.total ?? 0,
    done: stats?.done ?? 0,
    pending: stats?.pending ?? 0,
    adherence: stats?.adherence ?? 0,
    notDone: stats?.notDone ?? 0
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Dashboard operacional"
        title="Controle de Coleta de Amostras"
        description="Acompanhamento em tempo real das coletas horárias por pilha, amostrador e status. Os indicadores são calculados a partir dos lançamentos salvos no backend."
      />


      <section className="stats-grid">
        <StatCard label="Programadas" value={safeStats.total} detail="faixas previstas no dia" tone="blue" icon={Target} />
        <StatCard label="Pendentes" value={safeStats.pending} detail="sem lançamento concluído" tone="orange" icon={Clock3} />
        <StatCard label="Realizadas" value={safeStats.done} detail="salvas no backend" tone="green" icon={CheckCircle2} />
        <StatCard label="Não realizadas" value={safeStats.notDone} detail="lançadas como não realizadas" tone="red" icon={AlertTriangle} />
        <StatCard label="Aderência" value={`${safeStats.adherence}%`} detail="realizadas/programadas" tone="yellow" icon={Activity} />
      </section>
    </div>
  )
}
