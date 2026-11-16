import { useState, useCallback, useMemo, useRef } from 'react'
import { Excalidraw, convertToExcalidrawElements, exportToBlob, exportToSvg, serializeAsJSON, loadFromBlob } from '@excalidraw/excalidraw'
import { GROUPS, ARROWS, type Kind, type ArrowPreset } from './components'
import { FlowOverlay, arrowPaths } from './FlowOverlay'
import { encodeScene, decodeScene } from './share'

const STORE = 'sysdraw:scene'
const params = new URLSearchParams(location.hash.slice(1))
const EMBED = params.get('embed') === '1'

const download = (blob: Blob, name: string) => {
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = name
  a.click()
  URL.revokeObjectURL(a.href)
}

async function loadInitial() {
  try {
    const d = params.get('d')
    if (d) return { elements: await decodeScene(d), scrollToContent: true }
    const saved = !EMBED && localStorage.getItem(STORE)
    if (saved) return { elements: JSON.parse(saved) }
  } catch {
    /* ignore bad data */
  }
  return { elements: [] }
}

const btn: React.CSSProperties = { padding: '6px 8px', border: '1px solid #bbb', borderRadius: 6, background: '#fff', cursor: 'pointer', textAlign: 'left' }

export default function App() {
  const [api, setApi] = useState<any>(null)
  const [paths, setPaths] = useState<ReturnType<typeof arrowPaths>>([])
  const [view, setView] = useState({ scrollX: 0, scrollY: 0, zoom: 1 })
  const [playing, setPlaying] = useState(true)
  const [speed, setSpeed] = useState(0.4)
  const [color, setColor] = useState('#e8590c')
  const [useArrowColor, setUseArrowColor] = useState(true)
  const [step, setStep] = useState(1)
  const [msg, setMsg] = useState('')
  const initial = useMemo(loadInitial, [])
  const saveTimer = useRef<number>(0)
  const fileInput = useRef<HTMLInputElement>(null)

  const toast = (m: string) => {
    setMsg(m)
    setTimeout(() => setMsg(''), 2000)
  }

  const onChange = useCallback((elements: readonly any[], appState: any) => {
    setPaths(arrowPaths(elements))
    setView({ scrollX: appState.scrollX, scrollY: appState.scrollY, zoom: appState.zoom.value })
    if (!EMBED) {
      clearTimeout(saveTimer.current)
      saveTimer.current = window.setTimeout(() => localStorage.setItem(STORE, JSON.stringify(elements.filter((e) => !e.isDeleted))), 400)
    }
  }, [])

  const center = () => {
    const s = api.getAppState()
    return { x: s.width / 2 / s.zoom.value - s.scrollX, y: s.height / 2 / s.zoom.value - s.scrollY }
  }
  const jitter = () => (Math.random() - 0.5) * 60
  const append = (skeleton: any[]) => api.updateScene({ elements: [...api.getSceneElements(), ...convertToExcalidrawElements(skeleton)] })

  const addKind = (k: Kind) => {
    const c = center()
    append([
      {
        type: k.shape, x: c.x - k.w / 2 + jitter(), y: c.y - k.h / 2 + jitter(), width: k.w, height: k.h,
        backgroundColor: k.color, strokeColor: k.stroke ?? '#1e1e1e', fillStyle: 'solid', roundness: { type: 3 },
        label: { text: `${k.icon} ${k.label}`, fontSize: k.font ?? 18 },
      },
    ])
  }

  const addStep = () => {
    const c = center()
    append([
      {
        type: 'ellipse', x: c.x - 20 + jitter(), y: c.y - 20 + jitter(), width: 40, height: 40,
        backgroundColor: '#1e1e1e', strokeColor: '#1e1e1e', fillStyle: 'solid',
        label: { text: String(step), fontSize: 20, strokeColor: '#ffffff' },
      },
    ])
    setStep(step + 1)
  }

  // Red X marker: drop it on an arrow to show a cancelled / failed request.
  const addCross = () => {
    const c = center()
    const x = c.x + jitter(), y = c.y + jitter(), r = 16
    const g = `x-${Math.random().toString(36).slice(2)}`
    const base = { type: 'line', strokeColor: '#e03131', strokeWidth: 4, roundness: null, groupIds: [g] }
    append([
      { ...base, x: x - r, y: y - r, points: [[0, 0], [2 * r, 2 * r]] },
      { ...base, x: x + r, y: y - r, points: [[0, 0], [-2 * r, 2 * r]] },
    ])
  }

  const applyArrow =(a: ArrowPreset) => {
    const selected = api.getAppState().selectedElementIds
    const els = api.getSceneElements()
    if (els.some((e: any) => e.type === 'arrow' && selected[e.id])) {
      api.updateScene({
        elements: els.map((e: any) =>
          e.type === 'arrow' && selected[e.id]
            ? { ...e, strokeColor: a.color, strokeStyle: a.strokeStyle, startArrowhead: a.start, endArrowhead: a.end, version: e.version + 1, versionNonce: Math.floor(Math.random() * 2 ** 31) }
            : e,
        ),
      })
      return
    }
    const c = center()
    append([{ type: 'arrow', x: c.x - 80 + jitter(), y: c.y + jitter(), width: 160, height: 0, strokeColor: a.color, strokeStyle: a.strokeStyle, startArrowhead: a.start, endArrowhead: a.end }])
  }

  // Excalidraw doesn't rotate arrows/lines natively, so rotate selection ourselves.
  const rotateSelected = (deg: number) => {
    const rad = (deg * Math.PI) / 180
    const sel = api.getAppState().selectedElementIds
    const els = api.getSceneElements()
    const bump = { versionNonce: Math.floor(Math.random() * 2 ** 31) }
    const out = els.map((e: any) => {
      const hit = sel[e.id] || (e.containerId && sel[e.containerId])
      if (!hit) return e
      if (e.points && e.type !== 'freedraw') {
        const abs = e.points.map((p: number[]) => [e.x + p[0], e.y + p[1]])
        const xs = abs.map((p: number[]) => p[0]), ys = abs.map((p: number[]) => p[1])
        const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cy = (Math.min(...ys) + Math.max(...ys)) / 2
        const rot = abs.map(([x, y]: number[]) => [cx + (x - cx) * Math.cos(rad) - (y - cy) * Math.sin(rad), cy + (x - cx) * Math.sin(rad) + (y - cy) * Math.cos(rad)])
        return { ...e, x: rot[0][0], y: rot[0][1], points: rot.map((p: number[]) => [p[0] - rot[0][0], p[1] - rot[0][1]]), startBinding: null, endBinding: null, version: e.version + 1, ...bump }
      }
      return { ...e, angle: (e.angle + rad) % (Math.PI * 2), version: e.version + 1, ...bump }
    })
    api.updateScene({ elements: out })
  }

  const exportPNG = async () =>
    download(
      await exportToBlob({ elements: api.getSceneElements(), appState: { ...api.getAppState(), exportWithDarkMode: false, exportBackground: true }, files: api.getFiles(), mimeType: 'image/png', exportPadding: 24 }),
      'diagram.png',
    )
  const exportSVG = async () => {
    const svg = await exportToSvg({ elements: api.getSceneElements(), appState: api.getAppState(), files: api.getFiles(), exportPadding: 24 })
    download(new Blob([svg.outerHTML], { type: 'image/svg+xml' }), 'diagram.svg')
  }
  const saveFile = () =>
    download(new Blob([serializeAsJSON(api.getSceneElements(), api.getAppState(), api.getFiles(), 'local')], { type: 'application/json' }), 'diagram.excalidraw')
  const openFile = async (f: File) => {
    const data = await loadFromBlob(f, null, null)
    api.updateScene({ elements: data.elements })
    api.scrollToContent(data.elements, { fitToContent: true })
  }
  const link = async (embed: boolean) => {
    const d = await encodeScene(api.getSceneElements())
    const url = `${location.origin}${location.pathname}#d=${d}${embed ? '&embed=1' : ''}`
    await navigator.clipboard.writeText(
      embed ? `<iframe src="${url}" width="100%" height="480" style="border:1px solid #ddd;border-radius:8px" loading="lazy"></iframe>` : url,
    )
    toast(embed ? 'Embed code copied' : 'Share link copied')
  }
  const clearAll = () => {
    if (confirm('Clear the whole canvas?')) {
      api.resetScene()
      localStorage.removeItem(STORE)
    }
  }

  const canvas = (
    <main style={{ flex: 1, position: 'relative' }}>
      <Excalidraw excalidrawAPI={setApi} onChange={onChange} initialData={initial as any} viewModeEnabled={EMBED} zenModeEnabled={EMBED} />
      <FlowOverlay paths={paths} view={view} playing={playing} speed={speed} useArrowColor={useArrowColor} color={color} />
      {msg && (
        <div style={{ position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', background: '#222', color: '#fff', padding: '8px 14px', borderRadius: 8, zIndex: 20 }}>
          {msg}
        </div>
      )}
    </main>
  )
  if (EMBED) return <div style={{ height: '100%', display: 'flex' }}>{canvas}</div>

  return (
    <div style={{ display: 'flex', height: '100%' }}>
      <aside style={{ width: 210, padding: 12, borderRight: '1px solid #ddd', display: 'flex', flexDirection: 'column', gap: 6, overflow: 'auto', fontSize: 14 }}>
        <h3 style={{ margin: 0 }}>Design Whiteboard</h3>
        {GROUPS.map((g) => (
          <section key={g.title} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <b style={{ marginTop: 8 }}>{g.title}</b>
            {g.items.map((k) => (
              <button key={k.id} onClick={() => addKind(k)} style={{ ...btn, background: k.color, borderColor: k.stroke ?? '#bbb' }}>
                {k.icon} {k.label}
              </button>
            ))}
            {g.title === 'Annotations' && <button onClick={addCross} style={{ ...btn, color: '#e03131', borderColor: '#e03131' }}>✖ Cancel mark (X)</button>}
            {g.title === 'Annotations' && <button onClick={addStep} style={btn}>🔢 Step badge ({step})</button>}
            {g.title === 'Annotations' && step > 1 && <button onClick={() => setStep(1)} style={btn}>↺ Reset step counter</button>}
          </section>
        ))}
        <b style={{ marginTop: 8 }}>Arrows</b>
        <small style={{ color: '#666' }}>Select arrows first to restyle them, or click to insert one.</small>
        {ARROWS.map((a) => (
          <button key={a.id} onClick={() => applyArrow(a)} style={{ ...btn, color: a.color, borderColor: a.color }}>
            {a.start ? '↔' : '→'} {a.label} <small>({a.strokeStyle})</small>
          </button>
        ))}
        <b style={{ marginTop: 8 }}>Rotate selection</b>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={btn} onClick={() => rotateSelected(-90)}>⟲ 90°</button>
          <button style={btn} onClick={() => rotateSelected(90)}>⟳ 90°</button>
          <button style={btn} onClick={() => rotateSelected(15)}>⟳ 15°</button>
        </div>
        <b style={{ marginTop: 8 }}>Data flow</b>
        <button style={btn} onClick={() => setPlaying((p) => !p)}>{playing ? '⏸ Pause' : '▶ Play'} flow</button>
        <label>Speed <input type="range" min="0.1" max="1.5" step="0.1" value={speed} onChange={(e) => setSpeed(+e.target.value)} style={{ width: '100%' }} /></label>
        <label><input type="checkbox" checked={useArrowColor} onChange={(e) => setUseArrowColor(e.target.checked)} /> Dots match arrow color</label>
        {!useArrowColor && <label>Dot color <input type="color" value={color} onChange={(e) => setColor(e.target.value)} /></label>}
        <b style={{ marginTop: 8 }}>Export and share</b>
        <button style={btn} onClick={exportPNG}>🖼️ PNG</button>
        <button style={btn} onClick={exportSVG}>📐 SVG</button>
        <button style={btn} onClick={() => link(false)}>🔗 Copy share link</button>
        <button style={btn} onClick={() => link(true)}>📎 Copy embed code</button>
        <b style={{ marginTop: 8 }}>File</b>
        <button style={btn} onClick={saveFile}>💾 Save .excalidraw</button>
        <button style={btn} onClick={() => fileInput.current?.click()}>📂 Open file</button>
        <input ref={fileInput} type="file" accept=".excalidraw,.json" hidden onChange={(e) => e.target.files?.[0] && openFile(e.target.files[0])} />
        <button style={btn} onClick={clearAll}>🗑️ Clear canvas</button>
      </aside>
      {canvas}
    </div>
  )
}
