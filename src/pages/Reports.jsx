import React from 'react'
import { Download } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'

export default function Reports({ schedule, stats }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Relatórios"
        title="Resumo executivo das amostragens"
        description="Indicadores consolidados para acompanhamento do CCO e da liderança operacional."
        actions={<button className="btn btn--orange" type="button" onClick={() => exportScheduleCsv(schedule)}><Download size={17} /> Exportar CSV</button>}
      />

      <section className="stats-grid stats-grid--four">
        <StatCard label="Total" value={stats.total} detail="programadas" tone="blue" />
        <StatCard label="Realizadas" value={stats.done} detail="concluídas" tone="green" />
        <StatCard label="Pendentes" value={stats.pending} detail="aguardando" tone="orange" />
        <StatCard label="Atrasadas" value={stats.late} detail="fora do prazo" tone="red" />
      </section>

      <div className="panel">
        <div className="panel__header"><div><h3>Análise automática</h3><span>Texto base para relatório</span></div></div>
        <p className="report-text">No período avaliado, foram programadas {stats.total} coletas, com {stats.done} registros concluídos e aderência atual de {stats.adherence}%. As pendências e atrasos devem ser tratados como prioridade para garantir rastreabilidade e comunicação ao CCCO.</p>
      </div>
    </div>
  )
}
