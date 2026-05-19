import { removeBackground } from '@imgly/background-removal'

interface WorkerRequest {
  id: string
  buffer: ArrayBuffer
  type: string
}

interface WorkerResponse {
  id: string
  result?: ArrayBuffer
  error?: string
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, buffer, type } = e.data
  try {
    const blob = new Blob([buffer], { type })
    const resultBlob = await removeBackground(blob, {
      progress: (_key: string, _current: number, _total: number) => {
        // progress tracking could be posted back if needed
      },
    })
    const resultBuffer = await resultBlob.arrayBuffer()
    self.postMessage({ id, result: resultBuffer } satisfies WorkerResponse)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Background removal failed'
    self.postMessage({ id, error: message } satisfies WorkerResponse)
  }
}
