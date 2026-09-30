import { Suspense, lazy, useCallback, useEffect, useState } from 'react'
import { Navigation } from './components/ui/Navigation'
import { Loader } from './components/ui/Loader'
import { AnnotationLayer } from './components/ui/AnnotationLayer'
import { ChapterRail } from './components/ui/ChapterRail'
import { Hero } from './components/sections/Hero'
import { Problem } from './components/sections/Problem'
import { Transformation } from './components/sections/Transformation'
import { Solution } from './components/sections/Solution'
import { HowItWorks } from './components/sections/HowItWorks'
import { Features } from './components/sections/Features'
import { AIWorkload } from './components/sections/AIWorkload'
import { UseCases } from './components/sections/UseCases'
import { FinalCTA } from './components/sections/FinalCTA'
import { Footer } from './components/sections/Footer'
import { useResponsive3D } from './hooks/useResponsive3D'
import { onCovered, startScroll } from './lib/scroll'

// The whole WebGL stack loads as its own chunk so text and layout paint first.
const SceneCanvas = lazy(() => import('./components/scene/SceneCanvas'))

export default function App() {
  const { webgl } = useResponsive3D()
  const [sceneReady, setSceneReady] = useState(false)
  const [loaderGone, setLoaderGone] = useState(false)
  const [lifted, setLifted] = useState(false)
  const [covered, setCovered] = useState(false)

  useEffect(() => {
    const stop = startScroll()
    const off = onCovered(setCovered)
    return () => {
      stop()
      off()
    }
  }, [])

  const onReady = useCallback(() => setSceneReady(true), [])
  const noWebGL = webgl === false

  return (
    <>
      <a className="skip" href="#product">
        Skip to content
      </a>
      <div className={`stage ${noWebGL ? 'stage--static' : ''}`} aria-hidden="true">
        {webgl && (
          <Suspense fallback={null}>
            <SceneCanvas onReady={onReady} covered={covered} />
          </Suspense>
        )}
      </div>
      <AnnotationLayer />
      <Navigation />
      <ChapterRail />
      <main className="chapters">
        <Hero ready={lifted} />
        <Problem />
        <Transformation />
        <Solution />
        <HowItWorks />
        <Features />
        <AIWorkload />
        <UseCases />
        <FinalCTA />
      </main>
      <Footer />
      {!loaderGone && <Loader sceneReady={sceneReady || noWebGL} onLift={() => setLifted(true)} onDone={() => setLoaderGone(true)} />}
    </>
  )
}
