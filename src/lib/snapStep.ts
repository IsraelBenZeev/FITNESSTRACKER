/**
 * Next value after a +/− tap that lands on a multiple of the step:
 * 1 +10 → 10 (not 11), 47 −10 → 40, 40 +10 → 50.
 * A value already on the grid moves by a full step.
 */
export function snapStep(value: number, delta: number): number {
  const step = Math.abs(delta)
  if (!step) return value
  const q = value / step
  const eps = 1e-9 // float noise: 0.3 / 0.1 = 2.9999999999999996
  const next = delta > 0 ? Math.floor(q + eps) + 1 : Math.ceil(q - eps) - 1
  return Math.round(next * step * 1000) / 1000
}
