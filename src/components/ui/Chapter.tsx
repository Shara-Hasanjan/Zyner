import { useEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { onScroll } from '../../lib/scroll'
import { clamp } from '../../lib/math'

interface Props {
  index: number
  id?: string
  /** scroll runway, e.g. "300vh" */
  height: string
  panel: 'left' | 'right' | 'center' | 'floor'
  className?: string
  labelledBy: string
  /** hold the reveal until this is true (used by the hero while the loader runs) */
  gate?: boolean
  children: ReactNode
}

/**
 * A chapter is a tall runway with one sticky panel. While the panel is pinned, the
 * scroll position drives the 3D camera; the panel exposes its progress as `--p`.
 */
export function Chapter({ index, id, height, panel, className = '', labelledBy, gate = true, children }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(
    () =>
      onScroll((s) => {
        const el = panelRef.current
        if (!el) return
        if (s > index - 1.2 && s < index + 2.2) el.style.setProperty('--p', clamp(s - index).toFixed(4))
      }),
    [index],
  )

  useEffect(() => {
    const el = panelRef.current
    if (!el || !gate) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-in')
          io.disconnect()
        }
      },
      { threshold: 0.3 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [gate])

  return (
    <section
      className="chapter"
      id={id}
      data-chapter={index}
      style={{ '--h': height } as CSSProperties}
      aria-labelledby={labelledBy}
    >
      <div ref={panelRef} className={`panel panel--${panel} ${className}`}>
        {children}
      </div>
    </section>
  )
}
