import express from 'express'
import { pool } from '../db/pool.js'
import { currentHourSaoPaulo, hourFromTime, todaySaoPaulo } from '../utils/dateRules.js'

const router = express.Router()

function slotKey(plant, time) {
  const hour = hourFromTime(time)
  if (hour === null) return null
  return `${plant}|${String(hour).padStart(2, '0')}`
}

function isClosedStatus(status) {
  return ['coletado', 'parcial', 'nao_realizado'].includes(status)
}

router.get('/summary', async (req, res) => {
  try {
    const { date, plant } = req.query
    const selectedDate = date || todaySaoPaulo()
    const plants = plant ? [plant] : ['Planta 01', 'Planta 02']

    const [programmedResult, collectionsResult] = await Promise.all([
      pool.query(`
        SELECT *
        FROM programacao_amostragem
        WHERE data_programada = $1
          AND planta = ANY($2::text[])
        ORDER BY data_programada ASC, planta ASC, hora_programada ASC;
      `, [selectedDate, plants]),
      pool.query(`
        SELECT *
        FROM coletas_amostras
        WHERE data_coleta = $1
          AND planta = ANY($2::text[])
        ORDER BY data_coleta ASC, planta ASC, hora_programada ASC, atualizado_em ASC, criado_em ASC, id ASC;
      `, [selectedDate, plants])
    ])

    const totalProgrammed = programmedResult.rowCount
    const latestBySlot = new Map()

    for (const row of collectionsResult.rows) {
      const key = slotKey(row.planta, row.hora_programada)
      if (!key) continue
      latestBySlot.set(key, row)
    }

    const records = Array.from(latestBySlot.values())
    const done = records.filter((row) => row.status === 'coletado').length
    const partial = records.filter((row) => row.status === 'parcial').length
    const notDone = records.filter((row) => row.status === 'nao_realizado').length
    const fine = records.filter((row) => row.fino_agregado_npo || row.fino_agregado_htt || row.contem_fino_agregado).length
    const ccco = records.filter((row) => row.informado_ccco).length

    const currentHour = selectedDate === todaySaoPaulo() ? currentHourSaoPaulo() : null
    let late = records.filter((row) => row.status === 'atrasado').length

    if (currentHour !== null) {
      for (const programacao of programmedResult.rows) {
        const hour = hourFromTime(programacao.hora_programada)
        if (hour === null || hour >= currentHour) continue

        const row = latestBySlot.get(`${programacao.planta}|${String(hour).padStart(2, '0')}`)
        if (!row || row.status === 'pendente' || row.status === 'atrasado') late += 1
      }
    }

    const closed = records.filter((row) => isClosedStatus(row.status)).length
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
