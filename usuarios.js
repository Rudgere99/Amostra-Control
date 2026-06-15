import express from 'express'
import { pool } from '../db/pool.js'
import { mapColeta, mapLog } from '../utils/mapRows.js'

const router = express.Router()

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

function getFineNpo(body) {
  return toBoolean(body.fineNpo ?? body.finoAgregadoNpo ?? body.fino_agregado_npo ?? false)
}

function getFineHtt(body) {
  return toBoolean(body.fineHtt ?? body.finoAgregadoHtt ?? body.fino_agregado_htt ?? false)
}

async function ensureProgramacao(client, body) {
  const programacaoId = body.programacaoId || body.programacao_id || null
  if (programacaoId) return programacaoId

  const date = body.date || body.data_coleta
  const time = normalizeTime(body.time || body.hora_programada)
  const plant = body.plant || body.planta || null

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

async function insertLog(client, action, row) {
  await client.query(`
    INSERT INTO coletas_logs (
      coleta_id,
      acao,
      data_coleta,
      hora_programada,
      planta,
      turno,
      letra,
      amostrador_nome,
      cadastro,
      status,
      fino_agregado_npo,
      fino_agregado_htt,
      observacoes
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13);
  `, [
    row.id,
    action,
    row.data_coleta,
    row.hora_programada,
    row.planta,
    row.turno,
    row.letra,
    row.amostrador_nome,
    row.cadastro,
    row.status,
    row.fino_agregado_npo,
    row.fino_agregado_htt,
    row.observacoes
  ])
}

router.get('/logs', async (req, res) => {
  try {
    const { date, plant, status } = req.query
    const params = []
    const where = []

    if (date) {
      params.push(date)
      where.push(`data_coleta = $${params.length}`)
    }

    if (plant) {
      params.push(plant)
      where.push(`planta = $${params.length}`)
    }

    if (status) {
      params.push(status)
      where.push(`status = $${params.length}`)
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const result = await pool.query(`
      SELECT *
      FROM coletas_logs
      ${whereSql}
      ORDER BY criado_em DESC, id DESC
      LIMIT 500;
    `, params)

    res.json(result.rows.map(mapLog))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar logs de lançamentos.', details: error.message })
  }
})

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
  const client = await pool.connect()

  try {
    const body = req.body
    const time = normalizeTime(body.time || body.hora_programada)
    const realTime = normalizeTime(body.realTime || body.hora_real)
    const fineNpo = getFineNpo(body)
    const fineHtt = getFineHtt(body)

    await client.query('BEGIN')
    const programacaoId = await ensureProgramacao(client, body)

    const result = await client.query(`
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
        fino_agregado_npo,
        fino_agregado_htt,
        informado_ccco,
        status,
        observacoes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      RETURNING *;
    `, [
      programacaoId,
      body.date,
      time,
      realTime,
      body.plant || null,
      body.shift || null,
      body.letter || null,
      toBoolean(body.sf1),
      toBoolean(body.htt1),
      toBoolean(body.npo1),
      body.sampler || null,
      body.badge || null,
      fineNpo || fineHtt,
      fineNpo,
      fineHtt,
      toBoolean(body.ccco),
      body.status || 'pendente',
      body.notes || null
    ])

    if (programacaoId) {
      await client.query('UPDATE programacao_amostragem SET status = $1 WHERE id = $2', [body.status || 'pendente', programacaoId])
    }

    await insertLog(client, 'criado', result.rows[0])
    await client.query('COMMIT')
    res.status(201).json(mapColeta(result.rows[0]))
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
    const fineNpo = getFineNpo(body)
    const fineHtt = getFineHtt(body)

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
        fino_agregado_npo = $14,
        fino_agregado_htt = $15,
        informado_ccco = $16,
        status = $17,
        observacoes = $18,
        atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $19
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
      fineNpo || fineHtt,
      fineNpo,
      fineHtt,
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

    await insertLog(client, 'atualizado', result.rows[0])
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
