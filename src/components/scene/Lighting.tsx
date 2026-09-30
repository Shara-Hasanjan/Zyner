import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../../lib/store'
import { damp } from '../../lib/math'
import { useScene } from './SceneContext'

/** A tiny studio built from emissive cards, baked to a PMREM map. No HDR file needed. */
function buildStudio() {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#080706')
  const card = (w: number, h: number, color: string, k: number, pos: [number, number, number], look: [number, number, number]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }),
    )
    m.position.set(...pos)
    m.lookAt(...look)
    scene.add(m)
  }
  card(16, 7, '#ffe2b8', 3.2, [0, 12, 4], [0, 0, 0]) // warm overhead softbox
  card(2.5, 12, '#fff0dc', 2.6, [-13, 3, 7], [0, 0, 0]) // key strip, left
  card(2, 10, '#cad6e8', 2.4, [12, 3, -9], [0, 0, 0]) // cool rim, right-back
  card(14, 3, '#ff9a4a', 0.9, [0, -9, 5], [0, 0, 0]) // low amber bounce
  card(10, 2, '#e9e3d8', 1.6, [0, 2, -14], [0, 0, 0]) // back fill
  return scene
}

export function Lighting() {
  const { shadows } = useScene()
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const key = useRef<THREE.DirectionalLight>(null)
  const rim = useRef<THREE.DirectionalLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])

  useEffect(() => {
    const pm = new THREE.PMREMGenerator(gl)
    const studio = buildStudio()
    const rt = pm.fromScene(studio, 0.03)
    scene.environment = rt.texture
    scene.environmentIntensity = world.mobile ? 0.5 : 0.7
    return () => {
      scene.environment = null
      rt.dispose()
      pm.dispose()
      studio.traverse((o) => {
        const m = o as THREE.Mesh
        m.geometry?.dispose()
        ;(m.material as THREE.Material | undefined)?.dispose()
      })
    }
  }, [gl, scene])

  // the key light quietly follows the camera target so highlights stay on the lens side
  useFrame((_, dt) => {
    const k = key.current
    if (!k) return
    const cam = world.pointer
    k.position.x += (7 + cam.x * 2 - k.position.x) * damp(2, dt)
  })

  return (
    <>
      <hemisphereLight args={['#ffe9d0', '#1a1512', 0.55]} />
      <ambientLight intensity={0.2} color="#ffe8cf" />
      <directionalLight
        ref={key}
        position={[7, 11, 9]}
        intensity={2.4}
        color="#ffe3c0"
        castShadow={shadows}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-9}
        shadow-camera-right={9}
        shadow-camera-top={9}
        shadow-camera-bottom={-9}
        shadow-camera-near={1}
        shadow-camera-far={40}
        shadow-bias={-0.0004}
        shadow-radius={5}
      />
      <directionalLight ref={rim} position={[-8, 5, -9]} intensity={1.3} color="#b9c8de" />
      <primitive object={target} />
    </>
  )
}
