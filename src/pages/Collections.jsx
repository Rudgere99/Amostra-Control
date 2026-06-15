import React, { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCcw } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import CollectionTable from '../components/CollectionTable.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'
import { hasApiConfigured } from '../services/api.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function normalizeDate(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function shiftByHour(hour) {
  if (hour >= 0 && hour <= 7) return '1º Turno'
  if (hour >= 8 && hour <= 15) return '2º Turno'
  return '3º Turno'
}

function emptyCollectionSlot(date, plant, hour) {
  const time = `${String(hour).padStart(2, '0')}:00`

  return {
    id: `${date}-${plant}-${time}`,
    time,
    date,
    shift: shiftByHour(hour),
    letter: 'A',
    plant,
    sf1: false,
    htt1: false,
    npo1: false,
    sampler: '',
    badge: '',
    realTime: '',
    fineNpo: false,
  fineHtt: false,
    ccco: false,
    status: 'pendente',
    notes: ''
  }
}

function buildFixedDayRows(schedule, date, plant) {
  const rowsByHour = new Map()

  schedule.forEach((item) => {
    if (normalizeDate(item.date) !== date || item.plant !== plant) return

    const hour = Number.parseInt(String(item.time || '').slice(0, 2), 10)
    if (Number.isInteger(hour)) rowsByHour.set(hour, item)
  })

  return Array.from({ length: 24 }, (_, hour) => rowsByHour.get(hour) || emptyCollectionSlot(date, plant, hour))
}

export default function Collections({ schedule, updateCollection, generateFullDay, reloadCollections, isSaving }) {
  const [selectedDate, setSelectedDate] = useState(today())
  const [selectedPlant, setSelectedPlant] = useState('Planta 01')

  const fixedSchedule = useMemo(() => {
    return buildFixedDayRows(schedule, selectedDate, selectedPlant)
  }, [schedule, selectedDate, selectedPlant])

  function handleReload() {
    reloadCollections?.({ date: selectedDate, plant: selectedPlant })
  }

  useEffect(() => {
    if (hasApiConfigured()) {
      if (generateFullDay) {
        generateFullDay({ date: selectedDate, plant: selectedPlant, shift: '1º Turno', letter: 'A' })
        return
      }

      handleReload()
    }
  }, [selectedDate, selectedPlant])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Coletas programadas"
        description="Tabela fixa de 24 horas para lançamento das coletas. Altere apenas a data ou a planta para carregar a programação correspondente."
        actions={(
          <>
            <button className="btn btn--ghost" type="button" onClick={handleReload} disabled={isSaving}>
              <RefreshCcw size={17} /> Atualizar
            </button>
            <button className="btn btn--orange" type="button" onClick={() => exportScheduleCsv(fixedSchedule)}>
              <Download size={17} /> Exportar CSV
            </button>
          </>
        )}
      />

      <div className="collections-toolbar">
        <label>
          Data da coleta
          <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} />
        </label>
        <label>
          Planta
          <select value={selectedPlant} onChange={(event) => setSelectedPlant(event.target.value)}>
            <option>Planta 01</option>
            <option>Planta 02</option>
          </select>
        </label>
        <div className="collections-toolbar__hint">
          A grade permanece fixa de 00-01 até 23-00; os lançamentos mudam conforme a data e a planta selecionadas.
        </div>
      </div>

      <div className="filter-summary">
        Exibindo <strong>{fixedSchedule.length}</strong> horários de <strong>{selectedPlant}</strong> em <strong>{selectedDate}</strong>
      </div>

      <CollectionTable rows={fixedSchedule} onSave={updateCollection} />
    </div>
  )
}
