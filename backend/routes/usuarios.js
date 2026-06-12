import express from 'express'
import { pool } from '../db/pool.js'
import { mapUsuario } from '../utils/mapRows.js'

const router = express.Router()

function parseAtivo(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return ['ativo', 'true', 'sim', '1', 'yes'].includes(value.toLowerCase())
  return true
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM usuarios
      ORDER BY ativo DESC, nome ASC;
    `)

    res.json(result.rows.map(mapUsuario))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários.', details: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, nome, badge, cadastro, profile, perfil, active, ativo } = req.body
    const userName = (name || nome || '').trim()
    const userBadge = (badge || cadastro || '').trim()
    const userProfile = profile || perfil || 'amostrador'
    const isActive = parseAtivo(active ?? ativo)

    if (!userName || !userBadge) {
      return res.status(400).json({ error: 'Informe nome e cadastro do usuário.' })
    }

    const result = await pool.query(`
      INSERT INTO usuarios (nome, cadastro, perfil, ativo)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (cadastro)
      DO UPDATE SET nome = EXCLUDED.nome, perfil = EXCLUDED.perfil, ativo = EXCLUDED.ativo
      RETURNING *;
    `, [userName, userBadge, userProfile, isActive])

    res.status(201).json(mapUsuario(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar usuário.', details: error.message })
  }
})

router.put('/:id', async (req, res) => {
  try {
    const { name, nome, badge, cadastro, profile, perfil, active, ativo } = req.body
    const userName = (name || nome || '').trim()
    const userBadge = (badge || cadastro || '').trim()
    const userProfile = profile || perfil || 'amostrador'
    const isActive = parseAtivo(active ?? ativo)

    if (!userName || !userBadge) {
      return res.status(400).json({ error: 'Informe nome e cadastro do usuário.' })
    }

    const result = await pool.query(`
      UPDATE usuarios
      SET nome = $1, cadastro = $2, perfil = $3, ativo = $4
      WHERE id = $5
      RETURNING *;
    `, [userName, userBadge, userProfile, isActive, req.params.id])

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    res.json(mapUsuario(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário.', details: error.message })
  }
})

export default router
