import { DEFAULT_STATE, STATE_KEYS, type SceneState } from './store'
import { lerp, smootherstep } from './math'

/**
 * The cinematography of the site. Each shot is a camera pose plus the state of the
 * infrastructure at that moment. `s` is the chapter coordinate (see CHAPTERS):
 * the integer part is the section, the fraction is progress through it.
 * Between two shots the camera glides with zero velocity at both ends, so every
 * shot reads as a deliberate frame rather than a continuous drift.
 */
export interface Shot {
  s: number
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
  /** horizontal screen shift (fraction of width) that makes room for copy; + moves the world right */
  sx: number
  /** vertical shift used on portrait screens, where copy sits above the scene */
  sy: number
  state: SceneState
}

type Cam = {
  pos: [number, number, number]
  look: [number, number, number]
  fov?: number
  sx?: number
  sy?: number
  /** pull the camera back along its view line (overview shots use > 1) */
  k?: number
}

const shots: Shot[] = []
let running: SceneState = { ...DEFAULT_STATE }
function shot(s: number, cam: Cam, patch: Partial<SceneState> = {}) {
  running = { ...running, ...patch }
  const k = cam.k ?? 1
  const pos: [number, number, number] = [
    cam.look[0] + (cam.pos[0] - cam.look[0]) * k,
    cam.look[1] + (cam.pos[1] - cam.look[1]) * k,
    cam.look[2] + (cam.pos[2] - cam.look[2]) * k,
  ]
  shots.push({
    s,
    pos,
    look: cam.look,
    fov: cam.fov ?? 30,
    sx: cam.sx ?? 0.17,
    sy: cam.sy ?? 0.2,
    state: running,
  })
}

// ── 0 · HERO: wide establishing shot of the assembled system ─────────────────
shot(0.0, { pos: [10.5, 4.8, 19.5], look: [0, -0.8, 0], sx: 0.19, k: 1.34 }, { busy: 0.55 })
shot(0.5, { pos: [9.4, 4.3, 17.6], look: [0, -0.4, 0], sx: 0.19, k: 1.34 })
// ── 1 · PROBLEM: approach compute, then the system fragments ────────────────
shot(1.0, { pos: [5.8, 4.4, 10.6], look: [0.4, 2.5, 0.4], sx: 0.17 }, { busy: 0.8 })
shot(1.3, { pos: [3.6, 3.6, 12.6], look: [0, 1.6, 0.3], sx: 0.18 }, { chaos: 0.35, japolic: 0.4, copies: 0.4, busy: 0.6, speed: 0.7 })
shot(1.65, { pos: [-5, 4.8, 15.2], look: [0, 0.2, 0], sx: 0.19, k: 1.3 }, { chaos: 1, japolic: 0, copies: 1, speed: 0.45, busy: 0.5, s3: 0.3 })
shot(2.0, { pos: [-1.5, 6.6, 16.5], look: [0, -0.4, 0], sx: 0.19, k: 1.22 })
// ── 2 · TRANSFORMATION: everything pauses, then Japolic assembles ───────────
shot(2.3, { pos: [0, 5.6, 15.2], look: [0, -0.2, 0], sx: 0, k: 1.42 })
shot(2.75, { pos: [0, 3.3, 15.6], look: [0, -0.5, 0], sx: 0, k: 1.32 }, { chaos: 0, japolic: 1, copies: 0, speed: 1.4, busy: 0.85, s3: 0.5 })
// ── 3 · SOLUTION: orbit the architecture ────────────────────────────────────
shot(3.0, { pos: [-9, 3.2, 13.5], look: [0, 0.2, 0], sx: -0.22, k: 1.7 }, { speed: 1, busy: 0.7 })
shot(3.5, { pos: [0.5, 1.7, 11.8], look: [0, 0.6, 0.2], sx: -0.22, k: 1.75 })
shot(4.0, { pos: [8.5, 3.4, 14.5], look: [0, -0.6, 0], sx: 0.2, k: 1.3 })
// ── 4 · HOW IT WORKS: overview; layer focus is layered on top by the director ─
shot(4.5, { pos: [7.6, 3.2, 17.8], look: [0, -0.9, 0], sx: 0.2, k: 1.3 })
shot(5.0, { pos: [7.6, 3.2, 17.8], look: [0, -0.9, 0], sx: 0.2, k: 1.3 })
// ── 5 · FEATURES: six shots, one per capability ─────────────────────────────
shot(5.083, { pos: [-2.4, 2.1, 6.6], look: [-3.8, 1.5, 0.9], sx: 0.2, k: 1.9 }, { solo: 1, speed: 2.6, busy: 0.9 })
shot(5.25, { pos: [0.6, -0.3, 14.6], look: [0, -0.6, 0], sx: 0.2, k: 1.55 }, { solo: 0, share: 1, speed: 1.3, busy: 0.7 })
shot(5.417, { pos: [6, -3.4, 13.2], look: [0, -3.9, 0], sx: 0.2, k: 1.4 }, { share: 0, s3: 1, speed: 1.4 })
shot(5.583, { pos: [0, 7.6, 15.6], look: [0, 1.2, -0.8], sx: 0.2, k: 1.1 }, { s3: 0.55, rowB: 1, busy: 0.9, speed: 1 })
shot(5.75, { pos: [-7.5, 2.2, 12.6], look: [0, 0.4, -0.6], sx: 0.2, k: 1.3 }, { share: 0.5, busy: 1, speed: 1.7 })
shot(5.917, { pos: [9.5, 1.6, 10.6], look: [0, 1.6, -0.6], sx: 0.2, k: 1.4 }, { share: 0, spread: 1, lanes: 1, speed: 1.3, busy: 0.8 })
// ── 6 · AI / DATA-INTENSIVE WORKLOAD: five stages, camera travels through ────
shot(6.1, { pos: [5.6, -2.4, 11.6], look: [0, -2.2, 0], sx: 0.2, k: 1.45 }, { stage: 1, rowB: 0, spread: 0, lanes: 0, share: 0.5, busy: 0.3, speed: 1, flowBias: 0 })
shot(6.3, { pos: [-6, 1.6, 12], look: [0, 0.6, 0.3], sx: 0.2, k: 1.35 }, { stage: 2, busy: 1, speed: 1.5, flowBias: -1 })
shot(6.5, { pos: [0.5, 6.2, 15.6], look: [0, 0.8, -0.8], sx: 0.2, k: 1.2 }, { stage: 3, rowB: 1, busy: 1, speed: 2.6, flowBias: -0.3 })
shot(6.7, { pos: [8.6, 3, 9.6], look: [0.5, 1.8, -0.6], sx: 0.2, k: 1.55 }, { stage: 4, busy: 0.8, speed: 1.4, flowBias: -0.6, s3: 0.8 })
shot(6.9, { pos: [0, -1.2, 21], look: [0, -1.4, 0], sx: 0.2 }, { stage: 5, busy: 0.5, speed: 1.6, flowBias: 1, s3: 1 })
shot(7.0, { pos: [0, -1.2, 21], look: [0, -1.4, 0], sx: 0.2 })
// ── 7 · USE CASES: base frame, modified by the hovered use case ─────────────
shot(7.1, { pos: [9, 3, 17.6], look: [0, -1, 0], sx: 0.2, k: 1.25 }, { stage: 0, rowB: 0, busy: 0.6, speed: 1, flowBias: 0, s3: 0.6, share: 0 })
shot(8.0, { pos: [9, 3.2, 18.4], look: [0, -1, 0], sx: 0.2, k: 1.25 })
// ── 8 · FINAL: the complete system, slower ──────────────────────────────────
shot(8.15, { pos: [9.6, 4.2, 22.5], look: [0, -0.9, 0], sx: 0, k: 1.12 }, { busy: 0.7, speed: 0.85, s3: 1 })
shot(8.6, { pos: [3.5, 4.6, 24], look: [0, -0.9, 0], sx: 0, k: 1.12 })
shot(9.0, { pos: [-8.5, 4.4, 22.5], look: [0, -0.9, 0], sx: 0, k: 1.12 })

