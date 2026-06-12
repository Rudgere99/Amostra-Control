import React, { useState } from 'react'
import { Eye, PencilLine } from 'lucide-react'
import StatusBadge from './StatusBadge.jsx'
import SampleBadge from './SampleBadge.jsx'
import CollectionModal from './CollectionModal.jsx'

export default function CollectionTable({ rows, onSave }) {
  const [selected, setSelected] = useState(null)

  return (
    <div className="table-card">
      <div className="table-card__header">
        <div>
          <h3>Programação diária de amostragem</h3>
          <span>Controle por horário fechado, pilhas e amostrador responsável</span>
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
                <td><strong>{row.time}</strong></td>
                <td>{row.plant}</td>
                <td><SampleBadge value={row.sf1} /></td>
                <td><SampleBadge value={row.htt1} /></td>
                <td><SampleBadge value={row.npo1} /></td>
                <td>{row.sampler || '-'}</td>
                <td>{row.badge || '-'}</td>
                <td>{row.realTime || '-'}</td>
                <td>{row.ccco ? 'Sim' : 'Não'}</td>
                <td><StatusBadge status={row.status} /></td>
                <td>
                  {row.status === 'coletado'
                    ? <button className="table-action" type="button"><Eye size={15} /> Visualizar</button>
                    : <button className="table-action table-action--primary" type="button" onClick={() => setSelected(row)}><PencilLine size={15} /> Registrar</button>}
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
