# net

Sistema de gestão para provedores de internet. Base inicial: CRM + OS técnica.

## Stack

Node.js + Express + `node:sqlite` (nativo, sem instalação externa — banco de teste). Auth via JWT.

## Rodando

```
npm install
npm start
```

Sobe em `http://localhost:3000`. Na primeira execução cria automaticamente:

- login: `admin@teste.com` / `admin123`
- 1 plano e 1 cliente de exemplo

Banco fica em `net.db` (ignorado pelo git). Apagar o arquivo reseta os dados.

## Testes

```
npm test
```

## Endpoints

- `POST /auth/login` — `{ email, senha }` → token JWT
- `GET/POST /usuarios` — só admin (contas de acesso ao sistema: admin/atendente)
- `GET/POST/PATCH/DELETE /tecnicos` — cadastro de técnicos de campo (não fazem login)
- `GET/POST /planos`
- `GET/POST/PATCH /clientes`
- `GET/POST /ordens-servico`
- `PATCH /ordens-servico/:id/agendar` — `{ tecnico_id, data_agendada }`
- `PATCH /ordens-servico/:id/status` — respeita a máquina de estados: `aberta → agendada → em_andamento → concluida/cancelada`

Todas as rotas (exceto `/auth/login`) exigem `Authorization: Bearer <token>`.

## Roadmap (não implementado ainda)

- Chatbot WhatsApp (2ª via, status, abertura de chamado)
- Cobrança automática / régua de mensagens / previsão de churn
- Dashboard de rede (uptime POP/CTO, alertas)
- Otimização de rota dos técnicos
- Landing pages / captação de leads

## Produção

Banco de teste é `node:sqlite`. Pra produção de verdade, trocar por Postgres.
