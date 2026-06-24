import React from 'react'
import { Activity, AlertTriangle, CheckCircle2, Clock3, Target } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import AlertBanner from '../components/AlertBanner.jsx'

export default function Dashboard({ stats, alertVisible, setAlertVisible, onOpenCollections }) {
  const safeStats = {
    total: stats?.total ?? 0,
    done: stats?.done ?? 0,
    pending: stats?.pending ?? 0,
    late: stats?.late ?? 0,
    partial: stats?.partial ?? 0,
    adherence: stats?.adherence ?? 0,
    fine: stats?.fine ?? 0,
    notDone: stats?.notDone ?? 0,
    totalDay: stats?.totalDay ?? stats?.total ?? 0
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Dashboard operacional"
        title="Controle de Coleta de Amostras"
        description="Acompanhamento em tempo real das coletas horárias por pilha, amostrador e status. Os indicadores são calculados a partir dos lançamentos salvos no backend."
      />

      <AlertBanner visible={alertVisible} onClose={() => setAlertVisible(false)} onOpenCollections={onOpenCollections} />

      <section className="stats-grid">
        <StatCard label="Programadas" value={safeStats.total} detail={`faixas vencidas | dia: ${safeStats.totalDay}`} tone="blue" icon={Target} />
        <StatCard label="Realizadas" value={safeStats.done} detail="salvas no backend" tone="green" icon={CheckCircle2} />
        <StatCard label="Pendentes" value={safeStats.pending} detail="sem lançamento concluído" tone="orange" icon={Clock3} />
        <StatCard label="Atrasadas" value={safeStats.late} detail="horários vencidos" tone="red" icon={AlertTriangle} />
        <StatCard label="Aderência" value={`${safeStats.adherence}%`} detail="realizadas/programadas" tone="yellow" icon={Activity} />
      </section>

      <section className="dashboard-grid">
        <div className="panel panel--large">
          <div className="panel__header">
            <div>
              <h3>Resumo do dia</h3>
              <span>Cálculo do dia considera somente as faixas já vencidas/liberadas</span>
            </div>
          </div>
          <div className="progress-block">
            <div className="progress-block__top"><strong>{safeStats.adherence}%</strong><span>Aderência atual</span></div>
            <div className="progress-bar"><div style={{ width: `${safeStats.adherence}%` }}></div></div>
            <p>Prioridade operacional: tratar coletas pendentes e atrasadas antes do próximo horário fechado.</p>
          </div>
        </div>

        <div className="panel">
          <div className="panel__header">
            <div>
              <h3>Status crítico</h3>
              <span>Pendências por prioridade</span>
            </div>
          </div>
          <div className="critical-list">
            <div><span className="dot dot--red"></span> Atrasadas <strong>{safeStats.late}</strong></div>
            <div><span className="dot dot--orange"></span> Pendentes <strong>{safeStats.pending}</strong></div>
            <div><span className="dot dot--yellow"></span> Parciais <strong>{safeStats.partial}</strong></div>
            <div><span className="dot dot--green"></span> Concluídas <strong>{safeStats.done}</strong></div>
            <div><span className="dot dot--orange"></span> Não realizadas <strong>{safeStats.notDone}</strong></div>
            <div><span className="dot dot--yellow"></span> Com fino agregado <strong>{safeStats.fine}</strong></div>
          </div>
        </div>
      </section>
    </div>
  )
}
