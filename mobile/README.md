# MineTrace Mobile — Expo Go

Aplicativo móvel do MineTrace criado com React Native e Expo SDK 54. A versão móvel reutiliza a mesma API Node.js/Express e o mesmo PostgreSQL do sistema web.

## Funcionalidades do MVP

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

## 1. Pré-requisitos

No computador:

- Node.js LTS.
- Git.
- Visual Studio Code.

No celular Android ou iPhone, instale o **Expo Go** pela loja oficial.

## 2. Baixar a branch móvel

```bash
git clone -b mobile/minetrace-app https://github.com/Rudgere99/Amostra-Control.git MineTraceMobile
cd MineTraceMobile/mobile
```

Caso o repositório já esteja baixado:

```bash
git fetch origin
git switch mobile/minetrace-app
cd mobile
```

## 3. Configurar a API do Railway

Crie o arquivo `.env` dentro da pasta `mobile`:

```powershell
Copy-Item .env.example .env
notepad .env
```

O arquivo copiado vem propositalmente sem URL. Preencha com o domínio público HTTPS real do serviço Node.js no Railway:

```env
EXPO_PUBLIC_API_URL=https://DOMINIO-REAL-DO-BACKEND.up.railway.app
```

Regras importantes:

- Use a URL do serviço **backend Node.js** no Railway.
- Não use a URL da Vercel.
- Não use a URL do PostgreSQL.
- Não use `localhost` no celular.
- Não acrescente `/api` no final.
- Não deixe valores de exemplo como `sua-api` ou `seu-dominio`.

Antes de iniciar o Expo, teste a API no PowerShell:

```powershell
$ApiUrl = ((Get-Content .env | Where-Object { $_ -match '^EXPO_PUBLIC_API_URL=' }) -replace '^EXPO_PUBLIC_API_URL=', '').Trim()
Invoke-RestMethod "$ApiUrl/health"
```

O retorno esperado é:

```text
status database
------ --------
ok     connected
```

Também teste no navegador do próprio celular:

```text
https://DOMINIO-REAL-DO-BACKEND.up.railway.app/health
```

## 4. Instalar dependências

```bash
npm install
npx expo install --fix
npx expo-doctor
```

## 5. Iniciar no Expo Go

```bash
npx expo start
```

Um QR Code será exibido no terminal.

### Android

1. Abra o Expo Go.
2. Toque em **Scan QR code**.
3. Leia o QR Code.

### iPhone

1. Abra a câmera do iPhone.
2. Leia o QR Code.
3. Confirme a abertura no Expo Go.

O computador e o celular devem estar na mesma rede Wi-Fi.

## 6. Problemas de conexão

Para usar um túnel:

```bash
npx expo start --tunnel
```

Após alterar o `.env`, pare o Expo e reinicie limpando o cache:

```bash
npx expo start --tunnel --clear
```

Se aparecer `Network request failed`, verifique nesta ordem:

1. O endereço `/health` abre no navegador do celular.
2. O `.env` contém a URL real do backend Railway.
3. A URL começa com `https://`.
4. A URL não termina com `/api`.
5. O Expo foi reiniciado com `--clear`.

## 7. Teste mínimo

1. Abra o aplicativo no Expo Go.
2. Entre com uma matrícula ou nome cadastrado.
3. Confirme a declaração de ciência.
4. Abra a aba **Coletas**.
5. Selecione Planta 01 ou Planta 02.
6. Abra uma faixa horária liberada.
7. Marque as amostras, informe status, hora real e observação.
8. Toque em **Salvar coleta**.
9. Confirme no sistema web se o registro apareceu no banco.

## 8. Estrutura móvel

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
