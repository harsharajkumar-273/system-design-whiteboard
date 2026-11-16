export type Kind = { id: string; label: string; icon: string; color: string; w: number; h: number; shape: 'rectangle' | 'ellipse' | 'diamond'; stroke?: string; font?: number }
export type Group = { title: string; items: Kind[] }

export const GROUPS: Group[] = [
  {
    title: 'Clients & actors',
    items: [
      { id: 'user', label: 'User', icon: '🧑', color: '#e7f5ff', w: 110, h: 70, shape: 'ellipse' },
      { id: 'client', label: 'Client', icon: '💻', color: '#e7f5ff', w: 130, h: 70, shape: 'rectangle' },
      { id: 'mobile', label: 'Mobile App', icon: '📱', color: '#e7f5ff', w: 140, h: 70, shape: 'rectangle' },
      { id: 'browser', label: 'Browser', icon: '🖥️', color: '#e7f5ff', w: 140, h: 70, shape: 'rectangle' },
      { id: 'thirdparty', label: 'Third-party / Webhook', icon: '🔌', color: '#f1f3f5', w: 190, h: 70, shape: 'rectangle' },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      { id: 'cdn', label: 'CDN', icon: '🌐', color: '#e3fafc', w: 130, h: 70, shape: 'ellipse' },
      { id: 'lb', label: 'Load Balancer', icon: '⚖️', color: '#fff4e6', w: 170, h: 70, shape: 'diamond' },
      { id: 'gateway', label: 'API Gateway', icon: '🚪', color: '#fff4e6', w: 150, h: 70, shape: 'rectangle' },
      { id: 'service', label: 'Service', icon: '⚙️', color: '#ebfbee', w: 140, h: 80, shape: 'rectangle' },
      { id: 'cache', label: 'Cache', icon: '⚡', color: '#fff9db', w: 130, h: 70, shape: 'rectangle' },
      { id: 'db', label: 'Database', icon: '🛢️', color: '#f3f0ff', w: 140, h: 80, shape: 'rectangle' },
      { id: 'queue', label: 'Queue', icon: '📨', color: '#ffe8cc', w: 160, h: 60, shape: 'rectangle' },
      { id: 'storage', label: 'Object Store', icon: '🗄️', color: '#f8f0fc', w: 150, h: 70, shape: 'rectangle' },
    ],
  },
  {
    title: 'Annotations',
    items: [
      { id: 'idemkey', label: 'Idempotency-Key: abc123', icon: '🔑', color: '#fff3bf', w: 240, h: 40, shape: 'rectangle', stroke: '#f08c00', font: 15 },
      { id: 'ok', label: '200 OK', icon: '✅', color: '#d3f9d8', w: 110, h: 36, shape: 'rectangle', stroke: '#2f9e44', font: 15 },
      { id: 'created', label: '201 Created', icon: '✅', color: '#d3f9d8', w: 140, h: 36, shape: 'rectangle', stroke: '#2f9e44', font: 15 },
      { id: 'conflict', label: '409 Conflict', icon: '⛔', color: '#ffe3e3', w: 150, h: 36, shape: 'rectangle', stroke: '#e03131', font: 15 },
      { id: 'timeout', label: 'Timeout', icon: '⏱️', color: '#ffe3e3', w: 120, h: 36, shape: 'rectangle', stroke: '#e03131', font: 15 },
      { id: 'cancelled', label: 'Cancelled', icon: '❌', color: '#ffe3e3', w: 140, h: 36, shape: 'rectangle', stroke: '#e03131', font: 15 },
      { id: 'dup', label: 'Duplicate request', icon: '♻️', color: '#ffe8cc', w: 210, h: 36, shape: 'rectangle', stroke: '#e8590c', font: 15 },
      { id: 'note', label: 'Note', icon: '📝', color: '#fff9db', w: 140, h: 60, shape: 'rectangle', stroke: '#868e96', font: 15 },
    ],
  },
]

export type ArrowPreset = { id: string; label: string; color: string; strokeStyle: 'solid' | 'dashed' | 'dotted'; start: string | null; end: string | null }

export const ARROWS: ArrowPreset[] = [
  { id: 'req', label: 'Request', color: '#1e1e1e', strokeStyle: 'solid', start: null, end: 'arrow' },
  { id: 'res', label: 'Response', color: '#2f9e44', strokeStyle: 'dashed', start: null, end: 'arrow' },
  { id: 'async', label: 'Async / event', color: '#e8590c', strokeStyle: 'dotted', start: null, end: 'triangle' },
  { id: 'retry', label: 'Retry', color: '#e03131', strokeStyle: 'dashed', start: null, end: 'arrow' },
  { id: 'bidi', label: 'Two-way', color: '#1971c2', strokeStyle: 'solid', start: 'arrow', end: 'arrow' },
]
