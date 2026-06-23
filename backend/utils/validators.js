import { isValidDateString, normalizeTime } from './dateRules.js'

export const VALID_STATUSES = ['pendente', 'coletado', 'parcial', 'nao_realizado', 'atrasado']
export const VALID_PLANTS = ['Planta 01', 'Planta 02']

export function toBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', 'sim', '1', 'yes'].includes(value.toLowerCase())
  return Boolean(value)
}

export function pickCollectionPayload(body = {}) {
  const date = body.date || body.data_coleta || null
  const time = normalizeTime(body.time || body.hora_programada)
  const realTime = normalizeTime(body.realTime || body.hora_real) || null
  const plant = body.plant || body.planta || null
  const status = body.status || 'pendente'
  const sampler = String(body.sampler || body.amostrador_nome || '').trim()
  const badge = String(body.badge || body.cadastro || '').trim()

  return {
    date,
    time,
    realTime,
    plant,
    status,
    sampler,
    badge,
    shift: body.shift || body.turno || null,
    letter: body.letter || body.letra || null,
    sf1: toBoolean(body.sf1 || body.pilha_sf1),
    htt1: toBoolean(body.htt1 || body.pilha_htt1),
    npo1: toBoolean(body.npo1 || body.pilha_npo1),
    fineNpo: toBoolean(body.fineNpo || body.fino_agregado_npo),
    fineHtt: toBoolean(body.fineHtt || body.fino_agregado_htt),
    fine: toBoolean(body.fine || body.contem_fino_agregado || body.fineNpo || body.fino_agregado_npo || body.fineHtt || body.fino_agregado_htt),
    ccco: toBoolean(body.ccco || body.informado_ccco),
    notes: body.notes || body.observacoes || null,
    programacaoId: body.programacaoId || body.programacao_id || null
  }
}

export function validateCollectionPayload(payload, { requireIdentity = false } = {}) {
  if (!payload.date || !isValidDateString(payload.date)) {
    return 'Informe uma data válida no formato AAAA-MM-DD.'
  }

  if (!payload.time) {
    return 'Informe uma hora programada válida.'
  }

  if (!VALID_PLANTS.includes(payload.plant)) {
    return 'Planta inválida. Use Planta 01 ou Planta 02.'
  }

  if (!VALID_STATUSES.includes(payload.status)) {
    return `Status inválido. Use: ${VALID_STATUSES.join(', ')}.`
  }

  if (payload.realTime === null && ['coletado', 'parcial'].includes(payload.status)) {
    return 'Informe a hora real para coletas realizadas ou parciais.'
  }

  if (payload.status === 'parcial' && !String(payload.notes || '').trim()) {
    return 'Informe uma observação para lançamento parcial.'
  }

  if (payload.status === 'nao_realizado' && !String(payload.notes || '').trim()) {
    return 'Informe uma justificativa para coleta não realizada.'
  }

  if (requireIdentity && (!payload.sampler || !payload.badge)) {
    return 'Informe amostrador e matrícula para salvar o lançamento.'
  }

  return null
}
