import { MediaFile } from './upload-types'

export function uploadStorage(file: MediaFile): Promise<string> {
  throw new Error('Storage provider not configured.')
}

export async function uploadMultiple(
  files: MediaFile[]
): Promise<string[]> {
  throw new Error('Storage provider not configured.')
}
