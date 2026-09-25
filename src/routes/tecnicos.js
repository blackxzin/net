import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const router = Router();

router.get('/', requireAuth(), (req, res) => {
  const { status } = req.query;
  const rows = status
    ? db.prepare('SELECT * FROM tecnicos WHERE status = ? ORDER BY nome').all(status)
    : db.prepare('SELECT * FROM tecnicos ORDER BY nome').all();
  res.json(rows);
});

router.get('/:id', requireAuth(), (req, res) => {
  const tecnico = db.prepare('SELECT * FROM tecnicos WHERE id = ?').get(req.params.id);
  if (!tecnico) return res.status(404).json({ erro: 'tecnico nao encontrado' });
  res.json(tecnico);
});

router.post('/', requireAuth('admin', 'atendente'), (req, res) => {
  const { nome, telefone } = req.body;
  if (!nome) return res.status(400).json({ erro: 'campo obrigatorio: nome' });

  const info = db.prepare('INSERT INTO tecnicos (nome, telefone) VALUES (?, ?)').run(nome, telefone ?? null);
  res.status(201).json(db.prepare('SELECT * FROM tecnicos WHERE id = ?').get(info.lastInsertRowid));
});

router.patch('/:id', requireAuth('admin', 'atendente'), (req, res) => {
  const existente = db.prepare('SELECT * FROM tecnicos WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'tecnico nao encontrado' });

  const { nome, telefone, status } = req.body;
  db.prepare('UPDATE tecnicos SET nome = ?, telefone = ?, status = ? WHERE id = ?').run(
    nome ?? existente.nome,
    telefone ?? existente.telefone,
    status ?? existente.status,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM tecnicos WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireAuth('admin'), (req, res) => {
  const info = db.prepare('DELETE FROM tecnicos WHERE id = ?').run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ erro: 'tecnico nao encontrado' });
  res.status(204).send();
});
