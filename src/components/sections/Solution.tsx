import type { CSSProperties } from 'react'
import { Chapter } from '../ui/Chapter'
import { Lines } from '../ui/Lines'
import { SOLUTION_PATH } from '../../lib/content'

export function Solution() {
  return (
    <Chapter index={3} id="product" height="200vh" panel="right" className="solution" labelledBy="solution-title">
      <div className="grid">
        <div className="solution__copy">
          <h2 id="solution-title" className="display display--l solution__h">
            <Lines lines={['One data layer.', <em key="e">Every server.</em>]} />
          </h2>
          <p className="lede solution__p fade" style={{ '--d': '300ms' } as CSSProperties}>
            Japolic sits between your compute and your storage. Every server sees the same data through one
            high-performance file system.
          </p>
          <ul className="path mono fade" style={{ '--d': '450ms' } as CSSProperties} aria-label="Data path">
            {SOLUTION_PATH.map((p) => (
              <li key={p.label} className={p.key ? 'is-key' : ''}>
                <span>{p.label}</span>
                {p.note && <em>{p.note}</em>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Chapter>
  )
}
