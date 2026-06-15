import express from 'express'
import { pool } from '../db/pool.js'

const router = express.Router()

function mapCadastro(row) {
  return {
    id: row.id,
    name: row.nome,
    badge: row.cadastro,
    profile: row.perfil,
    active: row.ativo,
    createdAt: row.criado_em
  }
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT *
      FROM usuarios
      ORDER BY ativo DESC, nome ASC, id ASC;
    `)

    res.json(result.rows.map(mapCadastro))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar cadastros.', details: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, nome, badge, cadastro, profile = 'amostrador', perfil } = req.body
    const resolvedName = name || nome
    const resolvedBadge = badge || cadastro

    if (!resolvedName || !resolvedBadge) {
      return res.status(400).json({ error: 'Informe nome e cadastro.' })
    }

    const result = await pool.query(`
      INSERT INTO usuarios (nome, cadastro, perfil, ativo)
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT (cadastro)
      DO UPDATE SET nome = EXCLUDED.nome, perfil = EXCLUDED.perfil, ativo = TRUE
      RETURNING *;
    `, [resolvedName, resolvedBadge, perfil || profile])

    res.status(201).json(mapCadastro(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar cadastro.', details: error.message })
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const { active, ativo } = req.body
    const result = await pool.query(`
      UPDATE usuarios
      SET ativo = $1
      WHERE id = $2
      RETURNING *;
    `, [active ?? ativo, req.params.id])

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Cadastro não encontrado.' })
    }

    res.json(mapCadastro(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar cadastro.', details: error.message })
  }
})

export default router
