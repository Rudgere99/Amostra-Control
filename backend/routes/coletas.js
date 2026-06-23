import express from 'express'
import { pool } from '../db/pool.js'
import { mapColeta } from '../utils/mapRows.js'

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

function shiftByTime(time, fallback = null) {
  const normalized = normalizeTime(time)
  const hour = normalized ? Number(String(normalized).slice(0, 2)) : NaN
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) return fallback
  return hour >= 7 && hour <= 18 ? '1º Turno' : '2º Turno'
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['true', 'sim', '1', 'yes'].includes(value.toLowerCase())
  return Boolean(value)
}


function addDaysIso(date, days) {
  const base = new Date(`${date}T00:00:00.000Z`)
  if (Number.isNaN(base.getTime())) return null
  base.setUTCDate(base.getUTCDate() + days)
  return base.toISOString().slice(0, 10)
}

function labWindowWhere(startParamIndex = 1) {
  return `(
    (data_coleta = $${startParamIndex} AND hora_programada >= TIME '07:00:00')
    OR (data_coleta = $${startParamIndex + 1} AND hora_programada <= TIME '06:00:00')
  )`
}

router.get('/laboratorio', async (req, res) => {
  try {
    const date = String(req.query.date || '').slice(0, 10)
    const endDate = addDaysIso(date, 1)

    if (!date || !endDate) {
      return res.status(400).json({ error: 'Informe uma data operacional válida.' })
    }

    const result = await pool.query(`
      WITH coletas_janela AS (
        SELECT planta
        FROM coletas_amostras
        WHERE ${labWindowWhere(1)}
          AND status = 'coletado'
      ), plantas AS (
        SELECT planta, COUNT(*)::int AS coletas_realizadas
        FROM coletas_janela
        GROUP BY planta
      )
      SELECT
        plantas.planta,
        plantas.coletas_realizadas,
        COALESCE(recebimentos.recebido_sf1, FALSE) AS recebido_sf1,
        COALESCE(recebimentos.recebido_htt1, FALSE) AS recebido_htt1,
        COALESCE(recebimentos.recebido_npo1, FALSE) AS recebido_npo1,
        recebimentos.recebido_por,
        recebimentos.observacoes,
        recebimentos.atualizado_em
      FROM plantas
      LEFT JOIN laboratorio_recebimentos recebimentos
        ON recebimentos.data_operacional = $1
       AND recebimentos.planta = plantas.planta
      ORDER BY plantas.planta ASC;
    `, [date, endDate])

    res.json(result.rows.map((row) => {
      const receivedMaterials = {
        sf1: row.recebido_sf1,
        htt1: row.recebido_htt1,
        npo1: row.recebido_npo1
      }

      return {
        plant: row.planta,
        operationalDate: date,
        collectedSamples: row.coletas_realizadas,
        expectedBags: 3,
        receivedMaterials,
        received: receivedMaterials.sf1 && receivedMaterials.htt1 && receivedMaterials.npo1,
        receivedBy: row.recebido_por,
        receiptNotes: row.observacoes,
        receiptAt: row.atualizado_em
      }
    }))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar amostras do laboratório.', details: error.message })
  }
})

