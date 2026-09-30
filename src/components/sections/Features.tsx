import type { CSSProperties } from 'react'
import { Chapter } from '../ui/Chapter'
import { useChapterStep } from '../../hooks/useScrollProgress'
import { FEATURES } from '../../lib/content'
import { chapterRange, scrollToY } from '../../lib/scroll'

/** Six capabilities, six camera shots. The list is a scrubber for the scene. */
export function Features() {
  const step = useChapterStep(5, 6)
  const jump = (i: number) => {
    const { top, range } = chapterRange(5)
    scrollToY(top + range * ((i + 0.5) / FEATURES.length))
  }

  return (
    <Chapter index={5} id="developers" height="640vh" panel="left" className="features" labelledBy="features-title">
      <div className="grid">
        <div className="features__list">
          <h2 id="features-title" className="sr-only">
            Capabilities
          </h2>
          {FEATURES.map((f, i) => (
            <button
              key={f.name}
              className={`feat ${step === i ? 'is-on' : ''}`}
              aria-current={step === i}
              onClick={() => jump(i)}
            >
              <span className="feat__row">
                <span className="feat__n mono">0{i + 1}</span>
                <span className="feat__t">{f.name}</span>
              </span>
              <span className="feat__d">
                <span style={{ overflow: 'hidden', display: 'block' }}>
                  <p>{f.text}</p>
                </span>
              </span>
            </button>
          ))}
          <div className="dots" role="group" aria-label="Choose capability">
            {FEATURES.map((f, i) => (
              <button key={f.name} className={step === i ? 'is-on mono' : 'mono'} onClick={() => jump(i)} aria-label={f.name}>
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        className="features__count mono"
        style={{ '--fp': (step + 1) / FEATURES.length } as CSSProperties}
        aria-hidden="true"
      >
        <span>
          {String(step + 1).padStart(2, '0')} / {String(FEATURES.length).padStart(2, '0')}
        </span>
        <i />
      </div>
    </Chapter>
  )
}
