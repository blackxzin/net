import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { calcularRisco } from '../inadimplencia-logic.js';

export const router = Router();

router.get('/', requireAuth('admin', 'atendente'), (req, res) => {
  const linhas = db.prepare(`
    SELECT c.id as cliente_id, c.nome, COUNT(f.id) as faturas_vencidas,
           SUM(f.valor) as total_vencido, MIN(f.vencimento) as vencimento_mais_antigo
    FROM clientes c
    JOIN faturas f ON f.cliente_id = c.id AND f.status = 'vencido'
    GROUP BY c.id
    ORDER BY total_vencido DESC
  `).all();

  const hoje = new Date();
  const painel = linhas.map((linha) => {
    const diasAtraso = Math.floor((hoje - new Date(linha.vencimento_mais_antigo)) / 86400000);
    return { ...linha, dias_atraso: diasAtraso, risco_churn: calcularRisco(linha.faturas_vencidas, diasAtraso) };
  });

  res.json(painel);
});
