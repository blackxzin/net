// ponytail: simulacao ingenua de monitoramento (sem SNMP/API real dos equipamentos).
// Trocar por polling real quando o provedor der acesso aos POPs/CTOs.
const TRANSICOES = {
  online: [[0.90, 'online'], [0.98, 'instavel'], [1, 'offline']],
  instavel: [[0.50, 'online'], [0.80, 'instavel'], [1, 'offline']],
  offline: [[0.40, 'online'], [1, 'offline']],
};

export function simularProximoStatus(statusAtual, aleatorio) {
  const opcoes = TRANSICOES[statusAtual] ?? TRANSICOES.online;
  for (const [limite, proximo] of opcoes) {
    if (aleatorio < limite) return proximo;
  }
  return statusAtual;
}
