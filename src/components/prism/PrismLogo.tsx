import { cn } from "@/lib/utils";

interface PrismLogoProps {
  className?: string;
  withWordmark?: boolean;
}

export function PrismMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="prism-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(var(--spectrum-1))" />
          <stop offset="0.5" stopColor="hsl(var(--spectrum-3))" />
          <stop offset="1" stopColor="hsl(var(--spectrum-4))" />
        </linearGradient>
      </defs>
      <polygon
        points="50,10 88,80 12,80"
        fill="none"
        stroke="url(#prism-mark)"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <line x1="50" y1="10" x2="50" y2="80" stroke="url(#prism-mark)" strokeWidth="3" opacity="0.5" />
    </svg>
  );
}

export function PrismLogo({ className, withWordmark = true }: PrismLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <PrismMark />
      {withWordmark && (
        <span className="font-display text-xl font-semibold tracking-tight text-foreground">
          Prism
        </span>
      )}
    </div>
  );
}
