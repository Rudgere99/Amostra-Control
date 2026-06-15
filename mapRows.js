import express from 'express'
import { pool } from '../db/pool.js'
import { mapProgramacao } from '../utils/mapRows.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { date } = req.query
    const params = []
    const where = []

    if (date) {
      params.push(date)
      where.push(`data_programada = $${params.length}`)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const result = await pool.query(`
      SELECT *
      FROM programacao_amostragem
      ${whereSql}
      ORDER BY data_programada DESC, hora_programada ASC;
    `, params)

    res.json(result.rows.map(mapProgramacao))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar programação.', details: error.message })
  }
})

router.post('/generate-day', async (req, res) => {
  try {
    const { date, plant = 'Planta 01', shift = '1º Turno', letter = 'A', startHour = 0, endHour = 23 } = req.body

    if (!date) {
      return res.status(400).json({ error: 'Informe a data no campo date.' })
    }

    const firstHour = Math.max(0, Number(startHour))
    const lastHour = Math.min(23, Number(endHour))

    if (!Number.isInteger(firstHour) || !Number.isInteger(lastHour) || firstHour > lastHour) {
      return res.status(400).json({ error: 'Informe startHour e endHour entre 0 e 23.' })
    }

    const created = []

    for (let hour = firstHour; hour <= lastHour; hour += 1) {
      const time = `${String(hour).padStart(2, '0')}:00:00`

      const prog = await pool.query(`
        INSERT INTO programacao_amostragem (data_programada, hora_programada, planta, turno, letra, status)
        VALUES ($1, $2, $3, $4, $5, 'pendente')
        ON CONFLICT (data_programada, hora_programada, planta)
        DO UPDATE SET turno = EXCLUDED.turno, letra = EXCLUDED.letra
        RETURNING *;
      `, [date, time, plant, shift, letter])

      const programacao = prog.rows[0]

      await pool.query(`
        WITH existing AS (
          UPDATE coletas_amostras
          SET
            programacao_id = $1,
            turno = $5,
            letra = $6,
            atualizado_em = CURRENT_TIMESTAMP
          WHERE data_coleta = $2 AND hora_programada = $3 AND planta = $4
          RETURNING id
        )
        INSERT INTO coletas_amostras (
          programacao_id,
          data_coleta,
          hora_programada,
          planta,
          turno,
          letra,
          status
        )
        SELECT $1, $2, $3, $4, $5, $6, 'pendente'
        WHERE NOT EXISTS (SELECT 1 FROM existing);
      `, [programacao.id, date, time, plant, shift, letter])

      created.push(mapProgramacao(programacao))
    }

    res.status(201).json({ message: 'Programação gerada/verificada com sucesso.', items: created })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao gerar programação.', details: error.message })
  }
})

export default router
