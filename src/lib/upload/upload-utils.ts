import { MediaFile, MediaStatus } from './upload-types'

let counter = 0

function generateId(): string {
  counter++
  return `media-${Date.now()}-${counter}`
}

export function createMediaFile(file: File): MediaFile {
  const preview = URL.createObjectURL(file)
  return {
    id: generateId(),
    name: file.name,
    type: file.type,
    size: file.size,
    url: preview,
    preview,
    status: 'ready',
    progress: 0,
    file,
  }
}

export function generatePreview(file: File): string {
  return URL.createObjectURL(file)
}

export function revokePreview(url: string) {
  URL.revokeObjectURL(url)
}

export function validateSize(file: File, maxSize: number): boolean {
  return file.size <= maxSize
}

export function validateExtension(
  fileName: string,
  allowedExtensions: string[]
): boolean {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  return allowedExtensions.includes(ext)
}

export async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file)
      return
    }
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const MAX = 1920
      let { width, height } = img
      if (width > MAX || height > MAX) {
        const ratio = Math.min(MAX / width, MAX / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(
              new File([blob], file.name, { type: 'image/jpeg' })
            )
          } else {
            resolve(file)
          }
        },
        'image/jpeg',
        0.85
      )
    }
    img.src = URL.createObjectURL(file)
  })
}

export function prepareForUpload(files: MediaFile[]): File[] {
  return files.map((f) => f.file)
}

export async function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}
