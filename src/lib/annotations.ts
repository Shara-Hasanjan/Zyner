import type { Layout } from './layout3d'
import { nodeLocal, slabFront } from './pose'
import { trapezoid, smoothstep } from './math'
import { world, type SceneState } from './store'

/**
 * Engineering callouts pinned to points in the 3D scene. The scene projects each
 * anchor to the screen every frame and moves the matching DOM element, so the text
 * stays crisp and accessible while still riding the camera.
 */
export interface Annotation {
  id: string
  title: string
  sub?: string
  /** pixel offset of the label from its anchor */
  dx: number
  dy: number
  anchor: (L: Layout, out: [number, number, number]) => void
  visible: (s: number, st: SceneState) => number
}

const tmp: [number, number, number] = [0, 0, 0]
const nodeTop = (k: number, ly = 0.95, lx = 0, lz = 0.75) => (_: Layout, out: [number, number, number]) => {
  nodeLocal(world.poses[k], lx, ly, lz, tmp)
  out[0] = tmp[0]
  out[1] = tmp[1]
  out[2] = tmp[2]
}
const intro = () => smoothstep((world.intro - 0.82) / 0.18)
const focusIs = (i: number) => (s: number) => (world.focus === i && s > 3.9 && s < 5.05 ? 1 : 0)
const useCaseIs = (i: number) => (s: number) => (world.useCase === i && s > 6.95 && s < 8.1 ? 1 : 0)
const stageNear = (k: number) => (s: number, st: SceneState) => (s > 5.9 && s < 7.05 ? Math.max(0, 1 - Math.abs(st.stage - k) * 1.6) : 0)

const slabRight = (L: Layout, out: [number, number, number]) => {
  const f = slabFront(L)
  out[0] = f.x + L.slabW * 0.5
  out[1] = f.y
  out[2] = f.z
}
const storageRight = (L: Layout, out: [number, number, number]) => {
  out[0] = L.cableXs[7] + 0.6
  out[1] = L.storageTierYs[0]
  out[2] = L.storageZs[2] * 0.9
}
const storageMid = (L: Layout, out: [number, number, number]) => {
  out[0] = 0
  out[1] = L.storageTopY
  out[2] = L.storageZs[2]
}
const s3Right = (L: Layout, out: [number, number, number]) => {
  out[0] = (L.s3Cols * L.s3Pitch) / 2
  out[1] = L.s3Y + L.s3Pitch
  out[2] = (L.s3Rows * L.s3Pitch) / 2
}
const cableMid = (_: Layout, out: [number, number, number]) => {
  out[0] = 0.4
  out[1] = 1.0
  out[2] = 0.6
}

