import type { CSSProperties } from 'react'
import { Chapter } from '../ui/Chapter'
import { Lines } from '../ui/Lines'
import { go } from '../ui/Navigation'
import { FINAL_FACTS } from '../../lib/content'

export function FinalCTA() {
  return (
    <Chapter index={8} id="start" height="180vh" panel="center" className="final" labelledBy="final-title">
      <div className="grid">
        <h2 id="final-title" className="display display--xl final__h">
          <Lines lines={['Make your', 'data feel', <em key="l">local.</em>]} />
        </h2>
        <div className="final__cta fade" style={{ '--d': '500ms' } as CSSProperties}>
          <a className="btn btn--primary" href="#product" onClick={(e) => go(e, '#product')}>
            Explore Japolic <span className="btn__arrow" aria-hidden="true">→</span>
          </a>
          <a className="btn btn--ghost" href="#contact" onClick={(e) => go(e, '#contact')}>
            Talk to the team
          </a>
        </div>
      </div>
      <ul className="final__facts mono" aria-label="What Japolic is">
        {FINAL_FACTS.map((f) => (
          <li key={f}>{f}</li>
        ))}
      </ul>
    </Chapter>
  )
}
