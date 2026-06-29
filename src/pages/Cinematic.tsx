import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import Lenis from "lenis";
import {
  ArrowRight,
  ShieldCheck,
  Quote,
  FileText,
  Lock,
  Database,
  Zap,
  Search,
  Check,
} from "lucide-react";
import "@/styles/cinematic.css";

/* ---------- typewriter ---------- */
function useTyped(full: string, start: boolean, ms = 18) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (!start) {
      setShown("");
      setDone(false);
      return;
    }
    setShown("");
    setDone(false);
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, ms);
    return () => window.clearInterval(id);
  }, [full, start]);
  return { shown, done };
}

/* ---------- brand mark ---------- */
function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 3 L21 20 L3 20 Z" stroke="#fafafa" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M7 20 L15.5 6" stroke="#3b82f6" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- scroll reveal ---------- */
function Reveal({
  children,
  delay = 0,
  y = 22,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/* ---------- nav ---------- */
function Nav({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <nav className={`lp-nav${scrolled ? " scrolled" : ""}`}>
      <div className="lp-wrap lp-nav-inner">
        <div className="lp-brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Mark /> Prism
        </div>
        <div className="lp-nav-links">
          <a href="#impact">Impact</a>
          <a href="#features">Product</a>
          <a href="#how">How it works</a>
          <a href="#security">Security</a>
          <a href="#pricing">Pricing</a>
        </div>
        <div className="lp-nav-right">
          <span className="lp-login" onClick={onLogin}>Log in</span>
          <button className="lp-btn lp-btn-primary lp-btn-sm" onClick={onStart}>
            Get started <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ---------- product mock ---------- */
const HERO_ANSWER =
  "The Acme MSA auto-renews for 12 months unless either party gives 60 days’ written notice before the term ends (Section 8.2).";

function ProductMock() {
  const [start, setStart] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setStart(true), 950);
    return () => clearTimeout(t);
  }, []);
  const { shown, done } = useTyped(HERO_ANSWER, start, 20);
  return (
    <div className="lp-mock">
      <div className="lp-mock-bar">
        <span className="lp-mock-dot" style={{ background: "#ff5f57" }} />
        <span className="lp-mock-dot" style={{ background: "#febc2e" }} />
        <span className="lp-mock-dot" style={{ background: "#28c840" }} />
        <span className="lp-mock-url">prism.app / chat</span>
      </div>
      <div className="lp-mock-body">
        <div className="lp-mock-chat">
          <div className="lp-mock-row">
            <span className="lp-mock-av" style={{ background: "#3b82f6", color: "#fff", fontSize: 12, fontWeight: 600 }}>
              A
            </span>
            <div>
              <div className="lp-mock-name">You</div>
              <div className="lp-mock-text">What’s our notice period in the Acme MSA?</div>
            </div>
          </div>
          <div className="lp-mock-row">
            <span className="lp-mock-av" style={{ border: "1px solid rgba(255,255,255,0.14)", background: "#0c0c0f" }}>
              <Mark size={14} />
            </span>
            <div>
              <div className="lp-mock-name">Prism</div>
              <div className="lp-mock-text">
                {done ? (
                  <>
                    The Acme MSA auto-renews for 12 months unless either party gives{" "}
                    <strong style={{ color: "#fafafa", fontWeight: 600 }}>60 days’ written notice</strong> before the term ends (Section 8.2).
                  </>
                ) : (
                  <>
                    {shown}
                    {start && <span className="lp-caret" />}
                  </>
                )}
              </div>
              <motion.span
                className="lp-mock-chip"
                initial={{ opacity: 0, y: 4 }}
                animate={done ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4 }}
              >
                <span className="n">1</span>
                <FileText size={12} />
                Acme_MSA.pdf <span style={{ color: "#5a5a63" }}>· p.7</span>
              </motion.span>
            </div>
          </div>
        </div>
        <div className="lp-mock-doc">
          <div className="mono" style={{ fontSize: 10, letterSpacing: "0.1em", color: "#5a5a63", marginBottom: 10 }}>
            ACME_MSA.PDF · PAGE 7
          </div>
          8.1 This Agreement commences on the Effective Date.{" "}
          <span className="lp-mock-hl">8.2 The term auto-renews for successive 12-month periods unless either party provides 60 days’ written notice.</span>{" "}
          8.3 Termination for cause requires…
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    icon: Quote,
    color: "#3b82f6",
    title: "Answers you can verify",
    body: "Every response is grounded in your documents and backed by an exact quote — click to see the original passage highlighted in context.",
  },
  {
    icon: ShieldCheck,
    color: "#38bdf8",
    title: "No hallucinations",
    body: "Prism answers only from what you’ve indexed. When the documents don’t have an answer, it tells you — instead of making one up.",
  },
  {
    icon: FileText,
    color: "#6366f1",
    title: "Any document",
    body: "PDFs, Word docs, contracts, reports, playbooks. Drop them in and Prism parses, chunks, and embeds them in seconds.",
  },
  {
    icon: Zap,
    color: "#3b82f6",
    title: "Instant retrieval",
    body: "Ask in plain English and get a cited answer in under two seconds — across one document or your entire workspace.",
  },
  {
    icon: Search,
    color: "#38bdf8",
    title: "Jump to the source",
    body: "Open any citation to land on the exact page or paragraph, then step through every related passage without leaving the panel.",
  },
  {
    icon: Lock,
    color: "#6366f1",
    title: "Private by design",
    body: "Your documents live in a private, per-workspace index. Encrypted in transit and at rest — your data stays yours.",
  },
];

