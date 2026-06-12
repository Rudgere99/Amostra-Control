# AmostraControl API

Back-end em Node.js + Express preparado para Railway com PostgreSQL.

## Rodar localmente

```bash
cd backend
npm install
cp .env.example .env
npm run db:init
npm run dev
```

## Variáveis necessárias

```txt
DATABASE_URL=URL do PostgreSQL do Railway
FRONTEND_URL=URL principal do front-end na Vercel
FRONTEND_URLS=URLs extras liberadas no CORS, separadas por vírgula
ALLOW_VERCEL_PREVIEWS=true
PORT=3001
NODE_ENV=production
```

## Deploy no Railway

1. Crie um projeto no Railway.
2. Adicione um serviço PostgreSQL.
3. Crie outro serviço usando o repositório GitHub `Rudgere99/Amostra-Control`.
4. Configure o Root Directory como:

```txt
backend
```

5. Nas variáveis do serviço da API, configure:

```txt
DATABASE_URL=${{Postgres.DATABASE_URL}}
FRONTEND_URL=https://seu-front-na-vercel.vercel.app
# opcional: inclua URLs fixas adicionais, separadas por vírgula
FRONTEND_URLS=https://amostra-control.vercel.app,https://outro-preview.vercel.app
# por padrão, previews *.vercel.app são liberados; use false para bloquear
ALLOW_VERCEL_PREVIEWS=true
NODE_ENV=production
```

6. O comando de start será:

```bash
npm start
```

7. Para criar as tabelas, rode no Railway Shell:

```bash
npm run db:init
```

## Rotas principais

```txt
GET  /health
GET  /api/dashboard/summary
GET  /api/coletas
POST /api/coletas
PUT  /api/coletas/:id
GET  /api/usuarios
POST /api/usuarios
PUT  /api/usuarios/:id
GET  /api/programacao
POST /api/programacao/generate-day
```

## Gerar programação do dia

Exemplo de corpo para `POST /api/programacao/generate-day` (se `startHour`/`endHour` forem omitidos, a API gera de 00:00 até 23:00):

```json
{
  "date": "2026-06-12",
  "plant": "Planta 01",
  "shift": "1º Turno",
  "letter": "A",
  "startHour": 7,
  "endHour": 18
}
```
