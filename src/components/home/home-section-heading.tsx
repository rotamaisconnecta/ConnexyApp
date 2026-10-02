import { TypeScale } from "@/theme/typography";
import type { ReactNode } from "react";

export function HomeSectionHeading({
  title,
  subtitle,
  emoji,
  action,
  as = "h2",
}: {
  title: string;
  subtitle?: string;
  emoji?: string;
  action?: ReactNode;
  as?: "h2" | "h3";
}) {
  const Heading = as;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          {emoji ? (
            <span className="text-sm" aria-hidden>
              {emoji}
            </span>
          ) : null}
          <Heading className={`truncate font-display font-semibold ${TypeScale.sectionTitle}`}>
            {title}
          </Heading>
        </div>
        {subtitle ? (
          <p className={`mt-0.5 text-muted-foreground ${TypeScale.meta}`}>{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}
