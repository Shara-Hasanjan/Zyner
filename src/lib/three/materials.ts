import * as THREE from 'three'
import { brushedRoughness, cubeEdges, serverFront, slabTop, storageFace } from './textures'
import type { Layout } from '../layout3d'

const AMBER = new THREE.Color('#ff8b1f')

/** Adds a per-instance `aGlow` attribute that scales the emissive term. */
export function withInstanceGlow<T extends THREE.MeshStandardMaterial>(m: T) {
  m.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aGlow;\nvarying float vGlow;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = aGlow;')
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vGlow;')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance *= vGlow;')
  }
  return m
}

export interface Materials {
  chassis: THREE.MeshStandardMaterial
  frame: THREE.MeshStandardMaterial
  rubber: THREE.MeshStandardMaterial
  slabSide: THREE.MeshStandardMaterial
  slabTop: THREE.MeshStandardMaterial
  storage: THREE.MeshStandardMaterial
  s3: THREE.MeshStandardMaterial
  serverFront: { map: THREE.Texture; emissive: THREE.Texture }
  amber: THREE.MeshBasicMaterial
  copy: THREE.MeshStandardMaterial
}

export function makeMaterials(L: Layout): Materials {
  const rough = brushedRoughness()
  const front = serverFront()
  const sto = storageFace()
  const slab = slabTop(L.slabW, L.slabD)
  const edges = cubeEdges()

  const chassis = new THREE.MeshStandardMaterial({
    color: '#4a4744',
    metalness: 0.85,
    roughness: 0.42,
    roughnessMap: rough,
    envMapIntensity: 0.9,
  })
  const frame = new THREE.MeshStandardMaterial({ color: '#1b1a19', metalness: 0.9, roughness: 0.5, roughnessMap: rough })
  const rubber = new THREE.MeshStandardMaterial({ color: '#0d0d0c', metalness: 0.1, roughness: 0.75 })
  const slabSide = new THREE.MeshStandardMaterial({
    color: '#232221',
    metalness: 0.9,
    roughness: 0.4,
    roughnessMap: rough,
    envMapIntensity: 0.9,
  })
  const slabTopMat = new THREE.MeshStandardMaterial({
    color: '#161514',
    metalness: 0.85,
    roughness: 0.38,
    roughnessMap: rough,
    emissive: AMBER,
    emissiveMap: slab,
    emissiveIntensity: 1,
    envMapIntensity: 0.55,
  })
  const storage = withInstanceGlow(
    new THREE.MeshStandardMaterial({
      color: '#3a3836',
      map: sto.map,
      metalness: 0.8,
      roughness: 0.4,
      roughnessMap: rough,
      emissive: '#ffffff',
      emissiveMap: sto.emissive,
      emissiveIntensity: 1.4,
      envMapIntensity: 0.9,
    }),
  )
  const s3 = withInstanceGlow(
    new THREE.MeshStandardMaterial({
      color: '#7d858d',
      metalness: 0.65,
      roughness: 0.42,
      roughnessMap: rough,
      emissive: AMBER,
      emissiveMap: edges,
      emissiveIntensity: 1.6,
      envMapIntensity: 0.8,
    }),
  )
  const amber = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff9a2e').multiplyScalar(2.2), toneMapped: false })
  const copy = new THREE.MeshStandardMaterial({
    color: '#2a2826',
    metalness: 0.7,
    roughness: 0.5,
    emissive: AMBER,
    emissiveIntensity: 0.35,
  })
  return { chassis, frame, rubber, slabSide, slabTop: slabTopMat, storage, s3, serverFront: front, amber, copy }
}
