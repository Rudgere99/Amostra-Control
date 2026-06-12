import React from 'react'
import { Download, Plus } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import FiltersBar from '../components/FiltersBar.jsx'
import CollectionTable from '../components/CollectionTable.jsx'
import { exportScheduleCsv } from '../utils/exportCsv.js'

export default function Collections({ schedule, updateCollection }) {
  return (
    <div className="page-stack">
      <PageHeader
        eyebrow="Rotina de campo"
        title="Coletas programadas"
        description="Tabela operacional para registrar as coletas das pilhas SF1, HTT1 e NPO1."
        actions={(
          <>
            <button className="btn btn--ghost" type="button"><Plus size={17} /> Novo horário</button>
            <button className="btn btn--orange" type="button" onClick={() => exportScheduleCsv(schedule)}><Download size={17} /> Exportar CSV</button>
          </>
        )}
      />

      <FiltersBar />
      <CollectionTable rows={schedule} onSave={updateCollection} />
    </div>
  )
}
