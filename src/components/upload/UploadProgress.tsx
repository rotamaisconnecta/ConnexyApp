import { cn } from '@/lib/utils'

interface UploadProgressProps {
  progress: number
  className?: string
}

export function UploadProgress({ progress, className }: UploadProgressProps) {
  const clamped = Math.min(100, Math.max(0, progress))

  return (
    <div className={cn('w-full h-1.5 bg-muted rounded-full overflow-hidden', className)}>
      <div
        className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
