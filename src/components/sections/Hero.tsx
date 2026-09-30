import type { CSSProperties } from 'react'
import { Chapter } from '../ui/Chapter'
import { Lines } from '../ui/Lines'
import { go } from '../ui/Navigation'
import { HERO_SPECS } from '../../lib/content'

const d = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties

export function Hero({ ready }: { ready: boolean }) {
  return (
    <Chapter index={0} id="top" height="200vh" panel="left" className="hero" labelledBy="hero-title" gate={ready}>
      <div className="grid">
        <div className="hero__copy">
          <h1 id="hero-title" className="display display--xl hero__h">
            <Lines lines={['Make your', 'data feel', <em key="l">local.</em>]} delay={250} />
          </h1>
          <p className="lede hero__sub fade" style={d(900)}>
            A high-performance file system connecting many servers to shared storage and S3, at speeds closer to local
            disk.
          </p>
          <div className="hero__cta fade" style={d(1050)}>
            <a className="btn btn--primary" href="#product" onClick={(e) => go(e, '#product')}>
              Explore Japolic <span className="btn__arrow" aria-hidden="true">→</span>
            </a>
            <a className="btn btn--ghost" href="#technology" onClick={(e) => go(e, '#technology')}>
              See how it works
            </a>
          </div>
        </div>
      </div>
      <ul className="hero__ribbon mono fade" style={d(1300)} aria-label="Key characteristics">
        {HERO_SPECS.map((s) => (
          <li className="spec" key={s}>
            {s}
          </li>
        ))}
        <li className="hero__fig" aria-hidden="true">
          <span className="hero__scroll">
            <i /> Scroll
          </span>
        </li>
      </ul>
    </Chapter>
  )
}
