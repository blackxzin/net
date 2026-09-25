import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const router = Router();

router.get('/', requireAuth(), (req, res) => {
  const { busca } = req.query;
  const rows = busca
    ? db.prepare('SELECT * FROM clientes WHERE nome LIKE ? OR cpf_cnpj LIKE ? ORDER BY nome').all(`%${busca}%`, `%${busca}%`)
    : db.prepare('SELECT * FROM clientes ORDER BY nome').all();
  res.json(rows);
});

router.get('/:id', requireAuth(), (req, res) => {
  const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!cliente) return res.status(404).json({ erro: 'cliente nao encontrado' });
  res.json(cliente);
});

router.post('/', requireAuth('admin', 'atendente'), (req, res) => {
  const { nome, cpf_cnpj, telefone, endereco, plano_id } = req.body;
  if (!nome || !cpf_cnpj) return res.status(400).json({ erro: 'campos obrigatorios: nome, cpf_cnpj' });

  try {
    const info = db.prepare(
      'INSERT INTO clientes (nome, cpf_cnpj, telefone, endereco, plano_id) VALUES (?, ?, ?, ?, ?)'
    ).run(nome, cpf_cnpj, telefone ?? null, endereco ?? null, plano_id ?? null);
    res.status(201).json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(info.lastInsertRowid));
  } catch {
    res.status(409).json({ erro: 'cpf_cnpj ja cadastrado' });
  }
});

router.patch('/:id', requireAuth('admin', 'atendente'), (req, res) => {
  const existente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
  if (!existente) return res.status(404).json({ erro: 'cliente nao encontrado' });

  const { nome, telefone, endereco, plano_id, status } = req.body;
  db.prepare(
    `UPDATE clientes SET nome = ?, telefone = ?, endereco = ?, plano_id = ?, status = ? WHERE id = ?`
  ).run(
    nome ?? existente.nome,
    telefone ?? existente.telefone,
    endereco ?? existente.endereco,
    plano_id ?? existente.plano_id,
    status ?? existente.status,
    req.params.id
  );
  res.json(db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id));
});
