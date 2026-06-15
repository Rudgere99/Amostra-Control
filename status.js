import React, { useEffect, useMemo, useState } from 'react'
import { Download, RefreshCcw } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import CollectionTable from '../components/CollectionTable.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'
import { buildFixedDayRows } from '../utils/dayRows.js'

function today() {
  return new Date().toISOString().slice(0, 10)
}

export default function Collections({ schedule, updateCollection, reloadCollections, isSaving }) {
  const [filters, setFilters] = useState({
    date: today(),
    plant: 'Planta 01'
  })

  const fixedRows = useMemo(() => {
    return buildFixedDayRows({ rows: schedule, date: filters.date, plant: filters.plant })
  }, [schedule, filters])

  function setFilter(field, value) {
    setFilters((current) => ({ ...current, [field]: value }))
  }

  function handleReload() {
    reloadCollections?.({ date: filters.date, plant: filters.plant })
  }

  useEffect(() => {
    handleReload()
  }, [filters.date, filters.plant])

  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Lançamento de coletas"
        description="Tabela fixa de 24 horas no padrão MonPlant. Altere a data ou a planta e registre a coleta na faixa desejada."
        actions={(
          <>
            <button className="btn btn--ghost" type="button" onClick={handleReload} disabled={isSaving}>
              <RefreshCcw size={17} /> Atualizar
            </button>
            <button className="btn btn--orange" type="button" onClick={() => exportScheduleCsv(fixedRows)}>
              <Download size={17} /> Exportar CSV
            </button>
          </>
        )}
      />

      <div className="monplant-filter-card">
        <div>
          <h3>Tabela fixa de lançamento</h3>
          <p>As faixas 00-01 até 23-00 permanecem fixas. O lançamento muda conforme a data e a planta selecionadas.</p>
        </div>
        <label>Data<input type="date" value={filters.date} onChange={(e) => setFilter('date', e.target.value)} /></label>
        <label>Planta<select value={filters.plant} onChange={(e) => setFilter('plant', e.target.value)}><option>Planta 01</option><option>Planta 02</option></select></label>
      </div>

      <div className="filter-summary">
        Tabela fixa com <strong>{fixedRows.length}</strong> faixas horárias para <strong>{filters.plant}</strong>
      </div>

      <CollectionTable rows={fixedRows} onSave={updateCollection} />
    </div>
  )
}
