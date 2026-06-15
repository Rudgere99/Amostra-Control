import React, { useMemo, useState } from 'react'
import { Download, RefreshCcw, Save } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'
import { formatHourRange } from '../utils/time.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function matchesFilter(value, filterValue, allValue) {
  if (!filterValue || filterValue === allValue) return true
  return String(value || '') === String(filterValue)
}

function nextHourLabel(hour) {
  const start = String(hour).padStart(2, '0')
  const end = String((hour + 1) % 24).padStart(2, '0')
  return `${start}-${end}`
}

function fixedDayRows(date, plant) {
  return Array.from({ length: 24 }, (_, hour) => ({
    id: `fixed-${date}-${plant}-${hour}`,
    date,
    plant,
    time: nextHourLabel(hour),
    status: 'Pendente',
    sf1: false,
    htt1: false,
    npo1: false,
    fineNpo: false,
    fineHtt: false,
    sampler: '',
    badge: '',
    notes: ''
  }))
}

function mergeFixedRows(baseRows, scheduleRows) {
  return baseRows.map((base) => {
    const saved = scheduleRows.find((item) => String(item.time) === String(base.time))
    return saved ? { ...base, ...saved } : base
  })
}

export default function Collections({ schedule = [], updateCollection, generateFullDay, reloadCollections, isSaving }) {
  const [tableBase, setTableBase] = useState({
    date: today(),
    plant: 'Planta 01',
    shift: 'Todos',
    letter: 'Todas',
    status: 'Todos'
  })

  function setBaseField(field, value) {
    setTableBase((current) => ({ ...current, [field]: value }))
  }

  const scheduleForBase = useMemo(() => {
    return schedule.filter((item) => {
      const dateOk = normalizeDate(item.date) === tableBase.date
      const plantOk = matchesFilter(item.plant, tableBase.plant, 'Todas')
      const shiftOk = matchesFilter(item.shift, tableBase.shift, 'Todos')
      const letterOk = matchesFilter(item.letter, tableBase.letter, 'Todas')
      const statusOk = matchesFilter(item.status, tableBase.status, 'Todos')

      return dateOk && plantOk && shiftOk && letterOk && statusOk
    })
  }, [schedule, tableBase])

  const rows = useMemo(() => {
    const fixedRows = fixedDayRows(tableBase.date, tableBase.plant)
    return mergeFixedRows(fixedRows, scheduleForBase)
  }, [tableBase.date, tableBase.plant, scheduleForBase])

  function handleReload() {
    reloadCollections?.({
      date: tableBase.date,
      plant: tableBase.plant
    })
  }

  function handlePrepareTable() {
    generateFullDay?.({
      date: tableBase.date,
      plant: tableBase.plant,
      shift: tableBase.shift === 'Todos' ? '1º Turno' : tableBase.shift,
      letter: tableBase.letter === 'Todas' ? 'A' : tableBase.letter
    })
  }

  function handleChange(row, field, value) {
    updateCollection?.(row.id, {
      ...row,
      date: tableBase.date,
      plant: tableBase.plant,
      [field]: value
    })
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Coletas programadas"
        description="Tabela fixa de lançamento: selecione a data e a planta, registre as coletas nas faixas horárias e salve somente o que mudar."
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

      <div className="generation-card generation-card--fixed">
        <div>
          <h3>Base fixa de lançamento</h3>
          <p>A tabela permanece com as 24 faixas. Altere somente a data, planta ou filtros para lançar.</p>
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

        <label>
          Turno
          <select value={tableBase.shift} onChange={(e) => setBaseField('shift', e.target.value)}>
            <option>Todos</option>
            <option>1º Turno</option>
            <option>2º Turno</option>
            <option>3º Turno</option>
          </select>
        </label>

        <label>
          Letra
          <select value={tableBase.letter} onChange={(e) => setBaseField('letter', e.target.value)}>
            <option>Todas</option>
            <option>A</option>
            <option>B</option>
            <option>C</option>
            <option>D</option>
          </select>
        </label>

        <label>
          Status
          <select value={tableBase.status} onChange={(e) => setBaseField('status', e.target.value)}>
            <option>Todos</option>
            <option>Pendente</option>
            <option>Realizada</option>
            <option>Não realizada</option>
          </select>
        </label>

        <button className="btn btn--orange" type="button" onClick={handlePrepareTable} disabled={isSaving}>
          <Save size={17} /> Preparar base
        </button>
      </div>

      <div className="filter-summary">
        Exibindo <strong>{rows.length}</strong> faixas fixas para <strong>{tableBase.plant}</strong> em <strong>{tableBase.date}</strong>
      </div>

      <div className="table-card">
        <div className="table-card__header">
          <div>
            <h3>Lançamento das coletas</h3>
            <span>Controle por faixa horária, pilhas amostradas e fino agregado.</span>
          </div>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Faixa</th>
                <th>Status</th>
                <th>Amostrador</th>
                <th>Cadastro</th>
                <th>SF1</th>
                <th>HTT1</th>
                <th>NPO1</th>
                <th>Fino agregado NPO</th>
                <th>Fino agregado HTT</th>
                <th>Observações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatHourRange(row.time)}</td>
                  <td>
                    <select value={row.status || 'Pendente'} onChange={(e) => handleChange(row, 'status', e.target.value)} disabled={isSaving}>
                      <option>Pendente</option>
                      <option>Realizada</option>
                      <option>Não realizada</option>
                    </select>
                  </td>
                  <td>
                    <input value={row.sampler || ''} onChange={(e) => handleChange(row, 'sampler', e.target.value)} placeholder="Nome" disabled={isSaving} />
                  </td>
                  <td>
                    <input value={row.badge || ''} onChange={(e) => handleChange(row, 'badge', e.target.value)} placeholder="Credencial" disabled={isSaving} />
                  </td>
                  <td>
                    <input type="checkbox" checked={Boolean(row.sf1)} onChange={(e) => handleChange(row, 'sf1', e.target.checked)} disabled={isSaving} />
                  </td>
                  <td>
                    <input type="checkbox" checked={Boolean(row.htt1)} onChange={(e) => handleChange(row, 'htt1', e.target.checked)} disabled={isSaving} />
                  </td>
                  <td>
                    <input type="checkbox" checked={Boolean(row.npo1)} onChange={(e) => handleChange(row, 'npo1', e.target.checked)} disabled={isSaving} />
                  </td>
                  <td>
                    <input type="checkbox" checked={Boolean(row.fineNpo)} onChange={(e) => handleChange(row, 'fineNpo', e.target.checked)} disabled={isSaving} />
                  </td>
                  <td>
                    <input type="checkbox" checked={Boolean(row.fineHtt)} onChange={(e) => handleChange(row, 'fineHtt', e.target.checked)} disabled={isSaving} />
                  </td>
                  <td>
                    <input value={row.notes || ''} onChange={(e) => handleChange(row, 'notes', e.target.value)} placeholder="Observações" disabled={isSaving} />
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
