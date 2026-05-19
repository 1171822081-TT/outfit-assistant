import { useState, useRef, useCallback, useEffect } from 'react'

interface Job {
  id: string
  file: File
  resolve: (blob: Blob) => void
  reject: (err: Error) => void
}

interface UseImageProcessingOptions {
  onProcessingStart?: (jobId: string) => void
  onProcessingEnd?: (jobId: string) => void
}

export function useImageProcessing(options?: UseImageProcessingOptions) {
  const [isProcessing, setIsProcessing] = useState(false)
  const workerRef = useRef<Worker | null>(null)
  const queueRef = useRef<Job[]>([])
  const processingRef = useRef(false)
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const activeJobRef = useRef<string | null>(null)
  const optsRef = useRef(options)
  optsRef.current = options

  useEffect(() => {
    const worker = new Worker(
      new URL('@/workers/imageProcessor.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (e) => {
      const { id, result, error } = e.data
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      optsRef.current?.onProcessingEnd?.(id)
      activeJobRef.current = null

      if (error) {
        const job = queueRef.current.find((j) => j.id === id)
        if (job) job.reject(new Error(error))
      } else if (result) {
        const job = queueRef.current.find((j) => j.id === id)
        if (job) job.resolve(new Blob([result], { type: 'image/png' }))
      }
      queueRef.current = queueRef.current.filter((j) => j.id !== id)
      processNext()
    }

    worker.onerror = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      if (activeJobRef.current) {
        optsRef.current?.onProcessingEnd?.(activeJobRef.current)
        activeJobRef.current = null
      }
      const pending = queueRef.current.splice(0)
      for (const job of pending) {
        job.reject(new Error('图片处理服务异常'))
      }
      processingRef.current = false
      setIsProcessing(false)
    }

    workerRef.current = worker
    return () => {
      worker.terminate()
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [])

  const processNext = useCallback(() => {
    if (processingRef.current || queueRef.current.length === 0) {
      setIsProcessing(queueRef.current.length > 0)
      return
    }
    const job = queueRef.current[0]
    if (!job) return
    processingRef.current = true
    setIsProcessing(true)
    activeJobRef.current = job.id

    optsRef.current?.onProcessingStart?.(job.id)

    heartbeatRef.current = setInterval(() => {
      optsRef.current?.onProcessingStart?.(job.id)
    }, 30_000)

    const reader = new FileReader()
    reader.onload = () => {
      workerRef.current?.postMessage(
        {
          id: job.id,
          buffer: reader.result as ArrayBuffer,
          type: job.file.type,
        },
        [reader.result as ArrayBuffer],
      )
    }
    reader.onerror = () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
        heartbeatRef.current = null
      }
      optsRef.current?.onProcessingEnd?.(job.id)
      activeJobRef.current = null
      job.reject(new Error('Failed to read file'))
      queueRef.current = queueRef.current.filter((j) => j.id !== job.id)
      processingRef.current = false
      processNext()
    }
    reader.readAsArrayBuffer(job.file)
  }, [])

  const removeBackground = useCallback(
    (file: File): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const id = crypto.randomUUID()
        queueRef.current.push({ id, file, resolve, reject })
        processNext()
      })
    },
    [processNext],
  )

  return { removeBackground, isProcessing }
}
