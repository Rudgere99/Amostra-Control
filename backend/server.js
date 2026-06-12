import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './db/pool.js'
import dashboardRoutes from './routes/dashboard.js'
import coletasRoutes from './routes/coletas.js'
import programacaoRoutes from './routes/programacao.js'
import setupRoutes from './routes/setup.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001
const allowedOrigin = process.env.FRONTEND_URL || '*'

app.use(cors({ origin: allowedOrigin }))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    name: 'AmostraControl API',
    status: 'online',
    routes: ['/health', '/api/setup/tables', '/api/setup/init-db', '/api/dashboard/summary', '/api/coletas', '/api/programacao']
  })
})

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')
    res.json({ status: 'ok', database: 'connected' })
  } catch (error) {
    res.status(500).json({ status: 'error', database: 'disconnected', details: error.message })
  }
})

app.use('/api/setup', setupRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/coletas', coletasRoutes)
app.use('/api/programacao', programacaoRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' })
})

app.listen(PORT, () => {
  console.log(`[AmostraControl API] Rodando na porta ${PORT}`)
})
