import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const router = Router();

router.get('/', requireAuth(), (req, res) => {
  res.json(db.prepare('SELECT * FROM planos ORDER BY valor').all());
});

router.post('/', requireAuth('admin'), (req, res) => {
  const { nome, velocidade_mbps, valor } = req.body;
  if (!nome || !velocidade_mbps || !valor) return res.status(400).json({ erro: 'campos obrigatorios: nome, velocidade_mbps, valor' });

  const info = db.prepare('INSERT INTO planos (nome, velocidade_mbps, valor) VALUES (?, ?, ?)').run(nome, velocidade_mbps, valor);
  res.status(201).json(db.prepare('SELECT * FROM planos WHERE id = ?').get(info.lastInsertRowid));
});
