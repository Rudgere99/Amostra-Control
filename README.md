# Amostra Control

Sistema web para controle operacional de coletas horarias de amostras. O projeto usa um front-end React + Vite no padrao visual MonPlant e uma API Node.js + Express conectada a PostgreSQL para persistir programacao, lancamentos e usuarios.

## Funcionalidades atuais

- Login de usuario com nome, cadastro, perfil e letra de trabalho.
- Dashboard operacional com totais programados, realizados, pendentes, atrasados, parciais, nao realizados, aderencia e registros com fino agregado.
- Tela de coletas com grade fixa de 24 faixas horarias, de `00-01` ate `23-00`, por data e planta.
- Lancamento e edicao de coleta com amostrador, cadastro, letra, hora real, pilhas SF1/HTT1/NPO1, fino agregado NPO/HTT, CCCO, status e observacoes.
- Bloqueio de lancamento por data: nao permite data futura, permite o dia atual e permite o dia anterior somente ate `01:00` da manha.
- Bloqueio de lancamento por faixa horaria no front-end: cada faixa so libera no horario exato de fechamento.
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
│   ├── utils/
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

### Front-end

```bash
npm install
npm run dev
```

Para conectar na API, crie um arquivo de variaveis na raiz com:

```txt
VITE_API_URL=http://localhost:3001
```

### Back-end

```bash
cd backend
npm install
npm run db:init
npm run dev
```

## Scripts

### Front-end

```bash
npm run dev
npm run build
npm run preview
```

### Back-end

```bash
npm run dev
npm start
npm run db:init
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

No painel da Vercel, use:

```txt
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install --no-audit --no-fund
```

Configure a variavel:

```txt
VITE_API_URL=https://sua-api-no-railway.up.railway.app
```

### Railway back-end

No servico da API, configure o Root Directory como:

```txt
backend
```

Comando de start:

```bash
npm start
```
