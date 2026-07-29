import { Plus, Trash2, Replace, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UploadToolbarProps {
  fileCount: number
  maxFiles?: number
  onAdd?: () => void
  onRemoveAll?: () => void
  onReplace?: () => void
  className?: string
}

export function UploadToolbar({
  fileCount,
  maxFiles,
  onAdd,
  onRemoveAll,
  onReplace,
  className,
}: UploadToolbarProps) {
  const canAdd = !maxFiles || fileCount < maxFiles

  return (
    <div
      className={cn(
        'flex items-center gap-2 flex-wrap',
        className
      )}
    >
      {onAdd && canAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Adicionar
        </button>
      )}
      {onReplace && fileCount === 1 && (
        <button
          type="button"
          onClick={onReplace}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Replace className="w-3.5 h-3.5" />
          Substituir
        </button>
      )}
      {onRemoveAll && fileCount > 0 && (
        <button
          type="button"
          onClick={onRemoveAll}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive hover:text-destructive/80 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Limpar
        </button>
      )}
    </div>
  )
}
