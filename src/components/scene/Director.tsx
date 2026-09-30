import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { world, STATE_KEYS } from '../../lib/store'
import type { SceneState } from '../../lib/store'
import { makeFrame, sampleShots, FOCUS_SHOTS, FOCUS_STATE, USECASE_STATE, USECASE_CAM } from '../../lib/shots'
import { nodePose } from '../../lib/pose'
import { ANNOTATIONS, annotationEls } from '../../lib/annotations'
import { clamp, damp, lerp, smootherstep, smoothstep } from '../../lib/math'
import { driveScroll } from '../../lib/scroll'
import { useScene } from './SceneContext'

/**
 * The cinematographer. Every frame it:
 *  1. samples the shot list at the current scroll position,
 *  2. layers interaction overrides on top (focused layer, hovered use case),
 *  3. damps everything so movement has weight,
 *  4. moves the camera and pins the DOM annotations to 3D anchors.
 */
export function Director() {
  const { L } = useScene()
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)

  const frame = useMemo(makeFrame, [])
  const rig = useRef({
    pos: new THREE.Vector3(10, 5, 20),
    look: new THREE.Vector3(),
    tp: new THREE.Vector3(),
    tl: new THREE.Vector3(),
    fov: 30,
    sx: 0,
    sy: 0,
    fb: 0,
    ub: 0,
    fIdx: 0,
    uIdx: 0,
    started: false,
    right: new THREE.Vector3(),
    up: new THREE.Vector3(),
    v: new THREE.Vector3(),
    anchor: [0, 0, 0] as [number, number, number],
    px: 0,
    py: 0,
    fp: [0, 0, 0, 0, 0, 0, 0] as number[],
    up_: [0, 0, 0, 0, 0, 0, 0] as number[],
    fo: {} as Record<string, number>,
    uo: {} as Record<string, number>,
  })

  useFrame((state, rawDt) => {
    // advance scroll first so this frame's camera and the page copy share one scroll value
    driveScroll(performance.now())
    const dt = Math.min(rawDt, 0.05)
    const r = rig.current
    const st = frame.state
    const reduced = world.reduced
    const s = world.s

    // ── 1 · shot ──────────────────────────────────────────────────────────────
    sampleShots(s, frame)

    // ── 2 · overrides ────────────────────────────────────────────────────────
    const fTarget = world.focus >= 0 && s > 3.9 && s < 5.05 ? 1 : 0
    if (world.focus >= 0) r.fIdx = world.focus
    r.fb += (fTarget - r.fb) * damp(reduced ? 100 : 4, dt)
    const uTarget = world.useCase >= 0 && s > 6.95 && s < 8.1 ? 1 : 0
    if (world.useCase >= 0) r.uIdx = world.useCase
    r.ub += (uTarget - r.ub) * damp(reduced ? 100 : 4, dt)

    // Overrides get their own smoothing: the scroll-driven shot stays exact, while a
    // hover or focus change glides (camera pose and scene state) instead of snapping.
    const oa = damp(reduced ? 100 : 4.5, dt)
    const blendState = (ghost: Record<string, number>, patch: Partial<SceneState>, w: number, idle: boolean) => {
      for (const k of STATE_KEYS) {
        const target = patch[k] ?? st[k]
        ghost[k] = idle || ghost[k] === undefined ? st[k] : ghost[k] + (target - ghost[k]) * oa
        if (w > 0.001) st[k] = lerp(st[k], ghost[k], w)
      }
    }
    blendState(r.fo, FOCUS_STATE[r.fIdx], r.fb, fTarget === 0 && r.fb < 0.02)
    blendState(r.uo, USECASE_STATE[r.uIdx], r.ub, uTarget === 0 && r.ub < 0.02)

    // ── 3 · damp scene state ─────────────────────────────────────────────────
    const rate = 1000
    const cur = world.cur as unknown as Record<keyof SceneState, number>
    const a = damp(rate, dt)
    for (const k of STATE_KEYS) cur[k] += (st[k] - cur[k]) * a

    // node poses
    for (let k = 0; k < 8; k++) nodePose(k, L, world.cur, world.intro, world.poses[k])

    // ── 4 · camera ───────────────────────────────────────────────────────────
    const aspect = size.width / size.height
    const intro = smootherstep(world.intro)
    r.tp.set(frame.pos[0], frame.pos[1], frame.pos[2])
    r.tl.set(frame.look[0], frame.look[1], frame.look[2])
    let sx = frame.sx
    let focusSy = frame.sy
    const glide = (g: number[], f: { pos: number[]; look: number[]; sx?: number }, idle: boolean, sxBase: number) => {
      const tgt = [f.pos[0], f.pos[1], f.pos[2], f.look[0], f.look[1], f.look[2], f.sx ?? sxBase]
      const base = [r.tp.x, r.tp.y, r.tp.z, r.tl.x, r.tl.y, r.tl.z, sxBase]
      for (let n = 0; n < 7; n++) g[n] = idle ? base[n] : g[n] + (tgt[n] - g[n]) * oa
    }
    glide(r.fp, FOCUS_SHOTS[r.fIdx], fTarget === 0 && r.fb < 0.02, sx)
    glide(r.up_, USECASE_CAM[r.uIdx], uTarget === 0 && r.ub < 0.02, sx)
    if (r.fb > 0.001) {
      const g = r.fp
      r.tp.set(lerp(r.tp.x, g[0], r.fb), lerp(r.tp.y, g[1], r.fb), lerp(r.tp.z, g[2], r.fb))
      r.tl.set(lerp(r.tl.x, g[3], r.fb), lerp(r.tl.y, g[4], r.fb), lerp(r.tl.z, g[5], r.fb))
      sx = lerp(sx, g[6], r.fb)
      focusSy = lerp(frame.sy, 0.29, r.fb)
    }
    if (r.ub > 0.001) {
      const g = r.up_
      r.tp.set(lerp(r.tp.x, g[0], r.ub), lerp(r.tp.y, g[1], r.ub), lerp(r.tp.z, g[2], r.ub))
      r.tl.set(lerp(r.tl.x, g[3], r.ub), lerp(r.tl.y, g[4], r.ub), lerp(r.tl.z, g[5], r.ub))
    }

    // narrower screens need the camera further back; portrait puts copy above the scene
    const back = 1 + Math.max(0, 1.5 - aspect) * 0.33
    const wide = smoothstep((aspect - 0.85) / 0.6)
    r.v.copy(r.tp).sub(r.tl).multiplyScalar(back * (1 + (1 - intro) * 0.32))
    r.tp.copy(r.tl).add(r.v)
    const fovT = frame.fov + Math.max(0, 1 - aspect) * 10

    if (!r.started) {
      r.pos.copy(r.tp)
      r.look.copy(r.tl)
      r.fov = fovT
      r.sx = sx * wide
      r.sy = focusSy * (1 - wide)
      r.started = true
    }
    const cr = 1000
    r.pos.lerp(r.tp, damp(cr, dt))
    r.look.lerp(r.tl, damp(cr + 1, dt))
    r.fov += (fovT - r.fov) * damp(cr, dt)
    r.sx += (sx * wide - r.sx) * damp(cr, dt)
    r.sy += (focusSy * (1 - wide) - r.sy) * damp(cr, dt)

    camera.position.copy(r.pos)
    // subtle parallax + breathing, off for reduced motion and on touch screens
    r.px += (world.pointer.x - r.px) * damp(3, dt)
    r.py += (world.pointer.y - r.py) * damp(3, dt)
    if (!reduced && !world.mobile) {
      camera.lookAt(r.look)
      r.right.setFromMatrixColumn(camera.matrix, 0)
      r.up.setFromMatrixColumn(camera.matrix, 1)
      camera.position
        .addScaledVector(r.right, r.px * 0.35)
        .addScaledVector(r.up, r.py * 0.2 + Math.sin(state.clock.elapsedTime * 0.3) * 0.05)
    }
    camera.lookAt(r.look)
    camera.fov = r.fov
    camera.setViewOffset(size.width, size.height, -r.sx * size.width, -r.sy * size.height, size.width, size.height)
    camera.updateMatrixWorld()

    // ── 5 · annotations ──────────────────────────────────────────────────────
    const w = size.width
    const h = size.height
    for (const an of ANNOTATIONS) {
      const el = annotationEls.get(an.id)
      if (!el) continue
      let vis = an.visible(s, world.cur)
      if (vis <= 0.01 && el.dataset.v === '0') continue
      if (vis > 0.01) {
        an.anchor(L, r.anchor)
        r.v.set(r.anchor[0], r.anchor[1], r.anchor[2]).project(camera)
        const sxp = (r.v.x * 0.5 + 0.5) * w
        const syp = (-r.v.y * 0.5 + 0.5) * h
        if (r.v.z > 1 || sxp < 24 || sxp > w - 24 || syp < 70 || syp > h - 24) vis = 0
        else {
          el.style.transform = `translate3d(${sxp.toFixed(1)}px,${syp.toFixed(1)}px,0)`
          // keep labels inside the viewport: mirror the callout when it would run off an edge
          const dx = Number(el.dataset.dx)
          const flip = (dx > 0 && sxp > w - 250) || (dx < 0 && sxp < 250)
          el.style.setProperty('--flip', flip ? '-1' : '1')
        }
      }
      const o = clamp(vis)
      if (el.dataset.v !== (o > 0.02 ? '1' : '0')) el.dataset.v = o > 0.02 ? '1' : '0'
      el.style.opacity = o.toFixed(2)
    }
  })

  return null
}
