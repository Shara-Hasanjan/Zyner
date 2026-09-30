import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { ToneMappingMode } from 'postprocessing'
import * as THREE from 'three'
import { makeLayout } from '../../lib/layout3d'
import { makeMaterials } from '../../lib/three/materials'
import { world } from '../../lib/store'
import { SceneContext } from './SceneContext'
import { Director } from './Director'
import { Lighting } from './Lighting'
import { Backdrop } from './Backdrop'
import { ServerNodes } from './ServerNodes'
import { JapolicLayer } from './JapolicLayer'
import { StorageField } from './StorageField'
import { S3Layer } from './S3Layer'
import { DataStreams } from './DataStreams'
import { FocusFrames } from './FocusFrames'

/**
 * Pre-warms the GPU, then signals the DOM that the scene is ready. Objects that start
 * hidden (second server row, cables, disks, S3 links) would otherwise compile shaders and
 * upload textures the first time they appear mid-scroll, which shows up as a freeze.
 */
function ReadySignal({ onReady }: { onReady: () => void }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    let id2 = 0
    const id = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        const hidden: THREE.Object3D[] = []
        try {
          scene.traverse((o) => {
            if (!o.visible) {
              hidden.push(o)
              o.visible = true
            }
          })
          gl.compile(scene, camera)
          gl.render(scene, camera) // builds depth/shadow programs and uploads textures too
        } catch {
          /* warm-up is best-effort */
        } finally {
          hidden.forEach((o) => (o.visible = false))
        }
        onReady()
      })
    })
    return () => {
      cancelAnimationFrame(id)
      cancelAnimationFrame(id2)
    }
  }, [onReady, gl, scene, camera])
  return null
}

/**
 * Quality safety net: if the device sustains under ~30fps after warm-up, drop the
 * pixel ratio and switch off post-processing. `?quality=high|low` overrides for testing.
 */
function AdaptiveQuality({ onLow }: { onLow: () => void }) {
  const setDpr = useThree((s) => s.setDpr)
  const acc = useRef({ frames: 0, t: 0, windows: 0, done: false })
  useFrame((_, dt) => {
    const a = acc.current
    if (a.done || dt > 0.3) return
    a.frames++
    if (a.frames <= 90) return // shader compilation and intro
    a.t += dt
    if ((a.frames - 90) % 120 === 0) {
      if (a.t / 120 > 0.034) {
        a.done = true
        setDpr(1)
        onLow()
      }
      a.t = 0
      if (++a.windows >= 4) a.done = true
    }
  })
  return null
}

export default function SceneCanvas({ onReady, covered }: { onReady: () => void; covered: boolean }) {
  const mobile = world.mobile
  const L = useMemo(() => makeLayout(mobile), [mobile])
  const mats = useMemo(() => makeMaterials(L), [L])
  const forced = new URLSearchParams(window.location.search).get('quality')
  const [low, setLow] = useState(forced === 'low')
  const [shadows] = useState(!mobile && forced !== 'low')
  const ctx = useMemo(() => ({ L, mats, shadows }), [L, mats, shadows])

  return (
    <Canvas
      className="stage__canvas"
      frameloop={covered ? 'never' : 'always'}
      dpr={mobile ? [1, 1.3] : [1, 1.5]}
      shadows={shadows ? 'percentage' : false}
      camera={{ fov: 30, near: 0.5, far: 120, position: [10, 5, 20] }}
      gl={{
        antialias: mobile,
        powerPreference: 'high-performance',
        toneMapping: mobile ? THREE.ACESFilmicToneMapping : THREE.NoToneMapping,
        toneMappingExposure: 1.05,
      }}
      onCreated={({ scene }) => {
        scene.background = new THREE.Color('#0b0a09')
        scene.fog = new THREE.Fog('#0b0a09', 26, 62)
      }}
    >
      <SceneContext.Provider value={ctx}>
        <Director />
        <Lighting />
        <Backdrop />
        <ServerNodes />
        <JapolicLayer />
        <StorageField />
        <S3Layer />
        <DataStreams />
        <FocusFrames />
        {forced !== 'high' && <AdaptiveQuality onLow={() => setLow(true)} />}
        {!mobile && !low && (
          <EffectComposer multisampling={2} enableNormalPass={false}>
            <Bloom mipmapBlur intensity={0.55} luminanceThreshold={0.85} luminanceSmoothing={0.25} radius={0.7} />
            <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            <Vignette offset={0.28} darkness={0.7} />
            <Noise opacity={0.035} />
          </EffectComposer>
        )}
        <ReadySignal onReady={onReady} />
      </SceneContext.Provider>
    </Canvas>
  )
}
