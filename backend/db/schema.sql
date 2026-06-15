CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(150) NOT NULL,
  cadastro VARCHAR(50) NOT NULL UNIQUE,
  matricula VARCHAR(50),
  perfil VARCHAR(50) DEFAULT 'Amostrador',
  letra VARCHAR(10),
  ativo BOOLEAN DEFAULT TRUE,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
  informado_ccco BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'pendente',
  observacoes TEXT,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_programacao_data ON programacao_amostragem(data_programada);
CREATE INDEX IF NOT EXISTS idx_coletas_data ON coletas_amostras(data_coleta);
CREATE INDEX IF NOT EXISTS idx_coletas_status ON coletas_amostras(status);
CREATE INDEX IF NOT EXISTS idx_coletas_cadastro ON coletas_amostras(cadastro);

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS matricula VARCHAR(50);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS letra VARCHAR(10);
UPDATE usuarios SET matricula = cadastro WHERE matricula IS NULL;
