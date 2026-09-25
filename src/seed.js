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
  const cliente = db.prepare('INSERT INTO clientes (nome, cpf_cnpj, telefone, plano_id, status) VALUES (?, ?, ?, ?, ?)')
    .run('Cliente Teste', '000.000.000-00', '11999999999', plano.lastInsertRowid, 'ativo');
  db.prepare('INSERT INTO tecnicos (nome, telefone) VALUES (?, ?)')
    .run('Tecnico Teste', '11988888888');

  const dataOffset = (dias) => {
    const d = new Date();
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  };
  db.prepare("INSERT INTO faturas (cliente_id, valor, vencimento, status, pago_em) VALUES (?, ?, ?, 'pago', ?)")
    .run(cliente.lastInsertRowid, 89.9, dataOffset(-40), dataOffset(-38));
  db.prepare("INSERT INTO faturas (cliente_id, valor, vencimento, status) VALUES (?, ?, ?, 'vencido')")
    .run(cliente.lastInsertRowid, 89.9, dataOffset(-10));
  db.prepare("INSERT INTO faturas (cliente_id, valor, vencimento) VALUES (?, ?, ?)")
    .run(cliente.lastInsertRowid, 89.9, dataOffset(15));

  console.log('seed: login de teste -> admin@teste.com / admin123');
}
