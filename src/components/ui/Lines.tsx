import type { CSSProperties, ReactNode } from 'react'

/** Splits a headline into masked lines that rise into place when their panel enters view. */
export function Lines({ lines, delay = 0 }: { lines: ReactNode[]; delay?: number }) {
  return (
    <>
      {lines.map((line, i) => (
        <span className="ln" key={i}>
          <span className="ln__t" style={{ '--i': i, '--d': `${delay}ms` } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </>
  )
}
