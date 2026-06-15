import React, { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCcw, Save } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'
import { formatClockTime, formatHourRange, toHourNumber } from '../utils/time.js'
import { nowTime } from '../utils/status.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function normalizeHour(time) {
  const hour = toHourNumber(time)
  if (hour === null) return null
  return String(hour).padStart(2, '0')
}

function shiftByHour(hour) {
  if (hour >= 0 && hour <= 7) return '1º Turno'
  if (hour >= 8 && hour <= 15) return '2º Turno'
  return '3º Turno'
}

function rowKey(date, plant, time) {
  return `${date}|${plant}|${normalizeHour(time)}`
}

function fixedDayRows(date, plant) {
  return Array.from({ length: 24 }, (_, hour) => ({
    id: `novo-${date}-${plant}-${hour}`,
    date,
    plant,
    time: `${String(hour).padStart(2, '0')}:00`,
    shift: shiftByHour(hour),
    letter: '',
    status: 'pendente',
    sf1: false,
    htt1: false,
    npo1: false,
    fineNpo: false,
    fineHtt: false,
    ccco: false,
    sampler: '',
    badge: '',
    realTime: '',
    notes: '',
    remote: false
  }))
}

function mergeFixedRows(baseRows, scheduleRows, drafts) {
  return baseRows.map((base) => {
    const saved = scheduleRows.find((item) => normalizeHour(item.time) === normalizeHour(base.time))
    const merged = saved ? { ...base, ...saved, remote: true } : base
    return { ...merged, ...(drafts[rowKey(base.date, base.plant, base.time)] || {}) }
  })
}

function statusLabel(status) {
  const labels = {
    pendente: 'Pendente',
    coletado: 'Realizada',
    nao_realizado: 'Não realizada',
    parcial: 'Parcial',
    atrasado: 'Atrasado'
  }
  return labels[status] || status || 'Pendente'
}

