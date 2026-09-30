import { createContext, useContext } from 'react'
import type { Layout } from '../../lib/layout3d'
import type { Materials } from '../../lib/three/materials'

export interface SceneCtx {
  L: Layout
  mats: Materials
  shadows: boolean
}

export const SceneContext = createContext<SceneCtx | null>(null)

export function useScene() {
  const c = useContext(SceneContext)
  if (!c) throw new Error('SceneContext missing')
  return c
}
