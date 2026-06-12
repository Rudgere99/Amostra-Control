import React from 'react'
import { AlertTriangle } from 'lucide-react'

export default function AlertBanner({ visible, onClose, onOpenCollections }) {
  if (!visible) return null

  return (
    <div className="alert-banner">
      <div className="alert-banner__icon">
        <AlertTriangle size={22} />
      </div>
      <div>
        <strong>Atenção: coleta de amostra pendente.</strong>
        <p>Existe coleta aguardando registro. Priorize o lançamento antes do próximo horário fechado.</p>
      </div>
      <div className="alert-banner__actions">
        <button className="btn btn--orange" type="button" onClick={onOpenCollections}>Ver coletas</button>
        <button className="btn btn--ghost" type="button" onClick={onClose}>Ocultar</button>
      </div>
    </div>
  )
}
