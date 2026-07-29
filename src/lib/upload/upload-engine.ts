import { MediaFile } from './upload-types'

export class ConnexyUploadEngine {
  private files: MediaFile[] = []

  getFiles(): MediaFile[] {
    return [...this.files]
  }

  addFiles(newFiles: MediaFile[]): MediaFile[] {
    this.files = [...this.files, ...newFiles]
    return this.getFiles()
  }

  removeMedia(id: string): MediaFile[] {
    const file = this.files.find((f) => f.id === id)
    if (file) {
      URL.revokeObjectURL(file.preview)
    }
    this.files = this.files.filter((f) => f.id !== id)
    return this.getFiles()
  }

  replaceMedia(id: string, newFile: MediaFile): MediaFile[] {
    const idx = this.files.findIndex((f) => f.id === id)
    if (idx !== -1) {
      URL.revokeObjectURL(this.files[idx].preview)
      this.files[idx] = newFile
    }
    return this.getFiles()
  }

  clearAll(): MediaFile[] {
    this.files.forEach((f) => URL.revokeObjectURL(f.preview))
    this.files = []
    return this.getFiles()
  }

  updateStatus(id: string, status: MediaFile['status']): void {
    const file = this.files.find((f) => f.id === id)
    if (file) {
      file.status = status
    }
  }

  updateProgress(id: string, progress: number): void {
    const file = this.files.find((f) => f.id === id)
    if (file) {
      file.progress = progress
    }
  }

  getTotalSize(): number {
    return this.files.reduce((acc, f) => acc + f.size, 0)
  }

  getFileCount(): number {
    return this.files.length
  }

  futureUpload(files: MediaFile[]): Promise<string[]> {
    throw new Error('Storage provider not configured.')
  }
}

export const uploadEngine = new ConnexyUploadEngine()
