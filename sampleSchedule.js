import React, { useState } from 'react'
import { nowTime } from '../utils/status.js'
import { formatClockTime, formatHourRange } from '../utils/time.js'

export default function CollectionModal({ row, onClose, onSave }) {
  const [form, setForm] = useState({
    sampler: row.sampler || '',
    badge: row.badge || '',
    sf1: Boolean(row.sf1),
    htt1: Boolean(row.htt1),
    npo1: Boolean(row.npo1),
    fineNpo: Boolean(row.fineNpo),
    fineHtt: Boolean(row.fineHtt),
    ccco: Boolean(row.ccco),
    notes: row.notes || '',
    realTime: row.realTime || nowTime()
  })

  function setField(field, value) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function submit() {
    if (!form.sampler.trim() || !form.badge.trim()) {
      alert('Preencha o nome do amostrador e o cadastro.')
      return
    }

    const partial = !form.sf1 || !form.htt1 || !form.npo1
    if (partial && !form.notes.trim()) {
      alert('Informe uma observação/justificativa para coleta parcial.')
      return
    }

    onSave({
      ...row,
      ...form,
      status: partial ? 'parcial' : 'coletado'
    })
  }

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-card__header">
          <div>
            <span className="eyebrow">Registro de campo</span>
            <h3>Registrar coleta das {formatHourRange(row.time)}</h3>
          </div>
          <button className="icon-btn" type="button" onClick={onClose}>×</button>
        </div>

        <div className="form-grid">
          <label>Nome do amostrador<input value={form.sampler} onChange={(e) => setField('sampler', e.target.value)} placeholder="Digite o nome" /></label>
          <label>Cadastro<input value={form.badge} onChange={(e) => setField('badge', e.target.value)} placeholder="Ex: 12345" /></label>
          <label>Data<input value={row.date} readOnly /></label>
          <label>Hora programada<input value={formatHourRange(row.time)} readOnly /></label>
          <label>Hora real<input value={formatClockTime(form.realTime)} readOnly /></label>
          <label>Informado ao CCCO?<select value={form.ccco ? 'sim' : 'nao'} onChange={(e) => setField('ccco', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>SF1 coletada?<select value={form.sf1 ? 'sim' : 'nao'} onChange={(e) => setField('sf1', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>HTT1 coletada?<select value={form.htt1 ? 'sim' : 'nao'} onChange={(e) => setField('htt1', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>NPO1 coletada?<select value={form.npo1 ? 'sim' : 'nao'} onChange={(e) => setField('npo1', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>Fino agregado NPO?<select value={form.fineNpo ? 'sim' : 'nao'} onChange={(e) => setField('fineNpo', e.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></label>
          <label>Fino agregado HTT?<select value={form.fineHtt ? 'sim' : 'nao'} onChange={(e) => setField('fineHtt', e.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></label>
          <label className="form-grid__full">Observações / justificativa<textarea value={form.notes} onChange={(e) => setField('notes', e.target.value)} placeholder="Descreva observações, justificativas ou contaminação por fino" /></label>
        </div>

        <div className="modal-card__actions">
          <button className="btn btn--ghost" type="button" onClick={onClose}>Cancelar</button>
          <button className="btn btn--orange" type="button" onClick={submit}>Salvar coleta</button>
        </div>
      </div>
    </div>
  )
}
