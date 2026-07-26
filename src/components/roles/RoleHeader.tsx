interface RoleHeaderProps {
  title?: string;
  description?: string;
}

export function RoleHeader({
  title = "Ativar Funcionalidades",
  description = "Ative papéis adicionais para desbloquear recursos do Connexy.",
}: RoleHeaderProps) {
  return (
    <div className="mb-3">
      <h2 className="font-display font-bold text-sm">{title}</h2>
      {description && <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>}
    </div>
  );
}
