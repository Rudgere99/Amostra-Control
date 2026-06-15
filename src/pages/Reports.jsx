import React from 'react'
import { Download } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'
import { formatHourRange } from '../utils/time.js'

function yesNo(value) {
  return value ? 'Sim' : 'Não'
}

export default function Reports({ schedule, stats }) {
  const fineNpoRows = schedule.filter((item) => item.fineNpo)
  const fineHttRows = schedule.filter((item) => item.fineHtt)
  const contaminatedRows = schedule.filter((item) => item.fineNpo || item.fineHtt)

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Relatórios"
        title="Resumo executivo das amostragens"
        description="Indicadores consolidados para acompanhamento do CCO, rastreabilidade dos lançamentos e controle de fino agregado."
        actions={(
          <button className="btn btn--orange" type="button" onClick={() => exportScheduleCsv(schedule)}>
            <Download size={17} /> Exportar CSV
          </button>
        )}
      />

      <section className="stats-grid stats-grid--four">
        <StatCard label="Total" value={stats.total} detail="programadas" tone="blue" />
        <StatCard label="Realizadas" value={stats.done} detail="concluídas" tone="green" />
        <StatCard label="Fino NPO" value={fineNpoRows.length} detail="lançamentos" tone="yellow" />
        <StatCard label="Fino HTT" value={fineHttRows.length} detail="lançamentos" tone="orange" />
      </section>

      <div className="panel">
        <div className="panel__header">
          <div>
            <h3>Análise automática</h3>
            <span>Texto base para relatório</span>
          </div>
        </div>
        <p className="report-text">
          No período avaliado, foram programadas {stats.total} coletas, com {stats.done} registros concluídos e aderência atual de {stats.adherence}%. Foram identificados {contaminatedRows.length} lançamentos com presença de fino agregado, sendo {fineNpoRows.length} em NPO e {fineHttRows.length} em HTT.
        </p>
      </div>

      <div className="table-card">
        <div className="table-card__header">
          <div>
            <h3>Lançamentos com fino agregado</h3>
            <span>Detalhamento de contaminação por NPO e HTT</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Faixa</th>
                <th>Planta</th>
                <th>Amostrador</th>
                <th>Cadastro</th>
                <th>Fino NPO</th>
                <th>Fino HTT</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {contaminatedRows.map((item) => (
                <tr key={item.id}>
                  <td>{String(item.date || '').slice(0, 10)}</td>
                  <td>{formatHourRange(item.time)}</td>
                  <td>{item.plant || '-'}</td>
                  <td>{item.sampler || '-'}</td>
                  <td>{item.badge || '-'}</td>
                  <td>{yesNo(item.fineNpo)}</td>
                  <td>{yesNo(item.fineHtt)}</td>
                  <td>{item.notes || '-'}</td>
                </tr>
              ))}

              {contaminatedRows.length === 0 && (
                <tr>
                  <td colSpan="8">Nenhum lançamento com fino agregado encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
