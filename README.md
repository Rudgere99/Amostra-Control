# AmostraControl

Aplicativo React + Vite para controle de recolhimento de amostras horárias, no padrão visual MonPlant.

## Estrutura

```txt
src/
  components/
  data/
  layouts/
  pages/
  utils/
  main.jsx
  styles.css
```

## Rodar localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy Vercel

No painel da Vercel, importe o repositório e use:

- Framework: Vite
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

Este projeto é front-end. Os dados são simulados no estado do React e podem ser conectados a API/banco depois.
