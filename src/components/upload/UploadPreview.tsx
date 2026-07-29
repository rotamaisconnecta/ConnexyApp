import { cn } from '@/lib/utils'
import {
  FileIcon,
  Play,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { MediaFile } from '@/lib/upload'

interface UploadPreviewProps {
  file: MediaFile
  onRemove?: (id: string) => void
  className?: string
}

export function UploadPreview({ file, onRemove, className }: UploadPreviewProps) {
  const isVideo = file.type.startsWith('video/')
  const isImage = file.type.startsWith('image/')
  const isError = file.status === 'error'
  const isUploading = file.status === 'uploading'

  return (
    <div
      className={cn(
        'relative group rounded-xl overflow-hidden border border-border bg-muted aspect-square',
        isError && 'ring-2 ring-destructive',
        className
      )}
    >
      {isImage && file.preview ? (
        <img
          src={file.preview}
          alt={file.name}
          className="w-full h-full object-cover"
        />
      ) : isVideo ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black/5">
          {file.preview ? (
            <video
              src={file.preview}
              className="w-full h-full object-cover"
              preload="metadata"
            />
          ) : (
            <FileIcon className="w-8 h-8 text-muted-foreground" />
          )}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-black/60 flex items-center justify-center">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-black/5">
          <FileIcon className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {isUploading && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-white" />
        </div>
      )}

      {isError && (
        <div className="absolute top-1 right-1">
          <AlertCircle className="w-4 h-4 text-destructive" />
        </div>
      )}

      {file.status === 'success' && (
        <div className="absolute top-1 right-1">
          <CheckCircle2 className="w-4 h-4 text-green-500" />
        </div>
      )}

      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onRemove(file.id)
          }}
          className="absolute top-1 left-1 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
        >
          <X className="w-3.5 h-3.5 text-white" />
        </button>
      )}
    </div>
  )
}
