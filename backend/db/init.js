import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import { pool } from './pool.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql')
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

  console.log('[AmostraControl API] Tabelas verificadas/criadas com sucesso.')
}

initDatabase()
  .catch((error) => {
    console.error('[AmostraControl API] Erro ao inicializar banco:', error)
    process.exit(1)
  })
  .finally(async () => {
    await pool.end()
  })
