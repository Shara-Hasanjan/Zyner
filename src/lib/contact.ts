/** Where contact messages go. Placeholder address: replace with Japolic's real inbox. */
export const CONTACT_EMAIL = 'hello@japolic.com'

const listeners = new Set<() => void>()
export const onContactOpen = (fn: () => void) => {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}
export const openContact = () => listeners.forEach((f) => f())
