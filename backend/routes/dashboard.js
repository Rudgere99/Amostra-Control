import express from 'express'
import { pool } from '../db/pool.js'

const router = express.Router()

router.get('/summary', async (req, res) => {
  try {
    const { date } = req.query
    const selectedDate = date || new Date().toISOString().slice(0, 10)

    const result = await pool.query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'coletado')::int AS done,
        COUNT(*) FILTER (WHERE status = 'pendente')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'atrasado')::int AS late,
        COUNT(*) FILTER (WHERE status = 'parcial')::int AS partial
      FROM coletas_amostras
      WHERE data_coleta = $1;
    `, [selectedDate])

    const stats = result.rows[0]
    const adherence = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0

    res.json({ ...stats, adherence })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar resumo do dashboard.', details: error.message })
  }
})

export default router