export const SHOTS = shots

export interface Frame {
  pos: [number, number, number]
  look: [number, number, number]
  fov: number
  sx: number
  sy: number
  state: SceneState
}

export function makeFrame(): Frame {
  return { pos: [0, 0, 0], look: [0, 0, 0], fov: 30, sx: 0, sy: 0, state: { ...DEFAULT_STATE } }
}

/** Sample the shot list at chapter coordinate s. */
export function sampleShots(s: number, out: Frame) {
  let i = 0
  while (i < shots.length - 2 && s >= shots[i + 1].s) i++
  const a = shots[i]
  const b = shots[i + 1]
  const t = smootherstep((s - a.s) / (b.s - a.s))
  for (let k = 0; k < 3; k++) {
    out.pos[k] = lerp(a.pos[k], b.pos[k], t)
    out.look[k] = lerp(a.look[k], b.look[k], t)
  }
  out.fov = lerp(a.fov, b.fov, t)
  out.sx = lerp(a.sx, b.sx, t)
  out.sy = lerp(a.sy, b.sy, t)
  for (const key of STATE_KEYS) out.state[key] = lerp(a.state[key], b.state[key], t)
  return out
}

/** Camera poses used when a layer is focused in the "How it works" chapter. */
export const FOCUS_SHOTS: { pos: [number, number, number]; look: [number, number, number]; sx: number }[] = [
  { pos: [5.2, 4.6, 9.6], look: [0, 2.6, 0.6], sx: 0.2 },
  { pos: [6.0, 2.6, 10.4], look: [0, 0.5, 0.2], sx: 0.2 },
  { pos: [6.0, -0.4, 11.6], look: [0, -2.2, 0.2], sx: 0.2 },
  { pos: [6.2, -2.8, 12.4], look: [0, -5.0, 0.2], sx: 0.2 },
]

/** State changes applied while a layer is focused. */
export const FOCUS_STATE: Partial<SceneState>[] = [
  { busy: 1, speed: 1.2 },
  { speed: 1.6, busy: 0.8 },
  { share: 1, speed: 1.2 },
  { s3: 1, speed: 1.2 },
]

/** State changes applied while a use case is hovered (chapter 7). */
export const USECASE_STATE: Partial<SceneState>[] = [
  { rowB: 1, busy: 1, speed: 1.6 }, // AI / ML
  { busy: 1, speed: 2.4, share: 0.3 }, // data-intensive apps
  { share: 1, busy: 0.6, speed: 1 }, // engineering teams
  { rowB: 1, spread: 1, lanes: 1, busy: 0.8, speed: 1.3 }, // distributed compute
  { expand: 1, s3: 0.8, speed: 1 }, // large datasets
  { s3: 1, expand: 0.4, speed: 1.3 }, // cloud + hybrid
]

export const USECASE_CAM: { pos: [number, number, number]; look: [number, number, number] }[] = [
  { pos: [-6.5, 3.6, 14], look: [0, 0.8, -0.4] },
  { pos: [6.5, 2.2, 12], look: [0, 0.4, 0.2] },
  { pos: [0.5, 1.4, 13.5], look: [0, -0.2, 0.2] },
  { pos: [9.6, 4.2, 15], look: [0, 1.2, -0.6] },
  { pos: [7, -2.2, 15.5], look: [0, -3.2, 0.2] },
  { pos: [-7, -1.8, 16], look: [0, -3, 0.2] },
]