const STEPS = [
  { n: "01", title: "Upload", body: "Drop in PDFs and Word docs, or connect a source. Prism ingests everything securely." },
  { n: "02", title: "Index", body: "Documents are parsed, chunked, and embedded into your private vector index in seconds." },
  { n: "03", title: "Ask", body: "Ask in plain English. Every answer is grounded in your documents — with exact citations." },
];

const TRUST = [
  { t: "Private vector index", d: "Each workspace gets its own isolated index. Your documents are never pooled or shared." },
  { t: "Encrypted end to end", d: "Everything is encrypted in transit and at rest, with signed, expiring links to original files." },
  { t: "You stay in control", d: "Delete a document and it’s removed from the index immediately. No training on your data, ever." },
];

const PRICING = [
  {
    name: "Starter",
    price: "$0",
    unit: "/ forever",
    features: ["3 users", "10 documents", "Cited answers", "PDF & Word upload"],
    cta: "Get started",
    featured: false,
  },
  {
    name: "Team",
    price: "21 CHF",
    unit: "/ seat / mo",
    features: ["25 users", "Unlimited documents", "Role-based access", "Priority support", "Workspace search"],
    cta: "Start free trial",
    featured: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    unit: "",
    features: ["SSO & SCIM", "Audit logs", "Single-tenant", "Dedicated SLA"],
    cta: "Contact sales",
    featured: false,
  },
];

