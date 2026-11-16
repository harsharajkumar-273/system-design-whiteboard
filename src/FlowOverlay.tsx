import { useEffect, useRef } from 'react'

type Pt = [number, number]
type View = { scrollX: number; scrollY: number; zoom: number }

// Collect arrow polylines in scene coordinates.
export type FlowPath = { pts: Pt[]; color: string }
export function arrowPaths(elements: readonly any[]): FlowPath[] {
  return elements
    .filter((e) => !e.isDeleted && (e.type === 'arrow') && e.points?.length >= 2)
    .map((e) => ({ pts: e.points.map((p: Pt): Pt => [e.x + p[0], e.y + p[1]]), color: e.strokeColor }))
}

function pointAt(path: Pt[], t: number): Pt {
  const lens = path.slice(1).map((p, i) => Math.hypot(p[0] - path[i][0], p[1] - path[i][1]))
  const total = lens.reduce((a, b) => a + b, 0) || 1
  let d = t * total
  for (let i = 0; i < lens.length; i++) {
    if (d <= lens[i]) {
      const k = lens[i] ? d / lens[i] : 0
      return [path[i][0] + (path[i + 1][0] - path[i][0]) * k, path[i][1] + (path[i + 1][1] - path[i][1]) * k]
    }
    d -= lens[i]
  }
  return path[path.length - 1]
}

type Props = { paths: FlowPath[]; view: View; playing: boolean; speed: number; useArrowColor: boolean; color: string }

// Canvas layer drawn above Excalidraw; pointer-events none so drawing still works.
export function FlowOverlay({ paths, view, playing, speed, useArrowColor, color }: Props) {
  const ref = useRef<HTMLCanvasElement>(null)
  const state = useRef({ paths, view, playing, speed, useArrowColor, color })
  state.current = { paths, view, playing, speed, useArrowColor, color }

  useEffect(() => {
    const c = ref.current!
    const ctx = c.getContext('2d')!
    let raf = 0
    const start = performance.now()
    const frame = (now: number) => {
      const dpr = window.devicePixelRatio || 1
      const w = c.clientWidth, h = c.clientHeight
      if (c.width !== w * dpr || c.height !== h * dpr) { c.width = w * dpr; c.height = h * dpr }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)
      const s = state.current
      if (s.playing) {
        const phase = ((now - start) / 1000) * s.speed
        for (const path of s.paths) {
          for (let i = 0; i < 3; i++) {
            const t = (phase + i / 3) % 1
            const [x, y] = pointAt(path.pts, t)
            const dot = s.useArrowColor ? path.color : s.color
            const sx = (x + s.view.scrollX) * s.view.zoom, sy = (y + s.view.scrollY) * s.view.zoom
            ctx.beginPath()
            ctx.arc(sx, sy, 5 * s.view.zoom, 0, Math.PI * 2)
            ctx.fillStyle = dot
            ctx.shadowColor = dot
            ctx.shadowBlur = 8
            ctx.fill()
          }
        }
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 5 }} />
}
