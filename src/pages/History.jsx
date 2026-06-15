import React, { useEffect, useMemo, useState } from 'react'
import PageHeader from '../components/PageHeader.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { formatClockTime, formatHourRange } from '../utils/time.js'
import { fetchCollections, hasApiConfigured } from '../services/api.js'

function formatDate(value) {
  if (!value) return '-'
  return String(value).slice(0, 10)
}

function formatDateTime(value) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return String(value)
  return date.toLocaleString('pt-BR')
}

function hasLaunch(row) {
  return row.remote || row.sampler || row.badge || row.realTime || row.status === 'coletado' || row.status === 'parcial' || row.status === 'nao_realizado'
}

function contaminationLabel(row) {
  const items = []
  if (row.fineNpo) items.push('NPO')
  if (row.fineHtt) items.push('HTT')
  return items.length ? items.join(' / ') : '-'
}

export default function History({ schedule = [] }) {
  const [historyRows, setHistoryRows] = useState(schedule)

  useEffect(() => {
    setHistoryRows(schedule)
  }, [schedule])

  useEffect(() => {
    if (!hasApiConfigured()) return

    fetchCollections()
      .then((data) => setHistoryRows(Array.isArray(data) ? data : []))
      .catch((error) => console.error(error))
  }, [])

  const launchLogs = useMemo(() => {
    return historyRows
      .filter(hasLaunch)
      .map((row) => ({
        ...row,
        logDate: row.updatedAt || row.createdAt || row.date
      }))
      .sort((a, b) => String(b.logDate || '').localeCompare(String(a.logDate || '')))
  }, [historyRows])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Consulta"
        title="Histórico de lançamentos"
        description="Logs dos lançamentos realizados nas coletas, com data, planta, amostrador, status e indicação de fino agregado."
      />

      <div className="table-card">
        <div className="table-card__header">
          <div>
            <h3>Logs de lançamentos</h3>
            <span>{launchLogs.length} lançamento(s) encontrado(s)</span>
          </div>
        </div>
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Log</th>
                <th>Data coleta</th>
                <th>Hora</th>
                <th>Planta</th>
                <th>Amostrador</th>
                <th>Cadastro</th>
                <th>Hora real</th>
                <th>Fino agregado</th>
                <th>Status</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {launchLogs.map((row) => (
                <tr key={`${row.id}-${row.updatedAt || row.createdAt || row.realTime || row.status}`}>
                  <td>{formatDateTime(row.logDate)}</td>
                  <td>{formatDate(row.date)}</td>
                  <td><strong>{formatHourRange(row.time)}</strong></td>
                  <td>{row.plant || '-'}</td>
                  <td>{row.sampler || '-'}</td>
                  <td>{row.badge || '-'}</td>
                  <td>{formatClockTime(row.realTime)}</td>
                  <td>{contaminationLabel(row)}</td>
                  <td><StatusBadge status={row.status} /></td>
                  <td>{row.notes || '-'}</td>
                </tr>
              ))}
              {launchLogs.length === 0 && (
                <tr>
                  <td colSpan="10">Nenhum lançamento encontrado para exibir no histórico.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
