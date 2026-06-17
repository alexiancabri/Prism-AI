import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

/* =========================================================================
   PRISM AUTH SCENE — an interactive 3D refracting prism rendered to a
   full-bleed canvas behind the auth card.

   • A white beam enters from the left, strikes a wireframe 3D prism, and
     refracts into a colored fan on the right.
   • The fan bends toward the cursor and the prism parallax-tilts in 3D.
   • Calling `pulse("email" | "password" | "burst")` sends a packet of light
     down the beam and flares the spectrum — wired to field completion so
     finishing a field literally lights up the prism.
   ========================================================================= */

export type PulseType = "email" | "password" | "burst";
export interface PrismSceneHandle {
  pulse: (type: PulseType) => void;
}

interface Pulse {
  t: number;
  type: PulseType;
}

const RAYS = [
  { color: "#3b82f6", ang: -30 },
  { color: "#22c55e", ang: -15 },
  { color: "#a78bfa", ang: 0 },
  { color: "#fb923c", ang: 15 },
  { color: "#34d399", ang: 30 },
];

const hexA = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
};

const lerp = (
  p: { x: number; y: number },
  q: { x: number; y: number },
  t: number,
) => ({ x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t });

const PrismAuthScene = forwardRef<PrismSceneHandle, Record<string, never>>(
  function PrismAuthScene(_props, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pulses = useRef<Pulse[]>([]);

    useImperativeHandle(
      ref,
      () => ({
        pulse: (type) => {
          pulses.current.push({ t: performance.now(), type });
        },
      }),
      [],
    );

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      let W = 0;
      let H = 0;

      // Cursor in normalized [0..1] viewport coords, eased.
      const cur = { x: 0.5, y: 0.5 };
      const eased = { x: 0.5, y: 0.5 };

      const resize = () => {
        W = canvas.clientWidth;
        H = canvas.clientHeight;
        canvas.width = Math.max(1, Math.round(W * dpr));
        canvas.height = Math.max(1, Math.round(H * dpr));
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();
      window.addEventListener("resize", resize);

      const onMove = (e: PointerEvent) => {
        cur.x = e.clientX / window.innerWidth;
        cur.y = e.clientY / window.innerHeight;
      };
      if (!reduce) window.addEventListener("pointermove", onMove);

      // Ambient drifting motes.
      const motes = Array.from({ length: 34 }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 0.6 + Math.random() * 1.4,
        sp: 0.02 + Math.random() * 0.05,
        ph: Math.random() * Math.PI * 2,
      }));

      let raf = 0;
      let t = 0;

      const draw = () => {
        eased.x += (cur.x - eased.x) * 0.06;
        eased.y += (cur.y - eased.y) * 0.06;

        ctx.clearRect(0, 0, W, H);

        // ---- decay-summed "energy" from recent pulses -------------------
        const now = performance.now();
        pulses.current = pulses.current.filter((p) => now - p.t < 1700);
        let energy = 0;
        for (const p of pulses.current) {
          const dur = p.type === "burst" ? 1500 : 1100;
          const w = p.type === "burst" ? 1.5 : 0.7;
          energy += w * Math.max(0, 1 - (now - p.t) / dur);
        }
        energy = Math.min(energy, 2.2);

        // ---- geometry ---------------------------------------------------
        const size = Math.max(130, Math.min(Math.min(W, H) * 0.2, 230));
        const cx = W * 0.5;
        const cy = H * 0.46;
        const A = { x: cx, y: cy - size };
        const B = { x: cx - size * 0.92, y: cy + size * 0.74 };
        const C = { x: cx + size * 0.92, y: cy + size * 0.74 };

        // 3D depth offset shifts with cursor → parallax tilt.
        const depth = {
          x: 16 + (eased.x - 0.5) * 34,
          y: 12 + (eased.y - 0.5) * 26,
        };
        const A2 = { x: A.x + depth.x, y: A.y + depth.y };
        const B2 = { x: B.x + depth.x, y: B.y + depth.y };
        const C2 = { x: C.x + depth.x, y: C.y + depth.y };

        const entryHit = lerp(A, B, 0.52);
        const exitPt = lerp(A, C, 0.52);
        const beamStart = { x: -20, y: entryHit.y };

        // Fan bends toward cursor + slow idle sway.
        const bend = (eased.y - 0.5) * 0.55 + Math.sin(t * 0.5) * 0.04;
        const rayLen = size * 1.85;
        const rayEnds = RAYS.map((r) => {
          const rad = (r.ang * Math.PI) / 180 + bend;
          return {
            ...r,
            end: {
              x: exitPt.x + Math.cos(rad) * rayLen,
              y: exitPt.y + Math.sin(rad) * rayLen,
            },
          };
        });

        const glow = 0.32 + energy * 0.42;

        // ---- ambient motes ----------------------------------------------
        for (const m of motes) {
          m.x += Math.cos(m.ph) * m.sp * 0.004;
          m.y += Math.sin(m.ph) * m.sp * 0.004;
          if (m.x < 0) m.x += 1;
          if (m.x > 1) m.x -= 1;
          if (m.y < 0) m.y += 1;
          if (m.y > 1) m.y -= 1;
          const tw = 0.18 + 0.22 * (0.5 + 0.5 * Math.sin(t * 1.5 + m.ph));
          ctx.beginPath();
          ctx.arc(m.x * W, m.y * H, m.r, 0, Math.PI * 2);
          ctx.fillStyle = hexA("#3b82f6", tw * (0.6 + energy * 0.4));
          ctx.fill();
        }

        // ---- incoming beam ----------------------------------------------
        const beamPulse = 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.6));
        const beamA = 0.5 * beamPulse + energy * 0.25;
        ctx.beginPath();
        ctx.moveTo(beamStart.x, beamStart.y);
        ctx.lineTo(entryHit.x, entryHit.y);
        ctx.strokeStyle = `rgba(255,255,255,${Math.min(1, beamA).toFixed(3)})`;
        ctx.lineWidth = 1.8;
        ctx.stroke();
        ctx.strokeStyle = `rgba(255,255,255,${(beamA * 0.12).toFixed(3)})`;
        ctx.lineWidth = 8 + energy * 6;
        ctx.stroke();

        // internal segment through the prism
        ctx.beginPath();
        ctx.moveTo(entryHit.x, entryHit.y);
        ctx.lineTo(exitPt.x, exitPt.y);
        ctx.strokeStyle = hexA("#e2e8f0", 0.4 + energy * 0.3);
        ctx.lineWidth = 1.4;
        ctx.stroke();

        // ---- refracted fan ----------------------------------------------
        rayEnds.forEach((r, i) => {
          const op =
            (0.32 + 0.5 * (0.5 + 0.5 * Math.sin(t * 1.1 + i))) * (0.6 + glow);
          ctx.beginPath();
          ctx.moveTo(exitPt.x, exitPt.y);
          ctx.lineTo(r.end.x, r.end.y);
          ctx.strokeStyle = hexA(r.color, Math.min(1, op));
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.strokeStyle = hexA(r.color, Math.min(1, op) * 0.16);
          ctx.lineWidth = 7 + energy * 5;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(r.end.x, r.end.y, 3.5 + energy * 2, 0, Math.PI * 2);
          ctx.fillStyle = hexA(r.color, Math.min(1, op));
          ctx.fill();
        });

        // ---- pulse packets + burst rings --------------------------------
        for (const p of pulses.current) {
          const dur = p.type === "burst" ? 1500 : 1100;
          const a = (now - p.t) / dur;
          if (a < 0 || a > 1) continue;

          if (a < 0.45) {
            // travel beamStart → exit (through the prism)
            const seg = a / 0.45;
            const mid = lerp(beamStart, entryHit, Math.min(1, seg * 2));
            const pos =
              seg < 0.5 ? mid : lerp(entryHit, exitPt, (seg - 0.5) * 2);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.95)";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 11, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.12)";
            ctx.fill();
          } else {
            // disperse along the rays
            const seg = (a - 0.45) / 0.55;
            const set =
              p.type === "burst" ? rayEnds : [rayEnds[2], rayEnds[1], rayEnds[3]];
            for (const r of set) {
              const pos = lerp(exitPt, r.end, seg);
              const fade = 1 - seg;
              ctx.beginPath();
              ctx.arc(pos.x, pos.y, 3.2, 0, Math.PI * 2);
              ctx.fillStyle = hexA(r.color, 0.9 * fade);
              ctx.fill();
            }
          }

          // burst → expanding chromatic shockwave from the exit point
          if (p.type === "burst") {
            const ringR = a * size * 2.4;
            const ringA = (1 - a) * 0.5;
            [
              ["#3b82f6", -3],
              ["#a78bfa", 0],
              ["#34d399", 3],
            ].forEach(([col, off]) => {
              ctx.beginPath();
              ctx.arc(
                exitPt.x,
                exitPt.y,
                ringR + (off as number),
                0,
                Math.PI * 2,
              );
              ctx.strokeStyle = hexA(col as string, ringA);
              ctx.lineWidth = 1.6;
              ctx.stroke();
            });
          }
        }

        // ---- 3D prism (back face → connectors → glass front) ------------
        ctx.beginPath();
        ctx.moveTo(A2.x, A2.y);
        ctx.lineTo(B2.x, B2.y);
        ctx.lineTo(C2.x, C2.y);
        ctx.closePath();
        ctx.fillStyle = hexA("#0a0a0f", 0.55);
        ctx.fill();
        ctx.strokeStyle = hexA("#3b82f6", 0.18 + energy * 0.12);
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.strokeStyle = hexA("#52525b", 0.5);
        ctx.lineWidth = 0.8;
        [
          [A, A2],
          [B, B2],
          [C, C2],
        ].forEach(([p1, p2]) => {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        });

        // glass front face
        const grad = ctx.createLinearGradient(A.x, A.y, C.x, C.y);
        grad.addColorStop(0, hexA("#3b82f6", 0.05 + energy * 0.06));
        grad.addColorStop(0.5, hexA("#0d0d12", 0.6));
        grad.addColorStop(1, hexA("#a78bfa", 0.05 + energy * 0.05));
        ctx.beginPath();
        ctx.moveTo(A.x, A.y);
        ctx.lineTo(B.x, B.y);
        ctx.lineTo(C.x, C.y);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = hexA("#3b82f6", 0.1 + energy * 0.1);
        ctx.stroke();
        ctx.lineWidth = 0.9;
        ctx.strokeStyle = hexA("#e2e8f0", 0.85);
        ctx.stroke();

        if (!reduce) {
          t += 0.016;
          raf = requestAnimationFrame(draw);
        }
      };

      draw();

      return () => {
        cancelAnimationFrame(raf);
        window.removeEventListener("resize", resize);
        window.removeEventListener("pointermove", onMove);
      };
    }, []);

    return <canvas ref={canvasRef} className="auth-scene" aria-hidden="true" />;
  },
);

export default PrismAuthScene;
