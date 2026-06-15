import express from 'express'
import { pool } from '../db/pool.js'

const router = express.Router()

const VALID_PROFILES = ['Amostrador', 'Controle']

function normalizeProfile(profile) {
  const value = String(profile || '').trim().toLowerCase()
  if (value === 'controle' || value === 'cco' || value === 'admin' || value === 'controlador') return 'Controle'
  return 'Amostrador'
}

function mapUser(row) {
  return {
    id: row.id,
    name: row.nome,
    nome: row.nome,
    badge: row.matricula || row.cadastro,
    matricula: row.matricula || row.cadastro,
    cadastro: row.matricula || row.cadastro,
    profile: normalizeProfile(row.perfil),
    perfil: normalizeProfile(row.perfil),
    letter: row.letra || '',
    letra: row.letra || '',
    active: row.ativo,
    ativo: row.ativo,
    createdAt: row.criado_em
  }
}

function getUserPayload(body) {
  const name = String(body.name || body.nome || '').trim()
  const badge = String(body.badge || body.matricula || body.cadastro || '').trim()
  const profile = normalizeProfile(body.profile || body.perfil)
  const letter = String(body.letter || body.letra || '').trim().toUpperCase()
  return { name, badge, profile, letter }
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, COALESCE(matricula, cadastro) AS matricula, perfil, letra, ativo, criado_em
      FROM usuarios
      ORDER BY nome ASC;
    `)
    res.json(result.rows.map(mapUser))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários.', details: error.message })
  }
})

router.post('/login', async (req, res) => {
  const { badge } = getUserPayload(req.body || {})

  if (!badge) {
    return res.status(400).json({ error: 'Informe a matrícula para login.' })
  }

  try {
    const result = await pool.query(`
      SELECT id, nome, COALESCE(matricula, cadastro) AS matricula, perfil, letra, ativo, criado_em
      FROM usuarios
      WHERE (matricula = $1 OR cadastro = $1) AND ativo = TRUE
      LIMIT 1;
    `, [badge])

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Usuário não encontrado ou inativo.' })
    }

    res.json(mapUser(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar login.', details: error.message })
  }
})

router.post('/', async (req, res) => {
  const { name, badge, profile, letter } = getUserPayload(req.body || {})

  if (!name || !badge) {
    return res.status(400).json({ error: 'Informe nome e matrícula.' })
  }

  if (!VALID_PROFILES.includes(profile)) {
    return res.status(400).json({ error: 'Perfil inválido.' })
  }

  try {
    const result = await pool.query(`
      INSERT INTO usuarios (nome, cadastro, matricula, perfil, letra, ativo)
      VALUES ($1, $2, $2, $3, $4, TRUE)
      ON CONFLICT (cadastro) DO UPDATE SET
        nome = EXCLUDED.nome,
        matricula = EXCLUDED.matricula,
        perfil = EXCLUDED.perfil,
        letra = EXCLUDED.letra,
        ativo = TRUE
      RETURNING id, nome, COALESCE(matricula, cadastro) AS matricula, perfil, letra, ativo, criado_em;
    `, [name, badge, profile, letter])

    res.status(201).json(mapUser(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar usuário.', details: error.message })
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const result = await pool.query(`
      UPDATE usuarios
      SET ativo = $1
      WHERE id = $2
      RETURNING id, nome, COALESCE(matricula, cadastro) AS matricula, perfil, letra, ativo, criado_em;
    `, [Boolean(req.body.active ?? req.body.ativo), req.params.id])

    if (result.rowCount === 0) return res.status(404).json({ error: 'Usuário não encontrado.' })
    res.json(mapUser(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário.', details: error.message })
  }
})

export default router
