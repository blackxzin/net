// ponytail: heuristica ingenua (qtd de faturas vencidas + dias de atraso), trocar por
// modelo real quando houver historico de pagamento suficiente pra treinar algo.
export function calcularRisco(qtdVencidas, diasAtrasoMaisAntigo) {
  if (qtdVencidas <= 0) return 0;
  return Math.min(100, qtdVencidas * 20 + diasAtrasoMaisAntigo);
}
