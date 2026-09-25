import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const router = Router();

router.get('/', requireAuth('admin', 'atendente'), (req, res) => {
  const { papel } = req.query;
  const rows = papel
    ? db.prepare('SELECT id, nome, email, papel FROM usuarios WHERE papel = ? ORDER BY nome').all(papel)
    : db.prepare('SELECT id, nome, email, papel FROM usuarios ORDER BY nome').all();
  res.json(rows);
});

router.post('/', requireAuth('admin'), (req, res) => {
  const { nome, email, senha, papel } = req.body;
  if (!nome || !email || !senha || !papel) return res.status(400).json({ erro: 'campos obrigatorios: nome, email, senha, papel' });

  const senha_hash = bcrypt.hashSync(senha, 10);
  try {
    const info = db.prepare('INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)').run(nome, email, senha_hash, papel);
    res.status(201).json(db.prepare('SELECT id, nome, email, papel FROM usuarios WHERE id = ?').get(info.lastInsertRowid));
  } catch {
    res.status(409).json({ erro: 'email ja cadastrado' });
  }
});
