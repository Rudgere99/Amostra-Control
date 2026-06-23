CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  cadastro VARCHAR(50) NOT NULL UNIQUE,
  perfil VARCHAR(50) DEFAULT 'amostrador',
  letra VARCHAR(10),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS letra VARCHAR(10);

CREATE TABLE IF NOT EXISTS programacao_amostragem (
  id SERIAL PRIMARY KEY,
  data_programada DATE NOT NULL,
  hora_programada TIME NOT NULL,
  planta VARCHAR(50),
  turno VARCHAR(50),
  letra VARCHAR(10),
  status VARCHAR(50) DEFAULT 'pendente',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (data_programada, hora_programada, planta)
);

CREATE TABLE IF NOT EXISTS coletas_amostras (
  id SERIAL PRIMARY KEY,
  programacao_id INTEGER REFERENCES programacao_amostragem(id) ON DELETE SET NULL,
  data_coleta DATE NOT NULL,
  hora_programada TIME NOT NULL,
  hora_real TIME,
  planta VARCHAR(50),
  turno VARCHAR(50),
  letra VARCHAR(10),
  pilha_sf1 BOOLEAN DEFAULT FALSE,
  pilha_htt1 BOOLEAN DEFAULT FALSE,
  pilha_npo1 BOOLEAN DEFAULT FALSE,
  amostrador_nome VARCHAR(150),
  cadastro VARCHAR(50),
  contem_fino_agregado BOOLEAN DEFAULT FALSE,
  fino_agregado_npo BOOLEAN DEFAULT FALSE,
  fino_agregado_htt BOOLEAN DEFAULT FALSE,
  informado_ccco BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pendente',
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE coletas_amostras ADD COLUMN IF NOT EXISTS fino_agregado_npo BOOLEAN DEFAULT FALSE;
ALTER TABLE coletas_amostras ADD COLUMN IF NOT EXISTS fino_agregado_htt BOOLEAN DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS auditoria_coletas (
  id SERIAL PRIMARY KEY,
  coleta_id INTEGER REFERENCES coletas_amostras(id) ON DELETE SET NULL,
  cadastro VARCHAR(50),
  acao VARCHAR(50) NOT NULL,
  dados_anteriores JSONB,
  dados_novos JSONB,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_programacao_data ON programacao_amostragem(data_programada);
CREATE INDEX IF NOT EXISTS idx_programacao_data_planta ON programacao_amostragem(data_programada, planta);
CREATE INDEX IF NOT EXISTS idx_coletas_data ON coletas_amostras(data_coleta);
CREATE INDEX IF NOT EXISTS idx_coletas_data_planta_hora ON coletas_amostras(data_coleta, planta, hora_programada);
CREATE INDEX IF NOT EXISTS idx_coletas_status ON coletas_amostras(status);
CREATE INDEX IF NOT EXISTS idx_coletas_cadastro ON coletas_amostras(cadastro);
CREATE INDEX IF NOT EXISTS idx_coletas_fino_npo ON coletas_amostras(fino_agregado_npo);
CREATE INDEX IF NOT EXISTS idx_coletas_fino_htt ON coletas_amostras(fino_agregado_htt);
CREATE INDEX IF NOT EXISTS idx_usuarios_letra ON usuarios(letra);
CREATE INDEX IF NOT EXISTS idx_auditoria_coletas_coleta ON auditoria_coletas(coleta_id);
