const TRANSICOES = {
  aberta: ['agendada', 'cancelada'],
  agendada: ['em_andamento', 'cancelada'],
  em_andamento: ['concluida', 'cancelada'],
  concluida: [],
  cancelada: [],
};

export function transicaoValida(statusAtual, statusNovo) {
  return (TRANSICOES[statusAtual] ?? []).includes(statusNovo);
}
