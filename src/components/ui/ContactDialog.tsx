import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { CONTACT_EMAIL, onContactOpen } from '../../lib/contact'
import { stopSmoothScroll } from '../../lib/scroll'

type Errors = Partial<Record<'name' | 'email' | 'message', string>>

/** "Talk to the team": a native modal dialog with an accessible, validated form. */
export function ContactDialog() {
  const ref = useRef<HTMLDialogElement>(null)
  const [errors, setErrors] = useState<Errors>({})
  const [sent, setSent] = useState(false)

  useEffect(
    () =>
      onContactOpen(() => {
        setSent(false)
        setErrors({})
        ref.current?.showModal()
        stopSmoothScroll(true)
      }),
    [],
  )

  const close = () => ref.current?.close()

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const d = new FormData(form)
    const name = String(d.get('name') ?? '').trim()
    const email = String(d.get('email') ?? '').trim()
    const company = String(d.get('company') ?? '').trim()
    const message = String(d.get('message') ?? '').trim()
    const next: Errors = {}
    if (!name) next.name = 'Please tell us your name.'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    if (message.length < 10) next.message = 'Tell us a little more (at least 10 characters).'
    setErrors(next)
    if (Object.keys(next).length) {
      const first = (['name', 'email', 'message'] as const).find((k) => next[k])
      ;(form.elements.namedItem(first!) as HTMLElement | null)?.focus()
      return
    }
    const body = `${message}\n\n${name}${company ? `, ${company}` : ''}\n${email}`
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Talking to Japolic')}&body=${encodeURIComponent(body)}`
    setSent(true)
  }

  return (
    <dialog
      ref={ref}
      className="contact"
      aria-labelledby="contact-title"
      onClose={() => stopSmoothScroll(false)}
      onClick={(e) => e.target === ref.current && close()}
    >
      <div className="contact__panel">
        <button className="contact__close mono" onClick={close} aria-label="Close">
          Close ✕
        </button>
        {sent ? (
          <div className="contact__done" role="status">
            <h2 id="contact-title" className="display display--m">
              Your email app should be <em>opening.</em>
            </h2>
            <p className="lede">
              We have prepared your message to {CONTACT_EMAIL}. If nothing opened, write to us there directly.
            </p>
            <button className="btn btn--primary" onClick={close}>
              Back to the site
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h2 id="contact-title" className="display display--m">
              Talk to <em>the team.</em>
            </h2>
            <p className="lede">Tell us about your servers, storage and workloads, and we will take it from there.</p>
            <div className="contact__grid">
              <label className="field">
                <span>Name</span>
                <input name="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby="e-name" />
                <small id="e-name" role="alert">
                  {errors.name}
                </small>
              </label>
              <label className="field">
                <span>Work email</span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  aria-invalid={!!errors.email}
                  aria-describedby="e-email"
                />
                <small id="e-email" role="alert">
                  {errors.email}
                </small>
              </label>
              <label className="field field--wide">
                <span>Company (optional)</span>
                <input name="company" autoComplete="organization" />
              </label>
              <label className="field field--wide">
                <span>What are you building?</span>
                <textarea name="message" rows={4} aria-invalid={!!errors.message} aria-describedby="e-msg" />
                <small id="e-msg" role="alert">
                  {errors.message}
                </small>
              </label>
            </div>
            <button className="btn btn--primary" type="submit">
              Send message <span className="btn__arrow" aria-hidden="true">→</span>
            </button>
          </form>
        )}
      </div>
    </dialog>
  )
}
