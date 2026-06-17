import React, { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCcw } from '../components/LocalIcons.jsx'
import PageHeader from '../components/PageHeader.jsx'
import CollectionModal from '../components/CollectionModal.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import SampleBadge from '../components/SampleBadge.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'
import { formatClockTime, formatHourRange, toHourNumber } from '../utils/time.js'

function formatLocalDate(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function today() {
  return formatLocalDate(new Date())
}

function normalizeDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function createLocalDate(date) {
  const [year, month, day] = String(date || '').split('-').map(Number)

  if (!year || !month || !day) return null

  return new Date(year, month - 1, day, 0, 0, 0, 0)
}

function getLaunchDateLock(date) {
  if (!date) {
    return {
      locked: true,
      message: 'Informe uma data para realizar o lançamento.'
    }
  }

  const now = new Date()
  const todayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
  const selectedDate = createLocalDate(date)

  if (!selectedDate) {
    return {
      locked: true,
      message: 'Data de lançamento inválida.'
    }
  }

  const yesterday = new Date(todayDate)
  yesterday.setDate(todayDate.getDate() - 1)

  const tomorrow = new Date(todayDate)
  tomorrow.setDate(todayDate.getDate() + 1)

  const yesterdayLimit = new Date(todayDate)
  yesterdayLimit.setHours(1, 0, 0, 0)

  if (selectedDate >= tomorrow) {
    return {
      locked: true,
      message: 'Não é permitido lançar coleta para data futura.'
    }
  }

  if (selectedDate.getTime() === todayDate.getTime()) {
    return {
      locked: false,
      message: ''
    }
  }

  if (selectedDate.getTime() === yesterday.getTime()) {
    if (now <= yesterdayLimit) {
      return {
        locked: false,
        message: ''
      }
    }

    return {
      locked: true,
      message: 'O lançamento do dia anterior só é permitido até 01:00 da manhã.'
    }
  }

  return {
    locked: true,
    message: 'Não é permitido lançar coleta para datas anteriores ao dia de ontem.'
  }
}

function normalizeHour(time) {
  const hour = toHourNumber(time)
  if (hour === null) return null
  return String(hour).padStart(2, '0')
}

function shiftByHour(hour) {
  if (hour >= 7 && hour <= 18) return '1º Turno'
  return '2º Turno'
}

function rowKey(date, plant, time) {
  return `${date}|${plant}|${normalizeHour(time)}`
}

function fixedDayRows(date, plant, loggedUser) {
  return Array.from({ length: 24 }, (_, hour) => ({
    id: `novo-${date}-${plant}-${hour}`,
    date,
    plant,
    time: `${String(hour).padStart(2, '0')}:00`,
    shift: shiftByHour(hour),
    letter: loggedUser?.letter || '',
    status: 'pendente',
    sf1: false,
    htt1: false,
    npo1: false,
    fineNpo: false,
    fineHtt: false,
    ccco: false,
    sampler: loggedUser?.name || '',
    badge: loggedUser?.badge || '',
    realTime: '',
    notes: '',
    remote: false
  }))
}

function mergeFixedRows(baseRows, scheduleRows) {
  return baseRows.map((base) => {
    const saved = scheduleRows.find((item) => normalizeHour(item.time) === normalizeHour(base.time))
    return saved ? { ...base, ...saved, shift: base.shift, remote: true } : base
  })
}

export default function Collections({ schedule = [], updateCollection, reloadCollections, isSaving, loggedUser }) {
  const [tableBase, setTableBase] = useState({
    date: today(),
    plant: 'Planta 01'
  })
  const [selected, setSelected] = useState(null)

  const launchDateLock = useMemo(() => getLaunchDateLock(tableBase.date), [tableBase.date])

  function setBaseField(field, value) {
    setTableBase((current) => ({ ...current, [field]: value }))
    setSelected(null)
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
    return mergeFixedRows(fixedDayRows(tableBase.date, tableBase.plant, loggedUser), scheduleForBase)
  }, [tableBase.date, tableBase.plant, scheduleForBase, loggedUser])

  const summary = useMemo(() => {
    return {
      total: rows.length,
      done: rows.filter((item) => item.status === 'coletado').length,
      pending: rows.filter((item) => item.status === 'pendente').length,
      fine: rows.filter((item) => item.fineNpo || item.fineHtt).length
    }
  }, [rows])

  function openRegister(row) {
    if (launchDateLock.locked) {
      window.alert(launchDateLock.message)
      return
    }

    setSelected({
      ...row,
      date: tableBase.date,
      plant: tableBase.plant,
      sampler: row.sampler || loggedUser?.name || '',
      badge: row.badge || loggedUser?.badge || '',
      letter: row.letter || loggedUser?.letter || ''
    })
  }

  function saveFromModal(updatedRow) {
    const validation = getLaunchDateLock(tableBase.date)

    if (validation.locked) {
      window.alert(validation.message)
      return
    }

    const hour = toHourNumber(updatedRow.time) ?? 0

    updateCollection?.({
      ...updatedRow,
      date: tableBase.date,
      plant: tableBase.plant,
      time: `${String(hour).padStart(2, '0')}:00`,
      shift: shiftByHour(hour),
      sampler: loggedUser?.name || updatedRow.sampler || '',
      badge: loggedUser?.badge || updatedRow.badge || '',
      letter: loggedUser?.letter || updatedRow.letter || '',
      fine: Boolean(updatedRow.fineNpo || updatedRow.fineHtt)
    })
    setSelected(null)
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Coletas programadas"
        description="Tabela fixa no padrão MonPlant: altere somente a data e a planta. Para lançar, clique em Registrar na faixa horária desejada."
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
          <p>Selecione a data e a planta. A grade permanece fixa com as 24 faixas horárias.</p>
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

      {launchDateLock.locked && (
        <div className="generation-card generation-card--fixed" style={{ borderColor: '#f59e0b', background: '#fff7ed' }}>
          <div>
            <h3 style={{ color: '#9a3412' }}>Lançamento bloqueado para esta data</h3>
            <p style={{ color: '#9a3412' }}>{launchDateLock.message}</p>
          </div>
        </div>
      )}

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
          <table className="collections-table collections-table--register">
            <thead>
              <tr>
                <th>Faixa</th>
                <th>Turno</th>
                <th>Letra</th>
                <th>Status</th>
                <th>Amostrador</th>
                <th>Matrícula</th>
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
                  <td>{row.letter || loggedUser?.letter || '-'}</td>
                  <td><StatusBadge status={row.status || 'pendente'} /></td>
                  <td>{row.sampler || loggedUser?.name || '-'}</td>
                  <td>{row.badge || loggedUser?.badge || '-'}</td>
                  <td><SampleBadge ok={row.sf1} /></td>
                  <td><SampleBadge ok={row.htt1} /></td>
                  <td><SampleBadge ok={row.npo1} /></td>
                  <td>{row.fineNpo ? 'Sim' : 'Não'}</td>
                  <td>{row.fineHtt ? 'Sim' : 'Não'}</td>
                  <td>{row.ccco ? 'Sim' : 'Não'}</td>
                  <td>{formatClockTime(row.realTime)}</td>
                  <td className="notes-preview">{row.notes || '-'}</td>
                  <td>
                    <button
                      className="table-action table-action--primary"
                      type="button"
                      onClick={() => openRegister(row)}
                      disabled={isSaving || launchDateLock.locked}
                      title={launchDateLock.locked ? launchDateLock.message : ''}
                    >
                      {launchDateLock.locked
                        ? 'Bloqueado'
                        : row.status === 'coletado' || row.status === 'parcial' || row.status === 'nao_realizado'
                          ? 'Editar'
                          : 'Registrar'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <CollectionModal
          row={selected}
          loggedUser={loggedUser}
          onClose={() => setSelected(null)}
          onSave={saveFromModal}
        />
      )}
    </div>
  )
}
