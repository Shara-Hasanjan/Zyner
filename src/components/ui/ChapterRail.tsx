import { useEffect, useState } from 'react'
import { RAIL_LABELS } from '../../lib/content'
import { onScroll } from '../../lib/scroll'

/** A slim film-style chapter indicator. Replaces per-section eyebrows. */
export function ChapterRail() {
  const [active, setActive] = useState(0)
  const [hidden, setHidden] = useState(true)
  useEffect(
    () =>
      onScroll((s) => {
        const a = Math.min(RAIL_LABELS.length - 1, Math.floor(s + 0.001))
        setActive((v) => (v === a ? v : a))
        const h = s < 0.35 || s > 8.9
        setHidden((v) => (v === h ? v : h))
      }),
    [],
  )
  return (
    <ol className={`rail mono ${hidden ? 'is-hidden' : ''}`} aria-hidden="true">
      {RAIL_LABELS.map((l, i) => (
        <li key={l} className={i === active ? 'is-on' : ''}>
          <span>
            {String(i).padStart(2, '0')} · {l}
          </span>
          <i />
        </li>
      ))}
    </ol>
  )
}
