import { Router } from 'express';
import { db } from '../db.js';
import { requireAuth } from '../auth.js';
import { simularProximoStatus } from '../rede-logic.js';

export const router = Router();

router.get('/pontos', requireAuth(), (req, res) => {
  res.json(db.prepare('SELECT * FROM pontos_rede ORDER BY tipo, nome').all());
});

router.get('/alertas', requireAuth(), (req, res) => {
  const { todos } = req.query;
  const rows = todos === 'true'
    ? db.prepare(`
        SELECT a.*, p.nome as ponto_nome FROM alertas_rede a
        JOIN pontos_rede p ON p.id = a.ponto_id ORDER BY a.criado_em DESC
      `).all()
    : db.prepare(`
        SELECT a.*, p.nome as ponto_nome FROM alertas_rede a
        JOIN pontos_rede p ON p.id = a.ponto_id WHERE a.resolvido_em IS NULL ORDER BY a.criado_em DESC
      `).all();
  res.json(rows);
});

router.patch('/alertas/:id/resolver', requireAuth('admin', 'atendente'), (req, res) => {
  const info = db.prepare(
    "UPDATE alertas_rede SET resolvido_em = datetime('now') WHERE id = ? AND resolvido_em IS NULL"
  ).run(req.params.id);
  if (info.changes === 0) return res.status(404).json({ erro: 'alerta nao encontrado ou ja resolvido' });
  res.json(db.prepare('SELECT * FROM alertas_rede WHERE id = ?').get(req.params.id));
});

// simula um ciclo de monitoramento: sem SNMP real, so sorteia transicao de status
router.post('/verificar', requireAuth('admin', 'atendente'), (req, res) => {
  const pontos = db.prepare('SELECT * FROM pontos_rede').all();
  const eventos = [];

  for (const ponto of pontos) {
    const novoStatus = simularProximoStatus(ponto.status, Math.random());
    const latencia = novoStatus === 'offline'
      ? null
      : Math.max(1, Math.round((ponto.latencia_ms ?? 20) + (Math.random() * 10 - 5)));

    db.prepare("UPDATE pontos_rede SET status = ?, latencia_ms = ?, atualizado_em = datetime('now') WHERE id = ?")
      .run(novoStatus, latencia, ponto.id);

    const alertaAberto = db.prepare(
      'SELECT * FROM alertas_rede WHERE ponto_id = ? AND resolvido_em IS NULL'
    ).get(ponto.id);

    if (novoStatus !== 'online' && !alertaAberto) {
      db.prepare('INSERT INTO alertas_rede (ponto_id, mensagem) VALUES (?, ?)')
        .run(ponto.id, `${ponto.nome} esta ${novoStatus}`);
      eventos.push({ ponto: ponto.nome, evento: 'alerta_criado', status: novoStatus });
    } else if (novoStatus === 'online' && alertaAberto) {
      db.prepare("UPDATE alertas_rede SET resolvido_em = datetime('now') WHERE id = ?").run(alertaAberto.id);
      eventos.push({ ponto: ponto.nome, evento: 'alerta_resolvido' });
    }
  }

  res.json({ pontos_verificados: pontos.length, eventos });
});