export const ANNOTATIONS: Annotation[] = [
  // hero
  { id: 'h-node', title: 'NODE_02', sub: 'COMPUTE', dx: -70, dy: -36, anchor: nodeTop(1), visible: (s) => trapezoid(s, -1, 0.02, 0.32, 0.6) * intro() },
  { id: 'h-fabric', title: 'JAPOLIC DATA FABRIC', sub: 'SYSTEM ONLINE', dx: 84, dy: -20, anchor: slabRight, visible: (s) => trapezoid(s, -1, 0.02, 0.32, 0.6) * intro() },
  { id: 'h-storage', title: 'SHARED STORAGE', sub: 'STORAGE / SHARED', dx: 84, dy: 12, anchor: storageRight, visible: (s) => trapezoid(s, -1, 0.02, 0.32, 0.6) * intro() },
  { id: 'h-s3', title: 'S3', sub: 'CONNECTED', dx: 84, dy: 26, anchor: s3Right, visible: (s) => trapezoid(s, -1, 0.02, 0.32, 0.6) * intro() },
  // problem
  { id: 'p-copy', title: 'DUPLICATED DATA', sub: 'LOCAL COPY · NODE_01', dx: -84, dy: 56, anchor: nodeTop(0, -1.4, 0, 0), visible: (s) => trapezoid(s, 1.35, 1.6, 1.95, 2.25) },
  { id: 'p-path', title: 'LONG PATH', sub: 'DATA TAKES THE SLOW ROUTE', dx: 70, dy: -50, anchor: cableMid, visible: (s) => trapezoid(s, 1.4, 1.65, 1.95, 2.25) },
  { id: 'p-wait', title: 'NODE_03', sub: 'WAITING ON DATA', dx: 74, dy: -46, anchor: nodeTop(2), visible: (s) => trapezoid(s, 1.5, 1.75, 1.95, 2.25) },
  // transformation
  { id: 't-fabric', title: 'JAPOLIC DATA FABRIC', sub: 'ONLINE', dx: -84, dy: -30, anchor: slabRight, visible: (s) => trapezoid(s, 2.55, 2.75, 3.05, 3.2) },
  // solution
  ...[0, 1, 2, 3].map(
    (k): Annotation => ({
      id: `s-node-${k}`,
      title: `SERVER 0${k + 1}`,
      dx: 0,
      dy: -46,
      anchor: nodeTop(k),
      visible: (s) => trapezoid(s, 3.05, 3.25, 3.85, 4.0),
    }),
  ),
  { id: 's-fabric', title: 'JAPOLIC', sub: 'ONE DATA LAYER', dx: -90, dy: -40, anchor: slabRight, visible: (s) => trapezoid(s, 3.05, 3.25, 3.85, 4.0) },
  { id: 's-storage', title: 'SHARED STORAGE', sub: 'EVERY SERVER · SAME DATA', dx: -90, dy: 30, anchor: storageRight, visible: (s) => trapezoid(s, 3.1, 3.3, 3.85, 4.0) },
  // how it works (driven by the focused layer)
  { id: 'w-compute', title: 'COMPUTE', sub: 'APPLICATIONS RUN HERE', dx: -84, dy: -50, anchor: nodeTop(1), visible: focusIs(0) },
  { id: 'w-japolic', title: 'JAPOLIC', sub: 'HIGH-PERFORMANCE FILE SYSTEM', dx: 90, dy: -40, anchor: slabRight, visible: focusIs(1) },
  { id: 'w-storage', title: 'SHARED STORAGE', sub: 'ONE DATASET · EVERY SERVER', dx: 90, dy: 12, anchor: storageRight, visible: focusIs(2) },
  { id: 'w-s3', title: 'S3', sub: 'LOWER-COST CAPACITY', dx: 90, dy: -30, anchor: s3Right, visible: focusIs(3) },
  // features
  { id: 'f-1', title: 'NODE_01', sub: 'LOCAL-SPEED PATH', dx: -90, dy: 60, anchor: nodeTop(0, -0.9, -0.65, 0.3), visible: (s) => trapezoid(s, 5.03, 5.08, 5.15, 5.19) },
  { id: 'f-2', title: 'ONE DATASET', sub: 'MANY SERVERS', dx: 84, dy: -50, anchor: storageMid, visible: (s) => trapezoid(s, 5.2, 5.25, 5.31, 5.36) },
  { id: 'f-3', title: 'S3', sub: 'CONNECTED', dx: 90, dy: -40, anchor: s3Right, visible: (s) => trapezoid(s, 5.37, 5.42, 5.48, 5.53) },
  { id: 'f-4', title: 'MULTI-SERVER', sub: 'NODES JOIN THE SAME FILE SYSTEM', dx: 90, dy: -30, anchor: nodeTop(6, 0.95, 0, -0.2), visible: (s) => trapezoid(s, 5.54, 5.58, 5.65, 5.69) },
  { id: 'f-5', title: 'AI NODES', sub: 'SHARED DATASET', dx: -84, dy: -46, anchor: nodeTop(4, 0.95, 0, -0.2), visible: (s) => trapezoid(s, 5.7, 5.75, 5.81, 5.86) },
  { id: 'f-6', title: 'DISTRIBUTED WORK', sub: 'EAST–WEST ACROSS THE FABRIC', dx: 90, dy: -34, anchor: slabRight, visible: (s) => trapezoid(s, 5.87, 5.92, 5.97, 6.02) },
  // AI workload
  { id: 'a-1', title: 'DATASET', sub: 'SHARED STORAGE', dx: 90, dy: -40, anchor: storageRight, visible: stageNear(1) },
  { id: 'a-2', title: 'PREPROCESSING', sub: 'COMPUTE READS THE SAME DATA', dx: -90, dy: -44, anchor: nodeTop(1), visible: stageNear(2) },
  { id: 'a-3', title: 'TRAINING', sub: 'MORE NODES · SAME DATASET', dx: 90, dy: -40, anchor: nodeTop(5, 0.95, 0, -0.2), visible: stageNear(3) },
  { id: 'a-4', title: 'INFERENCE', sub: 'MANY READERS · ONE DATA LAYER', dx: 90, dy: -40, anchor: nodeTop(3), visible: stageNear(4) },
  { id: 'a-5', title: 'RESULT', sub: 'WRITTEN BACK TO SHARED STORAGE', dx: 90, dy: 10, anchor: storageRight, visible: stageNear(5) },
  // use cases
  { id: 'u-0', title: 'AI / ML', sub: 'COMPUTE NODES ACTIVE', dx: -90, dy: -44, anchor: nodeTop(5, 0.95, 0, -0.2), visible: useCaseIs(0) },
  { id: 'u-1', title: 'DATA-INTENSIVE', sub: 'DATA STREAM ACTIVE', dx: 90, dy: -30, anchor: cableMid, visible: useCaseIs(1) },
  { id: 'u-2', title: 'ONE DATASET', sub: 'THE WHOLE TEAM, SAME DATA', dx: 90, dy: -46, anchor: storageMid, visible: useCaseIs(2) },
  { id: 'u-3', title: 'MORE SERVERS', sub: 'SAME DATA LAYER', dx: 90, dy: -40, anchor: nodeTop(7, 0.95, 0, -0.2), visible: useCaseIs(3) },
  { id: 'u-4', title: 'STORAGE EXPANDS', sub: 'LARGE DATASETS', dx: 90, dy: 0, anchor: storageRight, visible: useCaseIs(4) },
  { id: 'u-5', title: 'S3 CONNECTED', sub: 'CLOUD + HYBRID', dx: 90, dy: -30, anchor: s3Right, visible: useCaseIs(5) },
  // final
  { id: 'z-fabric', title: 'SYSTEM ONLINE', dx: 84, dy: -30, anchor: slabRight, visible: (s) => trapezoid(s, 8.2, 8.4, 8.85, 9.0) },
  { id: 'z-storage', title: 'STORAGE', sub: 'SHARED', dx: 84, dy: 10, anchor: storageRight, visible: (s) => trapezoid(s, 8.25, 8.45, 8.85, 9.0) },
  { id: 'z-s3', title: 'S3', sub: 'CONNECTED', dx: 84, dy: 26, anchor: s3Right, visible: (s) => trapezoid(s, 8.3, 8.5, 8.85, 9.0) },
]

/** DOM elements registered by the overlay component. */
export const annotationEls = new Map<string, HTMLElement>()
