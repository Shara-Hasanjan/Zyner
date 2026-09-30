import * as THREE from 'three'

function canvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { c, g: c.getContext('2d')! }
}

function tex(c: HTMLCanvasElement, srgb = true) {
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  t.anisotropy = 8
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

export const AMBER = '#ff8b1f'

type SpacedContext = CanvasRenderingContext2D & { letterSpacing?: string }

/** Fine horizontal streaks: reads as brushed / machined aluminium. */
export function brushedRoughness() {
  const { c, g } = canvas(256, 256)
  g.fillStyle = '#9a9a9a'
  g.fillRect(0, 0, 256, 256)
  for (let i = 0; i < 1800; i++) {
    const y = Math.random() * 256
    const v = 110 + Math.random() * 90
    g.fillStyle = `rgba(${v},${v},${v},${0.05 + Math.random() * 0.12})`
    g.fillRect(Math.random() * 256, y, 30 + Math.random() * 200, 1)
  }
  return tex(c, false)
}

/** Front of a 1U-style chassis: drive bays, vent, status lights. Returns colour + emissive maps. */
export function serverFront() {
  const W = 512
  const H = 124
  const a = canvas(W, H)
  const e = canvas(W, H)
  a.g.fillStyle = '#161514'
  a.g.fillRect(0, 0, W, H)
  e.g.fillStyle = '#000'
  e.g.fillRect(0, 0, W, H)
  // vent perforations
  a.g.fillStyle = '#060606'
  for (let x = 0; x < 6; x++)
    for (let y = 0; y < 5; y++) {
      a.g.beginPath()
      a.g.arc(30 + x * 15, 24 + y * 18, 3.2, 0, Math.PI * 2)
      a.g.fill()
    }
  // drive bays
  for (let i = 0; i < 8; i++) {
    const x = 138 + i * 41
    a.g.fillStyle = '#242322'
    a.g.fillRect(x, 20, 35, 84)
    a.g.fillStyle = '#0c0c0b'
    a.g.fillRect(x + 3, 24, 29, 76)
    a.g.fillStyle = '#2f2d2b'
    a.g.fillRect(x + 6, 88, 23, 4)
    e.g.fillStyle = i % 3 === 1 ? AMBER : '#5a3410'
    e.g.fillRect(x + 6, 30, 5, 5)
  }
  // power / status
  e.g.fillStyle = AMBER
  e.g.beginPath()
  e.g.arc(472, 34, 6, 0, Math.PI * 2)
  e.g.fill()
  e.g.fillStyle = '#7a4a1a'
  e.g.fillRect(462, 60, 22, 3)
  e.g.fillRect(462, 70, 22, 3)
  a.g.fillStyle = '#2b2a28'
  a.g.fillRect(0, 0, W, 2)
  a.g.fillRect(0, H - 2, W, 2)
  return { map: tex(a.c), emissive: tex(e.c) }
}

/** Storage sled face: amber activity strip along the lower edge. */
export function storageFace() {
  const a = canvas(128, 64)
  const e = canvas(128, 64)
  a.g.fillStyle = '#1c1b1a'
  a.g.fillRect(0, 0, 128, 64)
  a.g.fillStyle = '#131211'
  a.g.fillRect(6, 8, 116, 30)
  a.g.fillStyle = '#2a2826'
  for (let i = 0; i < 9; i++) a.g.fillRect(10 + i * 12.5, 12, 8, 22)
  e.g.fillStyle = '#000'
  e.g.fillRect(0, 0, 128, 64)
  e.g.fillStyle = AMBER
  e.g.fillRect(8, 48, 84, 4)
  e.g.fillStyle = '#ffd08a'
  e.g.fillRect(100, 48, 20, 4)
  return { map: tex(a.c), emissive: tex(e.c) }
}

/** Top of the Japolic slab: engraved wordmark, guide lanes, registration marks. */
export function slabTop(w: number, d: number) {
  const W = 1600
  const H = Math.round((1600 * d) / w)
  const { c, g } = canvas(W, H)
  const gs = g as SpacedContext
  g.fillStyle = '#000'
  g.fillRect(0, 0, W, H)
  const px = W / w // px per world unit
  g.strokeStyle = 'rgba(255,139,31,0.16)'
  g.lineWidth = 2
  const step = px * 0.5
  for (let x = 0; x <= W; x += step) {
    g.beginPath()
    g.moveTo(x, 0)
    g.lineTo(x, H)
    g.stroke()
  }
  for (let y = 0; y <= H; y += step) {
    g.beginPath()
    g.moveTo(0, y)
    g.lineTo(W, y)
    g.stroke()
  }
  g.strokeStyle = 'rgba(255,139,31,0.7)'
  g.lineWidth = 4
  g.strokeRect(px * 0.22, px * 0.22, W - px * 0.44, H - px * 0.44)
  g.fillStyle = 'rgba(255,139,31,0.85)'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  // texture v runs from the back edge (top of canvas) to the front edge (bottom)
  g.font = `600 ${px * 0.62}px "Geist Mono Variable", ui-monospace, monospace`
  gs.letterSpacing = `${px * 0.32}px`
  g.fillText('JAPOLIC', W / 2, H - px * 0.85)
  g.font = `500 ${px * 0.17}px "Geist Mono Variable", ui-monospace, monospace`
  gs.letterSpacing = `${px * 0.05}px`
  g.fillText('DATA FABRIC   ·   SHARED STORAGE   ·   S3', W / 2, H - px * 0.36)
  // registration crosses at corners
  g.strokeStyle = 'rgba(255,200,130,0.9)'
  g.lineWidth = 3
  const m = px * 0.5
  for (const [cx, cy] of [
    [m, m],
    [W - m, m],
    [m, H - m],
    [W - m, H - m],
  ]) {
    g.beginPath()
    g.moveTo(cx - 14, cy)
    g.lineTo(cx + 14, cy)
    g.moveTo(cx, cy - 14)
    g.lineTo(cx, cy + 14)
    g.stroke()
  }
  return tex(c)
}

/** Outline-only cube face used for the S3 object lattice. */
export function cubeEdges() {
  const { c, g } = canvas(64, 64)
  g.fillStyle = '#000'
  g.fillRect(0, 0, 64, 64)
  g.strokeStyle = AMBER
  g.lineWidth = 4
  g.strokeRect(4, 4, 56, 56)
  return tex(c)
}
