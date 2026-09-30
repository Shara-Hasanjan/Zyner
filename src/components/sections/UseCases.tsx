import { useEffect, useState } from 'react'
import { Chapter } from '../ui/Chapter'
import { useChapterStep } from '../../hooks/useScrollProgress'
import { USE_CASES } from '../../lib/content'
import { world } from '../../lib/store'

/** Hovering a use case re-stages the infrastructure to show what it looks like. */
export function UseCases() {
  const step = useChapterStep(7, USE_CASES.length, 0.08, 0.92)
  const [pick, setPick] = useState<number | null>(null)
  const active = pick ?? step

  useEffect(() => {
    world.useCase = active
    return () => {
      world.useCase = -1
    }
  }, [active])

  return (
    <Chapter index={7} id="use-cases" height="200vh" panel="left" className="uc-panel" labelledBy="uc-title">
      <div className="grid">
        <div className="uc__list" onMouseLeave={() => setPick(null)}>
          <h2 id="uc-title" className="sr-only">
            Use cases
          </h2>
          {USE_CASES.map((u, i) => (
            <button
              key={u.name}
              className={`uc ${active === i ? 'is-on' : ''}`}
              aria-expanded={active === i}
              onMouseEnter={() => setPick(i)}
              onFocus={() => setPick(i)}
              onBlur={() => setPick(null)}
              onClick={() => setPick(i)}
            >
              <span className="uc__row">
                <span className="uc__n mono">0{i + 1}</span>
                <span className="uc__t">{u.name}</span>
              </span>
              <span className="uc__d">
                <span style={{ overflow: 'hidden', display: 'block' }}>
                  <p>
                    {u.text}
                    <span className="uc__fx mono">→ {u.fx}</span>
                  </p>
                </span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </Chapter>
  )
}
