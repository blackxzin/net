import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcularRisco } from '../src/inadimplencia-logic.js';

test('sem faturas vencidas, risco zero', () => {
  assert.equal(calcularRisco(0, 0), 0);
});

test('risco cresce com quantidade de faturas vencidas e dias de atraso', () => {
  assert.equal(calcularRisco(1, 10), 30);
  assert.equal(calcularRisco(2, 5), 45);
});

test('risco nunca passa de 100', () => {
  assert.equal(calcularRisco(10, 500), 100);
});
