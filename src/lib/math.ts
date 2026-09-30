export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
export const smoothstep = (t: number) => {
  const x = clamp(t)
  return x * x * (3 - 2 * x)
}
export const smootherstep = (t: number) => {
  const x = clamp(t)
  return x * x * x * (x * (x * 6 - 15) + 10)
}
/** Frame-rate independent exponential smoothing factor. */
export const damp = (rate: number, dt: number) => 1 - Math.exp(-rate * dt)
/** 0 → 1 between a and b, 1 between b and c, 1 → 0 between c and d. */
export const trapezoid = (x: number, a: number, b: number, c: number, d: number) => {
  if (x <= a || x >= d) return 0
  if (x < b) return smoothstep((x - a) / (b - a))
  if (x <= c) return 1
  return 1 - smoothstep((x - c) / (d - c))
}
/** Deterministic pseudo-random in [0,1) so layouts are stable between renders. */
export const hash = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}
