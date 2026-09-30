import type { CSSProperties } from 'react'
import { Chapter } from '../ui/Chapter'
import { Lines } from '../ui/Lines'
import { useChapterStep } from '../../hooks/useScrollProgress'
import { AI_STAGES } from '../../lib/content'
import { chapterRange, scrollToY } from '../../lib/scroll'

/** Dataset, preprocessing, training, inference, result: told by the camera. */
export function AIWorkload() {
  const step = useChapterStep(6, 5)
  const jump = (i: number) => {
    const { top, range } = chapterRange(6)
    scrollToY(top + range * ((i + 0.5) / AI_STAGES.length))
  }

  return (
    <Chapter index={6} id="ai" height="480vh" panel="floor" className="ai" labelledBy="ai-title">
      <div className="grid">
        <div className="ai__head">
          <h2 id="ai-title" className="display display--l ai__h">
            <Lines lines={['When many nodes', <em key="e">need the same data.</em>]} />
          </h2>
          <p className="lede fade" style={{ '--d': '300ms' } as CSSProperties}>
            Training, preprocessing and inference all read the same datasets. Shared, high-performance access keeps
            compute busy instead of waiting.
          </p>
        </div>
        <div className="ai__detail">
          {AI_STAGES.map((s, i) => (
            <div key={s.name} className={`ai__step ${step === i ? 'is-on' : ''}`} aria-hidden={step !== i}>
              <h3>{s.name}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="pipe mono" role="group" aria-label="Workload pipeline">
        {AI_STAGES.map((s, i) => (
          <button
            key={s.name}
            className={`pipe__s ${step === i ? 'is-on' : ''} ${step > i ? 'is-done' : ''}`}
            onClick={() => jump(i)}
            aria-current={step === i}
          >
            <span>0{i + 1}</span>
            {s.name}
          </button>
        ))}
      </div>
    </Chapter>
  )
}
