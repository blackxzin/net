import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

process.env.DB_PATH = path.join(mkdtempSync(path.join(tmpdir(), 'net-test-')), 'test.db');
process.env.JWT_SECRET = 'segredo-teste';

const { app } = await import('../src/app.js');
const { seed } = await import('../src/seed.js');
seed();

test('fluxo completo: login, criar cliente, criar OS, agendar, bloquear transicao invalida', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;

  const login = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@teste.com', senha: 'admin123' }),
  });
  assert.equal(login.status, 200);
  const { token } = await login.json();
  const auth = { 'content-type': 'application/json', authorization: `Bearer ${token}` };

  const clienteRes = await fetch(`${base}/clientes`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ nome: 'Fulano', cpf_cnpj: '123.456.789-00' }),
  });
  assert.equal(clienteRes.status, 201);
  const cliente = await clienteRes.json();

  const osRes = await fetch(`${base}/ordens-servico`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ cliente_id: cliente.id, tipo: 'instalacao' }),
  });
  assert.equal(osRes.status, 201);
  const os = await osRes.json();
  assert.equal(os.status, 'aberta');

  const tecnicoRes = await fetch(`${base}/tecnicos`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ nome: 'Joao Tecnico', telefone: '11977777777' }),
  });
  assert.equal(tecnicoRes.status, 201);
  const tecnico = await tecnicoRes.json();

  const agendarRes = await fetch(`${base}/ordens-servico/${os.id}/agendar`, {
    method: 'PATCH', headers: auth,
    body: JSON.stringify({ tecnico_id: tecnico.id, data_agendada: '2026-10-01 09:00' }),
  });
  assert.equal(agendarRes.status, 200);
  const agendada = await agendarRes.json();
  assert.equal(agendada.status, 'agendada');
  assert.equal(agendada.tecnico_id, tecnico.id);

  const bloqueado = await fetch(`${base}/ordens-servico/${os.id}/status`, {
    method: 'PATCH', headers: auth,
    body: JSON.stringify({ status: 'concluida' }),
  });
  assert.equal(bloqueado.status, 409);

  const semToken = await fetch(`${base}/clientes`);
  assert.equal(semToken.status, 401);

  server.close();
});

test('fluxo de cobranca: fatura vencida vira inadimplencia, regua simula envio, pagamento fecha', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;

  const login = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@teste.com', senha: 'admin123' }),
  });
  const { token } = await login.json();
  const auth = { 'content-type': 'application/json', authorization: `Bearer ${token}` };

  const cliente = await (await fetch(`${base}/clientes`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ nome: 'Inadimplente Teste', cpf_cnpj: '999.999.999-99' }),
  })).json();

  const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const fatura = await (await fetch(`${base}/faturas`, {
    method: 'POST', headers: auth,
    body: JSON.stringify({ cliente_id: cliente.id, valor: 89.9, vencimento: ontem }),
  })).json();
  assert.equal(fatura.status, 'pendente');

  const regua = await (await fetch(`${base}/faturas/regua/executar`, { method: 'POST', headers: auth })).json();
  assert.equal(regua.faturas_marcadas_vencidas >= 1, true);
  assert.equal(regua.mensagens_simuladas.some((m) => m.fatura_id === fatura.id), true);

  const painel = await (await fetch(`${base}/inadimplencia`, { headers: auth })).json();
  const linha = painel.find((p) => p.cliente_id === cliente.id);
  assert.ok(linha);
  assert.equal(linha.faturas_vencidas, 1);
  assert.ok(linha.risco_churn > 0);

  const pagar = await fetch(`${base}/faturas/${fatura.id}/pagar`, { method: 'PATCH', headers: auth });
  assert.equal(pagar.status, 200);
  assert.equal((await pagar.json()).status, 'pago');

  const pagarDeNovo = await fetch(`${base}/faturas/${fatura.id}/pagar`, { method: 'PATCH', headers: auth });
  assert.equal(pagarDeNovo.status, 409);

  server.close();
});

test('painel de rede: seed ja tem ponto instavel e offline com alertas abertos', async () => {
  const server = app.listen(0);
  const base = `http://localhost:${server.address().port}`;

  const login = await fetch(`${base}/auth/login`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'admin@teste.com', senha: 'admin123' }),
  });
  const { token } = await login.json();
  const auth = { 'content-type': 'application/json', authorization: `Bearer ${token}` };

  const pontos = await (await fetch(`${base}/rede/pontos`, { headers: auth })).json();
  assert.equal(pontos.length, 5);
  assert.ok(pontos.some((p) => p.status === 'offline'));

  const alertasAbertos = await (await fetch(`${base}/rede/alertas`, { headers: auth })).json();
  assert.equal(alertasAbertos.length, 2);

  const resolver = await fetch(`${base}/rede/alertas/${alertasAbertos[0].id}/resolver`, {
    method: 'PATCH', headers: auth,
  });
  assert.equal(resolver.status, 200);

  const alertasDepois = await (await fetch(`${base}/rede/alertas`, { headers: auth })).json();
  assert.equal(alertasDepois.length, 1);

  const verificar = await (await fetch(`${base}/rede/verificar`, { method: 'POST', headers: auth })).json();
  assert.equal(verificar.pontos_verificados, 5);

  server.close();
});
