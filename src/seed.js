import bcrypt from 'bcryptjs';
import { db } from './db.js';

export function seed() {
  const { n } = db.prepare('SELECT COUNT(*) as n FROM usuarios').get();
  if (Number(n) > 0) return;

  const senha_hash = bcrypt.hashSync('admin123', 10);
  db.prepare('INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)')
    .run('Admin', 'admin@teste.com', senha_hash, 'admin');

  const plano = db.prepare('INSERT INTO planos (nome, velocidade_mbps, valor) VALUES (?, ?, ?)')
    .run('Fibra 300MB', 300, 89.9);
  db.prepare('INSERT INTO clientes (nome, cpf_cnpj, telefone, plano_id, status) VALUES (?, ?, ?, ?, ?)')
    .run('Cliente Teste', '000.000.000-00', '11999999999', plano.lastInsertRowid, 'ativo');
  db.prepare('INSERT INTO tecnicos (nome, telefone) VALUES (?, ?)')
    .run('Tecnico Teste', '11988888888');

  console.log('seed: login de teste -> admin@teste.com / admin123');
}
