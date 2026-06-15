import React, { useEffect, useState } from 'react'
import { RefreshCcw } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { fetchLaunchLogs, hasApiConfigured } from '../services/api.js'
import { formatHourRange } from '../utils/time.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10).split('-').reverse().join('/')
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return `${date.toLocaleDateString('pt-BR')} ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
}

function actionLabel(action) {
  const labels = {
    criado: 'Lançamento criado',
    atualizado: 'Lançamento atualizado'
  }
  return labels[action] || action
}

export default function History() {
  const [filters, setFilters] = useState({ date: today(), plant: 'Todas' })
  const [logs, setLogs] = useState([])
  const [status, setStatus] = useState(hasApiConfigured() ? 'Carregando logs...' : 'API não configurada. Histórico depende do Railway.')
  const [loading, setLoading] = useState(false)

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  async function loadLogs() {
    if (!hasApiConfigured()) return

    setLoading(true)
    try {
      const params = {
        date: filters.date,
        plant: filters.plant !== 'Todas' ? filters.plant : undefined
      }
      const data = await fetchLaunchLogs(params)
      setLogs(Array.isArray(data) ? data : [])
      setStatus('Logs carregados do Railway')
    } catch (error) {
      console.error(error)
      setStatus(`Erro ao carregar logs: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLogs()
  }, [filters.date, filters.plant])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Consulta"
        title="Histórico de lançamentos"
        description="Logs de criação e atualização dos lançamentos de coletas registrados no sistema."
        actions={(
          <button className="btn btn--ghost" type="button" onClick={loadLogs} disabled={loading}>
            <RefreshCcw size={17} /> Atualizar logs
          </button>
        )}
      />

      <div className="monplant-filter-card">
        <div>
          <h3>Filtros do histórico</h3>
          <p>Consulte os logs por data e planta.</p>
        </div>
        <label>Data<input type="date" value={filters.date} onChange={(e) => setFilter('date', e.target.value)} /></label>
        <label>Planta<select value={filters.plant} onChange={(e) => setFilter('plant', e.target.value)}><option>Todas</option><option>Planta 01</option><option>Planta 02</option></select></label>
      </div>

      <div className="api-status-bar"><span className={status.includes('Railway') ? 'api-dot api-dot--ok' : 'api-dot'}></span>{status}</div>

      <div className="table-card">
        <div className="table-card__header"><div><h3>Logs de lançamentos</h3><span>Mostrando os últimos registros do período selecionado</span></div></div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data/hora log</th>
                <th>Ação</th>
                <th>Data coleta</th>
                <th>Faixa</th>
                <th>Planta</th>
                <th>Amostrador</th>
                <th>Cadastro</th>
                <th>Status</th>
                <th>Fino NPO</th>
                <th>Fino HTT</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td>{formatDateTime(log.createdAt)}</td>
                  <td>{actionLabel(log.action)}</td>
                  <td>{formatDate(log.date)}</td>
                  <td><strong>{formatHourRange(log.time)}</strong></td>
                  <td>{log.plant || '-'}</td>
                  <td>{log.sampler || '-'}</td>
                  <td>{log.badge || '-'}</td>
                  <td>{log.status || '-'}</td>
                  <td>{log.fineNpo ? 'Sim' : 'Não'}</td>
                  <td>{log.fineHtt ? 'Sim' : 'Não'}</td>
                  <td>{log.notes || '-'}</td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr><td colSpan="11">Nenhum log encontrado para os filtros selecionados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
