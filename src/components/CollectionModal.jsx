import React, { useState } from 'react'
import { nowTime } from '../utils/status.js'
import { formatClockTime, formatHourRange } from '../utils/time.js'

function sampleValue(row, field) {
  if (['pendente', 'atrasado'].includes(row.status || 'pendente') && row[field] !== true) return ''
  return Boolean(row[field])
}

function deriveStatus({ sf1, htt1, npo1 }) {
  const samples = [sf1, htt1, npo1]
  if (samples.some((sample) => sample === '')) return 'pendente'

  const collected = samples.filter(Boolean).length
  if (collected === 3) return 'coletado'
  if (collected === 0) return 'nao_realizado'
  return 'parcial'
}

function sampleSelectValue(value) {
  if (value === '') return ''
  return value ? 'sim' : 'nao'
}

function sampleFromSelect(value) {
  if (value === '') return ''
  return value === 'sim'
}

export default function CollectionModal({ row, loggedUser, onClose, onSave }) {
  const [form, setForm] = useState({
    sf1: sampleValue(row, 'sf1'),
    htt1: sampleValue(row, 'htt1'),
    npo1: sampleValue(row, 'npo1'),
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
        next.status = deriveStatus({ sf1, htt1, npo1 })
      }

      return next
    })
  }

  function submit() {
    if (!sampler || !badge) {
      alert('Usuário logado sem nome ou matrícula. Verifique o cadastro do usuário.')
      return
    }

    const derivedStatus = deriveStatus(form)
    const partial = derivedStatus === 'parcial'
    const notDone = derivedStatus === 'nao_realizado'

    if ((partial || notDone) && !form.notes.trim()) {
      alert('Informe uma observação/justificativa para coleta parcial ou não realizada.')
      return
    }

    onSave({
      ...row,
      ...form,
      sf1: form.sf1 === true,
      htt1: form.htt1 === true,
      npo1: form.npo1 === true,
      sampler,
      badge,
      letter,
      fine: Boolean(form.fineNpo || form.fineHtt),
      status: derivedStatus
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
          <label>Status<input value={form.status === 'coletado' ? 'Realizada' : form.status === 'parcial' ? 'Parcial' : form.status === 'nao_realizado' ? 'Não realizada' : 'Pendente'} readOnly /></label>
          <label>SF1 coletada?<select value={sampleSelectValue(form.sf1)} onChange={(e) => setField('sf1', sampleFromSelect(e.target.value))}><option value="">Não respondido</option><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>HTT1 coletada?<select value={sampleSelectValue(form.htt1)} onChange={(e) => setField('htt1', sampleFromSelect(e.target.value))}><option value="">Não respondido</option><option value="sim">Sim</option><option value="nao">Não</option></select></label>
          <label>NPO1 coletada?<select value={sampleSelectValue(form.npo1)} onChange={(e) => setField('npo1', sampleFromSelect(e.target.value))}><option value="">Não respondido</option><option value="sim">Sim</option><option value="nao">Não</option></select></label>
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
