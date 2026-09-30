import { Chapter } from '../ui/Chapter'
import { Lines } from '../ui/Lines'
import { useChapterStep } from '../../hooks/useScrollProgress'
import { PAINS, WORKLOAD_NEEDS } from '../../lib/content'

export function Problem() {
  const beat = useChapterStep(1, 2, 0.12, 0.9)
  return (
    <Chapter index={1} id="problem" height="320vh" panel="left" className="problem" labelledBy="problem-title">
      <div className="grid">
        <div className="problem__head">
          <h2 id="problem-title" className="display display--l">
            <Lines lines={['Your infrastructure', 'shouldn’t decide', 'how fast your', 'data moves.']} />
          </h2>
        </div>
        <div className="problem__beats">
          <div className={`beat ${beat === 0 ? 'is-on' : ''}`} aria-hidden={beat !== 0}>
            <p className="beat__label mono">Modern workloads need</p>
            <ul className="needs mono">
              {WORKLOAD_NEEDS.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </div>
          <div className={`beat ${beat === 1 ? 'is-on' : ''}`} aria-hidden={beat !== 1}>
            <p className="beat__label mono">Traditional approaches create</p>
            <ol className="pains">
              {PAINS.map((p, i) => (
                <li key={p}>
                  <span>0{i + 1}</span>
                  {p}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </Chapter>
  )
}
