import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../../lib/store'
import { clamp, hash, smootherstep, smoothstep, lerp } from '../../lib/math'
import { colX, nodeLocal } from '../../lib/pose'
import { useScene } from './SceneContext'

const SEG = 36
const RAD = 5
const PTS = SEG + 1

type Kind = 'upA' | 'upB' | 'down' | 's3'
interface Cable {
  kind: Kind
  j: number
  mesh: THREE.Mesh
  geo: THREE.BufferGeometry
  pts: Float32Array
  vis: number
}

function makeTube() {
  const geo = new THREE.BufferGeometry()
  const n = PTS * RAD
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
  geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n * 3), 3))
  const idx: number[] = []
  for (let i = 0; i < SEG; i++)
    for (let j = 0; j < RAD; j++) {
      const a = i * RAD + j
      const b = i * RAD + ((j + 1) % RAD)
      const c = (i + 1) * RAD + j
      const d = (i + 1) * RAD + ((j + 1) % RAD)
      idx.push(a, c, b, b, c, d)
    }
  geo.setIndex(idx)
  return geo
}

const _t = new THREE.Vector3()
const _n = new THREE.Vector3()
const _b = new THREE.Vector3()
const _p = new THREE.Vector3()

/** Sweep a small ring along `pts` (parallel-transport frames) in place. */
function fillTube(geo: THREE.BufferGeometry, pts: Float32Array, radius: number) {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute
  const nor = geo.getAttribute('normal') as THREE.BufferAttribute
  for (let i = 0; i < PTS; i++) {
    const i0 = Math.max(0, i - 1)
    const i1 = Math.min(PTS - 1, i + 1)
    _t.set(pts[i1 * 3] - pts[i0 * 3], pts[i1 * 3 + 1] - pts[i0 * 3 + 1], pts[i1 * 3 + 2] - pts[i0 * 3 + 2])
    if (_t.lengthSq() < 1e-10) _t.set(0, -1, 0)
    _t.normalize()
    if (i === 0) {
      _n.set(0, 0, 1)
      if (Math.abs(_t.z) > 0.9) _n.set(1, 0, 0)
    }
    _n.addScaledVector(_t, -_n.dot(_t)).normalize()
    _b.crossVectors(_t, _n)
    for (let j = 0; j < RAD; j++) {
      const a = (j / RAD) * Math.PI * 2
      const cx = Math.cos(a)
      const sy = Math.sin(a)
      const nx = _n.x * cx + _b.x * sy
      const ny = _n.y * cx + _b.y * sy
      const nz = _n.z * cx + _b.z * sy
      const k = i * RAD + j
      pos.setXYZ(k, pts[i * 3] + nx * radius, pts[i * 3 + 1] + ny * radius, pts[i * 3 + 2] + nz * radius)
      nor.setXYZ(k, nx, ny, nz)
    }
  }
  pos.needsUpdate = true
  nor.needsUpdate = true
}

