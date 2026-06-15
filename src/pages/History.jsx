import React, { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { fetchCollections, hasApiConfigured } from '../services/api.js'
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

function statusLabel(status) {
  const labels = {
    coletado: 'Realizada',
    pendente: 'Pendente',
    parcial: 'Parcial',
    nao_realizado: 'Não realizada',
    atrasado: 'Atrasado'
  }
  return labels[status] || status || '-'
}

function makeLogFromCollection(item) {
  const hasFine = item.fineNpo || item.fineHtt
  const action = item.status === 'coletado' ? 'Coleta realizada' : 'Lançamento atualizado'
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
    user: item.sampler || item.user || item.updatedBy || item.createdBy || '-',
    action,
    details: `${fineText}${item.ccco ? ' | CCCO informado' : ' | CCCO não informado'}${item.notes ? ` | Obs.: ${item.notes}` : ''}`
  }
}

export default function History({ schedule = [] }) {
  const [filters, setFilters] = useState({
    date: today(),
    plant: 'Todas',
    status: 'Todos'
  })
  const [remoteRows, setRemoteRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadHistory() {
      if (!hasApiConfigured()) {
        setRemoteRows([])
        setMessage('API não configurada. Exibindo somente registros locais da sessão.')
        return
      }

      setLoading(true)
      setMessage('')

      try {
        const query = {}
        if (filters.date) query.date = filters.date
        if (filters.plant && filters.plant !== 'Todas') query.plant = filters.plant
        if (filters.status && filters.status !== 'Todos') query.status = filters.status

        const data = await fetchCollections(query)
        if (!ignore) {
          setRemoteRows(Array.isArray(data) ? data : [])
          setMessage('')
        }
      } catch (error) {
        if (!ignore) {
          setRemoteRows([])
          setMessage(`Não foi possível buscar o histórico no backend: ${error.message}`)
        }
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadHistory()
    return () => { ignore = true }
  }, [filters.date, filters.plant, filters.status])

  const sourceRows = remoteRows.length > 0 ? remoteRows : schedule

  const logs = useMemo(() => {
    return sourceRows
      .filter((item) => item.remote || item.id)
      .map(makeLogFromCollection)
      .sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')) || String(b.time || '').localeCompare(String(a.time || '')))
  }, [sourceRows])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Consulta"
        title="Histórico de lançamentos"
        description="Consulta dos registros salvos no backend por data, planta, status, amostrador e ocorrências de fino agregado."
      />

      <div className="generation-card generation-card--fixed">
        <div>
          <h3>Filtros do histórico</h3>
          <p>Consulte os lançamentos já salvos no banco de dados.</p>
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
            <option value="coletado">Realizada</option>
            <option value="parcial">Parcial</option>
            <option value="nao_realizado">Não realizada</option>
            <option value="pendente">Pendente</option>
          </select>
        </label>
      </div>

      {message && <div className="api-status-bar"><span className="api-dot"></span><span>{message}</span></div>}

      <div className="table-card">
        <div className="table-card__header">
          <div>
            <h3>Logs de lançamentos</h3>
            <span>{loading ? 'Carregando histórico...' : `Exibindo ${logs.length} registro(s).`}</span>
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
                <th>Matrícula</th>
                <th>Status</th>
                <th>Ação</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => (
                <tr key={item.id}>
                  <td>{normalizeLogDate(item) || '-'}</td>
                  <td>{formatHourRange(item.time)}</td>
                  <td>{item.plant || '-'}</td>
                  <td>{item.user || '-'}</td>
                  <td>{item.badge || '-'}</td>
                  <td>{statusLabel(item.status)}</td>
                  <td>{item.action || '-'}</td>
                  <td>{item.details || '-'}</td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="8">Nenhum lançamento encontrado para os filtros selecionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