router.post('/laboratorio/recebimento', async (req, res) => {
  const client = await pool.connect()

  try {
    const date = String(req.body.date || '').slice(0, 10)
    const plant = String(req.body.plant || '').trim()
    const receivedBy = String(req.body.receivedBy || req.body.badge || req.body.cadastro || '').trim()
    const notes = String(req.body.notes || req.body.observations || '').trim()
    const receivedMaterials = req.body.receivedMaterials || {}
    const sf1 = toBoolean(req.body.sf1 ?? receivedMaterials.sf1)
    const htt1 = toBoolean(req.body.htt1 ?? receivedMaterials.htt1)
    const npo1 = toBoolean(req.body.npo1 ?? receivedMaterials.npo1)
    const endDate = addDaysIso(date, 1)

    if (!date || !endDate || !plant || !receivedBy) {
      return res.status(400).json({ error: 'Data operacional, planta e ID de confirmação são obrigatórios.' })
    }

    await client.query('BEGIN')

    const coletas = await client.query(`
      SELECT COUNT(*)::int AS total
      FROM coletas_amostras
      WHERE ${labWindowWhere(2)}
        AND planta = $1
        AND status = 'coletado';
    `, [plant, date, endDate])

    if (!coletas.rows[0]?.total) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'Nenhuma coleta realizada encontrada para esta planta na janela 07:00-06:00.' })
    }

    const result = await client.query(`
      INSERT INTO laboratorio_recebimentos (
        data_operacional,
        planta,
        recebido_sf1,
        recebido_htt1,
        recebido_npo1,
        recebido_por,
        observacoes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (data_operacional, planta)
      DO UPDATE SET
        recebido_sf1 = EXCLUDED.recebido_sf1,
        recebido_htt1 = EXCLUDED.recebido_htt1,
        recebido_npo1 = EXCLUDED.recebido_npo1,
        recebido_por = EXCLUDED.recebido_por,
        observacoes = EXCLUDED.observacoes,
        atualizado_em = CURRENT_TIMESTAMP
      RETURNING *;
    `, [date, plant, sf1, htt1, npo1, receivedBy, notes || null])

    await client.query(`
      UPDATE coletas_amostras
      SET laboratorio_recebido = $4,
          laboratorio_recebido_por = $5,
          laboratorio_observacoes = $6,
          laboratorio_recebido_em = CURRENT_TIMESTAMP,
          atualizado_em = CURRENT_TIMESTAMP
      WHERE ${labWindowWhere(2)}
        AND planta = $1
        AND status = 'coletado';
    `, [plant, date, endDate, sf1 && htt1 && npo1, receivedBy, notes || null])

    await client.query('COMMIT')

    const row = result.rows[0]
    res.json({
      message: 'Lançamento do laboratório salvo com sucesso.',
      receipt: {
        plant: row.planta,
        operationalDate: row.data_operacional,
        collectedSamples: coletas.rows[0].total,
        expectedBags: 3,
        receivedMaterials: {
          sf1: row.recebido_sf1,
          htt1: row.recebido_htt1,
          npo1: row.recebido_npo1
        },
        received: row.recebido_sf1 && row.recebido_htt1 && row.recebido_npo1,
        receivedBy: row.recebido_por,
        receiptNotes: row.observacoes,
        receiptAt: row.atualizado_em
      }
    })
  } catch (error) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: 'Erro ao salvar lançamento do laboratório.', details: error.message })
  } finally {
    client.release()
  }
})

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
    shiftByTime(time, body.shift || body.turno || null),
    body.letter || body.letra || null,
    body.status || 'pendente'
  ])

  return result.rows[0].id
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
    const body = req.body
    const time = normalizeTime(body.time || body.hora_programada)
    const realTime = normalizeTime(body.realTime || body.hora_real)

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
      shiftByTime(time, body.shift || null),
      body.letter || null,
      toBoolean(body.sf1),
      toBoolean(body.htt1),
      toBoolean(body.npo1),
      body.sampler || null,
      body.badge || null,
      toBoolean(body.fine || body.fineNpo || body.fineHtt),
      toBoolean(body.fineNpo),
      toBoolean(body.fineHtt),
      toBoolean(body.ccco),
      body.status || 'pendente',
      body.notes || null
    ])

    if (programacaoId) {
      await client.query('UPDATE programacao_amostragem SET status = $1 WHERE id = $2', [body.status || 'pendente', programacaoId])
    }

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
      shiftByTime(time, body.shift || null),
      body.letter || null,
      realTime,
      toBoolean(body.sf1),
      toBoolean(body.htt1),
      toBoolean(body.npo1),
      body.sampler || null,
      body.badge || null,
      toBoolean(body.fine || body.fineNpo || body.fineHtt),
      toBoolean(body.fineNpo),
      toBoolean(body.fineHtt),
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
