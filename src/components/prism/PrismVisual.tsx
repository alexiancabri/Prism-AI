import { cn } from "@/lib/utils";

/* The signature visual: a beam of white "documents" enters a prism and
   refracts into a spectrum of "answers". Pure SVG, animated with CSS. */
export function PrismVisual({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 560 420"
      className={cn("h-full w-full", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="hsl(var(--foreground))" stopOpacity="0" />
          <stop offset="1" stopColor="hsl(var(--foreground))" stopOpacity="0.85" />
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="hsl(var(--spectrum-1))" />
          <stop offset="0.5" stopColor="hsl(var(--spectrum-3))" />
          <stop offset="1" stopColor="hsl(var(--spectrum-4))" />
        </linearGradient>
        <radialGradient id="core" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="hsl(var(--spectrum-1))" stopOpacity="0.16" />
          <stop offset="1" stopColor="hsl(var(--spectrum-1))" stopOpacity="0" />
        </radialGradient>
        <filter id="soft" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      {/* incoming beam */}
      <rect x="0" y="203" width="230" height="6" fill="url(#beam)" rx="3" />
      <rect x="0" y="203" width="230" height="6" fill="url(#beam)" rx="3" filter="url(#soft)" opacity="0.6" />

      {/* refracted spectrum rays */}
      {[
        { y2: 70, color: "1", w: 5 },
        { y2: 130, color: "2", w: 5 },
        { y2: 195, color: "3", w: 5 },
        { y2: 255, color: "4", w: 5 },
        { y2: 320, color: "5", w: 5 },
      ].map((r, i) => (
        <g key={i}>
          <line
            x1="285"
            y1="206"
            x2="560"
            y2={r.y2}
            stroke={`hsl(var(--spectrum-${r.color}))`}
            strokeWidth={r.w}
            strokeLinecap="round"
            opacity="0.9"
            style={{
              animation: `fade-in 0.8s ease-out ${0.4 + i * 0.12}s both`,
            }}
          />
          <line
            x1="285"
            y1="206"
            x2="560"
            y2={r.y2}
            stroke={`hsl(var(--spectrum-${r.color}))`}
            strokeWidth={r.w + 8}
            strokeLinecap="round"
            opacity="0.25"
            filter="url(#soft)"
          />
        </g>
      ))}

      {/* glow core behind prism */}
      <circle cx="250" cy="206" r="110" fill="url(#core)" className="animate-aurora" />

      {/* the prism */}
      <polygon
        points="250,96 320,300 180,300"
        fill="hsl(var(--secondary) / 0.7)"
        stroke="url(#edge)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        className="animate-float"
        style={{ transformOrigin: "250px 200px" }}
      />
      <polygon
        points="250,96 320,300 180,300"
        fill="none"
        stroke="hsl(var(--foreground) / 0.15)"
        strokeWidth="1"
        strokeLinejoin="round"
        className="animate-float"
      />
    </svg>
  );
}
