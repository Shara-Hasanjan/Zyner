import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../../lib/store'
import { clamp, hash, smootherstep, smoothstep } from '../../lib/math'
import { colX } from '../../lib/pose'
import { useScene } from './SceneContext'
import { stageWeight } from './ServerNodes'

/** Shared storage: instanced drive sleds. Scatter when fragmented, stack higher when expanded. */
export function StorageField() {
  const { L, mats, shadows } = useScene()
  const mesh = useRef<THREE.InstancedMesh>(null)
  const COLS = 8
  const rows = L.storageZs.length
  const tiers = L.storageTierYs.length
  const count = COLS * rows * tiers

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const glow = useMemo(() => new Float32Array(count), [count])
  const seeds = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        dx: (hash(i) - 0.5) * 2.4,
        dy: (hash(i + 90) - 0.5) * 1.1,
        dz: (hash(i + 180) - 0.5) * 2.4,
        ry: (hash(i + 270) - 0.5) * 1.1,
        ph: hash(i + 360) * 6.283,
      })),
    [count],
  )
  const geo = useMemo(() => {
    const g = new THREE.BoxGeometry(L.blockW, 0.42, L.blockD)
    g.setAttribute('aGlow', new THREE.InstancedBufferAttribute(glow, 1))
    return g
  }, [L, glow])

  useFrame((state) => {
    const m = mesh.current
    if (!m) return
    const st = world.cur
    const t = world.reduced ? 0 : state.clock.elapsedTime
    const intro = smootherstep(clamp((world.intro - 0.5) / 0.4))
    const c = smootherstep(st.chaos)
    const wide = 1 + st.spread * 0.32
    const w1 = stageWeight(st.stage, 1)
    const w3 = stageWeight(st.stage, 3)
    const w5 = stageWeight(st.stage, 5)
    let i = 0
    for (let tier = 0; tier < tiers; tier++) {
      const tierAmt = tier < 2 ? 1 : smoothstep(clamp(st.expand * 1.4 - (tier - 2) * 0.4))
      for (let r = 0; r < rows; r++) {
        for (let col = 0; col < COLS; col++, i++) {
          const sd = seeds[i]
          const x = colX(col, L, wide)
          const y = L.storageTierYs[tier]
          const z = L.storageZs[r]
          const a = intro * tierAmt
          dummy.position.set(
            x + sd.dx * c * L.xScale,
            y + sd.dy * c - (1 - a) * 1.5,
            z + sd.dz * c * (L.mobile ? 0.6 : 1),
          )
          dummy.rotation.set(0, sd.ry * c, 0)
          dummy.scale.setScalar(0.001 + 0.999 * a)
          dummy.updateMatrix()
          m.setMatrixAt(i, dummy.matrix)

          // activity: each sled breathes on its own phase; shared reads sweep across all of them
          const act = Math.pow(0.5 + 0.5 * Math.sin(t * (1.6 + st.speed) + sd.ph), 3)
          const sweep = Math.pow(0.5 + 0.5 * Math.sin(t * 2.4 * st.speed - col * 0.8 - r * 0.6), 5)
          let g = 0.16 + act * (0.25 + st.busy * 0.55)
          g += st.share * sweep * 0.9
          g += w1 * 0.55 + w3 * 0.25 + w5 * 0.45
          g *= 1 - c * 0.5
          if (st.expand > 0.05 && tier >= 2) g += 0.35 * st.expand
          glow[i] = clamp(g, 0, 1.6)
        }
      }
    }
    m.instanceMatrix.needsUpdate = true
    const attr = geo.getAttribute('aGlow') as THREE.InstancedBufferAttribute
    attr.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={mesh}
      args={[geo, mats.storage, count]}
      frustumCulled={false}
      castShadow={shadows}
      receiveShadow={shadows}
    />
  )
}
