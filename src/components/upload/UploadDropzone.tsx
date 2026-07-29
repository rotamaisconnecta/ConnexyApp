import { useRef, useState, useCallback, DragEvent } from 'react'
import { cn } from '@/lib/utils'
import { Upload, Image, Video } from 'lucide-react'
import { UploadMode } from '@/lib/upload'

interface UploadDropzoneProps {
  mode: UploadMode
  multiple?: boolean
  accept?: string
  onFiles: (files: FileList) => void
  disabled?: boolean
}

function getIcon(mode: UploadMode) {
  switch (mode) {
    case 'photo':
      return Image
    case 'video':
      return Video
    default:
      return Upload
  }
}

function getLabel(mode: UploadMode) {
  switch (mode) {
    case 'photo':
      return 'Fotos'
    case 'video':
      return 'Vídeos'
    default:
      return 'Mídia'
  }
}

export function UploadDropzone({
  mode,
  multiple,
  accept,
  onFiles,
  disabled,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const Icon = getIcon(mode)
  const label = getLabel(mode)

  const handleClick = () => {
    if (!disabled) inputRef.current?.click()
  }

  const handleChange = () => {
    if (inputRef.current?.files?.length) {
      onFiles(inputRef.current.files)
      inputRef.current.value = ''
    }
  }

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragging(false)
      if (!disabled && e.dataTransfer.files.length) {
        onFiles(e.dataTransfer.files)
      }
    },
    [disabled, onFiles]
  )

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors',
        dragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/50',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
        disabled={disabled}
      />
      <Icon className="w-8 h-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground text-center">
        <span className="font-medium text-foreground">Clique</span> ou arraste{' '}
        {label.toLowerCase()} aqui
      </p>
      <p className="text-xs text-muted-foreground">
        {mode === 'photo' ? 'PNG, JPG, WEBP, HEIC' : 'MP4, MOV, WEBM'} —{' '}
        {multiple ? 'até 9 arquivos' : '1 arquivo'}
      </p>
    </div>
  )
}
