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
