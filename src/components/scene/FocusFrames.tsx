import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../../lib/store'
import { damp } from '../../lib/math'
import { useScene } from './SceneContext'

/** Amber bounding boxes that outline the layer selected in "How it works". */
export function FocusFrames() {
  const { L } = useScene()
  const refs = useRef<(THREE.LineSegments | null)[]>([])
  const boxes = useMemo(() => {
    const zs = L.storageZs
    const zSpan = zs[zs.length - 1] + L.blockD / 2 + 0.15
    const s3w = L.s3Cols * L.s3Pitch + 0.9
    const s3d = L.s3Rows * L.s3Pitch + 0.9
    const mk = (w: number, h: number, d: number, x: number, y: number, z: number) => {
      const g = new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d))
      return { g, pos: [x, y, z] as [number, number, number] }
    }
    return [
      mk(L.slabW + 0.5, 2.2, 5.6, 0, L.nodeY, -0.9),
      mk(L.slabW + 0.5, 0.75, L.slabD + 0.3, 0, L.slabY, 0),
      mk(L.slabW + 0.5, 2.2, zSpan * 2, 0, -2.7, 0),
      mk(s3w, 1.6, s3d, 0, L.s3Y + 0.3, 0),
    ]
  }, [L])

  useFrame((_, dt) => {
    const on = world.s > 3.9 && world.s < 5.05
    boxes.forEach((_, i) => {
      const l = refs.current[i]
      if (!l) return
      const m = l.material as THREE.LineBasicMaterial
      const t = on && world.focus === i ? 0.95 : 0
      m.opacity += (t - m.opacity) * damp(world.reduced ? 100 : 6, dt)
      l.visible = m.opacity > 0.01
    })
  })

  return (
    <>
      {boxes.map((b, i) => (
        <lineSegments
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          geometry={b.g}
          position={b.pos}
          visible={false}
        >
          <lineBasicMaterial color="#ff8b1f" transparent opacity={0} depthWrite={false} />
        </lineSegments>
      ))}
    </>
  )
}
