import express from 'express'
import { pool } from '../db/pool.js'

const router = express.Router()

function today() {
  return new Date().toISOString().slice(0, 10)
}

function hourFromTime(value) {
  if (!value) return null
  const match = String(value).match(/^(\d{1,2})/)
  if (!match) return null
  const hour = Number(match[1])
  return Number.isFinite(hour) ? hour : null
}

function calcCurrentHourForDate(selectedDate) {
  if (selectedDate !== today()) return null
  return new Date().getHours()
}

router.get('/summary', async (req, res) => {
  try {
    const { date, plant } = req.query
    const selectedDate = date || today()
    const plants = plant ? [plant] : ['Planta 01', 'Planta 02']
    const totalProgrammed = 24 * plants.length

    const result = await pool.query(`
      SELECT *
      FROM coletas_amostras
      WHERE data_coleta = $1
        AND planta = ANY($2::text[])
      ORDER BY data_coleta ASC, planta ASC, hora_programada ASC, atualizado_em ASC, criado_em ASC, id ASC;
    `, [selectedDate, plants])

    const latestBySlot = new Map()

    for (const row of result.rows) {
      const hour = hourFromTime(row.hora_programada)
      if (hour === null) continue
      latestBySlot.set(`${row.planta}|${String(hour).padStart(2, '0')}`, row)
    }

    const records = Array.from(latestBySlot.values())
    const done = records.filter((row) => row.status === 'coletado').length
    const partial = records.filter((row) => row.status === 'parcial').length
    const notDone = records.filter((row) => row.status === 'nao_realizado').length
    const fine = records.filter((row) => row.fino_agregado_npo || row.fino_agregado_htt || row.contem_fino_agregado).length
    const ccco = records.filter((row) => row.informado_ccco).length

    const currentHour = calcCurrentHourForDate(selectedDate)
    let late = records.filter((row) => row.status === 'atrasado').length

    if (currentHour !== null) {
      for (const currentPlant of plants) {
        for (let hour = 0; hour < currentHour; hour += 1) {
          const row = latestBySlot.get(`${currentPlant}|${String(hour).padStart(2, '0')}`)
          if (!row || row.status === 'pendente' || row.status === 'atrasado') late += 1
        }
      }
    }

    const closed = done + partial + notDone
    const pending = Math.max(totalProgrammed - closed, 0)
    const adherence = totalProgrammed > 0 ? Math.round((done / totalProgrammed) * 100) : 0

    res.json({
      date: selectedDate,
      plant: plant || 'Todas',
      total: totalProgrammed,
      done,
      pending,
      late,
      partial,
      notDone,
      fine,
      ccco,
      adherence
    })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar resumo do dashboard.', details: error.message })
  }
})

export default router
