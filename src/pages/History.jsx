import React, { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import { fetchCollections, hasApiConfigured } from '../services/api.js'
import { formatClockTime, formatHourRange, toHourNumber } from '../utils/time.js'
import { formatLocalDate, formatShortDate, normalizeDate, today } from '../utils/date.js'

function addDays(date, days) {
  const [year, month, day] = String(date || '').split('-').map(Number)
  if (!year || !month || !day) return ''

  const nextDate = new Date(year, month - 1, day, 0, 0, 0, 0)
  nextDate.setDate(nextDate.getDate() + days)
  return formatLocalDate(nextDate)
}

function shiftFromTime(time) {
  const hour = toHourNumber(time)
  if (hour === null) return ''
  return hour >= 7 && hour <= 18 ? 'Turno 01' : 'Turno 02'
}

function relativeDateFromTime(date, time) {
  const normalizedDate = normalizeDate(date)
  const hour = toHourNumber(time)

  if (!normalizedDate || hour === null) return normalizedDate
  if (hour >= 0 && hour <= 6) return addDays(normalizedDate, -1)
  return normalizedDate
}

function operationalHourOrder(time) {
  const hour = toHourNumber(time)
  if (hour === null) return 99
  return hour <= 6 ? hour + 24 : hour
}

function normalizeLogDate(item) {
  return normalizeDate(item.date)
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

function collectedMaterials(item) {
  const materials = [
    item.sf1 ? 'SF1' : '',
    item.htt1 ? 'HTT1' : '',
    item.npo1 ? 'NPO1' : ''
  ].filter(Boolean)

  return materials.length ? materials.join(', ') : '-'
}

function makeLogFromCollection(item) {
  const hasFine = item.fineNpo || item.fineHtt
  const fineText = hasFine
    ? `Fino agregado: ${item.fineNpo ? 'NPO' : ''}${item.fineNpo && item.fineHtt ? ' e ' : ''}${item.fineHtt ? 'HTT' : ''}`
    : 'Sem fino agregado informado'
  const shift = shiftFromTime(item.time)

  return {
    id: `log-${item.id}`,
    date: normalizeLogDate(item),
    relativeDate: relativeDateFromTime(item.date, item.time),
    time: item.time,
    realTime: item.realTime,
    shift,
    materials: collectedMaterials(item),
    plant: item.plant,
    sampler: item.sampler,
    badge: item.badge,
    status: item.status,
    user: item.sampler || item.user || item.updatedBy || item.createdBy || '-',
    details: `${fineText}${item.ccco ? ' | CCCO informado' : ' | CCCO não informado'}${item.notes ? ` | Obs.: ${item.notes}` : ''}`
  }
}

export default function History({ schedule = [] }) {
  const [filters, setFilters] = useState({
    date: today(),
    plant: 'Todas',
    shift: 'Todos',
    status: 'coletado'
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
        const baseQuery = {}
        if (filters.plant && filters.plant !== 'Todas') baseQuery.plant = filters.plant
        baseQuery.status = 'coletado'

        const datesToLoad = filters.date ? [filters.date, addDays(filters.date, 1)].filter(Boolean) : [null]
        const responses = await Promise.all(datesToLoad.map((date) => {
          const query = { ...baseQuery }
          if (date) query.date = date
          return fetchCollections(query)
        }))
        const rowsById = new Map(responses.flatMap((data) => Array.isArray(data) ? data : []).map((row) => [row.id, row]))
        const data = Array.from(rowsById.values())
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
  }, [filters.date, filters.plant])

  const sourceRows = hasApiConfigured() ? remoteRows : schedule

  const logs = useMemo(() => {
    return sourceRows
      .filter((item) => (item.remote || item.id) && item.status === 'coletado')
      .map(makeLogFromCollection)
      .filter((item) => !filters.date || item.relativeDate === filters.date)
      .filter((item) => filters.plant === 'Todas' || String(item.plant || '') === filters.plant)
      .filter((item) => filters.shift === 'Todos' || item.shift === filters.shift)
      .sort((a, b) => (
        String(b.relativeDate || '').localeCompare(String(a.relativeDate || '')) ||
        operationalHourOrder(a.time) - operationalHourOrder(b.time) ||
        String(a.plant || '').localeCompare(String(b.plant || ''))
      ))
  }, [sourceRows, filters])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Consulta"
        title="Histórico de lançamentos"
        description="Consulta somente das coletas realizadas e salvas no backend por data, planta, amostrador e ocorrências de fino agregado."
      />

      <div className="generation-card generation-card--fixed">
        <div>
          <h3>Filtros do histórico</h3>
          <p>Consulte apenas as coletas realizadas já salvas no banco de dados.</p>
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
          Turno
          <select value={filters.shift} onChange={(e) => setFilters((current) => ({ ...current, shift: e.target.value }))}>
            <option>Todos</option>
            <option>Turno 01</option>
            <option>Turno 02</option>
          </select>
        </label>

      </div>

      {message && <div className="api-status-bar"><span className="api-dot"></span><span>{message}</span></div>}

      <div className="table-card">
        <div className="table-card__header">
          <div>
            <h3>Logs de lançamentos</h3>
            <span>{loading ? 'Carregando histórico...' : `Exibindo ${logs.length} coleta(s) realizada(s).`}</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora coleta</th>
                <th>Turno</th>
                <th>Faixa</th>
                <th>Planta</th>
                <th>Usuário</th>
                <th>Materiais</th>
                <th>Status</th>
                <th>Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((item) => (
                <tr key={item.id}>
                  <td>{formatShortDate(item.relativeDate) || '-'}</td>
                  <td>{formatClockTime(item.realTime)}</td>
                  <td>{item.shift || '-'}</td>
                  <td>{formatHourRange(item.time)}</td>
                  <td>{item.plant || '-'}</td>
                  <td>{item.user || '-'}</td>
                  <td>{item.materials || '-'}</td>
                  <td>{statusLabel(item.status)}</td>
                  <td>{item.details || '-'}</td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan="9">Nenhuma coleta realizada encontrada para os filtros selecionados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
