import express from 'express'
import { pool } from '../db/pool.js'
import { mapColeta } from '../utils/mapRows.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { date, status, plant } = req.query
    const params = []
    const where = []

    if (date) {
      params.push(date)
      where.push(`data_coleta = $${params.length}`)
    }

    if (status) {
      params.push(status)
      where.push(`status = $${params.length}`)
    }

    if (plant) {
      params.push(plant)
      where.push(`planta = $${params.length}`)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const result = await pool.query(`
      SELECT *
      FROM coletas_amostras
      ${whereSql}
      ORDER BY data_coleta DESC, hora_programada ASC, id ASC;
    `, params)

    res.json(result.rows.map(mapColeta))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar coletas.', details: error.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM coletas_amostras WHERE id = $1', [req.params.id])

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Coleta não encontrada.' })
    }

    res.json(mapColeta(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar coleta.', details: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const body = req.body

    const result = await pool.query(`
      INSERT INTO coletas_amostras (
        programacao_id,
        data_coleta,
        hora_programada,
        hora_real,
        planta,
        turno,
        letra,
        pilha_sf1,
        pilha_htt1,
        pilha_npo1,
        amostrador_nome,
        cadastro,
        contem_fino_agregado,
        informado_ccco,
        status,
        observacoes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
      RETURNING *;
    `, [
      body.programacaoId || null,
      body.date,
      body.time,
      body.realTime || null,
      body.plant || null,
      body.shift || null,
      body.letter || null,
      Boolean(body.sf1),
      Boolean(body.htt1),
      Boolean(body.npo1),
      body.sampler || null,
      body.badge || null,
      Boolean(body.fine),
      Boolean(body.ccco),
      body.status || 'pendente',
      body.notes || null
    ])

    res.status(201).json(mapColeta(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar coleta.', details: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const body = req.body

    const result = await pool.query(`
      UPDATE coletas_amostras
      SET
        hora_real = $1,
        pilha_sf1 = $2,
        pilha_htt1 = $3,
        pilha_npo1 = $4,
        amostrador_nome = $5,
        cadastro = $6,
        contem_fino_agregado = $7,
        informado_ccco = $8,
        status = $9,
        observacoes = $10,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $11
      RETURNING *;
    `, [
      body.realTime || null,
      Boolean(body.sf1),
      Boolean(body.htt1),
      Boolean(body.npo1),
      body.sampler || null,
      body.badge || null,
      Boolean(body.fine),
      Boolean(body.ccco),
      body.status || 'pendente',
      body.notes || null,
      req.params.id
    ])

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Coleta não encontrada.' })
    }

    res.json(mapColeta(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar coleta.', details: error.message })
  }
})

export default router