export function DataStreams() {
  const { L } = useScene()
  const cableMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#6a6663',
        metalness: 0.3,
        roughness: 0.45,
        emissive: '#ff8b1f',
        emissiveIntensity: 0.1,
        side: THREE.DoubleSide,
      }),
    [],
  )

  const S3N = 6
  const cables = useMemo(() => {
    const list: Cable[] = []
    const mk = (kind: Kind, j: number) => {
      const geo = makeTube()
      const mesh = new THREE.Mesh(geo, cableMat)
      mesh.frustumCulled = false
      list.push({ kind, j, geo, mesh, pts: new Float32Array(PTS * 3), vis: 0 })
    }
    for (let j = 0; j < 8; j++) mk('upA', j)
    for (let j = 0; j < 8; j++) mk('upB', j)
    for (let j = 0; j < 8; j++) mk('down', j)
    for (let j = 0; j < S3N; j++) mk('s3', j)
    return list
  }, [cableMat])
  const groupRef = useRef<THREE.Group>(null)

  // routes: A = up+down through the fabric, B = row-B up only, S = storage → S3
  const routes = useMemo(() => {
    const r: number[][] = []
    for (let j = 0; j < 8; j++) r.push([j, 16 + j]) // upA j, down j
    for (let j = 0; j < 8; j++) r.push([8 + j])
    for (let j = 0; j < S3N; j++) r.push([24 + j])
    return r
  }, [])

  const PPR = L.packetsPerRoute
  const total = routes.length * PPR
  const packets = useMemo(
    () =>
      Array.from({ length: total }, (_, i) => ({
        route: Math.floor(i / PPR),
        u: (i % PPR) / PPR + hash(i + 3) * 0.08,
        v: 0.15 + hash(i + 11) * 0.08,
        r0: hash(i + 23),
      })),
    [total, PPR],
  )
  const pmesh = useRef<THREE.InstancedMesh>(null)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const color = useMemo(() => new THREE.Color(), [])
  const curve = useMemo(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]), [])
  const last = useRef({ sig: -1 })
  const tmp = useMemo(() => [0, 0, 0] as [number, number, number], [])

  useEffect(() => {
    // allocate the instance colour buffer once
    const m = pmesh.current
    if (m) m.setColorAt(0, color.set('#ff8b1f'))
    const g = groupRef.current
    if (g) cables.forEach((c) => g.add(c.mesh))
    return () => {
      cables.forEach((c) => {
        g?.remove(c.mesh)
        c.geo.dispose()
      })
    }
  }, [cables, color])

  const A = useMemo(() => new THREE.Vector3(), [])
  const B = useMemo(() => new THREE.Vector3(), [])
  const P1 = useMemo(() => new THREE.Vector3(), [])
  const P2 = useMemo(() => new THREE.Vector3(), [])

  useFrame((state, rawDt) => {
    const dt = world.reduced ? 0 : Math.min(rawDt, 0.05)
    const st = world.cur
    const c = smootherstep(st.chaos)
    const wide = 1 + st.spread * 0.32
    const rowB = smoothstep(st.rowB)
    const introCables = smootherstep(clamp((world.intro - 0.5) / 0.4))
    const s3vis = smoothstep((st.s3 - 0.2) / 0.4) * introCables

    // ── rebuild cables only when something they depend on has moved ──────────
    let sig = c * 1000 + wide * 100 + rowB * 10 + st.expand * 7 + st.s3 * 5 + introCables * 3
    for (let k = 0; k < 8; k++) {
      const p = world.poses[k]
      sig += p.x + p.y * 1.3 + p.z * 1.7 + p.ry * 2 + p.scale * 3
    }
    if (Math.abs(sig - last.current.sig) > 1e-3) {
      last.current.sig = sig
      const slabTop = L.slabY + 0.2
      const slabBot = L.slabY - 0.2
      const baseR = L.mobile ? 0.042 : 0.032
      const s3Top = L.s3Y + (L.s3Layers - 1) * L.s3Pitch + L.s3Size / 2 + 0.03
      const stoBot = lerp(L.storageTierYs[1], L.storageTierYs[3], st.expand) - 0.24
      const zMid = L.storageZs[Math.floor(L.storageZs.length / 2)]

      for (const cab of cables) {
        const { kind, j } = cab
        let vis = 1
        if (kind === 'upA' || kind === 'upB') {
          const k = (kind === 'upA' ? 0 : 4) + (j >> 1)
          const side = j & 1 ? 1 : -1
          nodeLocal(world.poses[k], side * 0.65, -0.86, 0.3, tmp)
          A.set(tmp[0], tmp[1], tmp[2])
          B.set(A.x, slabTop, A.z)
          if (c > 0.001) {
            const col = (j * 3 + 2) % 8
            B.x = lerp(B.x, colX(col, L, wide), c)
            B.y = lerp(B.y, L.storageTopY, c)
            B.z = lerp(B.z, zMid + (hash(j + 5) - 0.5) * 1.2, c)
          }
          const wx = (hash(j + 1) - 0.5) * 6.4 * L.xScale * c
          const wz = (hash(j + 9) - 0.5) * 4.4 * c
          P1.lerpVectors(A, B, 0.33).add(_p.set(wx, (hash(j + 2) - 0.3) * 1.6 * c, wz))
          P2.lerpVectors(A, B, 0.66).add(_p.set(-wx * 0.8, (hash(j + 4) - 0.6) * 1.6 * c, -wz * 0.9))
          if (kind === 'upB') vis = rowB * (1 - c)
          else vis = introCables
        } else if (kind === 'down') {
          const x = colX(j, L, wide)
          const S = _p.set(x, slabBot, 0)
          B.set(x, L.storageTopY, 0)
          A.set(S.x, lerp(S.y, B.y, c), lerp(S.z, B.z, c))
          P1.lerpVectors(A, B, 0.33)
          P2.lerpVectors(A, B, 0.66)
          vis = (1 - c) * introCables
        } else {
          const half = (L.s3Cols * L.s3Pitch) / 2 - 0.7
          const x = lerp(-half, half, j / (S3N - 1)) * 0.9
          A.set(x, stoBot, 0)
          B.set(x, s3Top, 0)
          P1.lerpVectors(A, B, 0.33)
          P2.lerpVectors(A, B, 0.66)
          vis = (1 - c) * s3vis
        }
        curve.points[0].copy(A)
        curve.points[1].copy(P1)
        curve.points[2].copy(P2)
        curve.points[3].copy(B)
        for (let i = 0; i < PTS; i++) {
          curve.getPoint(i / SEG, _t)
          cab.pts[i * 3] = _t.x
          cab.pts[i * 3 + 1] = _t.y
          cab.pts[i * 3 + 2] = _t.z
        }
        cab.vis = vis
        cab.mesh.visible = vis > 0.03
        if (cab.mesh.visible) fillTube(cab.geo, cab.pts, baseR * smoothstep(vis))
      }
    }
    cableMat.emissiveIntensity = 0.08 + st.busy * 0.22 * (1 - c * 0.5)

    // ── packets ──────────────────────────────────────────────────────────────
    const pm = pmesh.current
    if (!pm) return
    const pUp = 0.5 - 0.5 * st.flowBias
    const pace = st.speed * (0.35 + 0.65 * (1 - c))
    const bright = (0.7 + 0.9 * st.busy) * (1 - c * 0.45)
    const active = introCables
    for (let i = 0; i < total; i++) {
      const p = packets[i]
      p.u = (p.u + p.v * pace * dt) % 1
      const route = routes[p.route]
      const n = route.length * PTS
      // visibility of the whole route
      let vis = p.route < 8 ? active : p.route < 16 ? rowB * (1 - c) : s3vis * (1 - c)
      if (p.route < 8 && st.solo > 0.01 && p.route > 1) vis *= 1 - st.solo * 0.9
      const dirUp = p.r0 < pUp
      const flip = Math.min(1, Math.abs(p.r0 - pUp) * 7)
      const u = dirUp ? 1 - p.u : p.u
      const fi = u * (n - 1)
      let i0 = Math.floor(fi)
      if (i0 >= n - 1) i0 = n - 2
      const f = fi - i0
      const ca = cables[route[Math.floor(i0 / PTS)]]
      const cb = cables[route[Math.floor((i0 + 1) / PTS)]]
      const la = i0 % PTS
      const lb = (i0 + 1) % PTS
      const ax = ca.pts[la * 3]
      const ay = ca.pts[la * 3 + 1]
      const az = ca.pts[la * 3 + 2]
      const bx = cb.pts[lb * 3]
      const by = cb.pts[lb * 3 + 1]
      const bz = cb.pts[lb * 3 + 2]
      dummy.position.set(lerp(ax, bx, f), lerp(ay, by, f), lerp(az, bz, f))
      const dx = (bx - ax) * (dirUp ? -1 : 1)
      const dy = (by - ay) * (dirUp ? -1 : 1)
      const dz = (bz - az) * (dirUp ? -1 : 1)
      if (dx * dx + dy * dy + dz * dz > 1e-8) {
        dummy.lookAt(dummy.position.x + dx, dummy.position.y + dy, dummy.position.z + dz)
      }
      const edge = smoothstep(p.u / 0.07) * smoothstep((1 - p.u) / 0.07)
      const sz = vis * flip * edge * (0.55 + 0.45 * st.busy)
      dummy.scale.set(sz + 0.0001, sz + 0.0001, sz * (1 + Math.min(1.2, pace * 0.35)) + 0.0001)
      dummy.updateMatrix()
      pm.setMatrixAt(i, dummy.matrix)
      pm.setColorAt(i, color.setRGB(1.0 * bright * 1.15, 0.5 * bright * 1.15, 0.08 * bright * 1.15))
    }
    pm.instanceMatrix.needsUpdate = true
    if (pm.instanceColor) pm.instanceColor.needsUpdate = true
    void state
  })

  return (
    <>
      <group ref={groupRef} />
      <instancedMesh ref={pmesh} args={[undefined, undefined, total]} frustumCulled={false}>
        <boxGeometry args={[0.055, 0.055, 0.16]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
    </>
  )
}
