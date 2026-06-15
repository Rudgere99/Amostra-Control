function today() {
  return new Date().toISOString().slice(0, 10)
}

function shiftByHour(hour) {
  if (hour >= 0 && hour <= 7) return '1º Turno'
  if (hour >= 8 && hour <= 15) return '2º Turno'
  return '3º Turno'
}

export const initialSchedule = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  time: `${String(index).padStart(2, '0')}:00`,
  date: today(),
  shift: shiftByHour(index),
  letter: 'A',
  plant: 'Planta 01',
  sf1: false,
  htt1: false,
  npo1: false,
  sampler: '',
  badge: '',
  realTime: '',
  fineNpo: false,
  fineHtt: false,
  ccco: false,
  status: 'pendente',
  notes: ''
}))
