import { Chapter } from '../ui/Chapter'

export function Transformation() {
  return (
    <Chapter index={2} id="transformation" height="240vh" panel="center" className="transform" labelledBy="transform-title">
      <div className="grid">
        <p id="transform-title" className="transform__ask display display--l">
          What if one layer sat between them?
        </p>
      </div>
      <div className="transform__mark" aria-hidden="true">
        JAPOLIC<span>.</span>
      </div>
      <p className="sr-only">Japolic: a new infrastructure layer between compute and storage.</p>
      <div className="transform__meta mono" aria-hidden="true">
        <span>A new layer between compute and storage</span>
        <span>
          Fragmented <b>→</b> Connected
        </span>
        <span>
          Complex <b>→</b> Simplified
        </span>
      </div>
    </Chapter>
  )
}
