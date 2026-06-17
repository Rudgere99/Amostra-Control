# Amostra Control

Sistema web para controle operacional de coletas horarias de amostras. O projeto usa um front-end React + Vite no padrao visual MonPlant e uma API Node.js + Express conectada a PostgreSQL para persistir programacao, lancamentos e usuarios.

## Funcionalidades atuais

- Login de usuario com nome, cadastro, perfil e letra de trabalho.
- Dashboard operacional com totais programados, realizados, pendentes, atrasados, parciais, nao realizados, aderencia e registros com fino agregado.
- Tela de coletas com grade fixa de 24 faixas horarias, de `00-01` ate `23-00`, por data e planta.
- Lancamento e edicao de coleta com amostrador, cadastro, letra, hora real, pilhas SF1/HTT1/NPO1, fino agregado NPO/HTT, CCCO, status e observacoes.
- Bloqueio de lancamento por data: nao permite data futura, permite o dia atual e permite o dia anterior somente ate `01:00` da manha.
- Bloqueio de lancamento por faixa horaria no front-end: cada faixa so libera no horario exato de fechamento. Exemplo: `13-14` refere-se ao fechamento das `14:00`, entao o botao libera a partir de `14:00`.
- Historico, contingencia e relatorios com filtros por data/planta e exportacao CSV.
- Geracao de programacao diaria pela API.
- Fallback para dados locais quando `VITE_API_URL` nao esta configurada.

## Tecnologias

### Front-end

- React
- Vite
- CSS proprio
- Deploy previsto na Vercel

### Back-end

- Node.js
- Express
- PostgreSQL via `pg`
- CORS configuravel
- Deploy previsto no Railway

## Estrutura do projeto

```txt
.
├── backend/
│   ├── db/
│   │   ├── init.js
│   │   ├── pool.js
│   │   └── schema.sql
│   ├── routes/
│   │   ├── coletas.js
│   │   ├── dashboard.js
│   │   ├── programacao.js
│   │   ├── setup.js
│   │   └── usuarios.js
│   ├── utils/
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── public/
├── src/
│   ├── components/
│   ├── data/
│   ├── layouts/
│   ├── pages/
│   ├── services/
│   ├── utils/
│   ├── main.jsx
│   └── styles.css
├── index.html
├── package.json
└── vercel.json
```

## Rodar localmente

### 1. Front-end

```bash
npm install
npm run dev
```

Por padrao, o Vite sobe a aplicacao em modo desenvolvimento. Para conectar na API, crie um arquivo `.env` na raiz do projeto com:

```txt
VITE_API_URL=http://localhost:3001
```

Sem essa variavel, o front-end continua abrindo com dados locais de exemplo.

### 2. Back-end

```bash
cd backend
npm install
cp .env.example .env
npm run db:init
npm run dev
```

Variaveis principais do back-end:

```txt
DATABASE_URL=URL do PostgreSQL
FRONTEND_URL=URL principal do front-end
FRONTEND_URLS=URLs extras liberadas no CORS, separadas por virgula
ALLOW_VERCEL_PREVIEWS=true
PORT=3001
NODE_ENV=production
```

## Scripts

### Front-end

```bash
npm run dev       # inicia o Vite
npm run build     # gera build de producao em dist/
npm run preview   # visualiza o build localmente
```

### Back-end

```bash
npm run dev       # inicia a API com node --watch
npm start         # inicia a API em producao
npm run db:init   # cria/atualiza as tabelas no PostgreSQL
```

## Rotas principais da API

```txt
GET    /health
GET    /api/dashboard/summary
GET    /api/coletas
GET    /api/coletas/:id
POST   /api/coletas
PUT    /api/coletas/:id
GET    /api/programacao
POST   /api/programacao/generate-day
GET    /api/usuarios
POST   /api/usuarios
POST   /api/usuarios/login
PATCH  /api/usuarios/:id/status
```

## Deploy

### Vercel front-end

No painel da Vercel, importe o repositorio e use:

```txt
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Configure a variavel:

```txt
VITE_API_URL=https://sua-api-no-railway.up.railway.app
```

### Railway back-end

Crie um projeto no Railway com PostgreSQL e um servico apontando para este repositorio. No servico da API, configure o Root Directory como:

```txt
backend
```

Comando de start:

```bash
npm start
```

Depois de configurar `DATABASE_URL`, rode quando necessario:

```bash
npm run db:init
```

## Observacoes operacionais

- A programacao trabalha com 24 faixas fixas por dia e planta.
- A faixa `03-04` representa a coleta referente ao fechamento das `04:00`.
- O bloqueio por faixa e aplicado no front-end, desabilitando o lancamento ate o horario exato de fechamento da faixa.
- Os status e indicadores do dashboard sao calculados a partir dos lancamentos salvos quando a API esta configurada.
- O controle de fino agregado separa registros de NPO e HTT para facilitar relatorios e rastreabilidade.
