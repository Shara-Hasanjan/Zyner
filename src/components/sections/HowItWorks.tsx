import { useEffect, useState } from 'react'
import { Chapter } from '../ui/Chapter'
import { Lines } from '../ui/Lines'
import { useChapterStep } from '../../hooks/useScrollProgress'
import { LAYERS } from '../../lib/content'
import { world } from '../../lib/store'

/**
 * Interactive architecture. Scrolling walks down the stack; hovering or focusing a
 * layer takes over, and the 3D camera, outline and data paths follow.
 */
export function HowItWorks() {
  const step = useChapterStep(4, 4, 0.05, 0.95)
  const [pick, setPick] = useState<number | null>(null)
  const active = pick ?? step

  useEffect(() => {
    world.focus = active
    return () => {
      world.focus = -1
    }
  }, [active])

  return (
    <Chapter index={4} id="technology" height="320vh" panel="left" className="how" labelledBy="how-title">
      <div className="grid">
        <div className="how__copy">
          <h2 id="how-title" className="display display--l how__h">
            <Lines lines={['Four layers.', <em key="e">One path.</em>]} />
          </h2>
          <p className="how__apps mono">Applications</p>
          <ol className="layers" onMouseLeave={() => setPick(null)}>
            {LAYERS.map((l, i) => (
              <li key={l.name} className={`layer ${active === i ? 'is-on' : ''}`}>
                <button
                  className="layer__btn"
                  aria-expanded={active === i}
                  onMouseEnter={() => setPick(i)}
                  onFocus={() => setPick(i)}
                  onBlur={() => setPick(null)}
                  onClick={() => setPick(i)}
                >
                  <span className="layer__n mono">0{i + 1}</span>
                  <span className="layer__t">{l.name}</span>
                  <span className="layer__tag mono">{l.tag}</span>
                </button>
                <div className="layer__d">
                  <div>
                    <p>{l.text}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </Chapter>
  )
}
