# AmostraControl - Front-end + Back-end

Sistema web para controle de recolhimento de amostras por horário, com alerta, tabela diária, registro de amostrador, cadastro, pilhas SF1/HTT1/NPO1, fino agregado e comunicação ao CCCO.

## Estrutura

```txt
amostra_control_full/
├── backend/
│   ├── server.js
│   ├── db.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── package.json
    ├── .env.example
    └── src/
        ├── main.jsx
        └── styles.css
```

## Requisitos

- Node.js 18 ou superior
- npm

## Como rodar o back-end

Entre na pasta do back-end:

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

No Linux/Mac, use:

```bash
cp .env.example .env
```

A API vai rodar em:

```txt
http://localhost:3001/api
```

## Como rodar o front-end

Abra outro terminal:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

No Linux/Mac:

```bash
cp .env.example .env
```

O site vai abrir em:

```txt
http://localhost:5173
```

## Banco de dados

O projeto usa SQLite para facilitar o teste inicial. O arquivo será criado automaticamente em:

```txt
backend/database.sqlite
```

Tabelas criadas automaticamente:

- usuarios
- programacao_amostragem
- coletas_amostras
- auditoria

## Usuário de teste

O sistema cria automaticamente um usuário inicial:

```txt
Nome: Usuário Teste
Cadastro: 0000
Perfil: admin
```

Também é possível registrar uma coleta com qualquer nome e cadastro. Se o cadastro não existir, o back-end cria automaticamente o usuário como amostrador.

## Rotas principais da API

### Verificar API

```http
GET /api/health
```

### Gerar programação diária

```http
POST /api/seed
```

Body:

```json
{
  "date": "2026-06-11",
  "planta": "Planta 01"
}
```

### Listar programação do dia

```http
GET /api/programacao?date=2026-06-11&planta=Planta%2001
```

### Dashboard

```http
GET /api/dashboard?date=2026-06-11&planta=Planta%2001
```

### Registrar coleta

```http
POST /api/coletas
```

Body:

```json
{
  "programacao_id": 1,
  "nome": "João",
  "cadastro": "12345",
  "sf1": true,
  "htt1": true,
  "npo1": true,
  "contem_fino_agregado": false,
  "informado_ccco": true,
  "observacoes": "Coleta realizada sem anormalidade"
}
```

### Histórico

```http
GET /api/historico?dateStart=2026-06-01&dateEnd=2026-06-11
```

## Observações importantes

- O alerta de hora fechada funciona no front-end quando o sistema está aberto no navegador.
- Para alerta real via celular mesmo com navegador fechado, será necessário evoluir para PWA com push notification.
- Para produção, recomenda-se trocar SQLite por PostgreSQL ou SQL Server.
- O projeto ainda está sem login/autenticação real. Os perfis foram previstos, mas o login pode ser adicionado na próxima etapa.

## Próximas melhorias sugeridas

1. Login por cadastro/matrícula.
2. Perfis: Administrador, Amostrador e CCO.
3. Tela de histórico completa.
4. Exportação PDF além de CSV.
5. Notificação PWA para celular.
6. Painel do CCCO em tempo real.
7. Parametrização dos horários e pilhas por planta.
