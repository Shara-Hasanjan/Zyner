import '@fontsource-variable/newsreader/opsz.css'
import '@fontsource-variable/newsreader/opsz-italic.css'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import './styles/tokens.css'
import './styles/base.css'
import './styles/ui.css'
import './styles/chapters.css'
import './styles/contact.css'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { world } from './lib/store'

// Decide device tier and motion preference before the first render.
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
world.reduced = reduced
world.mobile = window.matchMedia('(max-width: 820px), (pointer: coarse)').matches
if (reduced) document.documentElement.classList.add('no-motion')
if (new URLSearchParams(window.location.search).has('debug')) (window as unknown as { __world: typeof world }).__world = world

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
