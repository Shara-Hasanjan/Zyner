import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../../lib/store'
import { clamp, hash, smootherstep } from '../../lib/math'
import { useScene } from './SceneContext'
import { stageWeight } from './ServerNodes'

/** S3: a cool-steel lattice of object cubes. Warms to amber as it becomes active. */
export function S3Layer() {
  const { L, mats } = useScene()
  const mesh = useRef<THREE.InstancedMesh>(null)
  const frameRef = useRef<THREE.LineSegments>(null)
  const { s3Cols: C, s3Rows: R, s3Layers: Y, s3Pitch: P, s3Size: S } = L
  const count = C * R * Y
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const glow = useMemo(() => new Float32Array(count), [count])
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(S, S, S)
    g.setAttribute('aGlow', new THREE.InstancedBufferAttribute(glow, 1))
    return g
  }, [S, glow])
  const seeds = useMemo(() => Array.from({ length: count }, (_, i) => hash(i + 7)), [count])
  const wire = useMemo(() => {
    const w = C * P + 0.5
    const d = R * P + 0.5
    const h = Y * P + 0.4
    return new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d))
  }, [C, R, Y, P])

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const st = world.cur
    const t = world.reduced ? 0 : state.clock.elapsedTime
    const intro = smootherstep(clamp((world.intro - 0.55) / 0.4))
    const w5 = stageWeight(st.stage, 5)
    const a = clamp(st.s3 + w5 * 0.3)
    const act = a * a
    let i = 0
    for (let y = 0; y < Y; y++)
      for (let r = 0; r < R; r++)
        for (let c = 0; c < C; c++, i++) {
          const x = (c - (C - 1) / 2) * P
          const z = (r - (R - 1) / 2) * P
          dummy.position.set(x, L.s3Y + y * P, z)
          const grow = smootherstep(clamp(intro * 1.6 - seeds[i] * 0.6))
          dummy.scale.setScalar(0.001 + 0.999 * grow)
          dummy.updateMatrix()
          m.setMatrixAt(i, dummy.matrix)
          const wave = Math.pow(0.5 + 0.5 * Math.sin(x * 0.75 - t * 2.1 * st.speed + z * 0.5 + seeds[i] * 2), 4)
          glow[i] = 0.08 + act * (0.18 + wave * 0.95)
        }
    m.instanceMatrix.needsUpdate = true
    ;(geo.getAttribute('aGlow') as THREE.InstancedBufferAttribute).needsUpdate = true
    const f = frameRef.current
    if (f) {
      f.position.set(0, L.s3Y + ((Y - 1) * P) / 2, 0)
      ;(f.material as THREE.LineBasicMaterial).opacity = (0.2 + a * 0.55) * intro
    }
  })

  return (
    <>
      <instancedMesh ref={mesh} args={[geo, mats.s3, count]} frustumCulled={false} />
      <lineSegments ref={frameRef} geometry={wire}>
        <lineBasicMaterial color="#9aa2aa" transparent opacity={0.3} depthWrite={false} />
      </lineSegments>
    </>
  )
}
