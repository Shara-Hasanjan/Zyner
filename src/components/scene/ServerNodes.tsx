import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../../lib/store'
import { smoothstep } from '../../lib/math'
import { useScene } from './SceneContext'

/** stage weights: how close the AI pipeline is to stage k (1..5) */
export const stageWeight = (stage: number, k: number) => Math.max(0, 1 - Math.abs(stage - k))

const unitY = [-0.5, 0, 0.5]
const boxUnit = new THREE.BoxGeometry(1.9, 0.44, 1.5)
const facePlane = new THREE.PlaneGeometry(1.86, 0.4)
const post = new THREE.BoxGeometry(0.07, 1.62, 0.07)
const plate = new THREE.BoxGeometry(2.02, 0.06, 1.62)
const foot = new THREE.BoxGeometry(0.16, 0.08, 0.16)
const disc = new THREE.CylinderGeometry(0.42, 0.42, 0.1, 28)
const ring = new THREE.TorusGeometry(0.42, 0.012, 6, 40)
const port = new THREE.CylinderGeometry(0.06, 0.07, 0.1, 10)

function ServerNode({ k }: { k: number }) {
  const { mats, shadows } = useScene()
  const group = useRef<THREE.Group>(null)
  const copies = useRef<THREE.Group>(null)
  const ledMat = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({
      map: mats.serverFront.map,
      emissiveMap: mats.serverFront.emissive,
      emissive: '#ff8b1f',
      emissiveIntensity: 1,
      metalness: 0.6,
      roughness: 0.55,
    })
    return m
  }, [mats])

  useFrame((state) => {
    const g = group.current
    if (!g) return
    const p = world.poses[k]
    const st = world.cur
    g.position.set(p.x, p.y, p.z)
    g.rotation.y = p.ry
    g.scale.setScalar(p.scale)
    g.visible = p.scale > 0.01

    const row = k < 4 ? 0 : 1
    const stageBoost =
      row === 0
        ? stageWeight(st.stage, 2) + stageWeight(st.stage, 3) + stageWeight(st.stage, 4) * 0.7
        : stageWeight(st.stage, 3) + stageWeight(st.stage, 4) * 0.6
    let busy = 0.3 + st.busy * 0.7 + stageBoost * 0.35
    if (st.solo > 0.01 && k !== 0) busy *= 1 - st.solo * 0.75
    const blink = world.reduced ? 1 : 0.75 + 0.25 * Math.sin(state.clock.elapsedTime * (2 + st.speed * 1.5) + k * 1.7)
    const chaosDim = 1 - st.chaos * 0.35
    ledMat.emissiveIntensity = busy * blink * chaosDim * 1.6

    if (copies.current) {
      const c = smoothstep(st.copies)
      copies.current.scale.setScalar(0.001 + c * 0.999)
      copies.current.visible = c > 0.01
    }
  })

  return (
    <group ref={group}>
      {unitY.map((y) => (
        <group key={y} position={[0, y, 0]}>
          <mesh geometry={boxUnit} material={mats.chassis} castShadow={shadows} receiveShadow={shadows} />
          <mesh geometry={facePlane} material={ledMat} position={[0, 0, 0.752]} />
        </group>
      ))}
      <mesh geometry={post} material={mats.frame} position={[-0.97, 0, 0.72]} />
      <mesh geometry={post} material={mats.frame} position={[0.97, 0, 0.72]} />
      <mesh geometry={plate} material={mats.frame} position={[0, 0.82, 0]} castShadow={shadows} />
      <mesh geometry={foot} material={mats.frame} position={[-0.85, -0.78, 0.6]} />
      <mesh geometry={foot} material={mats.frame} position={[0.85, -0.78, 0.6]} />
      <mesh geometry={port} material={mats.amber} position={[-0.65, -0.8, 0.3]} />
      <mesh geometry={port} material={mats.amber} position={[0.65, -0.8, 0.3]} />
      {/* duplicated local disks, only visible while the system is fragmented */}
      <group ref={copies} position={[0, -1.42, 0.2]}>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0, -i * 0.16, 0]}>
            <mesh geometry={disc} material={mats.copy} />
            <mesh geometry={ring} material={mats.amber} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} />
          </group>
        ))}
      </group>
    </group>
  )
}

export function ServerNodes() {
  return (
    <>
      {Array.from({ length: 8 }, (_, k) => (
        <ServerNode key={k} k={k} />
      ))}
    </>
  )
}
