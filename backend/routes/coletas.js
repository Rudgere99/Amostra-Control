import express from 'express'
import { pool } from '../db/pool.js'
import { mapColeta } from '../utils/mapRows.js'

const router = express.Router()
const DEFAULT_PLANT = 'Planta 01'
const DEFAULT_SHIFT = 'Operacional'
const DEFAULT_LETTER = 'A'

function normalizeTime(time) {
  if (!time) return null

  const value = String(time).trim()
  const rangeMatch = value.match(/^(\d{1,2})-(\d{1,2})$/)
  if (rangeMatch) {
    return `${String(Number(rangeMatch[1])).padStart(2, '0')}:00:00`
  }

  const clockMatch = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/)
  if (clockMatch) {
    const [, hour, minute, second = '00'] = clockMatch
    return `${String(Number(hour)).padStart(2, '0')}:${minute}:${second}`
  }

  return value
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', 'sim', '1', 'yes'].includes(value.toLowerCase())
  return Boolean(value)
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

async function ensureDailyCollectionRows(client, date, plant = DEFAULT_PLANT) {
  for (let hour = 0; hour <= 23; hour += 1) {
    const time = `${String(hour).padStart(2, '0')}:00:00`

    const prog = await client.query(`
      INSERT INTO programacao_amostragem (data_programada, hora_programada, planta, turno, letra, status)
      VALUES ($1, $2, $3, $4, $5, 'pendente')
      ON CONFLICT (data_programada, hora_programada, planta)
      DO UPDATE SET turno = COALESCE(programacao_amostragem.turno, EXCLUDED.turno), letra = COALESCE(programacao_amostragem.letra, EXCLUDED.letra)
      RETURNING *;
    `, [date, time, plant, DEFAULT_SHIFT, DEFAULT_LETTER])

    await client.query(`
      WITH existing AS (
        UPDATE coletas_amostras
        SET programacao_id = COALESCE(programacao_id, $1)
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
    `, [prog.rows[0].id, date, time, plant, prog.rows[0].turno || DEFAULT_SHIFT, prog.rows[0].letra || DEFAULT_LETTER])
  }
}

async function ensureProgramacao(client, body) {
  const programacaoId = body.programacaoId || body.programacao_id || null
  if (programacaoId) return programacaoId

  const date = body.date || body.data_coleta
  const time = normalizeTime(body.time || body.hora_programada)
  const plant = body.plant || body.planta || DEFAULT_PLANT

  if (!date || !time || !plant) return null

  const result = await client.query(`
    INSERT INTO programacao_amostragem (data_programada, hora_programada, planta, turno, letra, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (data_programada, hora_programada, planta)
    DO UPDATE SET turno = EXCLUDED.turno, letra = EXCLUDED.letra, status = EXCLUDED.status
    RETURNING id;
  `, [
    date,
    time,
    plant,
    body.shift || body.turno || null,
    body.letter || body.letra || null,
    body.status || 'pendente'
  ])

  return result.rows[0].id
}

