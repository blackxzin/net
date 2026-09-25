import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';

export const router = Router();

router.get('/', requireAuth(), (req, res) => {
  const { cliente_id, status } = req.query;
  const condicoes = [];
  const valores = [];
  if (cliente_id) { condicoes.push('cliente_id = ?'); valores.push(cliente_id); }
  if (status) { condicoes.push('status = ?'); valores.push(status); }
  const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

  res.json(db.prepare(`SELECT * FROM faturas ${where} ORDER BY vencimento`).all(...valores));
});

// 2a via: so retorna os dados da fatura de novo, sem PDF/boleto real ainda
router.get('/:id', requireAuth(), (req, res) => {
  const fatura = db.prepare('SELECT * FROM faturas WHERE id = ?').get(req.params.id);
  if (!fatura) return res.status(404).json({ erro: 'fatura nao encontrada' });
  res.json(fatura);
});

router.post('/', requireAuth('admin', 'atendente'), (req, res) => {
  const { cliente_id, valor, vencimento } = req.body;
  if (!cliente_id || !valor || !vencimento) {
    return res.status(400).json({ erro: 'campos obrigatorios: cliente_id, valor, vencimento' });
  }

  const info = db.prepare(
    'INSERT INTO faturas (cliente_id, valor, vencimento) VALUES (?, ?, ?)'
  ).run(cliente_id, valor, vencimento);
  res.status(201).json(db.prepare('SELECT * FROM faturas WHERE id = ?').get(info.lastInsertRowid));
});

// simula pagamento: sem PIX/boleto real, so marca como pago
router.patch('/:id/pagar', requireAuth('admin', 'atendente'), (req, res) => {
  const fatura = db.prepare('SELECT * FROM faturas WHERE id = ?').get(req.params.id);
  if (!fatura) return res.status(404).json({ erro: 'fatura nao encontrada' });
  if (fatura.status === 'pago') return res.status(409).json({ erro: 'fatura ja esta paga' });

  db.prepare("UPDATE faturas SET status = 'pago', pago_em = datetime('now') WHERE id = ?").run(req.params.id);
  res.json(db.prepare('SELECT * FROM faturas WHERE id = ?').get(req.params.id));
});

// regua de cobranca: marca pendentes vencidas como 'vencido' e SIMULA o envio de
// mensagem (so grava um log, nao chama WhatsApp/SMS/email de verdade)
router.post('/regua/executar', requireAuth('admin', 'atendente'), (req, res) => {
  const vencendoAgora = db.prepare(
    "SELECT id, cliente_id FROM faturas WHERE status = 'pendente' AND vencimento < date('now')"
  ).all();

  const mensagensSimuladas = vencendoAgora.map((fatura) => {
    db.prepare("UPDATE faturas SET status = 'vencido' WHERE id = ?").run(fatura.id);
    db.prepare("INSERT INTO cobrancas_enviadas (fatura_id, canal) VALUES (?, 'email')").run(fatura.id);
    const cliente = db.prepare('SELECT nome FROM clientes WHERE id = ?').get(fatura.cliente_id);
    return { fatura_id: fatura.id, cliente: cliente?.nome, canal: 'email', simulado: true };
  });

  res.json({ faturas_marcadas_vencidas: vencendoAgora.length, mensagens_simuladas: mensagensSimuladas });
});
