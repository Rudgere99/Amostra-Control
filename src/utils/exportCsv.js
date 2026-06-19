import { formatClockTime, formatHourRange } from './time.js'
import { formatShortDate } from './date.js'

export function exportScheduleCsv(schedule) {
  const headers = ['Data', 'Hora programada', 'Planta', 'Turno', 'Letra', 'SF1', 'HTT1', 'NPO1', 'Amostrador', 'Cadastro', 'Hora real', 'Fino agregado NPO', 'Fino agregado HTT', 'CCCO informado', 'Status', 'Observações']
  const rows = schedule.map((item) => [
    formatShortDate(item.date),
    formatHourRange(item.time),
    item.plant,
    item.shift,
    item.letter,
    item.sf1 ? 'Sim' : 'Não',
    item.htt1 ? 'Sim' : 'Não',
    item.npo1 ? 'Sim' : 'Não',
    item.sampler || '-',
    item.badge || '-',
    formatClockTime(item.realTime),
    item.fineNpo ? 'Sim' : 'Não',
    item.fineHtt ? 'Sim' : 'Não',
    item.ccco ? 'Sim' : 'Não',
    item.status,
    item.notes || ''
  ])

  const csv = [headers, ...rows]
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';'))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'amostra-control-registros.csv'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
