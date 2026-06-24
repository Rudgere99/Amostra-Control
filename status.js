import React, { useMemo, useState } from 'react'
import { Download } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'
import StatCard from '../components/StatCard.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'
import { formatHourRange } from '../utils/time.js'

function today() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function matchesFilter(value, filterValue, allValue) {
  if (!filterValue || filterValue === allValue) return true
  return String(value || '') === String(filterValue)
}

function yesNo(value) {
  return value ? 'Sim' : 'Não'
}

function contaminationType(item) {
  if (item.fineNpo && item.fineHtt) return 'NPO e HTT'
  if (item.fineNpo) return 'NPO'
  if (item.fineHtt) return 'HTT'
  return '-'
}

export default function Reports({ schedule = [], stats = {} }) {
  const [filters, setFilters] = useState({
    date: '',
    plant: 'Todas'
  })

  const filteredSchedule = useMemo(() => {
    return schedule.filter((item) => {
      const dateOk = !filters.date || normalizeDate(item.date) === filters.date
      const plantOk = matchesFilter(item.plant, filters.plant, 'Todas')
      return dateOk && plantOk
    })
  }, [schedule, filters])

  const fineNpoRows = filteredSchedule.filter((item) => item.fineNpo)
  const fineHttRows = filteredSchedule.filter((item) => item.fineHtt)
  const contaminatedRows = filteredSchedule.filter((item) => item.fineNpo || item.fineHtt)
  const total = stats.total ?? filteredSchedule.length
  const done = stats.done ?? filteredSchedule.filter((item) => item.status === 'coletado').length
  const adherence = stats.adherence ?? (total > 0 ? Math.round((done / total) * 100) : 0)

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Relatórios"
        title="Resumo executivo das amostragens"
        description="Indicadores consolidados para acompanhamento do CCO, rastreabilidade dos lançamentos e controle de contaminação por fino agregado."
        actions={(
          <button className="btn btn--orange" type="button" onClick={() => exportScheduleCsv(filteredSchedule)}>
            <Download size={17} /> Exportar CSV
          </button>
        )}
      />

      <div className="generation-card generation-card--fixed">
        <div>
          <h3>Filtros do relatório</h3>
          <p>Filtre por data e planta para identificar quando houve contaminação por fino agregado.</p>
        </div>

        <label>
          Data
          <input type="date" value={filters.date} max={today()} onChange={(e) => setFilters((current) => ({ ...current, date: e.target.value }))} />
        </label>

        <label>
          Planta
          <select value={filters.plant} onChange={(e) => setFilters((current) => ({ ...current, plant: e.target.value }))}>
            <option>Todas</option>
            <option>Planta 01</option>
            <option>Planta 02</option>
          </select>
        </label>
      </div>

      <section className="stats-grid stats-grid--four">
        <StatCard label="Total" value={total} detail="programadas" tone="blue" />
        <StatCard label="Realizadas" value={done} detail="concluídas" tone="green" />
        <StatCard label="Fino agregado NPO" value={fineNpoRows.length} detail="contaminações" tone="yellow" />
        <StatCard label="Fino agregado HTT" value={fineHttRows.length} detail="contaminações" tone="orange" />
      </section>

      <div className="panel">
        <div className="panel__header">
          <div>
            <h3>Análise automática</h3>
            <span>Texto base para relatório</span>
          </div>
        </div>
        <p className="report-text">
          No período avaliado, foram programadas {total} coletas, com {done} registros concluídos e aderência atual de {adherence}%. Foram identificados {contaminatedRows.length} lançamentos contaminados com fino agregado, sendo {fineNpoRows.length} em NPO e {fineHttRows.length} em HTT.
        </p>
      </div>

      <div className="table-card">
        <div className="table-card__header">
          <div>
            <h3>Lançamentos contaminados com fino agregado</h3>
            <span>Mostra exatamente quando ocorreu fino agregado em NPO e/ou HTT.</span>
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
                <th>Contaminação</th>
                <th>Fino agregado NPO</th>
                <th>Fino agregado HTT</th>
                <th>Status</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {contaminatedRows.map((item) => (
                <tr key={item.id}>
                  <td>{normalizeDate(item.date) || '-'}</td>
                  <td>{formatHourRange(item.time)}</td>
                  <td>{item.plant || '-'}</td>
                  <td>{item.sampler || '-'}</td>
                  <td>{item.badge || '-'}</td>
                  <td>{contaminationType(item)}</td>
                  <td>{yesNo(item.fineNpo)}</td>
                  <td>{yesNo(item.fineHtt)}</td>
                  <td>{item.status || '-'}</td>
                  <td>{item.notes || '-'}</td>
                </tr>
              ))}

              {contaminatedRows.length === 0 && (
                <tr>
                  <td colSpan="10">Nenhum lançamento contaminado com fino agregado encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
