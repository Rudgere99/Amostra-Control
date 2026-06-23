import React, { useState } from 'react'
import { nowTime } from '../utils/status.js'
import { formatClockTime, formatHourRange } from '../utils/time.js'

export default function CollectionModal({ row, loggedUser, onClose, onSave }) {
  const [form, setForm] = useState({
    sf1: Boolean(row.sf1),
    htt1: Boolean(row.htt1),
    npo1: Boolean(row.npo1),
    fineNpo: Boolean(row.fineNpo),
    fineHtt: Boolean(row.fineHtt),
    ccco: Boolean(row.ccco),
    status: row.status || 'pendente',
    notes: row.notes || '',
    realTime: row.realTime || nowTime()
  })

  const sampler = loggedUser?.name || row.sampler || ''
  const badge = loggedUser?.badge || row.badge || ''
  const letter = loggedUser?.letter || row.letter || ''

  function setField(field, value) {
    setForm((current) => {
      const next = { ...current, [field]: value }

      if (['sf1', 'htt1', 'npo1'].includes(field)) {
        const sf1 = field === 'sf1' ? value : next.sf1
        const htt1 = field === 'htt1' ? value : next.htt1
        const npo1 = field === 'npo1' ? value : next.npo1
        next.status = sf1 && htt1 && npo1 ? 'coletado' : 'parcial'
      }

      return next
    })
  }

  function submit() {
    if (!sampler || !badge) {
      alert('Usuário logado sem nome ou matrícula. Verifique o cadastro do usuário.')
      return
    }

    const partial = form.status === 'parcial' || !form.sf1 || !form.htt1 || !form.npo1
    const notDone = form.status === 'nao_realizado'

    if ((partial || notDone) && !form.notes.trim()) {
      alert('Informe uma observação/justificativa para coleta parcial ou não realizada.')
      return
    }

    onSave({
      ...row,
      ...form,
      sampler,
      badge,
      letter,
      fine: Boolean(form.fineNpo || form.fineHtt),
      status: notDone ? 'nao_realizado' : partial ? 'parcial' : form.status === 'pendente' ? 'coletado' : form.status
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
          <label>Usuário logado<input value={sampler} readOnly /></label>
          <label>Matrícula<input value={badge} readOnly /></label>
          <label>Letra<input value={letter || '-'} readOnly /></label>
          <label>Planta<input value={row.plant || '-'} readOnly /></label>
          <label>Data<input value={row.date} readOnly /></label>
          <label>Hora programada<input value={formatHourRange(row.time)} readOnly /></label>
          <label>Hora real<input value={formatClockTime(form.realTime)} readOnly /></label>
          <label>Status<select value={form.status} onChange={(e) => setField('status', e.target.value)}><option value="coletado">Realizada</option><option value="parcial">Parcial</option><option value="nao_realizado">Não realizada</option></select></label>
          <label>SF1 coletada?<select value={form.sf1 ? 'sim' : 'nao'} onChange={(e) => setField('sf1', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>HTT1 coletada?<select value={form.htt1 ? 'sim' : 'nao'} onChange={(e) => setField('htt1', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>NPO1 coletada?<select value={form.npo1 ? 'sim' : 'nao'} onChange={(e) => setField('npo1', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>Fino agregado NPO?<select value={form.fineNpo ? 'sim' : 'nao'} onChange={(e) => setField('fineNpo', e.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></label>
          <label>Fino agregado HTT?<select value={form.fineHtt ? 'sim' : 'nao'} onChange={(e) => setField('fineHtt', e.target.value === 'sim')}><option value="nao">Não</option><option value="sim">Sim</option></select></label>
          <label>Informado ao CCCO?<select value={form.ccco ? 'sim' : 'nao'} onChange={(e) => setField('ccco', e.target.value === 'sim')}><option value="sim">Sim</option><option value="nao">Não</option></select></label>
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
