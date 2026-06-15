import express from 'express'
import { pool } from '../db/pool.js'

const router = express.Router()

function mapUser(row) {
  return {
    id: row.id,
    name: row.nome,
    badge: row.cadastro,
    profile: row.perfil,
    letter: row.letra,
    active: row.ativo,
    createdAt: row.criado_em
  }
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id, nome, cadastro, perfil, letra, ativo, criado_em
      FROM usuarios
      ORDER BY nome ASC;
    `)

    res.json(result.rows.map(mapUser))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários.', details: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { name, nome, badge, cadastro, profile, perfil, letter, letra } = req.body

    const finalName = String(name || nome || '').trim()
    const finalBadge = String(badge || cadastro || '').trim()
    const finalProfile = String(profile || perfil || 'amostrador').trim()
    const finalLetter = String(letter || letra || '').trim().toUpperCase()

    if (!finalName || !finalBadge) {
      return res.status(400).json({ error: 'Nome e cadastro são obrigatórios.' })
    }

    if (finalLetter && !['A', 'B', 'C', 'D'].includes(finalLetter)) {
      return res.status(400).json({ error: 'Letra do turno deve ser A, B, C ou D.' })
    }

    const result = await pool.query(`
      INSERT INTO usuarios (nome, cadastro, perfil, letra, ativo)
      VALUES ($1, $2, $3, $4, TRUE)
      ON CONFLICT (cadastro)
      DO UPDATE SET
        nome = EXCLUDED.nome,
        perfil = EXCLUDED.perfil,
        letra = EXCLUDED.letra,
        ativo = TRUE
      RETURNING id, nome, cadastro, perfil, letra, ativo, criado_em;
    `, [finalName, finalBadge, finalProfile, finalLetter || null])

    res.status(201).json(mapUser(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao salvar usuário.', details: error.message })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { badge, cadastro, name, nome } = req.body
    const finalBadge = String(badge || cadastro || '').trim()
    const finalName = String(name || nome || '').trim()

    if (!finalBadge && !finalName) {
      return res.status(400).json({ error: 'Informe o cadastro ou o nome do usuário.' })
    }

    const params = []
    const where = []

    if (finalBadge) {
      params.push(finalBadge)
      where.push(`cadastro = $${params.length}`)
    }

    if (finalName) {
      params.push(finalName)
      where.push(`LOWER(nome) = LOWER($${params.length})`)
    }

    const result = await pool.query(`
      SELECT id, nome, cadastro, perfil, letra, ativo, criado_em
      FROM usuarios
      WHERE ${where.join(' OR ')}
      LIMIT 1;
    `, params)

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    const user = mapUser(result.rows[0])

    if (!user.active) {
      return res.status(403).json({ error: 'Usuário inativo.' })
    }

    res.json({ message: 'Login realizado com sucesso.', user })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao realizar login.', details: error.message })
  }
})

router.patch('/:id/status', async (req, res) => {
  try {
    const active = req.body.active ?? req.body.ativo

    if (typeof active !== 'boolean') {
      return res.status(400).json({ error: 'Informe active como true ou false.' })
    }

    const result = await pool.query(`
      UPDATE usuarios
      SET ativo = $1
      WHERE id = $2
      RETURNING id, nome, cadastro, perfil, letra, ativo, criado_em;
    `, [active, req.params.id])

    if (!result.rowCount) {
      return res.status(404).json({ error: 'Usuário não encontrado.' })
    }

    res.json(mapUser(result.rows[0]))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status do usuário.', details: error.message })
  }
})

export default router
