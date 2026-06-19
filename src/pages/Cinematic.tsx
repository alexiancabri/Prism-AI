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

      // Problem — pin + chaos rain
      gsap
        .timeline({
          scrollTrigger: {
            trigger: ".cine-problem",
            start: "top top",
            end: "+=110%",
            pin: true,
            scrub: 1,
          },
        })
        .from(
          ".cine-chaos .cine-doc",
          { y: -280, opacity: 0, rotate: () => gsap.utils.random(-40, 40), stagger: 0.05 },
          0,
        )
        .from(".cine-answer", { opacity: 0, x: 50 }, 0.25);

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

  const heroWords = [
    { t: "One", a: false },
    { t: "question.", a: false },
    { t: "Every", a: true },
    { t: "answer.", a: true },
  ];

  return (
    <div className="cine" ref={rootRef}>
      <div className="cine-noise" />

      <AnimatePresence>
        {!loaded && <Loader key="loader" onDone={() => setLoaded(true)} />}
      </AnimatePresence>

      {/* ============ HERO ============ */}
      <header className="cine-hero">
        <div className="wrap cine-hero-grid">
          <div>
            <motion.span
              className="cine-eyebrow"
              initial={{ opacity: 0, y: 12 }}
              animate={loaded ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 }}
            >
              <span className="dot" /> Refract your documents into clarity
            </motion.span>
            <h1 className="cine-title">
              {heroWords.map((w, i) => (
                <motion.span
                  key={i}
                  className={"word" + (w.a ? " accent" : "")}
                  initial={{ opacity: 0, y: 40 }}
                  animate={loaded ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.25 + i * 0.18, duration: 0.7, ease: [0.22, 0.61, 0.36, 1] }}
                >
                  {w.t}
                </motion.span>
              ))}
            </h1>
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
              transition={{ delay: 1.45 }}
            >
              <Magnetic className="cine-btn primary" onClick={() => navigate("/get-started")}>
                Get started <ArrowRight size={17} />
              </Magnetic>
              <Magnetic className="cine-btn ghost" onClick={() => navigate("/login")}>
                Log in
              </Magnetic>
            </motion.div>
          </div>

          <div className="cine-stage">
            <div className="cine-rays">
              {[["#3b82f6", -28], ["#22c55e", -10], ["#a78bfa", 12], ["#34d399", 30]].map(
                ([c, a], i) => (
                  <div
                    key={i}
                    className="cine-ray"
                    style={{
                      transform: `rotate(${a}deg)`,
                      background: `linear-gradient(90deg, ${c}, transparent)`,
                      boxShadow: `0 0 18px ${c}`,
                    }}
                  />
                ),
              )}
            </div>
            <div className="cine-prism">
              <div className="cine-face" style={{ transform: "translateZ(40px)" }} />
              <div className="cine-face" style={{ transform: "rotateY(120deg) translateZ(40px)" }} />
              <div className="cine-face" style={{ transform: "rotateY(240deg) translateZ(40px)" }} />
            </div>
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
          <svg width="420" height="260" viewBox="0 0 420 260">
            <path
              d="M40 150 C60 110 110 96 150 104 C180 80 230 78 262 96 C300 86 350 104 372 132 C390 152 372 186 338 196 C320 220 270 224 240 206 C210 224 160 222 132 200 C96 206 52 186 40 150 Z"
              fill="rgba(59,130,246,0.05)"
              stroke="#2a2a30"
              strokeWidth="1"
            />
            {/* Geneva */}
            <circle className="cine-pin-glow" cx="120" cy="190" r="4" fill="#3b82f6" />
            <circle className="cine-pin" cx="120" cy="190" r="4" />
            <text className="cine-pin-label" x="100" y="214">
              Geneva
            </text>
            {/* Zurich */}
            <circle className="cine-pin-glow" cx="270" cy="130" r="4" fill="#3b82f6" />
            <circle className="cine-pin" cx="270" cy="130" r="4" />
            <text className="cine-pin-label" x="252" y="118">
              Zurich
            </text>
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
