# MineTrace Mobile — Expo Go

Aplicativo móvel do MineTrace criado com React Native e Expo SDK 54. A versão móvel reaproveita a mesma API Node.js/Express e o mesmo PostgreSQL do sistema web.

## Funcionalidades implementadas no MVP

- Login por matrícula ou nome.
- Declaração obrigatória de ciência.
- Sessão persistida no dispositivo.
- Dashboard com faixas realizadas, pendentes e ocorrências.
- Consulta das 24 faixas horárias por data e planta.
- Registro e edição de coleta.
- Campos SF1, HTT1, NPO1, Fino NPO, Fino HTT e CCCO.
- Status coletado, parcial e não realizado.
- Hora real e observações.
- Bloqueios de data e horário equivalentes ao sistema web.
- Comunicação direta com a API hospedada no Railway.

## 1. Pré-requisitos no computador

Instale:

- Node.js LTS.
- Git.
- Visual Studio Code.

No celular Android ou iPhone, instale o aplicativo **Expo Go** pela loja oficial.

## 2. Baixar a branch móvel

```bash
git clone -b mobile/minetrace-app https://github.com/Rudgere99/Amostra-Control.git
cd Amostra-Control/mobile
```

Caso o repositório já esteja baixado:

```bash
git fetch origin
git switch mobile/minetrace-app
cd mobile
```

## 3. Configurar a API do Railway

Crie o arquivo `.env` dentro da pasta `mobile`:

```bash
copy .env.example .env
```

No PowerShell, também pode usar:

```powershell
Copy-Item .env.example .env
```

Edite o arquivo e informe a URL pública HTTPS da API:

```env
EXPO_PUBLIC_API_URL=https://sua-api-no-railway.up.railway.app
```

Não use `localhost` para testar no celular. O celular precisa acessar uma URL pública, como a URL do Railway.

## 4. Instalar as dependências

```bash
npm install
npx expo install --fix
```

Verifique o projeto:

```bash
npm run doctor
```

## 5. Iniciar no Expo Go

```bash
npx expo start
```

Um QR Code será exibido no terminal e no navegador.

### Android

1. Abra o Expo Go.
2. Toque em **Scan QR code**.
3. Leia o QR Code exibido pelo Expo.

### iPhone

1. Abra a câmera do iPhone.
2. Leia o QR Code.
3. Confirme a abertura no Expo Go.

O computador e o celular devem estar na mesma rede Wi-Fi.

## 6. Quando o QR Code não conectar

Inicie em modo túnel:

```bash
npx expo start --tunnel
```

O túnel costuma resolver bloqueios de rede corporativa, roteador ou firewall.

Para limpar o cache do Expo:

```bash
npx expo start --clear
```

## 7. Teste mínimo

1. Abra o aplicativo no Expo Go.
2. Entre com uma matrícula ou nome cadastrado.
3. Confirme a declaração de ciência.
4. Abra a aba **Coletas**.
5. Selecione Planta 01 ou Planta 02.
6. Abra uma faixa horária já liberada.
7. Marque as amostras, informe status, hora real e observação.
8. Toque em **Salvar coleta**.
9. Confirme no sistema web se o registro apareceu no banco.

## 8. Atualizações durante o desenvolvimento

Depois de editar `App.js` ou arquivos da pasta `src`, salve o arquivo. O Expo Go recarrega o aplicativo automaticamente.

Caso uma variável do `.env` seja alterada, faça uma recarga completa no Expo Go ou reinicie:

```bash
npx expo start --clear
```

## 9. Estrutura móvel

```text
mobile/
├── App.js
├── app.json
├── package.json
├── .env.example
└── src/
    └── services/
        └── api.js
```

## Próxima etapa

Após validar o MVP no Expo Go, a evolução recomendada é adicionar câmera para foto da coleta, funcionamento offline, sincronização automática e geração de APK com EAS Build.
