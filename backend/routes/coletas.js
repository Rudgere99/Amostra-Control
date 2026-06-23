import express from 'express'
import { pool } from '../db/pool.js'
import { mapColeta } from '../utils/mapRows.js'
import { getLaunchLock, shiftByTime } from '../utils/dateRules.js'
import { pickCollectionPayload, validateCollectionPayload } from '../utils/validators.js'

const router = express.Router()

function dateOnly(value) {
  if (!value) return null
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

async function ensureProgramacao(client, payload) {
  if (payload.programacaoId) return payload.programacaoId

  const result = await client.query(`
    INSERT INTO programacao_amostragem (data_programada, hora_programada, planta, turno, letra, status)
    VALUES ($1, $2, $3, $4, $5, $6)
    ON CONFLICT (data_programada, hora_programada, planta)
    DO UPDATE SET turno = EXCLUDED.turno, letra = EXCLUDED.letra, status = EXCLUDED.status
    RETURNING id;
  `, [
    payload.date,
    payload.time,
    payload.plant,
    shiftByTime(payload.time, payload.shift),
    payload.letter || null,
    payload.status
  ])

  return result.rows[0].id
}

async function findExistingCollection(client, payload, ignoreId = null) {
  const params = [payload.date, payload.time, payload.plant]
  let ignoreSql = ''

  if (ignoreId) {
    params.push(ignoreId)
    ignoreSql = `AND id <> $${params.length}`
  }

  const result = await client.query(`
    SELECT *
    FROM coletas_amostras
    WHERE data_coleta = $1
      AND hora_programada = $2
      AND planta = $3
      ${ignoreSql}
    ORDER BY atualizado_em DESC, criado_em DESC, id DESC
    LIMIT 1;
  `, params)

  return result.rows[0] || null
}

function collectionParams(payload, programacaoId, id = null) {
  const values = [
    programacaoId,
    payload.date,
    payload.time,
    payload.realTime,
    payload.plant,
    shiftByTime(payload.time, payload.shift),
    payload.letter || null,
    payload.sf1,
    payload.htt1,
    payload.npo1,
    payload.sampler || null,
    payload.badge || null,
    Boolean(payload.fine || payload.fineNpo || payload.fineHtt),
    payload.fineNpo,
    payload.fineHtt,
    payload.ccco,
    payload.status,
    payload.notes || null
  ]

  if (id !== null) values.push(id)
  return values
}

async function updateCollection(client, id, payload, programacaoId) {
  const result = await client.query(`
    UPDATE coletas_amostras
    SET
      programacao_id = COALESCE($1, programacao_id),
      data_coleta = $2,
      hora_programada = $3,
      hora_real = $4,
      planta = $5,
      turno = $6,
      letra = $7,
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
  `, collectionParams(payload, programacaoId, id))

  return result
}

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
    const payload = pickCollectionPayload(req.body)
    const validationError = validateCollectionPayload(payload, { requireIdentity: ['coletado', 'parcial'].includes(payload.status) })

    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const launchLock = getLaunchLock(payload.date, payload.time)
    if (launchLock.locked) {
      return res.status(403).json({ error: launchLock.message })
    }

    await client.query('BEGIN')
    const programacaoId = await ensureProgramacao(client, payload)
    const existing = await findExistingCollection(client, payload)

    const result = existing
      ? await updateCollection(client, existing.id, payload, programacaoId)
      : await client.query(`
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
      `, collectionParams(payload, programacaoId))

    await client.query('UPDATE programacao_amostragem SET status = $1 WHERE id = $2', [payload.status, programacaoId])

    await client.query('COMMIT')
    res.status(existing ? 200 : 201).json(mapColeta(result.rows[0]))
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
    const currentResult = await client.query('SELECT * FROM coletas_amostras WHERE id = $1', [req.params.id])

    if (!currentResult.rowCount) {
      return res.status(404).json({ error: 'Coleta não encontrada.' })
    }

    const current = currentResult.rows[0]
    const payload = pickCollectionPayload({
      date: dateOnly(current.data_coleta),
      time: current.hora_programada,
      plant: current.planta,
      ...req.body
    })
    const validationError = validateCollectionPayload(payload, { requireIdentity: ['coletado', 'parcial'].includes(payload.status) })

    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const launchLock = getLaunchLock(payload.date, payload.time)
    if (launchLock.locked) {
      return res.status(403).json({ error: launchLock.message })
    }

    await client.query('BEGIN')
    const programacaoId = await ensureProgramacao(client, payload)
    const duplicate = await findExistingCollection(client, payload, req.params.id)

    if (duplicate) {
      await client.query('ROLLBACK')
      return res.status(409).json({ error: 'Já existe lançamento para esta data, faixa horária e planta.' })
    }

    const result = await updateCollection(client, req.params.id, payload, programacaoId)

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
