export function getStatusLabel(status) {
  const labels = {
    coletado: 'Coletado',
    pendente: 'Pendente',
    atrasado: 'Atrasado',
    parcial: 'Parcial',
    nao_realizado: 'Não realizado'
  }
  return labels[status] || status
}

export function getSampleLabel(value) {
  return value ? 'OK' : '--'
}

export function nowTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

export function buildStats(schedule) {
  const total = schedule.length
  const done = schedule.filter((item) => item.status === 'coletado').length
  const pending = schedule.filter((item) => item.status === 'pendente').length
  const late = schedule.filter((item) => item.status === 'atrasado').length
  const partial = schedule.filter((item) => item.status === 'parcial').length
  const adherence = total ? Math.round((done / total) * 100) : 0
  return { total, done, pending, late, partial, adherence }
}
