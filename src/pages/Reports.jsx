import React, { useMemo } from 'react'
import { Download } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'
import { formatHourRange } from '../utils/time.js'

function hasFine(row) {
  return Boolean(row.fineNpo || row.fineHtt)
}

function fineSources(row) {
  const sources = []
  if (row.fineNpo) sources.push('NPO')
  if (row.fineHtt) sources.push('HTT')
  return sources.join(' / ')
}

export default function Reports({ schedule, stats }) {
  const fineRows = useMemo(() => schedule.filter(hasFine), [schedule])

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
        <StatCard label="Com fino" value={fineRows.length} detail="contaminadas" tone="yellow" />
      </section>

      <div className="panel">
        <div className="panel__header"><div><h3>Análise automática</h3><span>Texto base para relatório</span></div></div>
        <p className="report-text">No período avaliado, foram programadas {stats.total} coletas, com {stats.done} registros concluídos e aderência atual de {stats.adherence}%. Foram identificadas {fineRows.length} coleta(s) contaminada(s) com fino agregado, devendo ser acompanhadas pela liderança operacional.</p>
      </div>

      <div className="table-card">
        <div className="table-card__header"><div><h3>Coletas contaminadas com fino</h3><span>Indica se a contaminação ocorreu no fino agregado NPO, HTT ou ambos</span></div></div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Data</th><th>Hora</th><th>Planta</th><th>Fino agregado</th><th>Amostrador</th><th>Cadastro</th><th>Observações</th></tr>
            </thead>
            <tbody>
              {fineRows.map((row) => (
                <tr key={row.id}>
                  <td>{String(row.date || '').slice(0, 10)}</td>
                  <td><strong>{formatHourRange(row.time)}</strong></td>
                  <td>{row.plant || '-'}</td>
                  <td>{fineSources(row)}</td>
                  <td>{row.sampler || '-'}</td>
                  <td>{row.badge || '-'}</td>
                  <td>{row.notes || '-'}</td>
                </tr>
              ))}
              {fineRows.length === 0 && (
                <tr><td colSpan="7">Nenhuma coleta contaminada com fino agregado no período exibido.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
