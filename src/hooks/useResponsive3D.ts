import { useEffect, useState } from 'react'

/** Whether this device can run the 3D scene, and at what tier. */
export function useResponsive3D() {
  const [webgl, setWebgl] = useState<boolean | null>(null)
  useEffect(() => {
    try {
      const c = document.createElement('canvas')
      const ok = !!(window.WebGL2RenderingContext && c.getContext('webgl2'))
      setWebgl(ok)
    } catch {
      setWebgl(false)
    }
  }, [])
  return { webgl }
}
