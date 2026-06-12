const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const databaseFile = process.env.DATABASE_FILE || './database.sqlite';
const dbPath = path.resolve(__dirname, databaseFile);
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      cadastro TEXT NOT NULL UNIQUE,
      funcao TEXT,
      perfil TEXT DEFAULT 'amostrador',
      ativo INTEGER DEFAULT 1,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS programacao_amostragem (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data_programada TEXT NOT NULL,
      hora_programada TEXT NOT NULL,
      planta TEXT DEFAULT 'Planta 01',
      turno TEXT,
      letra TEXT,
      status TEXT DEFAULT 'Pendente',
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(data_programada, hora_programada, planta)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS coletas_amostras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      programacao_id INTEGER NOT NULL,
      usuario_id INTEGER NOT NULL,
      data_coleta TEXT NOT NULL,
      hora_programada TEXT NOT NULL,
      hora_real TEXT NOT NULL,
      pilha_sf1 INTEGER DEFAULT 0,
      pilha_htt1 INTEGER DEFAULT 0,
      pilha_npo1 INTEGER DEFAULT 0,
      contem_fino_agregado INTEGER,
      informado_ccco INTEGER,
      status TEXT,
      justificativa TEXT,
      observacoes TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(programacao_id) REFERENCES programacao_amostragem(id),
      FOREIGN KEY(usuario_id) REFERENCES usuarios(id)
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS auditoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entidade TEXT NOT NULL,
      entidade_id INTEGER,
      acao TEXT NOT NULL,
      detalhes TEXT,
      criado_em TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

module.exports = { db, run, get, all, initDb };
