import Lenis from 'lenis'
import { gsap } from 'gsap'
import { world } from './store'
import { clamp } from './math'

type Listener = (s: number, y: number) => void
const listeners = new Set<Listener>()
const coveredListeners = new Set<(c: boolean) => void>()

/** Subscribe to scroll updates. Fires on every scroll tick and after layout changes. */
export function onScroll(fn: Listener) {
  listeners.add(fn)
  fn(world.s, world.y)
  return () => {
    listeners.delete(fn)
  }
}
export function onCovered(fn: (c: boolean) => void) {
  coveredListeners.add(fn)
  return () => {
    coveredListeners.delete(fn)
  }
}

let lenis: Lenis | null = null

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

/** Glide to a page offset. Longer trips take longer, with a soft start and stop. */
export function scrollToY(y: number) {
  if (lenis) {
    const screens = Math.abs(y - lenis.scroll) / window.innerHeight
    const duration = Math.min(3.4, Math.max(1.1, 0.9 + screens * 0.11))
    navTravel = true
    lenis.scrollTo(y, {
      duration,
      easing: easeInOut,
      lock: false,
      onComplete: () => {
        navTravel = false
      },
    })
    window.setTimeout(() => (navTravel = false), duration * 1000 + 300)
  } else window.scrollTo({ top: y, behavior: world.reduced ? 'auto' : 'smooth' })
}

export function scrollToEl(target: string | HTMLElement, offset = 0) {
  const el = typeof target === 'string' ? document.querySelector<HTMLElement>(target) : target
  if (!el) return
  scrollToY(el.getBoundingClientRect().top + window.scrollY + offset)
}

let lastDriven = 0
/**
 * Advance smooth scroll. The 3D scene calls this at the top of every rendered frame so
 * camera and copy always read the same scroll value; the GSAP ticker only steps in
 * when the scene isn't rendering (no WebGL, or footer covering the canvas).
 */
export function driveScroll(nowMs: number) {
  lastDriven = performance.now()
  lenis?.raf(nowMs)
}

/** Absolute page offset where chapter `i` starts and how tall its scroll range is. */
export function chapterRange(i: number) {
  const el = document.querySelector<HTMLElement>(`[data-chapter="${i}"]`)
  if (!el) return { top: 0, range: 1 }
  const top = el.getBoundingClientRect().top + window.scrollY
  return { top, range: Math.max(1, el.offsetHeight - window.innerHeight) }
}

/**
 * Chapters that advance one step per scroll gesture. Each stop sits at the centre of its
 * step (where its camera shot is keyed), matching `useChapterStep` in the sections.
 */
export const STEP_CHAPTERS = [
  { ch: 1, count: 2, from: 0.12, to: 0.9 },
  { ch: 4, count: 4, from: 0.05, to: 0.95 },
  { ch: 5, count: 6, from: 0, to: 1 },
  { ch: 6, count: 5, from: 0, to: 1 },
  { ch: 7, count: 6, from: 0.08, to: 0.92 },
]
interface StepZone {
  top: number
  range: number
  pts: number[]
}
let zones: StepZone[] = []
const currentY = () => (lenis ? lenis.scroll : window.scrollY)
let tweenRaf = 0

/** Animate the page to `p`: through Lenis when present, otherwise our own tween (or a jump). */
function animateTo(p: number, duration: number, done: () => void) {
  if (lenis) {
    lenis.scrollTo(p, { duration, easing: easeInOut, lock: false, force: true, onComplete: done })
    return
  }
  cancelAnimationFrame(tweenRaf)
  if (world.reduced) {
    window.scrollTo(0, p)
    done()
    return
  }
  const y0 = window.scrollY
  const t0 = performance.now()
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / (duration * 1000))
    window.scrollTo(0, y0 + (p - y0) * easeInOut(k))
    if (k < 1) tweenRaf = requestAnimationFrame(tick)
    else done()
  }
  tweenRaf = requestAnimationFrame(tick)
}
let stepLocked = false
let navTravel = false // a menu / button jump is flying through: don't capture it
let lastGesture = 0

/** Next stop in the scroll direction, or null when the page should scroll freely. */
function nextStop(dir: number): number | null {
  const y = currentY()
  for (const z of zones) {
    if (y < z.top - 2 || y > z.top + z.range + 2) continue
    if (dir > 0) return z.pts.find((p) => p > y + 6) ?? null
    return [...z.pts].reverse().find((p) => p < y - 6) ?? null
  }
  return null
}

function goTo(p: number) {
  stepLocked = true
  animateTo(p, 1.25, () => {
    stepLocked = false
  })
  window.setTimeout(() => (stepLocked = false), 1500) // safety if another scroll interrupts
}

function stepBy(dir: number) {
  const p = nextStop(dir)
  if (p == null) return false
  goTo(p)
  return true
}

/**
 * Free momentum (a fast flick) must not coast through a whole stepped chapter: when its
 * target lies beyond the next stop, redirect it to that stop.
 */
function capture(y: number) {
  if (!lenis || stepLocked || navTravel || lenis.isScrolling !== 'smooth') return
  const dist = lenis.targetScroll - y
  const dir = Math.sign(dist)
  if (!dir) return
  const p = nextStop(dir)
  if (p != null && Math.abs(dist) > Math.abs(p - y) + 30) goTo(p)
}

let touchY = 0
let touchDone = false

/**
 * Wheel / trackpad: in a stepped chapter one gesture is one step. The tail of a trackpad
 * swipe (inertia) is swallowed until the hand has really stopped.
 */
