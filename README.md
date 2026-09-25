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
- `GET/POST /faturas` — filtros `?cliente_id=` e `?status=`
- `GET /faturas/:id` — 2ª via (retorna os dados da fatura; sem PDF/boleto ainda)
- `PATCH /faturas/:id/pagar` — simula pagamento (sem PIX/boleto real)
- `POST /faturas/regua/executar` — marca pendentes vencidas como `vencido` e **simula** o envio de cobrança (só grava um log, não chama WhatsApp/SMS/e-mail de verdade)
- `GET /inadimplencia` — painel por cliente: faturas vencidas, total em aberto, dias de atraso e um score de risco (heurística simples, não é ML)
- `GET /rede/pontos` — status dos POPs/CTOs (online/instável/offline, latência, uptime)
- `GET /rede/alertas` — alertas abertos (`?todos=true` inclui resolvidos)
- `PATCH /rede/alertas/:id/resolver`
- `POST /rede/verificar` — **simula** um ciclo de monitoramento (sem SNMP/API real ainda)

Todas as rotas (exceto `/auth/login`) exigem `Authorization: Bearer <token>`.

## Painel de rede

`GET /rede.html` (servido pelo próprio Express) — dashboard visual com login embutido, stat tiles, cards de status por ponto e lista de alertas, auto-atualiza a cada 5s. Design clean/dark, cores de status seguem a paleta acessível do skill de dataviz.

## O que é simulado (nada real ainda)

Este projeto ainda está em fase de protótipo pra validar se vale a pena vender pra provedores. Por isso:

- Cobrança não integra com PIX/boleto de verdade — "pagar" é só marcar status.
- Régua de cobrança não envia WhatsApp/SMS/e-mail — só loga o que seria enviado.
- Risco de churn é uma conta simples (qtd de faturas vencidas + dias de atraso), não um modelo treinado.
- Monitoramento de rede é um sorteio de transição de status, sem SNMP/API real dos equipamentos.

## Roadmap (não implementado ainda)

- Chatbot WhatsApp (2ª via, status, abertura de chamado)
- Envio real de cobrança (WhatsApp/SMS/e-mail) e conciliação PIX/boleto
- Monitoramento de rede real (SNMP/API dos equipamentos)
- Otimização de rota dos técnicos
- Landing pages / captação de leads

## Produção

Banco de teste é `node:sqlite`. Pra produção de verdade, trocar por Postgres.
