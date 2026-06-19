/* Self-contained brand logos for the source cards (no external CDN).
   Each renders a 40x40 rounded app-icon tile. */
import { cn } from "@/lib/utils";

const TILE = "flex h-10 w-10 items-center justify-center rounded-lg shrink-0";

export function GoogleDriveLogo({ className }: { className?: string }) {
  return (
    <span className={cn(TILE, "bg-white", className)}>
      <svg width="22" height="22" viewBox="0 0 87.3 78" aria-hidden="true">
        <path
          fill="#0066da"
          d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8H0c0 1.55.4 3.1 1.2 4.5z"
        />
        <path
          fill="#00ac47"
          d="M43.65 25L29.9 1.2c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44C.4 49.9 0 51.45 0 53h27.5z"
        />
        <path
          fill="#ea4335"
          d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5H59.8l5.85 11.5z"
        />
        <path
          fill="#00832d"
          d="M43.65 25L57.4 1.2C56.05.4 54.5 0 52.9 0H34.4c-1.6 0-3.15.45-4.5 1.2z"
        />
        <path
          fill="#2684fc"
          d="M59.8 53H27.5L13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z"
        />
        <path
          fill="#ffba00"
          d="M73.4 26.5L60.7 4.5c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25l16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z"
        />
      </svg>
    </span>
  );
}

export function NotionLogo({ className }: { className?: string }) {
  return (
    <span className={cn(TILE, "bg-white", className)}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <text
          x="20"
          y="21"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="24"
          fill="#0f0f0f"
        >
          N
        </text>
      </svg>
    </span>
  );
}

export function SharePointLogo({ className }: { className?: string }) {
  return (
    <span
      className={cn(TILE, className)}
      style={{ background: "linear-gradient(135deg,#036C70,#1A9BA2)" }}
    >
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <text
          x="20"
          y="21"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="'Segoe UI', Arial, sans-serif"
          fontWeight="700"
          fontSize="22"
          fontStyle="italic"
          fill="#fff"
        >
          S
        </text>
      </svg>
    </span>
  );
}

export function PdfLogo({ className }: { className?: string }) {
  return (
    <span className={cn(TILE, "bg-[#e5252a]", className)}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <text
          x="20"
          y="22"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Arial, sans-serif"
          fontWeight="800"
          fontSize="9.5"
          letterSpacing="0.5"
          fill="#fff"
        >
          PDF
        </text>
      </svg>
    </span>
  );
}

export function WordLogo({ className }: { className?: string }) {
  return (
    <span className={cn(TILE, "bg-[#2b579a]", className)}>
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <text
          x="20"
          y="21"
          textAnchor="middle"
          dominantBaseline="central"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontWeight="700"
          fontSize="22"
          fill="#fff"
        >
          W
        </text>
      </svg>
    </span>
  );
}
