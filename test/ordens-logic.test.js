import { test } from 'node:test';
import assert from 'node:assert/strict';
import { transicaoValida } from '../src/ordens-logic.js';

test('aberta pode ir para agendada ou cancelada', () => {
  assert.equal(transicaoValida('aberta', 'agendada'), true);
  assert.equal(transicaoValida('aberta', 'cancelada'), true);
  assert.equal(transicaoValida('aberta', 'concluida'), false);
});

test('estados terminais nao aceitam nenhuma transicao', () => {
  assert.equal(transicaoValida('concluida', 'aberta'), false);
  assert.equal(transicaoValida('cancelada', 'agendada'), false);
});

test('nao pode pular etapa (aberta direto pra em_andamento)', () => {
  assert.equal(transicaoValida('aberta', 'em_andamento'), false);
});

test('status desconhecido nunca e valido', () => {
  assert.equal(transicaoValida('inexistente', 'agendada'), false);
});