export default function Collections({ schedule = [], updateCollection, reloadCollections, isSaving, loggedUser }) {
  const [tableBase, setTableBase] = useState({
    date: today(),
    plant: 'Planta 01'
  })
  const [drafts, setDrafts] = useState({})

  function setBaseField(field, value) {
    setTableBase((current) => ({ ...current, [field]: value }))
    setDrafts({})
  }

  function handleReload() {
    reloadCollections?.({ date: tableBase.date, plant: tableBase.plant })
  }

  useEffect(() => {
    handleReload()
  }, [tableBase.date, tableBase.plant])

  const scheduleForBase = useMemo(() => {
    return schedule.filter((item) => {
      return normalizeDate(item.date) === tableBase.date && String(item.plant || '') === tableBase.plant
    })
  }, [schedule, tableBase])

  const rows = useMemo(() => {
    return mergeFixedRows(fixedDayRows(tableBase.date, tableBase.plant), scheduleForBase, drafts)
  }, [tableBase.date, tableBase.plant, scheduleForBase, drafts])

  const summary = useMemo(() => {
    return {
      total: rows.length,
      done: rows.filter((item) => item.status === 'coletado').length,
      pending: rows.filter((item) => item.status === 'pendente').length,
      fine: rows.filter((item) => item.fineNpo || item.fineHtt).length
    }
  }, [rows])

  function updateDraft(row, field, value) {
    const key = rowKey(row.date, row.plant, row.time)
    setDrafts((current) => ({
      ...current,
      [key]: {
        ...(current[key] || {}),
        [field]: value
      }
    }))
  }

  function saveRow(row) {
    const hour = toHourNumber(row.time) ?? 0
    const status = row.status || 'pendente'
    const shouldSetRealTime = status === 'coletado' && !row.realTime

    updateCollection?.({
      ...row,
      date: tableBase.date,
      plant: tableBase.plant,
      time: `${String(hour).padStart(2, '0')}:00`,
      shift: row.shift || shiftByHour(hour),
      sampler: row.sampler || loggedUser?.name || '',
      badge: row.badge || loggedUser?.badge || '',
      realTime: shouldSetRealTime ? nowTime() : row.realTime,
      fine: Boolean(row.fineNpo || row.fineHtt)
    })
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Coletas programadas"
        description="Modelo fixo no padrão MonPlant: a tabela mantém as 24 faixas horárias e muda somente conforme a data e a planta selecionadas."
        actions={(
          <>
            <button className="btn btn--ghost" type="button" onClick={handleReload} disabled={isSaving}>
              <RefreshCcw size={17} /> Atualizar
            </button>
            <button className="btn btn--orange" type="button" onClick={() => exportScheduleCsv(rows)}>
              <Download size={17} /> Exportar CSV
            </button>
          </>
        )}
      />

      <div className="generation-card generation-card--fixed collections-filter">
        <div>
          <h3>Base de lançamento</h3>
          <p>Selecione a data e a planta. As linhas permanecem fixas para lançamento direto, sem gerar uma nova tabela manualmente.</p>
        </div>

        <label>
          Data
          <input type="date" value={tableBase.date} onChange={(e) => setBaseField('date', e.target.value)} />
        </label>

        <label>
          Planta
          <select value={tableBase.plant} onChange={(e) => setBaseField('plant', e.target.value)}>
            <option>Planta 01</option>
            <option>Planta 02</option>
          </select>
        </label>
      </div>

      <div className="collection-summary-grid">
        <div><span>Total de faixas</span><strong>{summary.total}</strong></div>
        <div><span>Realizadas</span><strong>{summary.done}</strong></div>
        <div><span>Pendentes</span><strong>{summary.pending}</strong></div>
        <div><span>Com fino agregado</span><strong>{summary.fine}</strong></div>
      </div>

      <div className="table-card">
        <div className="table-card__header">
          <div>
            <h3>Lançamento das coletas</h3>
            <span>{tableBase.plant} | {tableBase.date} | Tabela fixa 00-01 até 23-00.</span>
          </div>
        </div>

        <div className="table-wrapper table-wrapper--fixed">
          <table className="collections-table">
            <thead>
              <tr>
                <th>Faixa</th>
                <th>Turno</th>
                <th>Status</th>
                <th>Amostrador</th>
                <th>Cadastro</th>
                <th>SF1</th>
                <th>HTT1</th>
                <th>NPO1</th>
                <th>Fino NPO</th>
                <th>Fino HTT</th>
                <th>CCCO</th>
                <th>Hora real</th>
                <th>Observações</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={rowKey(row.date, row.plant, row.time)}>
                  <td className="sticky-cell"><strong>{formatHourRange(row.time)}</strong></td>
                  <td>{row.shift || '-'}</td>
                  <td>
                    <select value={row.status || 'pendente'} onChange={(e) => updateDraft(row, 'status', e.target.value)} disabled={isSaving}>
                      <option value="pendente">Pendente</option>
                      <option value="coletado">Realizada</option>
                      <option value="nao_realizado">Não realizada</option>
                      <option value="parcial">Parcial</option>
                    </select>
                  </td>
                  <td><input value={row.sampler || ''} onChange={(e) => updateDraft(row, 'sampler', e.target.value)} placeholder="Nome" disabled={isSaving} /></td>
                  <td><input value={row.badge || ''} onChange={(e) => updateDraft(row, 'badge', e.target.value)} placeholder="Credencial" disabled={isSaving} /></td>
                  <td className="check-cell"><input type="checkbox" checked={Boolean(row.sf1)} onChange={(e) => updateDraft(row, 'sf1', e.target.checked)} disabled={isSaving} /></td>
                  <td className="check-cell"><input type="checkbox" checked={Boolean(row.htt1)} onChange={(e) => updateDraft(row, 'htt1', e.target.checked)} disabled={isSaving} /></td>
                  <td className="check-cell"><input type="checkbox" checked={Boolean(row.npo1)} onChange={(e) => updateDraft(row, 'npo1', e.target.checked)} disabled={isSaving} /></td>
                  <td className="check-cell"><input type="checkbox" checked={Boolean(row.fineNpo)} onChange={(e) => updateDraft(row, 'fineNpo', e.target.checked)} disabled={isSaving} /></td>
                  <td className="check-cell"><input type="checkbox" checked={Boolean(row.fineHtt)} onChange={(e) => updateDraft(row, 'fineHtt', e.target.checked)} disabled={isSaving} /></td>
                  <td className="check-cell"><input type="checkbox" checked={Boolean(row.ccco)} onChange={(e) => updateDraft(row, 'ccco', e.target.checked)} disabled={isSaving} /></td>
                  <td>{formatClockTime(row.realTime)}</td>
                  <td><input className="notes-input" value={row.notes || ''} onChange={(e) => updateDraft(row, 'notes', e.target.value)} placeholder="Observações" disabled={isSaving} /></td>
                  <td>
                    <button className="table-action table-action--primary" type="button" onClick={() => saveRow(row)} disabled={isSaving}>
                      <Save size={15} /> Salvar
                    </button>
                    <small className="status-hint">{statusLabel(row.status)}</small>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
