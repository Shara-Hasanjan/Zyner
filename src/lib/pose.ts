import type { Layout } from './layout3d'
import type { NodePoseData, SceneState } from './store'
import { smootherstep, smoothstep, clamp } from './math'

/** Where each compute node sits when the system is fragmented. */
const CHAOS: [number, number, number, number][] = [
  [-1.5, 1.0, 1.5, 0.38],
  [1.0, -0.5, -1.2, -0.5],
  [-0.7, 0.7, 1.9, -0.28],
  [1.7, -1.0, -0.9, 0.55],
]

export function nodePose(
  k: number,
  L: Layout,
  st: SceneState,
  intro: number,
  out: NodePoseData,
) {
  const i = k % 4
  const isB = k >= 4
  const wide = 1 + st.spread * 0.32
  const c = smootherstep(st.chaos)
  const cx = CHAOS[i]
  if (!isB) {
    // nodes arrive one after another during the intro
    const arrive = smootherstep(clamp((intro - 0.12 - i * 0.07) / 0.5))
    out.x = L.nodeXs[i] * wide + cx[0] * L.xScale * c
    out.y = L.nodeY + cx[1] * c + (1 - arrive) * 3.2
    out.z = L.nodeZA + cx[2] * c * (L.mobile ? 0.6 : 1)
    out.ry = cx[3] * c
    out.scale = L.nodeScale * (0.001 + 0.999 * arrive)
  } else {
    const r = smoothstep(st.rowB) * (1 - c)
    out.x = (L.nodeXs[i] + (i % 2 === 0 ? 0.55 : -0.55) * L.xScale) * wide
    out.y = L.nodeY + (1 - r) * 2.2
    out.z = L.nodeZB
    out.ry = 0
    out.scale = L.nodeScale * (0.001 + 0.999 * r)
  }
}

/** Rotate a node-local offset into world space. */
export function nodeLocal(
  p: NodePoseData,
  lx: number,
  ly: number,
  lz: number,
  out: [number, number, number],
) {
  const cos = Math.cos(p.ry)
  const sin = Math.sin(p.ry)
  out[0] = p.x + (lx * cos + lz * sin) * p.scale
  out[1] = p.y + ly * p.scale
  out[2] = p.z + (-lx * sin + lz * cos) * p.scale
}

/** X position of cable/storage column j (0..7): two per compute node. */
export function colX(j: number, L: Layout, wide = 1) {
  const side = j % 2 === 0 ? -1 : 1
  return L.nodeXs[j >> 1] * wide + side * L.cableDx
}

export function slabFront(L: Layout) {
  return { x: 0, y: L.slabY + 0.14, z: L.slabD / 2 }
}