function onWheel(e: WheelEvent) {
  if (e.ctrlKey) return // pinch-zoom
  const now = performance.now()
  const gap = now - lastGesture
  lastGesture = now
  if (Math.abs(e.deltaY) < 1) return
  const dir = Math.sign(e.deltaY)
  if (nextStop(dir) == null && !stepLocked) return // free scrolling outside / past the ends
  e.preventDefault()
  e.stopImmediatePropagation()
  if (stepLocked || gap < 220) return
  stepBy(dir)
}

function onTouchStart(e: TouchEvent) {
  touchY = e.touches[0].clientY
  touchDone = false
}
function onTouchMove(e: TouchEvent) {
  const dy = touchY - e.touches[0].clientY // + = finger moving up = scrolling down
  const dir = Math.sign(dy)
  if (!dir || (nextStop(dir) == null && !stepLocked)) return
  if (e.cancelable) e.preventDefault()
  if (touchDone || stepLocked || Math.abs(dy) < 36) return
  touchDone = true // one step per swipe
  stepBy(dir)
}

interface Sec {
  top: number
  h: number
}

/** Boot the scroll system: smooth scroll, chapter mapping, pointer, media queries. */
export function startScroll() {
  const mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)')
  const mqMobile = window.matchMedia('(max-width: 820px), (pointer: coarse)')
  world.reduced = mqReduce.matches
  world.mobile = mqMobile.matches
  const onReduce = () => (world.reduced = mqReduce.matches)
  mqReduce.addEventListener('change', onReduce)

  let secs: Sec[] = []
  let footerTop = Infinity

  const measure = () => {
    world.vw = window.innerWidth
    world.vh = window.innerHeight
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-chapter]')).sort(
      (a, b) => Number(a.dataset.chapter) - Number(b.dataset.chapter),
    )
    const sy = window.scrollY
    secs = els.map((el) => ({ top: el.getBoundingClientRect().top + sy, h: el.offsetHeight }))
    footerTop = secs.length ? secs[secs.length - 1].top : Infinity
    zones = STEP_CHAPTERS.filter((z) => secs[z.ch]).map((z) => {
      const range = Math.max(1, secs[z.ch].h - world.vh)
      return {
        top: secs[z.ch].top,
        range,
        pts: Array.from({ length: z.count }, (_, k) => secs[z.ch].top + range * (z.from + ((z.to - z.from) * (k + 0.5)) / z.count)),
      }
    })
    update()
  }

  let wasCovered = false
  const update = () => {
    const y = lenis ? lenis.scroll : window.scrollY
    world.y = y
    capture(y)
    const n = secs.length
    let s = 0
    if (n) {
      s = n - 1
      for (let i = 0; i < n - 1; i++) {
        if (y < secs[i + 1].top) {
          const range = Math.max(1, secs[i].h - world.vh)
          s = i + clamp((y - secs[i].top) / range)
          break
        }
      }
    }
    world.s = s
    const covered = y >= footerTop - 2
    if (covered !== wasCovered) {
      wasCovered = covered
      world.covered = covered
      coveredListeners.forEach((f) => f(covered))
    }
    listeners.forEach((f) => f(s, y))
  }

  if (!world.reduced) {
    lenis = new Lenis({ lerp: 0.12, wheelMultiplier: 1, touchMultiplier: 1.2, smoothWheel: true, autoRaf: false })
    lenis.on('scroll', update)
    gsap.ticker.add((t) => {
      if (performance.now() - lastDriven > 80) lenis?.raf(t * 1000)
    })
    gsap.ticker.lagSmoothing(0)
  } else {
    window.addEventListener('scroll', update, { passive: true })
  }

  const ro = new ResizeObserver(measure)
  ro.observe(document.body)
  window.addEventListener('resize', measure)
  document.fonts?.ready.then(measure)
  measure()

  const onMove = (e: PointerEvent) => {
    if (e.pointerType === 'touch') return
    world.pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    world.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', onMove, { passive: true })

  const onKey = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    const el = e.target as HTMLElement
    if (el && /^(input|textarea|select)$/i.test(el.tagName)) return
    if (e.key === ' ' && el && /^(button|a)$/i.test(el.tagName)) return
    let dir = 0
    if (e.key === 'ArrowDown' || e.key === 'PageDown' || (e.key === ' ' && !e.shiftKey)) dir = 1
    if (e.key === 'ArrowUp' || e.key === 'PageUp' || (e.key === ' ' && e.shiftKey)) dir = -1
    if (!dir || nextStop(dir) == null) return
    e.preventDefault()
    if (!stepLocked) stepBy(dir)
  }
  window.addEventListener('keydown', onKey)
  window.addEventListener('wheel', onWheel, { passive: false, capture: true })
  window.addEventListener('touchstart', onTouchStart, { passive: true })
  window.addEventListener('touchmove', onTouchMove, { passive: false })

  return () => {
    mqReduce.removeEventListener('change', onReduce)
    window.removeEventListener('resize', measure)
    window.removeEventListener('pointermove', onMove)
    window.removeEventListener('keydown', onKey)
    window.removeEventListener('wheel', onWheel, { capture: true })
    window.removeEventListener('touchstart', onTouchStart)
    window.removeEventListener('touchmove', onTouchMove)
    window.removeEventListener('scroll', update)
    ro.disconnect()
    lenis?.destroy()
    lenis = null
  }
}

export function stopSmoothScroll(stop: boolean) {
  if (!lenis) return
  if (stop) lenis.stop()
  else lenis.start()
}
