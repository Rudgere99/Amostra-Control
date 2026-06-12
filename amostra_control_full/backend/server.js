require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb, run, get, all } = require('./db');

const app = express();
const PORT = process.env.PORT || 3001;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN }));
app.use(express.json());

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function isLate(horaProgramada, horaReal, toleranciaMinutos = 15) {
  const [ph, pm] = horaProgramada.split(':').map(Number);
  const [rh, rm] = horaReal.split(':').map(Number);
  const planned = ph * 60 + pm;
  const real = rh * 60 + rm;
  return real - planned > toleranciaMinutos;
}

function calculateStatus({ sf1, htt1, npo1, hora_programada, hora_real }) {
  const allCollected = sf1 && htt1 && npo1;
  const someCollected = sf1 || htt1 || npo1;

  if (allCollected) {
    return isLate(hora_programada, hora_real) ? 'Coletado com atraso' : 'Coletado no horário';
  }

  if (someCollected) return 'Parcial';
  return 'Não realizado';
}

async function ensureDefaultUser() {
  const existing = await get('SELECT id FROM usuarios WHERE cadastro = ?', ['0000']);
  if (!existing) {
    await run(
      'INSERT INTO usuarios (nome, cadastro, funcao, perfil) VALUES (?, ?, ?, ?)',
      ['Usuário Teste', '0000', 'Amostrador', 'admin']
    );
  }
}

