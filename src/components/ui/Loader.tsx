import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { world } from '../../lib/store'
import { stopSmoothScroll } from '../../lib/scroll'

const ROWS: [string, string][] = [
  ['Compute nodes', 'Ready'],
  ['Storage layer', 'Ready'],
  ['S3', 'Connected'],
  ['Data fabric', 'Online'],
]

/**
 * Brief branded intro. It waits for the first WebGL frame, then lifts away and
 * hands over to the scene's own assembly animation.
 */
export function Loader({
  sceneReady,
  onLift,
  onDone,
}: {
  sceneReady: boolean
  onLift: () => void
  onDone: () => void
}) {
  const root = useRef<HTMLDivElement>(null)
  const pct = useRef<HTMLSpanElement>(null)
  const state = useRef({ v: 0, minDone: false, finished: false })
  const tween = useRef<gsap.core.Tween | null>(null)

  const finish = () => {
    const r = root.current
    if (!r || state.current.finished) return
    state.current.finished = true
    const set = (v: number) => {
      r.style.setProperty('--load', String(v))
      if (pct.current) pct.current.textContent = String(Math.round(v * 100)).padStart(3, '0')
    }
    gsap.to(state.current, {
      v: 1,
      duration: world.reduced ? 0.01 : 0.35,
      ease: 'power2.out',
      onUpdate: () => set(state.current.v),
      onComplete: () => {
        r.querySelectorAll('.loader__row').forEach((el) => el.classList.add('is-on'))
        set(1)
        world.ready = true
        document.documentElement.classList.add('is-ready')
        window.setTimeout(
          () => {
            r.classList.add('is-done')
            onLift()
            gsap.to(world, { intro: 1, duration: world.reduced ? 0.01 : 3.8, ease: 'power2.inOut', delay: world.reduced ? 0 : 0.2 })
            window.setTimeout(() => {
              document.documentElement.style.overflow = ''
              stopSmoothScroll(false)
              onDone()
            }, world.reduced ? 0 : 900)
          },
          world.reduced ? 0 : 300,
        )
      },
    })
  }

  useEffect(() => {
    const r = root.current
    if (!r) return
    history.scrollRestoration = 'manual'
    window.scrollTo(0, 0)
    document.documentElement.style.overflow = 'hidden'
    stopSmoothScroll(true)
    const rows = Array.from(r.querySelectorAll('.loader__row'))
    const set = (v: number) => {
      r.style.setProperty('--load', String(v))
      if (pct.current) pct.current.textContent = String(Math.round(v * 100)).padStart(3, '0')
      rows.forEach((el, i) => el.classList.toggle('is-on', v >= (i + 1) * 0.22 && i < 3))
    }
    tween.current = gsap.to(state.current, {
      v: 0.88,
      duration: world.reduced ? 0.2 : 1.5,
      ease: 'power1.inOut',
      onUpdate: () => set(state.current.v),
      onComplete: () => {
        state.current.minDone = true
        if (sceneReadyRef.current) finish()
      },
    })
    return () => {
      tween.current?.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sceneReadyRef = useRef(sceneReady)
  useEffect(() => {
    sceneReadyRef.current = sceneReady
    if (sceneReady && state.current.minDone) finish()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneReady])

  return (
    <div ref={root} className="loader" role="status" aria-label="Loading Japolic">
      <div className="loader__inner">
        <div className="loader__brand">JAPOLIC</div>
        <p className="loader__sub mono">Initializing data fabric</p>
        <div className="loader__rows mono">
          {ROWS.map(([a, b]) => (
            <div className="loader__row" key={a}>
              <span>{a}</span>
              <span className="dots" aria-hidden="true" />
              <b>{b}</b>
            </div>
          ))}
        </div>
        <div className="loader__bar" aria-hidden="true">
          <i />
        </div>
        <div className="loader__pct mono" aria-hidden="true">
          <span>System</span>
          <span ref={pct}>000</span>
        </div>
      </div>
    </div>
  )
}
