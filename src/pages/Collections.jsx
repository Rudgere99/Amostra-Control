import React, { useMemo, useState } from 'react'
import { Download, RefreshCcw, Wand2 } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import FiltersBar from '../components/FiltersBar.jsx'
import CollectionTable from '../components/CollectionTable.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'

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

export default function Collections({ schedule, updateCollection, generateFullDay, reloadCollections, isSaving }) {
  const [form, setForm] = useState({
    date: today(),
    plant: 'Planta 01',
    shift: '1º Turno',
    letter: 'A'
  })

  const [filters, setFilters] = useState({
    date: today(),
    shift: 'Todos',
    plant: 'Todas',
    letter: 'Todas',
    status: 'Todos'
  })

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const filteredSchedule = useMemo(() => {
    return schedule.filter((item) => {
      const dateOk = !filters.date || normalizeDate(item.date) === filters.date
      const shiftOk = matchesFilter(item.shift, filters.shift, 'Todos')
      const plantOk = matchesFilter(item.plant, filters.plant, 'Todas')
      const letterOk = matchesFilter(item.letter, filters.letter, 'Todas')
      const statusOk = matchesFilter(item.status, filters.status, 'Todos')

      return dateOk && shiftOk && plantOk && letterOk && statusOk
    })
  }, [schedule, filters])

  function handleReload() {
    const params = {
      date: filters.date || form.date,
      plant: filters.plant !== 'Todas' ? filters.plant : form.plant
    }

    reloadCollections?.(params)
  }

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Coletas programadas"
        description="Tabela operacional para registrar as coletas das faixas 00-01 até 23-00, considerando as pilhas SF1, HTT1 e NPO1."
        actions={(
          <>
            <button className="btn btn--ghost" type="button" onClick={handleReload} disabled={isSaving}>
              <RefreshCcw size={17} /> Atualizar
            </button>
            <button className="btn btn--orange" type="button" onClick={() => exportScheduleCsv(filteredSchedule)}>
              <Download size={17} /> Exportar CSV
            </button>
          </>
        )}
      />

      <div className="generation-card">
        <div>
          <h3>Gerar programação diária</h3>
          <p>Cria/verifica automaticamente as 24 faixas horárias: 00-01, 01-02, ... 23-00.</p>
        </div>
        <label>Data<input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} /></label>
        <label>Planta<select value={form.plant} onChange={(e) => setField('plant', e.target.value)}><option>Planta 01</option><option>Planta 02</option></select></label>
        <label>Turno<select value={form.shift} onChange={(e) => setField('shift', e.target.value)}><option>1º Turno</option><option>2º Turno</option><option>3º Turno</option></select></label>
        <label>Letra<select value={form.letter} onChange={(e) => setField('letter', e.target.value)}><option>A</option><option>B</option><option>C</option><option>D</option></select></label>
        <button className="btn btn--orange" type="button" onClick={() => generateFullDay?.(form)} disabled={isSaving}>
          <Wand2 size={17} /> Gerar 24h
        </button>
      </div>

      <FiltersBar filters={filters} onChange={setFilters} />

      <div className="filter-summary">
        Exibindo <strong>{filteredSchedule.length}</strong> de <strong>{schedule.length}</strong> registros
      </div>

      <CollectionTable rows={filteredSchedule} onSave={updateCollection} />
    </div>
  )
}
