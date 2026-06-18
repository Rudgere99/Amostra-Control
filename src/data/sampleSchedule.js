import { today } from '../utils/date.js'


function shiftByHour(hour) {
  if (hour >= 7 && hour <= 18) return '1º Turno'
  return '2º Turno'
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
  fine: false,
  ccco: false,
  status: 'pendente',
  notes: ''
}))