async function generateDailySchedule(date = todayIso(), planta = 'Planta 01') {
  const horarios = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

  for (const hora of horarios) {
    await run(
      `INSERT OR IGNORE INTO programacao_amostragem
       (data_programada, hora_programada, planta, turno, letra, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [date, hora, planta, hora < '19:00' ? '1º Turno' : '2º Turno', '', 'Pendente']
    );
  }
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'AmostraControl API' });
});

app.post('/api/seed', async (req, res) => {
  try {
    const date = req.body.date || todayIso();
    const planta = req.body.planta || 'Planta 01';
    await generateDailySchedule(date, planta);
    res.json({ ok: true, message: 'Programação gerada', date, planta });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/usuarios', async (req, res) => {
  try {
    const rows = await all('SELECT * FROM usuarios ORDER BY nome');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/usuarios', async (req, res) => {
  try {
    const { nome, cadastro, funcao, perfil } = req.body;
    if (!nome || !cadastro) return res.status(400).json({ error: 'Nome e cadastro são obrigatórios.' });

    const result = await run(
      'INSERT INTO usuarios (nome, cadastro, funcao, perfil) VALUES (?, ?, ?, ?)',
      [nome, cadastro, funcao || 'Amostrador', perfil || 'amostrador']
    );

    const usuario = await get('SELECT * FROM usuarios WHERE id = ?', [result.id]);
    res.status(201).json(usuario);
  } catch (error) {
    if (String(error.message).includes('UNIQUE')) {
      return res.status(409).json({ error: 'Cadastro já existe.' });
    }
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/programacao', async (req, res) => {
  try {
    const date = req.query.date || todayIso();
    const planta = req.query.planta || 'Planta 01';
    await generateDailySchedule(date, planta);

    const rows = await all(`
      SELECT
        p.*,
        c.id AS coleta_id,
        c.hora_real,
        c.pilha_sf1,
        c.pilha_htt1,
        c.pilha_npo1,
        c.contem_fino_agregado,
        c.informado_ccco,
        c.observacoes,
        c.justificativa,
        c.status AS coleta_status,
        u.nome AS amostrador,
        u.cadastro AS cadastro
      FROM programacao_amostragem p
      LEFT JOIN coletas_amostras c ON c.programacao_id = p.id
      LEFT JOIN usuarios u ON u.id = c.usuario_id
      WHERE p.data_programada = ? AND p.planta = ?
      ORDER BY p.hora_programada ASC
    `, [date, planta]);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const date = req.query.date || todayIso();
    const planta = req.query.planta || 'Planta 01';
    await generateDailySchedule(date, planta);

    const rows = await all(`
      SELECT p.id, p.status, c.status AS coleta_status
      FROM programacao_amostragem p
      LEFT JOIN coletas_amostras c ON c.programacao_id = p.id
      WHERE p.data_programada = ? AND p.planta = ?
    `, [date, planta]);

    const total = rows.length;
    const realizadas = rows.filter(r => ['Coletado no horário', 'Coletado com atraso'].includes(r.coleta_status)).length;
    const atrasadas = rows.filter(r => r.coleta_status === 'Coletado com atraso' || r.status === 'Atrasado').length;
    const parciais = rows.filter(r => r.coleta_status === 'Parcial').length;
    const pendentes = total - realizadas - parciais;
    const aderencia = total ? Math.round((realizadas / total) * 100) : 0;

    res.json({ total, realizadas, pendentes, atrasadas, parciais, aderencia });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coletas', async (req, res) => {
  try {
    const {
      programacao_id,
      nome,
      cadastro,
      sf1,
      htt1,
      npo1,
      contem_fino_agregado,
      informado_ccco,
      observacoes,
      justificativa
    } = req.body;

    if (!programacao_id) return res.status(400).json({ error: 'programacao_id é obrigatório.' });
    if (!nome || !cadastro) return res.status(400).json({ error: 'Nome e cadastro são obrigatórios.' });

    const programacao = await get('SELECT * FROM programacao_amostragem WHERE id = ?', [programacao_id]);
    if (!programacao) return res.status(404).json({ error: 'Programação não encontrada.' });

    let usuario = await get('SELECT * FROM usuarios WHERE cadastro = ?', [cadastro]);
    if (!usuario) {
      const created = await run(
        'INSERT INTO usuarios (nome, cadastro, funcao, perfil) VALUES (?, ?, ?, ?)',
        [nome, cadastro, 'Amostrador', 'amostrador']
      );
      usuario = await get('SELECT * FROM usuarios WHERE id = ?', [created.id]);
    }

    const hora_real = nowTime();
    const status = calculateStatus({
      sf1: !!sf1,
      htt1: !!htt1,
      npo1: !!npo1,
      hora_programada: programacao.hora_programada,
      hora_real
    });

    if ((status === 'Parcial' || status === 'Não realizado') && !observacoes && !justificativa) {
      return res.status(400).json({ error: 'Observação ou justificativa é obrigatória para coleta parcial/não realizada.' });
    }

    const existing = await get('SELECT id FROM coletas_amostras WHERE programacao_id = ?', [programacao_id]);
    if (existing) return res.status(409).json({ error: 'Esta coleta já foi registrada.' });

    const result = await run(`
      INSERT INTO coletas_amostras (
        programacao_id, usuario_id, data_coleta, hora_programada, hora_real,
        pilha_sf1, pilha_htt1, pilha_npo1, contem_fino_agregado, informado_ccco,
        status, justificativa, observacoes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      programacao_id,
      usuario.id,
      programacao.data_programada,
      programacao.hora_programada,
      hora_real,
      sf1 ? 1 : 0,
      htt1 ? 1 : 0,
      npo1 ? 1 : 0,
      contem_fino_agregado ? 1 : 0,
      informado_ccco ? 1 : 0,
      status,
      justificativa || '',
      observacoes || ''
    ]);

    await run('UPDATE programacao_amostragem SET status = ? WHERE id = ?', [status, programacao_id]);
    await run('INSERT INTO auditoria (entidade, entidade_id, acao, detalhes) VALUES (?, ?, ?, ?)', [
      'coletas_amostras', result.id, 'CRIAR', JSON.stringify({ cadastro, status })
    ]);

    const coleta = await get('SELECT * FROM coletas_amostras WHERE id = ?', [result.id]);
    res.status(201).json(coleta);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/historico', async (req, res) => {
  try {
    const dateStart = req.query.dateStart || todayIso();
    const dateEnd = req.query.dateEnd || todayIso();
    const status = req.query.status || '';

    const params = [dateStart, dateEnd];
    let statusFilter = '';
    if (status) {
      statusFilter = ' AND c.status = ?';
      params.push(status);
    }

    const rows = await all(`
      SELECT c.*, u.nome AS amostrador, u.cadastro, p.planta, p.turno, p.letra
      FROM coletas_amostras c
      JOIN usuarios u ON u.id = c.usuario_id
      JOIN programacao_amostragem p ON p.id = c.programacao_id
      WHERE c.data_coleta BETWEEN ? AND ? ${statusFilter}
      ORDER BY c.data_coleta DESC, c.hora_programada DESC
    `, params);

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/programacao/:id/atrasado', async (req, res) => {
  try {
    const id = req.params.id;
    await run('UPDATE programacao_amostragem SET status = ? WHERE id = ? AND status = ?', ['Atrasado', id, 'Pendente']);
    const row = await get('SELECT * FROM programacao_amostragem WHERE id = ?', [id]);
    res.json(row);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

initDb()
  .then(ensureDefaultUser)
  .then(() => generateDailySchedule(todayIso(), 'Planta 01'))
  .then(() => {
    app.listen(PORT, () => {
      console.log(`AmostraControl API rodando na porta ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Erro ao iniciar API:', error);
    process.exit(1);
  });
