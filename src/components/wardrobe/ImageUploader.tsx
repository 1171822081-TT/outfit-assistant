import { useState, useRef, type ChangeEvent, type DragEvent } from 'react'

interface ImageUploaderProps {
  onCompressed: (file: File, previewUrl: string) => void
  className?: string
}

async function compressImage(file: File, maxWidth: number): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)
      const { naturalWidth, naturalHeight } = img

      let width = naturalWidth
      let height = naturalHeight
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas context not available'))

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error('压缩失败'))
          const previewUrl = URL.createObjectURL(blob)
          resolve({ blob, previewUrl })
        },
        'image/jpeg',
        0.85,
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('图片加载失败'))
    }

    img.src = url
  })
}

export default function ImageUploader({ onCompressed, className = '' }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) return
    setError('')
    setIsCompressing(true)
    try {
      const { blob, previewUrl } = await compressImage(file, 1024)
      setPreview(previewUrl)
      const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
        type: 'image/jpeg',
      })
      onCompressed(compressedFile, previewUrl)
    } catch {
      setError('图片处理失败，请重试')
    } finally {
      setIsCompressing(false)
    }
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFile(file)
  }

  return (
    <div className={className}>
      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={`relative flex aspect-[4/3] cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-md)] border-2 border-dashed transition-colors duration-[var(--duration-fast)] ${
          isDragging
            ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5'
            : 'border-[var(--color-border)] hover:border-[var(--color-accent)]/40'
        }`}
      >
        {isCompressing ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-accent)]" />
            <span className="text-xs text-[var(--color-text-secondary)]">压缩中...</span>
          </div>
        ) : preview ? (
          <img
            src={preview}
            alt="预览"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 px-4 text-center">
            <svg className="h-8 w-8 text-[var(--color-border)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0L21 15m-18 3.75h16.5A2.25 2.25 0 0021.75 16.5V7.5A2.25 2.25 0 0019.5 5.25H4.5A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
            </svg>
            <span className="text-sm text-[var(--color-text-secondary)]">
              点击或拖拽上传图片
            </span>
            <span className="text-xs text-[var(--color-border)]">
              JPG / PNG / WebP，自动压缩至 1024px
            </span>
          </div>
        )}

        {preview && !isCompressing && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity hover:opacity-100">
            <span className="text-sm text-white font-medium">重新上传</span>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-500">{error}</p>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={onFileChange}
        className="hidden"
      />
    </div>
  )
}