export default function Cinematic() {
  const navigate = useNavigate();
  const start = () => navigate("/get-started");
  const login = () => navigate("/login");

  // Smooth scrolling for a premium feel (respects reduced-motion).
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    let raf = 0;
    const loop = (t: number) => {
      lenis.raf(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      lenis.destroy();
    };
  }, []);

  return (
    <div className="lp">
      <div className="lp-aurora">
        <div className="lp-blob b1" />
        <div className="lp-blob b2" />
        <div className="lp-blob b3" />
      </div>
      <div className="lp-grid" />

      <Nav onStart={start} onLogin={login} />

      {/* hero */}
      <header className="lp-hero">
        <div className="lp-wrap">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Every answer,<br />
            <span className="lp-grad-text">traced to the source.</span>
          </motion.h1>
          <motion.p
            className="lp-hero-sub"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          >
            The answer you need is already in your documents — buried where no one
            has time to look. And AI that makes things up only makes it worse. Prism
            finds the exact answer in seconds, and shows you where it came from.
          </motion.p>
          <motion.div
            className="lp-hero-cta"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
            <button className="lp-btn lp-btn-primary" onClick={start}>
              Start for free <ArrowRight size={16} />
            </button>
            <button className="lp-btn lp-btn-ghost" onClick={login}>Log in</button>
          </motion.div>
          <motion.div
            className="lp-hero-trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.34 }}
          >
            <Check size={14} style={{ color: "#6aa3ff" }} /> No credit card · Free forever for small teams
          </motion.div>
        </div>
      </header>

      {/* product mock */}
      <motion.div
        className="lp-mock-shell"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="lp-mock-glow" />
        <ProductMock />
      </motion.div>

      {/* logos */}
      <section className="lp-logos">
        <div className="lp-wrap">
          <Reveal>
            <p className="lp-logos-label">Trusted by knowledge-intensive teams</p>
            <div className="lp-logos-row">
              {["Banque Léman", "Helvetia Capital", "Rhône Partners", "Alpine Trust", "Quai Wealth"].map((n) => (
                <span key={n} className="lp-logo">{n}</span>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* impact / time saved */}
      <section className="lp-section" id="impact">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-head center">
              <span className="lp-kicker">The impact</span>
              <h2>Hours back, every week.</h2>
              <p>The average knowledge worker loses a full day a week just hunting for information buried in documents. Prism turns that into seconds.</p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="lp-compare">
              <div className="lp-compare-row">
                <span className="lp-compare-label">Finding an answer manually</span>
                <div className="lp-compare-track">
                  <span className="lp-compare-bar slow" style={{ width: "100%" }} />
                </div>
                <span className="lp-compare-val">~12 min</span>
              </div>
              <div className="lp-compare-row">
                <span className="lp-compare-label">With Prism</span>
                <div className="lp-compare-track">
                  <span className="lp-compare-bar fast" style={{ width: "4%" }} />
                </div>
                <span className="lp-compare-val accent">~8 sec</span>
              </div>
            </div>
          </Reveal>

          <div className="lp-impact-grid">
            {[
              { v: "90×", l: "Faster to a cited answer", d: "Seconds instead of minutes digging through files." },
              { v: "6 hrs", l: "Saved per person each week", d: "Time returned to the work that actually moves things." },
              { v: "92%", l: "Less time spent searching", d: "Ask once and get the answer, with its source attached." },
            ].map((s, i) => (
              <Reveal key={s.l} delay={i * 0.08}>
                <div className="lp-impact-card">
                  <div className="lp-impact-v">{s.v}</div>
                  <div className="lp-impact-l">{s.l}</div>
                  <div className="lp-impact-d">{s.d}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <p className="lp-impact-foot">
              Based on a 5-person team asking ~20 questions a day, versus searching and re-reading documents by hand.
            </p>
          </Reveal>
        </div>
      </section>

      {/* features */}
      <section className="lp-section" id="features" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-head center">
              <span className="lp-kicker">Why Prism</span>
              <h2>Built to be believed.</h2>
              <p>Most AI tools sound confident and cite nothing. Prism does the opposite — every claim is anchored to a source you can open and read for yourself.</p>
            </div>
          </Reveal>
          <div className="lp-grid-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 0.08}>
                <div className="lp-card">
                  <span className="lp-card-ico" style={{ background: `${f.color}1a`, color: f.color }}>
                    <f.icon size={20} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* how it works */}
      <section className="lp-section" id="how" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-head center">
              <span className="lp-kicker">How it works</span>
              <h2>From documents to answers in three steps.</h2>
            </div>
          </Reveal>
          <div className="lp-steps">
            {STEPS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.08}>
                <div className="lp-step">
                  <span className="lp-step-n">{s.n}</span>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* security / trust split */}
      <section className="lp-section" id="security" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <div className="lp-split">
            <Reveal>
              <div>
                <span className="lp-kicker">Security</span>
                <h2 style={{ fontSize: "clamp(28px,3.6vw,40px)", marginTop: 16 }}>
                  Enterprise-grade trust, by default.
                </h2>
                <p style={{ marginTop: 18, fontSize: 16.5, lineHeight: 1.6, color: "var(--dim)" }}>
                  Prism is built for documents you can’t afford to leak. Your content is isolated, encrypted, and never used to train models.
                </p>
                <div className="lp-trust-list">
                  {TRUST.map((t) => (
                    <div className="lp-trust-item" key={t.t}>
                      <span className="ic"><ShieldCheck size={16} /></span>
                      <div>
                        <div className="tt">{t.t}</div>
                        <div className="td">{t.d}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="lp-panel">
                <div className="lp-stat-grid">
                  <div className="lp-stat">
                    <div className="v" style={{ color: "#3b82f6" }}>&lt;2s</div>
                    <div className="l">Average answer time</div>
                  </div>
                  <div className="lp-stat">
                    <div className="v" style={{ color: "#38bdf8" }}>100%</div>
                    <div className="l">Answers cited to source</div>
                  </div>
                  <div className="lp-stat">
                    <div className="v" style={{ color: "#6366f1" }}>0</div>
                    <div className="l">Documents used for training</div>
                  </div>
                  <div className="lp-stat">
                    <div className="v" style={{ color: "#3b82f6" }}>256-bit</div>
                    <div className="l">Encryption at rest</div>
                  </div>
                </div>
                <div style={{ marginTop: 18, display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--muted)" }}>
                  <Database size={15} style={{ color: "#6aa3ff" }} />
                  Isolated per-workspace vector index
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* pricing */}
      <section className="lp-section" id="pricing" style={{ paddingTop: 0 }}>
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-head center">
              <span className="lp-kicker">Pricing</span>
              <h2>Start clear. Scale when ready.</h2>
              <p>Free for small teams, with room to grow. No credit card to begin.</p>
            </div>
          </Reveal>
          <div className="lp-price-grid">
            {PRICING.map((p, i) => (
              <Reveal key={p.name} delay={i * 0.08}>
                <div className={`lp-price${p.featured ? " featured" : ""}`}>
                  {p.featured && <span className="lp-price-badge">Recommended</span>}
                  <div className="lp-price-name">{p.name}</div>
                  <div className="lp-price-amt">{p.price}{p.unit && <span> {p.unit}</span>}</div>
                  <ul>
                    {p.features.map((f) => (
                      <li key={f}><Check size={15} className="ck" /> {f}</li>
                    ))}
                  </ul>
                  <button
                    className={`lp-btn ${p.featured ? "lp-btn-primary" : "lp-btn-ghost"}`}
                    onClick={p.name === "Enterprise" ? login : start}
                  >
                    {p.cta}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* final CTA */}
      <section className="lp-final">
        <div className="lp-wrap">
          <Reveal>
            <div className="lp-final-card">
              <div className="lp-final-glow" />
              <h2>Stop searching.<br />Start asking.</h2>
              <p>Turn your documents into answers you can trust — with a source behind every word.</p>
              <div className="lp-final-cta">
                <button className="lp-btn lp-btn-primary" onClick={start}>
                  Start for free <ArrowRight size={16} />
                </button>
                <button className="lp-btn lp-btn-ghost" onClick={login}>Log in</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* footer */}
      <footer className="lp-footer">
        <div className="lp-wrap">
          <div className="lp-footer-inner">
            <div className="lp-footer-brand">
              <div className="lp-brand"><Mark /> Prism</div>
              <p>Grounded answers from your own documents — with a citation behind every one.</p>
            </div>
            <div className="lp-footer-cols">
              <div className="lp-footer-col">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#how">How it works</a>
                <a href="#pricing">Pricing</a>
              </div>
              <div className="lp-footer-col">
                <h4>Company</h4>
                <a onClick={start}>Get started</a>
                <a onClick={login}>Log in</a>
                <a href="#security">Security</a>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <span>© 2026 Prism Labs</span>
            <span className="mono">prism.app</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
