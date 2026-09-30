/**
 * The single mutable "world" shared between the DOM chapters and the WebGL scene.
 * Continuous values (scroll, camera, scene state) live here and are read inside
 * animation frames, never in React state, so scrolling never re-renders React.
 */

export interface SceneState {
  /** 0 = clean orthogonal cabling, 1 = fragmented, tangled, duplicated */
  chaos: number
  /** presence of the Japolic data-fabric layer */
  japolic: number
  /** S3 layer activation */
  s3: number
  /** second row of compute nodes */
  rowB: number
  /** data flow speed multiplier */
  speed: number
  /** compute activity (LEDs, packet brightness) */
  busy: number
  /** AI pipeline stage, 0 = none, 1..5 = dataset … result (continuous) */
  stage: number
  /** emphasis on node 01 only */
  solo: number
  /** widen the compute rows */
  spread: number
  /** extra storage tiers */
  expand: number
  /** all servers reading one dataset */
  share: number
  /** east-west lanes across the fabric */
  lanes: number
  /** local duplicate disks under each node */
  copies: number
  /** -1 = reads (storage→compute), +1 = writes (compute→storage) */
  flowBias: number
}

export const DEFAULT_STATE: SceneState = {
  chaos: 0,
  japolic: 1,
  s3: 0.55,
  rowB: 0,
  speed: 1,
  busy: 0.55,
  stage: 0,
  solo: 0,
  spread: 0,
  expand: 0,
  share: 0,
  lanes: 0,
  copies: 0,
  flowBias: 0,
}

export const STATE_KEYS = Object.keys(DEFAULT_STATE) as (keyof SceneState)[]

export const CHAPTERS = {
  hero: 0,
  problem: 1,
  transform: 2,
  solution: 3,
  how: 4,
  features: 5,
  ai: 6,
  useCases: 7,
  final: 8,
  footer: 9,
} as const

export interface NodePoseData {
  x: number
  y: number
  z: number
  ry: number
  scale: number
}

export const world = {
  /** smoothed scroll offset in px */
  y: 0,
  /** continuous chapter coordinate, see CHAPTERS */
  s: 0,
  vw: 1,
  vh: 1,
  reduced: false,
  mobile: false,
  /** DOM loader finished & scene ready */
  ready: false,
  /** footer fully covers the canvas: rendering can stop */
  covered: false,
  /** 0 → 1 cinematic intro */
  intro: 0,
  /** active layer in "how it works": 0 compute, 1 japolic, 2 storage, 3 s3, -1 none */
  focus: -1,
  /** active use case index, -1 none */
  useCase: -1,
  pointer: { x: 0, y: 0 },
  /** smoothed scene state */
  cur: { ...DEFAULT_STATE } as SceneState,
  /** node poses, written by the director every frame */
  poses: Array.from({ length: 8 }, () => ({ x: 0, y: 0, z: 0, ry: 0, scale: 1 })) as NodePoseData[],
}
