import React from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock3, Target } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import AlertBanner from '../components/AlertBanner.jsx'
import CollectionTable from '../components/CollectionTable.jsx'

export default function Dashboard({ schedule, stats, updateCollection, alertVisible, setAlertVisible, onOpenCollections }) {
  const nextRows = schedule.slice(0, 6)

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Dashboard operacional"
        title="Controle de Coleta de Amostras"
        description="Acompanhamento em tempo real das coletas horárias por pilha, amostrador e status."
      />

      <AlertBanner visible={alertVisible} onClose={() => setAlertVisible(false)} onOpenCollections={onOpenCollections} />

      <section className="stats-grid">
        <StatCard label="Programadas" value={stats.total} detail="coletas no dia" tone="blue" icon={Target} />
        <StatCard label="Realizadas" value={stats.done} detail="registradas" tone="green" icon={CheckCircle2} />
        <StatCard label="Pendentes" value={stats.pending} detail="aguardando coleta" tone="orange" icon={Clock3} />
        <StatCard label="Atrasadas" value={stats.late} detail="fora da tolerância" tone="red" icon={AlertTriangle} />
        <StatCard label="Aderência" value={`${stats.adherence}%`} detail="realizadas/programadas" tone="yellow" icon={Activity} />
      </section>

      <section className="dashboard-grid">
        <div className="panel panel--large">
          <div className="panel__header"><div><h3>Resumo do turno</h3><span>Visão executiva do andamento das amostragens</span></div></div>
          <div className="progress-block">
            <div className="progress-block__top"><strong>{stats.adherence}%</strong><span>Aderência atual</span></div>
            <div className="progress-bar"><div style={{ width: `${stats.adherence}%` }}></div></div>
            <p>Prioridade operacional: tratar coletas pendentes e atrasadas antes do próximo horário fechado.</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel__header"><div><h3>Status crítico</h3><span>Pendências por prioridade</span></div></div>
          <div className="critical-list">
            <div><span className="dot dot--red"></span> Atrasadas <strong>{stats.late}</strong></div>
            <div><span className="dot dot--orange"></span> Pendentes <strong>{stats.pending}</strong></div>
            <div><span className="dot dot--yellow"></span> Parciais <strong>{stats.partial}</strong></div>
            <div><span className="dot dot--green"></span> Concluídas <strong>{stats.done}</strong></div>
          </div>
        </div>
      </section>

      <CollectionTable rows={nextRows} onSave={updateCollection} />
    </div>
  )
}
