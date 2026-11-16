const toB64 = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const fromB64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0))

async function pipe(data: Uint8Array, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([data as BlobPart]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

export async function encodeScene(elements: readonly any[]) {
  const json = JSON.stringify(elements.filter((e) => !e.isDeleted))
  return toB64(await pipe(new TextEncoder().encode(json), new CompressionStream('gzip')))
}

export async function decodeScene(hash: string): Promise<any[]> {
  const bytes = await pipe(fromB64(hash), new DecompressionStream('gzip'))
  return JSON.parse(new TextDecoder().decode(bytes))
}
