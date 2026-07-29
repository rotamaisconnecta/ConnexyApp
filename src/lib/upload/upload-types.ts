export type MediaStatus =
  | 'idle'
  | 'reading'
  | 'ready'
  | 'uploading'
  | 'success'
  | 'error'

export type UploadMode = 'photo' | 'video' | 'mixed'

export interface MediaFile {
  id: string
  name: string
  type: string
  size: number
  url: string
  preview: string
  status: MediaStatus
  progress: number
  file: File
}

export interface UploadValidation {
  maxSize: number
  allowedExtensions: string[]
}

export const PHOTO_VALIDATION: UploadValidation = {
  maxSize: 20 * 1024 * 1024,
  allowedExtensions: ['png', 'jpg', 'jpeg', 'webp', 'heic'],
}

export const VIDEO_VALIDATION: UploadValidation = {
  maxSize: 250 * 1024 * 1024,
  allowedExtensions: ['mp4', 'mov', 'webm'],
}

export const PHOTO_ACCEPT = 'image/*'
export const VIDEO_ACCEPT = 'video/*'
export const MIXED_ACCEPT = 'image/*,video/*'

export const MAX_GRID_FILES = 9
