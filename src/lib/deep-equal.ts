// Comparação estrutural para dados JSON (objetos/arrays/primitivos), usada para
// evitar re-renderizações quando o polling traz um payload idêntico ao anterior.
// Equivalente a comparar JSON.stringify(a) === JSON.stringify(b), mas sem alocar
// strings gigantes e com saída antecipada assim que encontra uma diferença.
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true

  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) {
    return false
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false
    }
    return true
  }

  const objA = a as Record<string, unknown>
  const objB = b as Record<string, unknown>
  const keysA = Object.keys(objA)
  const keysB = Object.keys(objB)

  if (keysA.length !== keysB.length) return false

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false
    if (!deepEqual(objA[key], objB[key])) return false
  }

  return true
}
