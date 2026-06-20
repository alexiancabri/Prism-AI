import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { ArrowRight, FileText, Upload, Sparkles, MessageSquare, Check } from "lucide-react";
import "@/styles/cinematic.css";

gsap.registerPlugin(ScrollTrigger);

/* ---------- Magnetic button ---------- */
function Magnetic({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);
  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const x = e.clientX - (r.left + r.width / 2);
        const y = e.clientY - (r.top + r.height / 2);
        el.style.transform = `translate(${x * 0.3}px, ${y * 0.45}px)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </button>
  );
}

/* ---------- 3D tilt card ---------- */
function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div
      ref={ref}
      className="cine-3dcard"
      onPointerMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        el.style.transform = `rotateX(${(0.5 - py) * 12}deg) rotateY(${(px - 0.5) * 14}deg)`;
      }}
      onPointerLeave={() => {
        if (ref.current) ref.current.style.transform = "";
      }}
    >
      {children}
    </div>
  );
}

/* ---------- Glistening 3D prism (canvas) — scroll-zooms into its core ---------- */
function HeroPrism({ zoomRef }: { zoomRef: React.MutableRefObject<number> }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    const resize = () => {
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const r = 96;
    const d = 150;
    const triPts: [number, number][] = [[0, -1], [-0.866, 0.55], [0.866, 0.55]];
    const verts: [number, number, number][] = [];
    for (const [x, y] of triPts) verts.push([x * r, y * r, d / 2]);
    for (const [x, y] of triPts) verts.push([x * r, y * r, -d / 2]);
    const faces = [
      [0, 1, 2],
      [3, 4, 5],
      [0, 1, 4, 3],
      [1, 2, 5, 4],
      [2, 0, 3, 5],
    ];

    const rot = (
      p: [number, number, number],
      ay: number,
      ax: number,
    ): [number, number, number] => {
      const [x, y, z] = p;
      const cy = Math.cos(ay);
      const sy = Math.sin(ay);
      const x1 = x * cy + z * sy;
      const z1 = -x * sy + z * cy;
      const cx = Math.cos(ax);
      const sx = Math.sin(ax);
      const y1 = y * cx - z1 * sx;
      const z2 = y * sx + z1 * cx;
      return [x1, y1, z2];
    };

    const sparks = Array.from({ length: 22 }, () => ({
      a: Math.random() * Math.PI * 2,
      rad: 70 + Math.random() * 150,
      ph: Math.random() * Math.PI * 2,
      sp: 0.4 + Math.random() * 1,
    }));

    let t = 0;
    let raf = 0;
    const focal = 560;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      const z = Math.max(0, Math.min(1, zoomRef.current));
      const zoom = 1 + z * z * 9; // ease-in zoom toward the core
      const fade = z < 0.72 ? 1 : Math.max(0, 1 - (z - 0.72) / 0.28);
      const cx = W * 0.5;
      const cyc = H * 0.5;
      ctx.globalAlpha = fade;

      // gentle wobble (no full spin) so it glistens
      const ay = 0.62 + Math.sin(t * 0.5) * 0.42;
      const ax = -0.4 + Math.sin(t * 0.33) * 0.06;
      const P = verts.map((v) => {
        const [x, y, zz] = rot(v, ay, ax);
        const s = focal / (focal - zz);
        return [cx + x * s * zoom, cyc + y * s * zoom, zz] as [number, number, number];
      });

      // ambient core glow
      const glow = ctx.createRadialGradient(cx, cyc, 0, cx, cyc, 170 * zoom);
      glow.addColorStop(0, "rgba(59,130,246,0.22)");
      glow.addColorStop(1, "rgba(59,130,246,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // incoming beam + dispersed rays
      const pulse = 0.6 + 0.4 * Math.sin(t * 2.2);
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(255,255,255,${(0.55 * pulse * fade).toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cyc);
      ctx.lineTo(cx, cyc);
      ctx.stroke();
      const rays: [string, number][] = [
        ["#3b82f6", -24],
        ["#22c55e", -8],
        ["#a78bfa", 8],
        ["#34d399", 24],
      ];
      for (const [col, ang] of rays) {
        const a = (ang * Math.PI) / 180;
        const len = (W * 0.55) * zoom;
        const ex = cx + Math.cos(a) * len;
        const ey = cyc + Math.sin(a) * len;
        const g = ctx.createLinearGradient(cx, cyc, ex, ey);
        g.addColorStop(0, col);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.strokeStyle = g;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cyc);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        ctx.globalAlpha = 0.12 * fade;
        ctx.lineWidth = 10;
        ctx.strokeStyle = col;
        ctx.stroke();
        ctx.globalAlpha = fade;
      }

      // glass faces, painter-sorted far → near
      const order = faces
        .map((f) => ({ f, z: f.reduce((s, i) => s + P[i][2], 0) / f.length }))
        .sort((a, b) => a.z - b.z);
      const shimmer = 0.5 + 0.5 * Math.sin(t * 1.6);
      for (const { f, z: fz } of order) {
        ctx.beginPath();
        ctx.moveTo(P[f[0]][0], P[f[0]][1]);
        for (let k = 1; k < f.length; k++) ctx.lineTo(P[f[k]][0], P[f[k]][1]);
        ctx.closePath();
        ctx.fillStyle = `rgba(59,130,246,${(0.05 + 0.16 * ((fz + d / 2) / d)).toFixed(3)})`;
        ctx.fill();
        ctx.lineWidth = 1.1;
        ctx.strokeStyle = `rgba(226,232,240,${(0.45 + 0.4 * shimmer).toFixed(2)})`;
        ctx.stroke();
      }

      // glistening sparkles
      for (const sp of sparks) {
        const tw = 0.5 + 0.5 * Math.sin(t * sp.sp * 2 + sp.ph);
        const px = cx + Math.cos(sp.a + t * 0.05) * sp.rad * zoom;
        const py = cyc + Math.sin(sp.a + t * 0.05) * sp.rad * 0.66 * zoom;
        ctx.beginPath();
        ctx.arc(px, py, 1.3 * tw + 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(205,225,255,${(0.55 * tw).toFixed(2)})`;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      if (!reduce) {
        t += 0.012;
        raf = requestAnimationFrame(draw);
      }
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [zoomRef]);
  return <canvas ref={ref} className="cine-canvas" aria-hidden="true" />;
}

