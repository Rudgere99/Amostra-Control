import React, { useState } from 'react'
import { PencilLine } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import SampleBadge from './SampleBadge.jsx'
import CollectionModal from './CollectionModal.jsx'
import { formatClockTime, formatHourRange } from '../utils/time.js'

function FineBadge({ value }) {
  return <span className={`sample ${value ? 'sample--no' : 'sample--ok'}`}>{value ? 'Sim' : 'Não'}</span>
}

export default function CollectionTable({ rows, onSave }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="table-card">
      <div className="table-card__header">
        <div>
          <h3>Programação diária de amostragem</h3>
          <span>Tabela fixa de 24 horas, com status por pilha, fino agregado e amostrador responsável</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Hora</th>
              <th>Planta</th>
              <th>SF1</th>
              <th>HTT1</th>
              <th>NPO1</th>
              <th>Fino NPO</th>
              <th>Fino HTT</th>
              <th>Amostrador</th>
              <th>Cadastro</th>
              <th>Hora real</th>
              <th>CCCO</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td><strong>{formatHourRange(row.time)}</strong></td>
                <td>{row.plant}</td>
                <td><SampleBadge value={row.sf1} /></td>
                <td><SampleBadge value={row.htt1} /></td>
                <td><SampleBadge value={row.npo1} /></td>
                <td><FineBadge value={row.fineNpo} /></td>
                <td><FineBadge value={row.fineHtt} /></td>
                <td>{row.sampler || '-'}</td>
                <td>{row.badge || '-'}</td>
                <td>{formatClockTime(row.realTime)}</td>
                <td>{row.ccco ? 'Sim' : 'Não'}</td>
                <td><StatusBadge status={row.status} /></td>
                <td>
                  <button className={`table-action ${row.status === 'coletado' ? '' : 'table-action--primary'}`} type="button" onClick={() => setSelected(row)}><PencilLine size={15} /> {row.status === 'coletado' ? 'Editar' : 'Registrar'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <CollectionModal
          row={selected}
          onClose={() => setSelected(null)}
          onSave={(updated) => {
            onSave(updated)
            setSelected(null)
          }}
        />
      )}
    </div>
  )
}