router.get('/', async (req, res) => {
  const client = await pool.connect()

  try {
    const { date, status, plant } = req.query
    const selectedDate = date || todayDate()
    const selectedPlant = plant || DEFAULT_PLANT
    const params = []
    const where = []

    await client.query('BEGIN')
    await ensureDailyCollectionRows(client, selectedDate, selectedPlant)

    params.push(selectedDate)
    where.push(`data_coleta = $${params.length}`)

    if (status) {
      params.push(status)
      where.push(`status = $${params.length}`)
    }

    params.push(selectedPlant)
    where.push(`planta = $${params.length}`)

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const result = await client.query(`
      SELECT *
      FROM coletas_amostras
      ${whereSql}
      ORDER BY data_coleta DESC, hora_programada ASC, id ASC;
    `, params)

    await client.query('COMMIT')
    res.json(result.rows.map(mapColeta))
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: 'Erro ao listar coletas.', details: error.message })
  } finally {
    client.release()
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
  const client = await pool.connect()

  try {
    const body = req.body
    const time = normalizeTime(body.time || body.hora_programada)
    const realTime = normalizeTime(body.realTime || body.hora_real)

    await client.query('BEGIN')
    const programacaoId = await ensureProgramacao(client, body)

    const result = await client.query(`
      WITH existing AS (
        UPDATE coletas_amostras
        SET
          programacao_id = COALESCE($1, programacao_id),
          hora_real = $4,
          turno = $6,
          letra = $7,
          pilha_sf1 = $8,
          pilha_htt1 = $9,
          pilha_npo1 = $10,
          amostrador_nome = $11,
          cadastro = $12,
          contem_fino_agregado = $13,
          informado_ccco = $14,
          status = $15,
          observacoes = $16,
          atualizado_em = CURRENT_TIMESTAMP
        WHERE data_coleta = $2 AND hora_programada = $3 AND planta = $5
        RETURNING *
      )
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
      )
      SELECT $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16
      WHERE NOT EXISTS (SELECT 1 FROM existing)
      RETURNING *;
    `, [
      programacaoId,
      body.date,
      time,
      realTime,
      body.plant || DEFAULT_PLANT,
      body.shift || DEFAULT_SHIFT,
      body.letter || DEFAULT_LETTER,
      toBoolean(body.sf1),
      toBoolean(body.htt1),
      toBoolean(body.npo1),
      body.sampler || null,
      body.badge || null,
      toBoolean(body.fine),
      toBoolean(body.ccco),
      body.status || 'pendente',
      body.notes || null
    ])

    const savedRow = result.rows[0] || (await client.query(`
      SELECT * FROM coletas_amostras
      WHERE data_coleta = $1 AND hora_programada = $2 AND planta = $3
      ORDER BY id ASC
      LIMIT 1;
    `, [body.date, time, body.plant || DEFAULT_PLANT])).rows[0]

    if (programacaoId) {
      await client.query('UPDATE programacao_amostragem SET status = $1 WHERE id = $2', [body.status || 'pendente', programacaoId])
    }

    await client.query('COMMIT')
    res.status(201).json(mapColeta(savedRow))
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: 'Erro ao criar coleta.', details: error.message })
  } finally {
    client.release()
  }
})

router.put('/:id', async (req, res) => {
  const client = await pool.connect()

  try {
    const body = req.body
    const time = normalizeTime(body.time || body.hora_programada)
    const realTime = normalizeTime(body.realTime || body.hora_real)

    await client.query('BEGIN')
    const programacaoId = await ensureProgramacao(client, body)

    const result = await client.query(`
      UPDATE coletas_amostras
      SET
        programacao_id = COALESCE($1, programacao_id),
        data_coleta = COALESCE($2, data_coleta),
        hora_programada = COALESCE($3, hora_programada),
        planta = COALESCE($4, planta),
        turno = COALESCE($5, turno),
        letra = COALESCE($6, letra),
        hora_real = $7,
        pilha_sf1 = $8,
        pilha_htt1 = $9,
        pilha_npo1 = $10,
        amostrador_nome = $11,
        cadastro = $12,
        contem_fino_agregado = $13,
        informado_ccco = $14,
        status = $15,
        observacoes = $16,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $17
      RETURNING *;
    `, [
      programacaoId,
      body.date || null,
      time,
      body.plant || null,
      body.shift || null,
      body.letter || null,
      realTime,
      toBoolean(body.sf1),
      toBoolean(body.htt1),
      toBoolean(body.npo1),
      body.sampler || null,
      body.badge || null,
      toBoolean(body.fine),
      toBoolean(body.ccco),
      body.status || 'pendente',
      body.notes || null,
      req.params.id
    ])

    if (!result.rowCount) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Coleta não encontrada.' })
    }

    if (result.rows[0].programacao_id) {
      await client.query('UPDATE programacao_amostragem SET status = $1 WHERE id = $2', [result.rows[0].status, result.rows[0].programacao_id])
    }

    await client.query('COMMIT')
    res.json(mapColeta(result.rows[0]))
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: 'Erro ao atualizar coleta.', details: error.message })
  } finally {
    client.release()
  }
})

export default router
