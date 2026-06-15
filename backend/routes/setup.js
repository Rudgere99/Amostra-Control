import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../db/pool.js'

const router = express.Router()
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

router.post('/init-db', async (req, res) => {
  try {
    const token = req.headers['x-setup-token']

    if (!process.env.SETUP_TOKEN) {
      return res.status(400).json({ error: 'SETUP_TOKEN não configurado no Railway.' })
    }

    if (token !== process.env.SETUP_TOKEN) {
      return res.status(401).json({ error: 'Token inválido.' })
    }

    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql')
    const schema = fs.readFileSync(schemaPath, 'utf8')

    await pool.query(schema)

    await pool.query(`
      INSERT INTO usuarios (nome, cadastro, matricula, perfil, letra)
      VALUES
        ('Amostrador Campo', '1023', '1023', 'Amostrador', 'A'),
        ('Controlador CCO', '2001', '2001', 'Controle', 'C'),
        ('Administrador', '0001', '0001', 'Controle', 'D')
      ON CONFLICT (cadastro) DO NOTHING;
    `)

    res.json({ message: 'Tabelas criadas/verificadas com sucesso.' })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar tabelas.', details: error.message })
  }
})

router.get('/tables', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `)

    res.json(result.rows.map((row) => row.table_name))
  } catch (error) {
    res.status(500).json({ error: 'Erro ao consultar tabelas.', details: error.message })
  }
})

export default router
