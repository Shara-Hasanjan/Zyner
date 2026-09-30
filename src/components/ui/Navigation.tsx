import { useEffect, useState } from 'react'
import { NAV_LINKS } from '../../lib/content'
import { onScroll, scrollToEl, stopSmoothScroll, chapterRange } from '../../lib/scroll'

export const go = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
  if (!href.startsWith('#')) return
  e.preventDefault()
  scrollToEl(href === '#top' ? 'body' : href)
}

export function Navigation() {
  const [solid, setSolid] = useState(false)
  const [light, setLight] = useState(false)
  const [current, setCurrent] = useState(-1)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    let footerTop = Infinity
    let lastMeasure = 0
    return onScroll((s, y) => {
      const now = performance.now()
      if (now - lastMeasure > 500) {
        footerTop = chapterRange(9).top
        lastMeasure = now
      }
      setSolid((v) => (v === y > 40 ? v : y > 40))
      const l = y + 34 > footerTop
      setLight((v) => (v === l ? v : l))
      const ch = Math.floor(s + 0.001)
      setCurrent((v) => (v === ch ? v : ch))
    })
  }, [])

  useEffect(() => {
    stopSmoothScroll(open)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const cls = ['nav', solid && 'is-solid', light && 'is-light'].filter(Boolean).join(' ')
  const close = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false)
    // wait for the sheet to release scroll before travelling
    setTimeout(() => go(e, href), 30)
    if (href.startsWith('#')) e.preventDefault()
  }

  return (
    <>
      <header className={cls}>
        <a className="brand" href="#top" aria-label="Japolic, back to top" onClick={(e) => go(e, '#top')}>
          <span className="brand__mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span className="brand__name">JAPOLIC</span>
        </a>
        <nav aria-label="Primary" className="nav__links">
          {NAV_LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              aria-current={l.chapters.includes(current) ? 'true' : undefined}
              onClick={(e) => go(e, l.href)}
            >
              {l.label}
            </a>
          ))}
        </nav>
        <a className="btn btn--ghost nav__cta" href="mailto:hello@japolic.com">
          Talk to the team
        </a>
        <button
          className="nav__menu mono"
          aria-expanded={open}
          aria-controls="menu-sheet"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Menu'}
          <i aria-hidden="true" />
        </button>
      </header>
      <div id="menu-sheet" className={`sheet ${open ? 'is-open' : ''}`} aria-hidden={!open} inert={!open}>
        <nav aria-label="Mobile" className="sheet__links">
          {NAV_LINKS.map((l, i) => (
            <a key={l.label} href={l.href} onClick={(e) => close(e, l.href)}>
              <span>0{i + 1}</span>
              {l.label}
            </a>
          ))}
        </nav>
        <div className="sheet__foot">
          <a className="btn btn--primary" href="mailto:hello@japolic.com">
            Talk to the team <span className="btn__arrow" aria-hidden="true">→</span>
          </a>
          <p className="mono" style={{ color: 'var(--ivory-faint)' }}>
            Make your data feel local.
          </p>
        </div>
      </div>
    </>
  )
}
