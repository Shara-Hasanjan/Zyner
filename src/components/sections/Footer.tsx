import { go } from '../ui/Navigation'
import { FOOTER_COLS } from '../../lib/content'

export function Footer() {
  return (
    <footer className="footer" id="resources" data-chapter={9}>
      <div className="footer__top">
        <div className="footer__about">
          <span className="brand" style={{ color: 'var(--ink)' }}>
            <span className="brand__mark" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="brand__name">JAPOLIC</span>
          </span>
          <p>
            Japolic is a high-performance file system for developers. It connects multiple servers to shared storage
            and S3, so data access feels closer to a local disk.
          </p>
          <a className="btn btn--ink" href="mailto:hello@japolic.com">
            Talk to the team <span className="btn__arrow" aria-hidden="true">→</span>
          </a>
        </div>
        <nav className="footer__cols" aria-label="Footer">
          {FOOTER_COLS.map((c) => (
            <div key={c.title}>
              <h3>{c.title}</h3>
              <ul>
                {c.links.map((l) => (
                  <li key={l.label}>
                    <a href={l.href} onClick={(e) => go(e, l.href)}>
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>
      <div className="footer__mark" aria-hidden="true">
        JAPOLIC<span>.</span>
      </div>
      <div className="footer__legal mono">
        <span>© 2026 Japolic</span>
        <span>Make your data feel local</span>
      </div>
    </footer>
  )
}
