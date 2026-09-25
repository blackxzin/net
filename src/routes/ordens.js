import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { transicaoValida } from '../ordens-logic.js';

export const router = Router();

router.get('/', requireAuth(), (req, res) => {
  const { tecnico_id, status } = req.query;
  const condicoes = [];
  const valores = [];
  if (tecnico_id) { condicoes.push('tecnico_id = ?'); valores.push(tecnico_id); }
  if (status) { condicoes.push('status = ?'); valores.push(status); }
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  res.json(db.prepare(
    `SELECT * FROM ordens_servico ${where} ORDER BY data_agendada IS NULL, data_agendada, criado_em`
  ).all(...valores));
});

router.post('/', requireAuth('admin', 'atendente'), (req, res) => {
  const { cliente_id, tipo, observacoes } = req.body;
  if (!cliente_id || !tipo) return res.status(400).json({ erro: 'campos obrigatorios: cliente_id, tipo' });

  const info = db.prepare(
    'INSERT INTO ordens_servico (cliente_id, tipo, observacoes) VALUES (?, ?, ?)'
  ).run(cliente_id, tipo, observacoes ?? null);
  res.status(201).json(db.prepare('SELECT * FROM ordens_servico WHERE id = ?').get(info.lastInsertRowid));
});

router.patch('/:id/agendar', requireAuth('admin', 'atendente'), (req, res) => {
  const { tecnico_id, data_agendada } = req.body;
  if (!tecnico_id || !data_agendada) return res.status(400).json({ erro: 'campos obrigatorios: tecnico_id, data_agendada' });

  const atual = db.prepare('SELECT status FROM ordens_servico WHERE id = ?').get(req.params.id);
  if (!atual) return res.status(404).json({ erro: 'ordem nao encontrada' });
  if (!transicaoValida(atual.status, 'agendada')) {
    return res.status(409).json({ erro: `nao e possivel agendar uma ordem em status '${atual.status}'` });
  }

  db.prepare(
    `UPDATE ordens_servico SET tecnico_id = ?, data_agendada = ?, status = 'agendada' WHERE id = ?`
  ).run(tecnico_id, data_agendada, req.params.id);
  res.json(db.prepare('SELECT * FROM ordens_servico WHERE id = ?').get(req.params.id));
});

router.patch('/:id/status', requireAuth('admin', 'atendente', 'tecnico'), (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ erro: 'campo obrigatorio: status' });

  const atual = db.prepare('SELECT status FROM ordens_servico WHERE id = ?').get(req.params.id);
  if (!atual) return res.status(404).json({ erro: 'ordem nao encontrada' });
  if (!transicaoValida(atual.status, status)) {
    return res.status(409).json({ erro: `transicao invalida: '${atual.status}' -> '${status}'` });
  }

  db.prepare('UPDATE ordens_servico SET status = ? WHERE id = ?').run(status, req.params.id);
  res.json(db.prepare('SELECT * FROM ordens_servico WHERE id = ?').get(req.params.id));
});
