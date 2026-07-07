export function calcularPercentual(
  valorAtual: number | null,
  valorMeta: number
): number | null {
  return valorAtual !== null && valorMeta > 0 ? (valorAtual / valorMeta) * 100 : null
}
