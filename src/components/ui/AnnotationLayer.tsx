import { ANNOTATIONS, annotationEls } from '../../lib/annotations'
import { world } from '../../lib/store'

/** DOM half of the 3D callouts. The scene moves these every frame; see lib/annotations. */
export function AnnotationLayer() {
  const k = world.mobile ? 0.62 : 1
  return (
    <div className="annos" aria-hidden="true">
      {ANNOTATIONS.map((a) => {
        const dx = a.dx * k
        const dy = a.dy * k
        const len = Math.hypot(dx, dy)
        const ang = (Math.atan2(dy, dx) * 180) / Math.PI
        const left = dx < 0
        return (
          <div
            key={a.id}
            className="anno"
            data-v="0"
            data-dx={dx}
            ref={(el) => {
              if (el) annotationEls.set(a.id, el)
              else annotationEls.delete(a.id)
            }}
          >
            <span className="anno__dot" />
            <div className="anno__flip">
              <span className="anno__stem" style={{ width: len, transform: `rotate(${ang}deg)` }} />
              <div
                className="anno__box mono"
                style={{
                  left: dx,
                  top: dy,
                  transform: left ? 'translate(-100%,-50%)' : 'translate(0,-50%)',
                  borderLeft: left ? 'none' : undefined,
                  borderRight: left ? '1px solid var(--amber)' : undefined,
                }}
              >
                <span className="anno__unflip" style={{ textAlign: left ? 'right' : 'left' }}>
                  <span className="anno__title">{a.title}</span>
                  {a.sub && <span className="anno__sub">{a.sub}</span>}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