/* ---------- Loader ---------- */
function Loader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  useEffect(() => {
    let v = 0;
    const id = window.setInterval(() => {
      v = Math.min(100, v + Math.random() * 9 + 4);
      setPct(Math.floor(v));
      if (v >= 100) {
        window.clearInterval(id);
        window.setTimeout(onDone, 550);
      }
    }, 95);
    return () => window.clearInterval(id);
  }, [onDone]);

  const rays: [string, number, number][] = [
    ["#3b82f6", -22, 0.9],
    ["#22c55e", 0, 1.05],
    ["#a78bfa", 22, 1.2],
  ];

  return (
    <motion.div
      className="cine-loader"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
    >
      <svg width="120" height="110" viewBox="0 0 120 110">
        <motion.path
          d="M60 10 L108 96 L12 96 Z"
          fill="none"
          stroke="#fafafa"
          strokeWidth="1.8"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
        />
        <motion.path
          d="M28 96 L70 28"
          stroke="#3b82f6"
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: 0.85, duration: 0.6 }}
        />
        {rays.map(([color, ang, delay], i) => {
          const rad = (ang * Math.PI) / 180;
          const x2 = 70 + Math.cos(rad) * 46;
          const y2 = 28 + Math.sin(rad) * 46;
          return (
            <motion.line
              key={i}
              x1={70}
              y1={28}
              x2={x2}
              y2={y2}
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ delay, duration: 0.5 }}
            />
          );
        })}
      </svg>
      <div className="pct">{pct}%</div>
    </motion.div>
  );
}

/* ---------- Live demo card (auto-typing) ---------- */
const ANSWER_TOKENS: { t: string; hl?: boolean }[] = [
  { t: "Net CHF exposure in Q3 was " },
  { t: "CHF 4.2M", hl: true },
  { t: ", concentrated in the " },
  { t: "Geneva trading book", hl: true },
  { t: ", down " },
  { t: "12% QoQ", hl: true },
  { t: " after the September hedging program." },
];

