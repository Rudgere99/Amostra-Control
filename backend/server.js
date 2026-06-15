import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { pool } from './db/pool.js'
import dashboardRoutes from './routes/dashboard.js'
import coletasRoutes from './routes/coletas.js'
import programacaoRoutes from './routes/programacao.js'
import setupRoutes from './routes/setup.js'
import usuariosRoutes from './routes/usuarios.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

function normalizeOrigin(origin) {
  return origin ? origin.trim().replace(/\/+$/, '') : ''
}

function getAllowedOrigins() {
  return [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
    .filter(Boolean)
    .flatMap((value) => value.split(','))
    .map(normalizeOrigin)
    .filter(Boolean)
}

const allowedOrigins = getAllowedOrigins()
const allowAnyOrigin = allowedOrigins.length === 0 || allowedOrigins.includes('*')

function isAllowedVercelPreview(origin) {
  if (process.env.ALLOW_VERCEL_PREVIEWS === 'false') return false

  try {
    const { hostname } = new URL(origin)
    return hostname === 'vercel.app' || hostname.endsWith('.vercel.app')
  } catch {
    return false
  }
}

function isAllowedLocalhost(origin) {
  try {
    const { hostname } = new URL(origin)
    return ['localhost', '127.0.0.1'].includes(hostname)
  } catch {
    return false
  }
}

app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true)
      return
    }

    const normalizedOrigin = normalizeOrigin(origin)
    const allowed = allowAnyOrigin || allowedOrigins.includes(normalizedOrigin) || isAllowedVercelPreview(normalizedOrigin) || isAllowedLocalhost(normalizedOrigin)
    callback(null, allowed ? normalizedOrigin : false)
  }
}))
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    name: 'AmostraControl API',
    status: 'online',
    routes: [
      '/health',
      '/api/setup/tables',
      '/api/setup/init-db',
      '/api/dashboard/summary',
      '/api/coletas',
      '/api/programacao',
      '/api/usuarios',
      '/api/usuarios/login'
    ]
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
app.use('/api/usuarios', usuariosRoutes)

app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' })
})

app.listen(PORT, () => {
  console.log(`[AmostraControl API] Rodando na porta ${PORT}`)
})
