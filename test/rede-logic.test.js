import { test } from 'node:test';
import assert from 'node:assert/strict';
import { simularProximoStatus } from '../src/rede-logic.js';

test('online fica online na maior parte do range', () => {
  assert.equal(simularProximoStatus('online', 0), 'online');
  assert.equal(simularProximoStatus('online', 0.89), 'online');
});

test('online piora pra instavel e depois offline nas bordas do range', () => {
  assert.equal(simularProximoStatus('online', 0.95), 'instavel');
  assert.equal(simularProximoStatus('online', 0.99), 'offline');
});

test('offline pode voltar a ficar online', () => {
  assert.equal(simularProximoStatus('offline', 0.1), 'online');
  assert.equal(simularProximoStatus('offline', 0.9), 'offline');
});

test('status desconhecido cai no comportamento de online', () => {
  assert.equal(simularProximoStatus('inexistente', 0), 'online');
});