function DemoCard() {
  const ref = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"idle" | "typing" | "answering" | "done">("idle");
  const [typed, setTyped] = useState("");
  const [shown, setShown] = useState(0);
  const Q = "What was our Q3 exposure to CHF?";

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPhase((p) => (p === "idle" ? "typing" : p));
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "typing") return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(Q.slice(0, i));
      if (i >= Q.length) {
        window.clearInterval(id);
        window.setTimeout(() => setPhase("answering"), 550);
      }
    }, 48);
    return () => window.clearInterval(id);
  }, [phase]);

  useEffect(() => {
    if (phase !== "answering") return;
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= ANSWER_TOKENS.length) {
        window.clearInterval(id);
        window.setTimeout(() => setPhase("done"), 300);
      }
    }, 280);
    return () => window.clearInterval(id);
  }, [phase]);

  return (
    <div ref={ref} className="cine-demo-card cine-reveal">
      <div className="cine-demo-bar">
        <div className="lights">
          <i style={{ background: "#ff5f57" }} />
          <i style={{ background: "#febc2e" }} />
          <i style={{ background: "#28c840" }} />
        </div>
        prism.app — Geneva workspace
      </div>
      <div className="cine-demo-body">
        {phase !== "idle" && (
          <div className="cine-msg-user">
            {typed}
            {phase === "typing" && <span className="cine-typecaret" />}
          </div>
        )}

        {(phase === "answering" || phase === "done") && (
          <div className="cine-msg-bot">
            {ANSWER_TOKENS.slice(0, shown).map((tok, i) =>
              tok.hl ? (
                <span key={i} className="cine-hl">
                  {tok.t}
                </span>
              ) : (
                <span key={i}>{tok.t}</span>
              ),
            )}
            {phase === "done" && (
              <div className="cine-cites">
                <span className="cine-cite">
                  <span className="d" /> Q3_Treasury_Report.pdf · p.12
                </span>
                <span className="cine-cite">
                  <span className="d" /> FX_Hedging_Sept.xlsx · Sheet 2
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const BRANDS = [
  "Banque Léman",
  "Helvetia Capital",
  "Rhône Partners",
  "Genève Asset Mgmt",
  "Alpine Trust",
  "Quai Wealth",
  "Mont Blanc Securities",
  "Lac Capital",
];

const HOW = [
  {
    step: "STEP 01",
    title: "Upload",
    body: "Drop in PDFs, Word docs, or connect a source. Prism ingests everything securely.",
    icon: Upload,
  },
  {
    step: "STEP 02",
    title: "Embed",
    body: "Documents are parsed, chunked, and embedded into your private vector index in seconds.",
    icon: Sparkles,
  },
  {
    step: "STEP 03",
    title: "Ask",
    body: "Ask in plain English. Every answer is grounded in your documents — with exact citations.",
    icon: MessageSquare,
  },
];

const PRICING = [
  { name: "Starter", price: "$0", per: "/ forever", feats: ["3 users", "10 documents", "Cited answers"], featured: false },
  { name: "Team", price: "21 CHF", per: "/ seat / mo", feats: ["25 users", "Unlimited documents", "Role-based access", "Priority support"], featured: true },
  { name: "Enterprise", price: "Custom", per: "", feats: ["SSO & SCIM", "Audit logs", "Single-tenant", "Dedicated SLA"], featured: false },
];

export default function Cinematic() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef(0); // hero "zoom into the prism" progress (0..1)

  // Randomized positions for the chaotic "problem" documents.
  const docs = useMemo(
    () =>
      Array.from({ length: 9 }).map(() => ({
        left: Math.random() * 60,
        top: Math.random() * 70,
        rot: Math.random() * 40 - 20,
      })),
    [],
  );

  useLayoutEffect(() => {
    if (!loaded) return;
    const lenis = new Lenis({ duration: 1.1 });
    lenis.on("scroll", ScrollTrigger.update);
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      // generic reveals
      gsap.utils.toArray<HTMLElement>(".cine-reveal").forEach((el) => {
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 84%" },
        });
      });

      // Hero — pin, then zoom into the prism's core while text fades + flash
      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".cine-hero",
            start: "top top",
            end: "+=130%",
            pin: true,
            scrub: 0.4,
            onUpdate: (self) => {
              zoomRef.current = self.progress;
            },
          },
        })
        .to(".cine-hero-text", { opacity: 0, y: -40, duration: 0.42 }, 0)
        .to(".cine-flash", { opacity: 0.95, duration: 0.28 }, 0.64)
        .to(".cine-flash", { opacity: 0, duration: 0.3 }, 0.9);

      // Problem — pin + chaos rain (front-loaded so it resolves early)
      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".cine-problem",
            start: "top top",
            end: "+=55%",
            pin: true,
            scrub: 0.5,
          },
        })
        .from(
          ".cine-chaos .cine-doc",
          {
            y: -260,
            opacity: 0,
            rotate: () => gsap.utils.random(-40, 40),
            stagger: 0.025,
            duration: 0.4,
          },
          0,
        )
        .from(".cine-answer", { opacity: 0, x: 50, duration: 0.35 }, 0.25);

      // How it works — horizontal scroll
      const track = document.querySelector<HTMLElement>(".cine-track");
      if (track) {
        gsap.to(track, {
          x: () => -(track.scrollWidth - window.innerWidth),
          ease: "none",
          scrollTrigger: {
            trigger: ".cine-horiz",
            start: "top top",
            end: () => "+=" + (track.scrollWidth - window.innerWidth),
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
          },
        });
      }

      ScrollTrigger.refresh();
    }, rootRef);

    return () => {
      ctx.revert();
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [loaded]);

  return (
    <div className="cine" ref={rootRef}>
      <div className="cine-noise" />

      <AnimatePresence>
        {!loaded && <Loader key="loader" onDone={() => setLoaded(true)} />}
      </AnimatePresence>

      {/* ============ HERO ============ */}
      <header className="cine-hero">
        <div className="cine-stage">
          <HeroPrism zoomRef={zoomRef} />
        </div>
        <div className="cine-flash" aria-hidden="true" />

        <div className="cine-hero-text">
          <div className="htop">
            <motion.span
              className="cine-eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
            >
              <span className="dot" /> Refract your documents into clarity
            </motion.span>
            <motion.h1
              className="cine-title"
              initial={{ opacity: 0, y: 40 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.3, duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
            >
              One question.
            </motion.h1>
          </div>

          <div className="hbot">
            <motion.h1
              className="cine-title accent"
              initial={{ opacity: 0, y: 40 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.75, duration: 0.8, ease: [0.22, 0.61, 0.36, 1] }}
            >
              Every answer.
            </motion.h1>
            <motion.p
              className="cine-sub"
              initial={{ opacity: 0 }}
              animate={loaded ? { opacity: 1 } : {}}
              transition={{ delay: 1.2 }}
            >
              Prism turns your company's scattered documents into a single source of
              truth. Ask anything. Get cited answers instantly.
            </motion.p>
            <motion.div
              className="cine-hero-actions"
              initial={{ opacity: 0, y: 16 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 1.4 }}
            >
              <Magnetic className="cine-btn primary" onClick={() => navigate("/get-started")}>
                Get started <ArrowRight size={17} />
              </Magnetic>
              <Magnetic className="cine-btn ghost" onClick={() => navigate("/login")}>
                Log in
              </Magnetic>
            </motion.div>
            <motion.div
              className="cine-scrollhint"
              initial={{ opacity: 0 }}
              animate={loaded ? { opacity: 1 } : {}}
              transition={{ delay: 1.8 }}
            >
              Scroll to enter the prism
            </motion.div>
          </div>
        </div>
      </header>

      {/* ============ PROBLEM (pinned) ============ */}
      <section className="cine-problem">
        <div className="wrap cine-problem-grid">
          <div className="cine-chaos">
            {docs.map((d, i) => (
              <div
                key={i}
                className="cine-doc"
                style={{ left: `${d.left}%`, top: `${d.top}%`, rotate: `${d.rot}deg` }}
              >
                <div className="bar" style={{ width: "70%" }} />
                <div className="bar" style={{ width: "90%" }} />
                <div className="bar" style={{ width: "55%" }} />
                <FileText size={14} style={{ marginTop: 6, opacity: 0.5 }} />
              </div>
            ))}
          </div>
          <div>
            <span className="cine-tag">The problem</span>
            <h2 className="cine-h2">
              Your answers are buried.
              <br />
              <span className="accent">Prism digs them out.</span>
            </h2>
            <div className="cine-answer" style={{ marginTop: 28 }}>
              <div className="a-q">Q · Where's the renewal clause in the Acme MSA?</div>
              <div className="a-body">
                Section 8.2 — auto-renews for 12 months unless either party gives 60
                days' written notice.
              </div>
              <div className="a-cite">
                <FileText size={13} /> Acme_MSA.pdf · p.7
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ LIVE DEMO ============ */}
      <section className="cine-section cine-demo">
        <div className="wrap" style={{ textAlign: "center", marginBottom: 48 }}>
          <span className="cine-tag cine-reveal">Live demo</span>
          <h2 className="cine-h2 cine-reveal" style={{ margin: "14px auto 0" }}>
            Watch it answer in <span className="accent">real time</span>
          </h2>
        </div>
        <DemoCard />
      </section>

      {/* ============ HOW IT WORKS (horizontal) ============ */}
      <section className="cine-horiz">
        <div className="cine-track">
          {HOW.map((h) => {
            const Icon = h.icon;
            return (
              <div className="cine-panel" key={h.step}>
                <TiltCard>
                  <div className="ic">
                    <Icon size={26} />
                  </div>
                  <div className="step">{h.step}</div>
                  <h3>{h.title}</h3>
                  <p>{h.body}</p>
                </TiltCard>
              </div>
            );
          })}
        </div>
      </section>

      {/* ============ TRUST ============ */}
      <section className="cine-section">
        <div className="wrap" style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="cine-tag cine-reveal">Trusted in</span>
          <h2 className="cine-h2 cine-reveal" style={{ margin: "14px auto 0" }}>
            Built for Geneva's knowledge-intensive teams
          </h2>
        </div>
        <div className="cine-marquee">
          <div className="cine-marquee-row">
            {[...BRANDS, ...BRANDS].map((b, i) => (
              <span className="cine-brand" key={i}>
                {b}
              </span>
            ))}
          </div>
        </div>

        <div className="cine-map-wrap cine-reveal">
          <svg width="480" height="300" viewBox="0 0 940 560" aria-hidden="true">
            <defs>
              <radialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(120,190,255,0.9)" />
                <stop offset="40%" stopColor="rgba(59,130,246,0.35)" />
                <stop offset="100%" stopColor="rgba(59,130,246,0)" />
              </radialGradient>
              <linearGradient id="beamGrad" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="rgba(120,190,255,0.85)" />
                <stop offset="100%" stopColor="rgba(120,190,255,0)" />
              </linearGradient>
            </defs>

            {/* Switzerland silhouette (stylized) */}
            <path
              d="M60 430 L96 360 L150 300 L214 256 L300 218 L388 202 L470 196
                 L520 168 L556 200 L644 206 L706 236 L766 250 L862 286 L890 332
                 L842 360 L772 376 L724 420 L692 504 L652 410 L560 442 L470 446
                 L410 472 L330 456 L250 462 L160 442 L96 452 Z"
              fill="rgba(59,130,246,0.04)"
              stroke="#2c2c33"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />

            {/* Geneva beacon (south-west) */}
            <g transform="translate(108,416)">
              <circle r="40" fill="url(#beaconGlow)" />
              <line className="cine-beam" x1="0" y1="-8" x2="0" y2="-58" />
              <circle className="cine-ring" r="5" />
              <circle className="cine-ring d2" r="5" />
              <circle className="cine-core" r="4" />
              <text className="cine-pin-label" x="0" y="26" textAnchor="middle">
                Geneva
              </text>
            </g>

            {/* Zurich beacon (north-central) */}
            <g transform="translate(560,250)">
              <circle r="40" fill="url(#beaconGlow)" />
              <line className="cine-beam" x1="0" y1="-8" x2="0" y2="-58" />
              <circle className="cine-ring" r="5" />
              <circle className="cine-ring d2" r="5" />
              <circle className="cine-core" r="4" />
              <text className="cine-pin-label" x="0" y="-22" textAnchor="middle">
                Zurich
              </text>
            </g>
          </svg>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="cine-section">
        <div className="wrap">
          <div style={{ textAlign: "center" }}>
            <span className="cine-tag cine-reveal">Pricing</span>
            <h2 className="cine-h2 cine-reveal" style={{ margin: "14px auto 0" }}>
              Start clear. Scale when ready.
            </h2>
          </div>
          <div className="cine-pricing-grid">
            {PRICING.map((t) => (
              <div
                key={t.name}
                className={"cine-tier cine-reveal" + (t.featured ? " featured" : "")}
              >
                {t.featured && <div className="badge">Recommended</div>}
                <div className="tname">{t.name}</div>
                <div className="price">{t.price}</div>
                <div className="per">{t.per}</div>
                <ul>
                  {t.feats.map((f) => (
                    <li key={f}>
                      <Check size={16} /> {f}
                    </li>
                  ))}
                </ul>
                <Magnetic
                  className={"cine-btn " + (t.featured ? "primary" : "ghost")}
                  onClick={() => navigate("/get-started")}
                >
                  {t.name === "Enterprise" ? "Contact sales" : "Get started"}
                </Magnetic>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="cine-footer">
        <div className="wrap" style={{ display: "flex", justifyContent: "space-between" }}>
          <span>© 2026 Prism Labs — experimental build</span>
          <span className="mono">prism.app</span>
        </div>
      </footer>
    </div>
  );
}
