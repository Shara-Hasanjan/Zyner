import { useEffect, useRef, useState } from 'react'
import { onScroll } from '../lib/scroll'
import { clamp } from '../lib/math'

/**
 * Discrete step (0..count-1) within a chapter, derived from scroll.
 * Re-renders only when the step changes, never per scroll tick.
 */
export function useChapterStep(chapter: number, count: number, from = 0, to = 1) {
  const [step, setStep] = useState(0)
  const last = useRef(0)
  useEffect(
    () =>
      onScroll((s) => {
        const local = clamp((s - chapter - from) / (to - from))
        const next = Math.min(count - 1, Math.floor(local * count))
        if (next !== last.current) {
          last.current = next
          setStep(next)
        }
      }),
    [chapter, count, from, to],
  )
  return step
}

/** Writes 0..1 chapter progress into a CSS custom property on the given element. */
export function useChapterVar(ref: React.RefObject<HTMLElement | null>, chapter: number, name = '--p') {
  useEffect(
    () =>
      onScroll((s) => {
        ref.current?.style.setProperty(name, clamp(s - chapter).toFixed(4))
      }),
    [ref, chapter, name],
  )
}
