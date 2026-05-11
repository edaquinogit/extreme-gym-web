# Extreme Gym Web

Frontend da aplicacao Extreme Gym, criado com React, TypeScript e Vite para consumir a Extreme Gym API.

## Requisitos

- Node.js
- npm
- Extreme Gym API rodando localmente em `http://localhost:8080`

## Configuracao

Crie um arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

A URL da API e definida pela variavel:

```env
VITE_API_URL=http://localhost:8080
```

## Rodando localmente

Instale as dependencias:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse `http://localhost:5173/`.

## Build

```bash
npm run build
```
