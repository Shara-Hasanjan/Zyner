import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { world } from '../../lib/store'
import { hash } from '../../lib/math'
import { useScene } from './SceneContext'

const gridVert = /* glsl */ `
  varying vec2 vP;
  uniform float uOrient;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vP = uOrient > 0.5 ? w.xz : w.xy;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`

const gridFrag = /* glsl */ `
  varying vec2 vP;
  uniform vec2 uCenter;
  uniform float uReach;
  uniform float uAmt;
  float grid(vec2 p, float s) {
    vec2 q = p / s;
    vec2 g = abs(fract(q - 0.5) - 0.5) / fwidth(q);
    return 1.0 - min(min(g.x, g.y), 1.0);
  }
  void main() {
    float fade = 1.0 - smoothstep(uReach * 0.25, uReach, length(vP - uCenter));
    float a = (grid(vP, 1.0) * 0.06 + grid(vP, 5.0) * 0.16) * fade * uAmt;
    gl_FragColor = vec4(vec3(0.78, 0.72, 0.62), a);
  }
`

function GridPlane({
  orient,
  center,
  reach,
  position,
  rotation,
}: {
  orient: 0 | 1
  center: [number, number]
  reach: number
  position: [number, number, number]
  rotation?: [number, number, number]
}) {
  const u = useMemo(
    () => ({
      uOrient: { value: orient },
      uCenter: { value: new THREE.Vector2(...center) },
      uReach: { value: reach },
      uAmt: { value: 1 },
    }),
    [orient, center, reach],
  )
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[120, 120]} />
      <shaderMaterial
        uniforms={u}
        vertexShader={gridVert}
        fragmentShader={gridFrag}
        transparent
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  )
}

const dustVert = /* glsl */ `
  uniform float uTime;
  uniform float uScale;
  attribute float aSeed;
  varying float vA;
  void main() {
    vec3 p = position;
    p.y += sin(uTime * 0.12 + aSeed * 40.0) * 0.6;
    p.x += cos(uTime * 0.09 + aSeed * 25.0) * 0.5;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = uScale * (0.8 + aSeed) / -mv.z;
    vA = 0.25 + aSeed * 0.35;
    gl_Position = projectionMatrix * mv;
  }
`
const dustFrag = /* glsl */ `
  varying float vA;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    gl_FragColor = vec4(0.95, 0.9, 0.8, vA * (1.0 - d * 2.0));
  }
`

function Dust() {
  const { L } = useScene()
  const n = world.reduced ? Math.floor(L.dust / 3) : L.dust
  const mat = useRef<THREE.ShaderMaterial>(null)
  const { pos, seed } = useMemo(() => {
    const pos = new Float32Array(n * 3)
    const seed = new Float32Array(n)
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (hash(i) - 0.5) * 34
      pos[i * 3 + 1] = hash(i + 100) * 20 - 11
      pos[i * 3 + 2] = (hash(i + 200) - 0.5) * 24
      seed[i] = hash(i + 300)
    }
    return { pos, seed }
  }, [n])
  useFrame((s) => {
    if (mat.current && !world.reduced) mat.current.uniforms.uTime.value = s.clock.elapsedTime
  })
  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[pos, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seed, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={mat}
        uniforms={{ uTime: { value: 0 }, uScale: { value: 60 } }}
        vertexShader={dustVert}
        fragmentShader={dustFrag}
        transparent
        depthWrite={false}
      />
    </points>
  )
}

/** Architectural drawing planes: a floor and a back wall of fine grid, plus drifting dust. */
export function Backdrop() {
  return (
    <>
      <GridPlane orient={1} center={[0, 0]} reach={36} rotation={[-Math.PI / 2, 0, 0]} position={[0, -7.6, 0]} />
      <GridPlane orient={0} center={[0, -3]} reach={34} position={[0, 0, -12]} />
      <Dust />
    </>
  )
}
