import { cn } from '@/lib/utils'
import { MediaFile } from '@/lib/upload'
import { UploadPreview } from './UploadPreview'

interface UploadGridProps {
  files: MediaFile[]
  onRemove?: (id: string) => void
  maxFiles?: number
}

export function UploadGrid({ files, onRemove, maxFiles }: UploadGridProps) {
  const cols = files.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
  return (
    <div className={cn('grid gap-2', cols)}>
      {files.slice(0, maxFiles).map((file) => (
        <UploadPreview key={file.id} file={file} onRemove={onRemove} />
      ))}
    </div>
  )
}
