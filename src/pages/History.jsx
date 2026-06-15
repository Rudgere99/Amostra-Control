import React, { useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { formatHourRange } from '../utils/time.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function normalizeLogDate(item) {
  return normalizeDate(item.updatedAt || item.createdAt || item.date)
}

function matchesFilter(value, filterValue, allValue) {
  if (!filterValue || filterValue === allValue) return true
  return String(value || '') === String(filterValue)
}

function makeLogFromCollection(item) {
  const hasFine = item.fineNpo || item.fineHtt
  const action = item.status === 'Realizada' ? 'Coleta realizada' : 'Lançamento atualizado'
  const fineText = hasFine
    ? `Fino agregado: ${item.fineNpo ? 'NPO' : ''}${item.fineNpo && item.fineHtt ? ' e ' : ''}${item.fineHtt ? 'HTT' : ''}`
    : 'Sem fino agregado informado'

  return {
    id: `log-${item.id}`,
    date: normalizeLogDate(item),
    time: item.time,
    plant: item.plant,
    sampler: item.sampler,
    badge: item.badge,
    status: item.status,
    user: item.user || item.updatedBy || item.createdBy || item.sampler || '-',
    action,
    details: `${fineText}${item.notes ? ` | Obs.: ${item.notes}` : ''}`
  }
}

export default function History({ logs = [], schedule = [] }) {
  const [filters, setFilters] = useState({
    date: today(),
    plant: 'Todas',
    status: 'Todos'
  })

  const sourceLogs = useMemo(() => {
    if (logs.length > 0) return logs
    return schedule
      .filter((item) => item.status && item.status !== 'Pendente')
      .map(makeLogFromCollection)
  }, [logs, schedule])

  const filteredLogs = useMemo(() => {
    return sourceLogs.filter((item) => {
      const dateOk = !filters.date || normalizeLogDate(item) === filters.date
      const plantOk = matchesFilter(item.plant, filters.plant, 'Todas')
      const statusOk = matchesFilter(item.status, filters.status, 'Todos')
      return dateOk && plantOk && statusOk
    })
  }, [sourceLogs, filters])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Consulta"
        title="Histórico de lançamentos"
        description="Logs dos registros salvos, alterações de status, amostrador, planta e ocorrências de fino agregado."
      />

      <div className="generation-card generation-card--fixed">
        <div>
          <h3>Filtros do histórico</h3>
          <p>Consulte os logs por data, planta e status do lançamento.</p>
        </div>

        <label>
          Data
          <input type="date" value={filters.date} onChange={(e) => setFilters((current) => ({ ...current, date: e.target.value }))} />
        </label>

        <label>
          Planta
          <select value={filters.plant} onChange={(e) => setFilters((current) => ({ ...current, plant: e.target.value }))}>
            <option>Todas</option>
            <option>Planta 01</option>
            <option>Planta 02</option>
          </select>
        </label>

        <label>
          Status
          <select value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value }))}>
            <option>Todos</option>
            <option>Realizada</option>
            <option>Não realizada</option>
            <option>Pendente</option>
          </select>
        </label>
      </div>

      <div className="table-card">
        <div className="table-card__header">
          <div>
            <h3>Logs de lançamentos</h3>
            <span>Exibindo {filteredLogs.length} de {sourceLogs.length} registros.</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Faixa</th>
                <th>Planta</th>
                <th>Usuário</th>
                <th>Amostrador</th>
                <th>Status</th>
                <th>Ação</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((item) => (
                <tr key={item.id}>
                  <td>{normalizeLogDate(item) || '-'}</td>
                  <td>{formatHourRange(item.time)}</td>
                  <td>{item.plant || '-'}</td>
                  <td>{item.user || '-'}</td>
                  <td>{item.sampler || '-'}</td>
                  <td>{item.status || '-'}</td>
                  <td>{item.action || '-'}</td>
                  <td>{item.details || '-'}</td>
                </tr>
              ))}

              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan="8">Nenhum log de lançamento encontrado para os filtros selecionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
