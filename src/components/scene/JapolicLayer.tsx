import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../../lib/store'
import { smootherstep, smoothstep, clamp, hash } from '../../lib/math'
import { colX } from '../../lib/pose'
import { useScene } from './SceneContext'

const fabricVert = /* glsl */ `
  varying vec2 vP;
  void main() {
    vP = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
// Travelling bands across a fine grid: the "data fabric" doing work.
const fabricFrag = /* glsl */ `
  varying vec2 vP;
  uniform float uTime;
  uniform float uAmt;
  uniform float uSpeed;
  uniform vec3 uColor;
  float grid(vec2 p, float s) {
    vec2 q = p / s;
    vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    float fine = grid(vP, 0.5);
    float wave = pow(0.5 + 0.5 * sin(vP.x * 0.85 - uTime * 2.6 * uSpeed + vP.y * 0.35), 7.0);
    float a = fine * (0.05 + wave * 0.85) * uAmt;
    gl_FragColor = vec4(uColor * (1.0 + wave * 1.6), a);
  }
`

/** The Japolic data-fabric slab that sits between compute and storage. */
export function JapolicLayer() {
  const { L, mats, shadows } = useScene()
  const group = useRef<THREE.Group>(null)
  const light = useRef<THREE.PointLight>(null)
  const seam = useRef<THREE.Mesh>(null)
  const lanes = useRef<THREE.InstancedMesh>(null)
  const fabric = useRef<THREE.ShaderMaterial>(null)

  const slabMats = useMemo(
    () => [mats.slabSide, mats.slabSide, mats.slabTop, mats.slabSide, mats.slabSide, mats.slabSide],
    [mats],
  )
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uAmt: { value: 1 }, uSpeed: { value: 1 }, uColor: { value: new THREE.Color('#ff8b1f') } }),
    [],
  )
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const LANES = 3
  const PER = 7
  const laneZ = useMemo(() => [-1.3, 0, 1.3].map((z) => z * (L.mobile ? 0.7 : 1)), [L])
  const laneSeed = useMemo(() => Array.from({ length: LANES * PER }, (_, i) => hash(i + 40)), [])

  useFrame((state, dt) => {
    const g = group.current
    if (!g) return
    const st = world.cur
    const intro = smootherstep(clamp((world.intro - 0.3) / 0.45))
    const j = smootherstep(st.japolic) * intro
    g.visible = j > 0.01
    g.scale.set(0.02 + 0.98 * j, 1, 1)
    // ignite during assembly
    const flash = 4 * clamp(st.japolic) * (1 - clamp(st.japolic)) * 1.3
    mats.slabTop.emissiveIntensity = (0.55 + st.busy * 0.55 + flash) * j
    if (seam.current) (seam.current.material as THREE.MeshBasicMaterial).opacity = j
    if (light.current) light.current.intensity = j * (7 + flash * 10 + st.busy * 5)
    const u = uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uAmt.value = j * (0.55 + st.busy * 0.6 + flash * 0.4)
    u.uSpeed.value = world.reduced ? 0 : st.speed

    // east–west lanes (distributed workloads)
    const lm = lanes.current
    if (lm) {
      const amt = smoothstep(st.lanes) * j
      const t = world.reduced ? 0 : state.clock.elapsedTime
      const half = (L.slabW - 1.2) / 2
      for (let i = 0; i < LANES * PER; i++) {
        const lane = i % LANES
        const dir = lane === 1 ? -1 : 1
        const p = (laneSeed[i] + t * 0.11 * st.speed * dir + i * 0.031) % 1
        const x = (p < 0 ? p + 1 : p) * 2 * half - half
        dummy.position.set(x, L.slabY + 0.2, laneZ[lane])
        dummy.scale.set(0.34 * amt + 0.0001, 0.06 * amt + 0.0001, 0.06 * amt + 0.0001)
        dummy.updateMatrix()
        lm.setMatrixAt(i, dummy.matrix)
      }
      lm.instanceMatrix.needsUpdate = true
      lm.visible = amt > 0.01
    }
    void dt
  })

  const ports = useMemo(() => Array.from({ length: 8 }, (_, j) => colX(j, L)), [L])

  return (
    <>
      <group ref={group} position={[0, L.slabY, 0]}>
        <mesh material={slabMats} castShadow={shadows} receiveShadow={shadows}>
          <boxGeometry args={[L.slabW, 0.28, L.slabD]} />
        </mesh>
        {/* signal seam along the front edge */}
        <mesh ref={seam} position={[0, 0.14, L.slabD / 2 + 0.002]}>
          <boxGeometry args={[L.slabW, 0.03, 0.02]} />
          <meshBasicMaterial color={new THREE.Color('#ff9a2e').multiplyScalar(2.4)} toneMapped={false} transparent />
        </mesh>
        {/* travelling data bands */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.146, 0]}>
          <planeGeometry args={[L.slabW - 0.3, L.slabD - 0.3]} />
          <shaderMaterial
            ref={fabric}
            uniforms={uniforms}
            vertexShader={fabricVert}
            fragmentShader={fabricFrag}
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
        {/* ports the cables land on, above and below */}
        {ports.map((x, i) => (
          <group key={i} position={[x, 0, 0]}>
            <mesh position={[0, 0.16, i < 8 ? L.nodeZA + 0.3 : 0]} material={mats.frame}>
              <cylinderGeometry args={[0.1, 0.12, 0.06, 14]} />
            </mesh>
            <mesh position={[0, -0.16, 0]} material={mats.frame}>
              <cylinderGeometry args={[0.1, 0.12, 0.06, 14]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* Lives outside the slab group: toggling a light's visibility changes the light count and recompiles every lit shader. */}
      <pointLight ref={light} position={[0, L.slabY + 1.2, 1.5]} color="#ff8b1f" distance={13} decay={2} intensity={0} />
      <instancedMesh ref={lanes} args={[undefined, undefined, LANES * PER]} material={mats.amber} frustumCulled={false}>
        <boxGeometry args={[1, 1, 1]} />
      </instancedMesh>
    </>
  )
}
