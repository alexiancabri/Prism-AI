import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  answerQuestion,
  docById,
  SUGGESTED_QUESTIONS,
  type Citation,
} from "@/data/prismData";
import "@/styles/prism-landing.css";

/* =========================================================================
   PRISM LANDING — React port of "Prism Landing.html" (Claude Design handoff).
   Pure-black, single-blue-accent marketing page. Self-contained: all styling
   lives in src/styles/prism-landing.css scoped under .prism-landing so it
   never touches the light-themed /app and /roi pages.
   ========================================================================= */

const PRISM_MARK = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M12 3 L21 20 L3 20 Z" stroke="#fafafa" strokeWidth="1.4" strokeLinejoin="round" />
    <path d="M7 20 L15.5 6" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const HOW_STEPS = [
  {
    tab: "01 — CONNECT",
    num: "STEP 01",
    title: "Connect sources",
    desc: "Point Prism at Drive, SharePoint, Notion, or an S3 bucket. SSO and SCIM included, so access maps to what you already have.",
    meta: [
      ["Sources", "20+ connectors"],
      ["Setup", "Under 5 min"],
    ],
  },
  {
    tab: "02 — INDEX",
    num: "STEP 02",
    title: "Index & embed",
    desc: "Documents are parsed, chunked, and embedded into a private vector store — incrementally, so new content is searchable in seconds.",
    meta: [
      ["Throughput", "12k docs / min"],
      ["Sync", "Real-time"],
    ],
  },
  {
    tab: "03 — ASK",
    num: "STEP 03",
    title: "Ask in plain English",
    desc: "Your team queries naturally. Prism retrieves the most relevant passages with hybrid search before the model ever answers.",
    meta: [
      ["Retrieval", "Hybrid + rerank"],
      ["Latency", "~3s median"],
    ],
  },
  {
    tab: "04 — VERIFY",
    num: "STEP 04",
    title: "Verify with citations",
    desc: "Every response links back to the exact source passage, page, and line — so any answer can be traced and trusted.",
    meta: [
      ["Coverage", "100% cited"],
      ["Audit", "Full trail"],
    ],
  },
];

const BAR_HEIGHTS = [90, 135, 110, 160, 148, 185, 170, 210];

const INTEGRATIONS = [
  ["ti-brand-google-drive", "Drive"],
  ["ti-brand-notion", "Notion"],
  ["ti-brand-slack", "Slack"],
  ["ti-brand-github", "GitHub"],
  ["ti-cloud", "S3"],
  ["ti-cloud-cog", "SharePoint"],
  ["ti-box", "Box"],
  ["ti-message-circle", "Zendesk"],
  ["ti-cloud-up", "Salesforce"],
  ["ti-file-text", "Confluence"],
];

const FEATURES = [
  ["ti-lock-access", "Role-based access", "Permissions inherit from your source systems, so users only ever see what they're cleared for."],
  ["ti-quote", "Source citations", "Every claim links to a passage with page and line numbers. Zero unverifiable answers."],
  ["ti-rocket", "Instant deploy", "Connect a source and your workspace is live in minutes — no infra, no setup calls."],
  ["ti-stack-2", "Multi-tenant isolation", "Each workspace runs in its own isolated index. Your data never mixes with anyone else's."],
  ["ti-chart-dots-3", "Usage analytics", "See what your team asks, where answers fall short, and which sources carry the load."],
  ["ti-refresh", "Always up to date", "Incremental indexing keeps answers current within seconds of a document changing."],
];

const SECURITY = [
  ["ti-certificate", "SOC 2 Type II", "Independently audited security controls, re-certified every year."],
  ["ti-key", "SSO & SCIM", "SAML / OIDC sign-in with automated provisioning and instant de-provisioning."],
  ["ti-lock", "Encrypted end to end", "AES-256 at rest, TLS 1.3 in transit. Keys you can bring and rotate."],
  ["ti-shield-off", "Never trained on", "Your documents are never used to train models — and never leave your tenant."],
  ["ti-world-pin", "Data residency", "Pin your index to US or EU regions, or deploy in your own VPC or on-prem."],
  ["ti-list-check", "Full audit trail", "Every query, source access, and admin action is logged and exportable."],
];

const COMPLIANCE = ["SOC 2 Type II", "GDPR", "ISO 27001", "HIPAA-ready", "CCPA"];

const FAQ_ITEMS: [string, string][] = [
  [
    "How long does it take to get started?",
    "Connect a source and your workspace is indexed and searchable in minutes — no infrastructure to stand up and no setup calls required. Larger libraries keep indexing in the background while you start asking.",
  ],
  [
    "How are document permissions handled?",
    "Prism inherits permissions directly from your source systems. Each user only ever retrieves answers from documents they're already cleared to see, and access updates the moment it changes upstream.",
  ],
  [
    "Can Prism run in our own cloud?",
    "Yes. Team runs on our multi-tenant cloud with isolated per-workspace indexes; Enterprise adds single-tenant, VPC, and on-prem deployments with data pinned to the region you choose.",
  ],
  [
    "Is our data used to train models?",
    "No. Your documents are never used to train any model and never leave your tenant. Each workspace runs in its own isolated index, and you can bring and rotate your own encryption keys.",
  ],
  [
    "What file types can it index?",
    "PDFs, Word, PowerPoint, Excel, Markdown, HTML, and plain text — plus scanned documents and images via OCR. New and changed files are re-indexed incrementally within seconds.",
  ],
  [
    "How accurate are the answers?",
    "Every answer is grounded in passages retrieved from your library and links back to the exact source, page, and line. 100% of answers carry citations, so anything Prism says can be verified at a glance.",
  ],
];

const IMPACT_STATS = [
  ["2", "h", "saved per employee per day", "vs. manual search"],
  ["67", "%", "reduction in internal email threads", "within 30 days"],
  ["3", "s", "average time to a cited answer", "vs. 14min manually"],
  ["$312", "k", "avg annual saving per 50-person team", "in recovered productivity", true],
];

const IMPACT_ROWS = [
  ["Legal & compliance", 100, 12, "9.2h", "1.1h"],
  ["Sales", 80, 10, "7.4h", "0.9h"],
  ["Finance", 74, 11, "6.8h", "1h"],
  ["HR & onboarding", 64, 9, "5.9h", "0.8h"],
  ["Product & engineering", 46, 8, "4.2h", "0.7h"],
] as const;

const METRICS = [
  [80, "%", "Faster than searching by hand"],
  [3, "s", "Median answer time"],
  [100, "%", "Answers backed by citations"],
] as const;

const PRICING = [
  {
    name: "Starter",
    amt: "$0",
    per: "/ forever",
    note: "For trying Prism on a single team.",
    cta: "Get started",
    ghost: true,
    feats: ["Up to 3 users", "10 documents indexed", "Cited answers", "Community support"],
  },
  {
    name: "Team",
    amt: "21 CHF",
    per: "/ seat / month",
    note: "For teams running on shared knowledge.",
    cta: "Start free trial",
    ghost: false,
    featured: true,
    feats: ["Up to 25 users", "Unlimited documents", "Role-based access", "Usage analytics", "Priority support"],
  },
  {
    name: "Enterprise",
    amt: "Custom",
    per: "",
    note: "For regulated, large-scale deployments.",
    cta: "Contact sales",
    ghost: true,
    feats: ["Unlimited users", "SSO & SCIM", "Audit logs", "Dedicated SLA", "Single-tenant option"],
  },
];

const Index = () => {
  const navigate = useNavigate();
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [activeSection, setActiveSection] = useState("");

  // Close the mobile menu once the viewport is wide enough for the inline nav.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 921px)");
    const onChange = () => mq.matches && setMenuOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Scroll-spy: the active link is the last section whose top has scrolled
  // under the sticky nav. A scroll listener handles every section reliably,
  // including the ones near the page end that can't reach the very top.
  useEffect(() => {
    const ids = NAV_LINKS.map(([id]) => id);
    const onScroll = () => {
      const line = 120; // px below the viewport top (just under the nav)
      let current = "";
      for (const id of ids) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= line) current = id;
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cursor FX: ambient glow follows the pointer, cards get a spotlight that
  // tracks the cursor inside them, and primary buttons pull toward it.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const glow = root.querySelector<HTMLElement>(".cursor-glow");
    const CARD_SEL = ".card, .scard, .integ, .istat, .tier";
    let magBtn: HTMLElement | null = null;
    let raf = 0;
    let cx = 0, cy = 0, card: HTMLElement | null = null, cardX = 0, cardY = 0;

    const apply = () => {
      raf = 0;
      if (glow) {
        glow.style.setProperty("--gx", cx + "px");
        glow.style.setProperty("--gy", cy + "px");
      }
      if (card) {
        card.style.setProperty("--mx", cardX + "px");
        card.style.setProperty("--my", cardY + "px");
      }
    };

    const onMove = (e: PointerEvent) => {
      cx = e.clientX;
      cy = e.clientY;
      const target = e.target as HTMLElement;

      const hovered = target.closest<HTMLElement>(CARD_SEL);
      card = hovered;
      if (hovered) {
        const r = hovered.getBoundingClientRect();
        cardX = e.clientX - r.left;
        cardY = e.clientY - r.top;
      }

      const btn = target.closest<HTMLElement>(".btn-primary");
      if (btn) {
        const r = btn.getBoundingClientRect();
        const dx = Math.max(-8, Math.min(8, (e.clientX - (r.left + r.width / 2)) * 0.3));
        const dy = Math.max(-8, Math.min(8, (e.clientY - (r.top + r.height / 2)) * 0.4));
        btn.style.transform = `translate(${dx}px, ${dy}px)`;
        magBtn = btn;
      } else if (magBtn) {
        magBtn.style.transform = "";
        magBtn = null;
      }

      if (!raf) raf = requestAnimationFrame(apply);
    };

    const onLeave = () => {
      if (magBtn) {
        magBtn.style.transform = "";
        magBtn = null;
      }
    };

    root.addEventListener("pointermove", onMove);
    root.addEventListener("pointerleave", onLeave);
    return () => {
      root.removeEventListener("pointermove", onMove);
      root.removeEventListener("pointerleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* ---------- HERO PRISM CANVAS ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const W = canvas.width;
    const H = canvas.height;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const tx = 430, ty = 560, size = 230;
    const A = { x: tx, y: ty - size };
    const B = { x: tx - size * 0.92, y: ty + size * 0.74 };
    const C = { x: tx + size * 0.92, y: ty + size * 0.74 };

    const lerp = (p: { x: number; y: number }, q: { x: number; y: number }, t: number) => ({
      x: p.x + (q.x - p.x) * t,
      y: p.y + (q.y - p.y) * t,
    });
    const entryHit = lerp(A, B, 0.52);
    const exitPt = lerp(A, C, 0.52);
    const beamStart = { x: 60, y: entryHit.y };

    const rays = [
      { color: "#3b82f6", label: "cited answers", ang: -27, phase: 0.0, end: { x: 0, y: 0 } },
      { color: "#22c55e", label: "instant search", ang: -13, phase: 1.1, end: { x: 0, y: 0 } },
      { color: "#a78bfa", label: "role access", ang: 1, phase: 2.2, end: { x: 0, y: 0 } },
      { color: "#fb923c", label: "audit trail", ang: 15, phase: 3.3, end: { x: 0, y: 0 } },
      { color: "#34d399", label: "team knowledge", ang: 29, phase: 4.4, end: { x: 0, y: 0 } },
    ];
    const rayLen = 300;
    // The whole fan eases toward the cursor's vertical offset for a subtle
    // "light bends toward you" reaction.
    let curOff = 0;
    let targetOff = 0;
    const computeEnds = () => {
      rays.forEach((r) => {
        const rad = (r.ang * Math.PI) / 180 + curOff;
        r.end = { x: exitPt.x + Math.cos(rad) * rayLen, y: exitPt.y + Math.sin(rad) * rayLen };
      });
    };
    computeEnds();

    const onPMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const py = ((e.clientY - rect.top) / rect.height) * H;
      targetOff = Math.max(-1, Math.min(1, (py - exitPt.y) / 620)) * 0.34;
    };
    const onPLeave = () => {
      targetOff = 0;
    };
    if (!reduce) {
      canvas.addEventListener("pointermove", onPMove);
      canvas.addEventListener("pointerleave", onPLeave);
    }

    const hexA = (hex: string, a: number) => {
      const n = parseInt(hex.slice(1), 16);
      const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
      return `rgba(${r},${g},${b},${Math.max(0, Math.min(1, a)).toFixed(3)})`;
    };

    let t = 0;
    let raf = 0;

    const drawTriangle = () => {
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.fillStyle = "#0d0d10";
      ctx.fill();
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(59,130,246,0.10)";
      ctx.stroke();
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = "rgba(226,232,240,0.85)";
      ctx.stroke();
    };

    const drawParticles = () => {
      const NP = 3;
      rays.forEach((r, ri) => {
        for (let k = 0; k < NP; k++) {
          const p = (t * 0.18 + ri * 0.21 + k / NP) % 1;
          const pos = lerp(exitPt, r.end, p);
          const fade = Math.sin(p * Math.PI);
          ctx.beginPath();
          ctx.arc(pos.x, pos.y, 2.2, 0, Math.PI * 2);
          ctx.fillStyle = hexA(r.color, 0.7 * fade);
          ctx.fill();
        }
      });
      for (let k = 0; k < 2; k++) {
        const p = (t * 0.22 + k / 2) % 1;
        const pos = lerp(beamStart, entryHit, p);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${(0.7 * Math.sin(p * Math.PI)).toFixed(3)})`;
        ctx.fill();
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      curOff += (targetOff - curOff) * 0.07;
      computeEnds();

      const beamPulse = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.4));
      ctx.beginPath();
      ctx.moveTo(beamStart.x, beamStart.y);
      ctx.lineTo(entryHit.x, entryHit.y);
      ctx.strokeStyle = `rgba(255,255,255,${(0.85 * beamPulse).toFixed(3)})`;
      ctx.lineWidth = 2.4;
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255,${(0.1 * beamPulse).toFixed(3)})`;
      ctx.lineWidth = 8;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(entryHit.x, entryHit.y);
      ctx.lineTo(exitPt.x, exitPt.y);
      ctx.strokeStyle = "rgba(226,232,240,0.5)";
      ctx.lineWidth = 1.6;
      ctx.stroke();

      rays.forEach((r) => {
        const op = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * 1.1 + r.phase));
        ctx.beginPath();
        ctx.moveTo(exitPt.x, exitPt.y);
        ctx.lineTo(r.end.x, r.end.y);
        ctx.strokeStyle = hexA(r.color, op);
        ctx.lineWidth = 2.2;
        ctx.stroke();
        ctx.strokeStyle = hexA(r.color, op * 0.14);
        ctx.lineWidth = 7;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(r.end.x, r.end.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = hexA(r.color, op);
        ctx.fill();

        ctx.font = "500 21px JetBrains Mono, monospace";
        ctx.fillStyle = hexA(r.color, Math.min(1, op + 0.15));
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(r.label, r.end.x + 14, r.end.y);
      });

      drawParticles();
      drawTriangle();

      if (!reduce) {
        t += 0.016;
        raf = requestAnimationFrame(draw);
      }
    };

    draw();
    return () => {
      cancelAnimationFrame(raf);
      canvas.removeEventListener("pointermove", onPMove);
      canvas.removeEventListener("pointerleave", onPLeave);
    };
  }, []);

  /* ---------- METRICS COUNT-UP + IMPACT BARS + REVEAL ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observers: IntersectionObserver[] = [];
    const rafs: number[] = [];

    // metrics count-up
    const grid = root.querySelector<HTMLElement>("#metricsGrid");
    if (grid) {
      const animateVal = (el: HTMLElement) => {
        const target = parseFloat(el.dataset.target || "0");
        const suffix = el.dataset.suffix || "";
        const dur = 1600;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const cur = target * eased;
          const shown = target % 1 === 0 ? Math.round(cur) : cur.toFixed(1);
          el.innerHTML = shown + '<span class="suffix">' + suffix + "</span>";
          if (p < 1) rafs.push(requestAnimationFrame(tick));
        };
        rafs.push(requestAnimationFrame(tick));
      };
      let done = false;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting && !done) {
              done = true;
              grid.querySelectorAll<HTMLElement>(".val").forEach(animateVal);
              io.disconnect();
            }
          });
        },
        { threshold: 0.4 }
      );
      io.observe(grid);
      observers.push(io);
    }

    // impact chart bars
    const chart = root.querySelector<HTMLElement>("#impactChart");
    if (chart) {
      let done = false;
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting && !done) {
              done = true;
              chart.querySelectorAll<HTMLElement>(".ic-fill").forEach((f, idx) => {
                setTimeout(() => {
                  f.style.width = (f.dataset.w || "0") + "%";
                }, idx * 70);
              });
              io.disconnect();
            }
          });
        },
        { threshold: 0.25 }
      );
      io.observe(chart);
      observers.push(io);
    }

    // reveal on scroll
    const revealEls = root.querySelectorAll<HTMLElement>(".reveal");
    const revealIo = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            revealIo.unobserve(e.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => revealIo.observe(el));
    observers.push(revealIo);

    return () => {
      observers.forEach((o) => o.disconnect());
      rafs.forEach((r) => cancelAnimationFrame(r));
    };
  }, []);

  /* ---------- HOW-IT-WORKS: animate the INDEX bar chart when shown ---------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const bars = root.querySelectorAll<HTMLElement>('.how-stage[data-stage="1"] .bar');
    if (activeStep === 1) {
      bars.forEach((b) => (b.style.height = "0px"));
      const timers = Array.from(bars).map((b, i) =>
        setTimeout(() => {
          b.style.height = (b.dataset.h || "0") + "px";
        }, i * 60)
      );
      return () => timers.forEach(clearTimeout);
    } else {
      bars.forEach((b) => (b.style.height = "0px"));
    }
  }, [activeStep]);

  const goLogin = () => navigate("/login");
  const goStart = () => navigate("/get-started");
  const step = HOW_STEPS[activeStep];

  return (
    <div className="prism-landing" ref={rootRef}>
      <div className="cursor-glow" aria-hidden="true" />

      {/* ============ ANNOUNCE BANNER ============ */}
      <div className="announce">
        <div className="wrap">
          <i className="ti ti-sparkles" />
          <span>
            <b>Now in private beta</b>
          </span>
          <span className="sep seg-hide">·</span>
          <span className="seg-hide">Built for knowledge-intensive teams</span>
        </div>
      </div>

      {/* ============ NAV ============ */}
      <nav className="topbar">
        <div className="wrap nav-inner">
          <a className="brand" href="#top">
            {PRISM_MARK}
            prism
          </a>
          <div className="nav-links">
            {NAV_LINKS.map(([id, label]) => (
              <a key={id} href={"#" + id} className={activeSection === id ? "active" : ""}>
                {label}
              </a>
            ))}
          </div>
          <div className="nav-right">
            <button className="login" onClick={goLogin} type="button">
              Log in
            </button>
            <button className="btn btn-primary" onClick={goStart} type="button">
              Get started <i className="ti ti-arrow-right" />
            </button>
            <button
              className="nav-toggle"
              type="button"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <i className={menuOpen ? "ti ti-x" : "ti ti-menu-2"} />
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <div className="wrap">
              {[
                ["#how", "How it works"],
                ["#integrations", "Integrations"],
                ["#demo", "Demo"],
                ["#features", "Features"],
                ["#security", "Security"],
                ["#pricing", "Pricing"],
                ["#faq", "FAQ"],
              ].map(([href, label]) => (
                <a key={href} href={href} className="ml-link" onClick={() => setMenuOpen(false)}>
                  {label}
                </a>
              ))}
              <div className="ml-divider" />
              <button
                className="btn btn-ghost"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  goLogin();
                }}
              >
                Log in
              </button>
              <button
                className="btn btn-primary"
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  goStart();
                }}
              >
                Get started <i className="ti ti-arrow-right" />
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ============ HERO ============ */}
      <header className="hero" id="top">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">
              <span className="dot" /> Refract your documents into clarity
            </span>
            <h1 className="hero-title">
              Your documents.
              <br />
              <span className="accent">Finally intelligent.</span>
            </h1>
            <p className="hero-sub">
              Prism turns your company's scattered documents into a single source of truth. Ask
              anything. Get cited answers instantly.
            </p>
            <div className="hero-actions">
              <button className="btn btn-primary btn-lg" onClick={goStart} type="button">
                Get started <i className="ti ti-arrow-right" />
              </button>
              <a className="btn btn-ghost btn-lg" href="#demo">
                <i className="ti ti-player-play" /> Watch demo
              </a>
            </div>
          </div>
          <div className="canvas-stage">
            <canvas id="prismCanvas" ref={canvasRef} width={1080} height={1080} />
          </div>
        </div>
      </header>

      {/* ============ HOW IT WORKS ============ */}
      <section className="block" id="how">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-tag">How it works</span>
            <h2 className="sec-title">Raw documents in. Refracted clarity out.</h2>
            <p className="sec-desc">
              Four steps from a pile of files to grounded, cited answers your whole team can trust.
            </p>
          </div>
          <div className="how-tabs reveal">
            {HOW_STEPS.map((s, idx) => (
              <button
                key={s.tab}
                type="button"
                className={"how-tab" + (idx === activeStep ? " active" : "")}
                onClick={() => setActiveStep(idx)}
              >
                {s.tab}
              </button>
            ))}
          </div>
          <div className="how-panel reveal">
            <div className="how-detail">
              <span className="how-stepnum">{step.num}</span>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              <div className="how-meta">
                {step.meta.map(([k, v]) => (
                  <div className="mi" key={k}>
                    <span className="k">{k}</span>
                    <span className="v">{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="how-visual">
              {/* 0: connect */}
              <div className={"how-stage" + (activeStep === 0 ? " show" : "")} data-stage="0">
                <div className="vz-connect">
                  <span className="vz-chip">
                    <i className="ti ti-brand-google-drive" /> Drive
                  </span>
                  <span className="vz-chip">
                    <i className="ti ti-brand-notion" /> Notion
                  </span>
                  <span className="vz-chip">
                    <i className="ti ti-cloud" /> SharePoint
                  </span>
                  <span className="vz-chip">
                    <i className="ti ti-brand-slack" /> Slack
                  </span>
                  <span className="vz-chip">
                    <i className="ti ti-box" /> Box
                  </span>
                  <span className="vz-chip">
                    <i className="ti ti-brand-github" /> GitHub
                  </span>
                  <span className="vz-chip">
                    <i className="ti ti-database" /> S3 bucket
                  </span>
                </div>
              </div>
              {/* 1: index */}
              <div className={"how-stage" + (activeStep === 1 ? " show" : "")} data-stage="1">
                <div className="vz-bars">
                  {BAR_HEIGHTS.map((h, i) => (
                    <div className="bar" data-h={h} key={i} />
                  ))}
                </div>
              </div>
              {/* 2: ask */}
              <div className={"how-stage" + (activeStep === 2 ? " show" : "")} data-stage="2">
                <div className="vz-ask">
                  <div className="vz-line r">
                    <div className="b">What's our PTO carryover policy?</div>
                  </div>
                  <div className="vz-line">
                    <div className="b">
                      Up to 5 unused days roll over each calendar year; the rest expire on Dec 31.
                    </div>
                  </div>
                  <div className="vz-line r">
                    <div className="b">Does that apply to contractors?</div>
                  </div>
                </div>
              </div>
              {/* 3: verify */}
              <div className={"how-stage" + (activeStep === 3 ? " show" : "")} data-stage="3">
                <div className="vz-verify">
                  <div className="vh">
                    "…unused days roll over each calendar year, capped at five business days."
                  </div>
                  <div className="vc">
                    <i className="ti ti-file-text" /> Employee_Handbook.pdf · p.14
                  </div>
                  <div className="vc">
                    <i className="ti ti-file-text" /> PTO_Policy_2026.pdf · §3.2
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ IMPACT DATA ============ */}
      <section className="block" id="impact" style={{ paddingTop: 40, paddingBottom: 56 }}>
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-tag">Impact data</span>
            <h2 className="sec-title">
              Hours back.
              <br />
              <span style={{ color: "var(--blue)" }}>Every single day.</span>
            </h2>
            <p className="sec-desc">
              Across 40+ enterprise deployments, Prism users reclaim an average of 2.1 hours per
              employee per day previously lost to searching for information.
            </p>
          </div>

          <div className="impact-stats reveal">
            {IMPACT_STATS.map(([big, unit, desc, trend, unitFirst]) => (
              <div className="istat" key={desc as string}>
                <div className="big">
                  {unitFirst ? (
                    <>
                      <span className="u">$</span>
                      {(big as string).replace("$", "")}
                      <span className="u">{unit}</span>
                    </>
                  ) : (
                    <>
                      {big}
                      <span className="u">{unit}</span>
                    </>
                  )}
                </div>
                <div className="desc">{desc}</div>
                <div className="trend">
                  <i className="ti ti-trending-up" /> {trend}
                </div>
              </div>
            ))}
          </div>

          <div className="impact-chart reveal" id="impactChart">
            <div className="ic-title">Time spent searching for information — before vs. after Prism</div>
            <div className="ic-sub">Weekly hours per employee, by department</div>
            <div className="ic-legend">
              <span>
                <span className="sw before" /> Before Prism
              </span>
              <span>
                <span className="sw after" /> After Prism
              </span>
            </div>
            <div className="ic-rows">
              {IMPACT_ROWS.map(([dept, before, after, vb, va]) => (
                <div className="ic-row" key={dept}>
                  <div className="ic-dept">{dept}</div>
                  <div className="ic-bars">
                    <div className="ic-track">
                      <div className="ic-fill before" data-w={before} />
                    </div>
                    <div className="ic-track">
                      <div className="ic-fill after" data-w={after} />
                    </div>
                  </div>
                  <div className="ic-vals">
                    <span className="vb">{vb}</span>
                    <span className="va">{va}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ INTEGRATIONS ============ */}
      <section className="block" id="integrations" style={{ paddingTop: 40 }}>
        <div className="wrap">
          <div className="sec-head reveal" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            <span className="sec-tag">Integrations</span>
            <h2 className="sec-title">Connect the tools you already use</h2>
            <p className="sec-desc" style={{ marginLeft: "auto", marginRight: "auto" }}>
              Prism lives where your knowledge lives — from cloud drives to wikis to ticketing systems.
            </p>
          </div>
          <div className="integ-grid reveal">
            {INTEGRATIONS.map(([icon, nm]) => (
              <div className="integ" key={nm}>
                <i className={"ti " + icon} />
                <div className="nm">{nm}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ DEMO WINDOW ============ */}
      <section className="block" id="demo" style={{ paddingTop: 32 }}>
        <div className="wrap">
          <div className="sec-head reveal" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            <span className="sec-tag">Live demo</span>
            <h2 className="sec-title">Watch it shed light in real time</h2>
          </div>
          <div className="demo-wrap reveal">
            <div className="win">
              <div className="win-bar">
                <div className="lights">
                  <span className="r" />
                  <span className="y" />
                  <span className="g" />
                </div>
                <div className="win-title">
                  <i className="ti ti-lock" /> acme.prism.app — Workspace
                </div>
              </div>
              <div className="win-body">
                <DemoChat />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FEATURES ============ */}
      <section className="block" id="features">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-tag">Capabilities</span>
            <h2 className="sec-title">Everything you need to illuminate your knowledge base</h2>
            <p className="sec-desc">
              Built for the security, scale, and accuracy bar that document-heavy teams demand.
            </p>
          </div>
          <div className="cards">
            {FEATURES.map(([icon, title, body]) => (
              <div className="card reveal" key={title}>
                <div className="ic">
                  <i className={"ti " + icon} />
                </div>
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ SECURITY ============ */}
      <section className="block" id="security">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="sec-tag">Security &amp; trust</span>
            <h2 className="sec-title">Enterprise-grade by default</h2>
            <p className="sec-desc">
              Prism reads your most sensitive documents, so security isn't a tier — it's the
              foundation every workspace runs on.
            </p>
          </div>
          <div className="sec-cards reveal">
            {SECURITY.map(([icon, title, body]) => (
              <div className="scard" key={title}>
                <div className="ic">
                  <i className={"ti " + icon} />
                </div>
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <div className="compliance reveal">
            <span className="cl-label">Compliant with</span>
            {COMPLIANCE.map((c) => (
              <span className="badge" key={c}>
                <i className="ti ti-shield-check" />
                {c}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ============ METRICS ============ */}
      <section className="metrics" id="metrics">
        <div className="wrap" style={{ paddingTop: 72, paddingBottom: 72 }}>
          <div className="metrics-grid" id="metricsGrid">
            {METRICS.map(([target, suffix, lbl]) => (
              <div className="metric" key={lbl}>
                <div className="val" data-target={target} data-suffix={suffix}>
                  0
                </div>
                <div className="lbl">{lbl}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ PRICING ============ */}
      <section className="block" id="pricing">
        <div className="wrap">
          <div className="sec-head reveal" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            <span className="sec-tag">Pricing</span>
            <h2 className="sec-title">Start clear. Scale when you're ready.</h2>
          </div>
          <div className="pricing-grid reveal">
            {PRICING.map((tier) => (
              <div className={"tier" + (tier.featured ? " featured" : "")} key={tier.name}>
                {tier.featured && <div className="tier-badge">Most popular</div>}
                <div className="tname">{tier.name}</div>
                <div className="price">
                  <span className="amt">{tier.amt}</span>
                  {tier.per && <span className="per">{tier.per}</span>}
                </div>
                <div className="price-note">{tier.note}</div>
                <button
                  type="button"
                  className={"btn tier-cta " + (tier.ghost ? "btn-ghost" : "btn-primary")}
                  onClick={goStart}
                >
                  {tier.cta}
                </button>
                <ul>
                  {tier.feats.map((f) => (
                    <li key={f}>
                      <i className="ti ti-check" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="block" id="faq">
        <div className="wrap">
          <div className="sec-head reveal" style={{ textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
            <span className="sec-tag">FAQ</span>
            <h2 className="sec-title">Questions, answered</h2>
          </div>
          <div className="faq-list reveal" style={{ marginLeft: "auto", marginRight: "auto" }}>
            {FAQ_ITEMS.map(([q, a], i) => (
              <div className={"faq-item" + (openFaq === i ? " open" : "")} key={q}>
                <button
                  className="faq-q"
                  type="button"
                  aria-expanded={openFaq === i}
                  onClick={() => setOpenFaq((cur) => (cur === i ? null : i))}
                >
                  {q}
                  <i className="ti ti-chevron-down" />
                </button>
                <div className="faq-a">
                  <div>
                    <p>{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section className="cta" id="cta">
        <div className="wrap">
          <h2 className="reveal">One question. Every answer.</h2>
          <p className="reveal">
            Spin up a workspace in minutes. No credit card, no sales call — refract your first source
            free.
          </p>
          <div className="cta-actions reveal">
            <button className="btn btn-primary btn-lg" onClick={goStart} type="button">
              Get started <i className="ti ti-arrow-right" />
            </button>
            <button className="btn btn-ghost btn-lg" onClick={goStart} type="button">
              <i className="ti ti-calendar" /> Book a demo
            </button>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer>
        <div className="wrap foot-inner">
          <a className="brand" href="#top" style={{ fontSize: 16 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 3 L21 20 L3 20 Z" stroke="#fafafa" strokeWidth="1.4" strokeLinejoin="round" />
              <path d="M7 20 L15.5 6" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            prism
          </a>
          <div className="foot-links">
            <a href="#">Privacy</a>
            <a href="#">Security</a>
            <a href="#">Docs</a>
            <a href="#">Status</a>
          </div>
          <span>© 2026 Prism Labs, Inc.</span>
        </div>
      </footer>
    </div>
  );
};

/* ---------- INTERACTIVE DEMO CHAT ----------
   The user types a question (or taps a suggestion) and Prism answers from the
   deterministic mock corpus in prismData.ts, streaming word-by-word and then
   revealing the source citations. */
/* The indexed corpus shown in the demo window's knowledge-base bar. Each entry's
   `id` maps to a DOCUMENTS id so we can light up the exact files an answer cites. */
const CORPUS: { id: string; icon: string; name: string }[] = [
  { id: "ma-2026", icon: "ti-files", name: "Project Helios M&A" },
  { id: "noncompete", icon: "ti-user-shield", name: "Exec Non-Compete" },
  { id: "ip-policy", icon: "ti-shield-lock", name: "IP Assignment Policy" },
  { id: "q4-report", icon: "ti-chart-line", name: "Q4 FY25 Financials" },
  { id: "msa", icon: "ti-file-text", name: "Acme MSA" },
  { id: "dpa", icon: "ti-lock-square", name: "GDPR DPA" },
];

const NAV_LINKS: [string, string][] = [
  ["how", "How it works"],
  ["integrations", "Integrations"],
  ["demo", "Demo"],
  ["features", "Features"],
  ["security", "Security"],
  ["pricing", "Pricing"],
];

interface DemoMessage {
  id: number;
  role: "user" | "bot";
  text: string;
  citations?: Citation[];
  streaming?: boolean;
  revealCitations?: boolean;
}

let demoIdSeq = 1;

function DemoChat() {
  const [messages, setMessages] = useState<DemoMessage[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [matchedDocs, setMatchedDocs] = useState<string[]>([]);
  const [openCites, setOpenCites] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const toggleCite = (key: string) =>
    setOpenCites((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setMessages([]);
    setOpenCites(new Set());
    setMatchedDocs([]);
    setThinking(false);
    setBusy(false);
    setInput("");
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, thinking]);

  const ask = useCallback(
    (question: string) => {
      const q = question.trim();
      if (!q || busy) return;
      setBusy(true);
      setInput("");
      setMessages((m) => [...m, { id: demoIdSeq++, role: "user", text: q }]);
      setThinking(true);

      const answer = answerQuestion(q);
      // Light up the corpus chips for the documents this answer will cite.
      setMatchedDocs([...new Set(answer.citations.map((c) => c.docId))]);

      timers.current.push(
        setTimeout(() => {
          setThinking(false);
          const botId = demoIdSeq++;
          setMessages((m) => [
            ...m,
            { id: botId, role: "bot", text: "", citations: answer.citations, streaming: true },
          ]);

          const words = answer.summary.split(" ");
          let i = 0;
          const tick = () => {
            i += 1;
            setMessages((m) =>
              m.map((msg) => (msg.id === botId ? { ...msg, text: words.slice(0, i).join(" ") } : msg))
            );
            if (i < words.length) {
              timers.current.push(setTimeout(tick, 26));
            } else {
              timers.current.push(
                setTimeout(() => {
                  setMessages((m) =>
                    m.map((msg) =>
                      msg.id === botId ? { ...msg, streaming: false, revealCitations: true } : msg
                    )
                  );
                  setMatchedDocs([]);
                  setBusy(false);
                }, 200)
              );
            }
          };
          tick();
        }, 650)
      );
    },
    [busy]
  );

  const empty = messages.length === 0 && !thinking;

  return (
    <div className="chat">
      <div className="kb-bar">
        <span className="kb-status">
          <i className="ti ti-database" /> {CORPUS.length} documents indexed
        </span>
        <div className="kb-docs">
          {CORPUS.map((d) => (
            <span className={"kb-doc" + (matchedDocs.includes(d.id) ? " matched" : "")} key={d.id}>
              <i className={"ti " + d.icon} />
              {d.name}
            </span>
          ))}
        </div>
        <span className="kb-synced">
          <span className="kb-dot" /> Synced
        </span>
      </div>
      <div className="chat-scroll" ref={scrollRef}>
        {empty && (
          <div className="chat-empty">
            <div className="ce-title">Ask your documents anything</div>
            <div className="ce-sub">
              Prism reads across the whole library and answers with the exact passages it came from.
            </div>
            <div className="chat-suggest">
              {SUGGESTED_QUESTIONS.map((sq) => (
                <button key={sq} type="button" onClick={() => ask(sq)}>
                  {sq}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div className={"msg " + msg.role + " anim-in"} key={msg.id}>
            <div className="bubble">
              {msg.text}
              {msg.streaming && <span className="caret" />}
              {msg.revealCitations && msg.citations && msg.citations.length > 0 && (
                <>
                  <div className="cites-label">
                    <i className="ti ti-link" /> Pulled from {msg.citations.length}{" "}
                    {msg.citations.length === 1 ? "source" : "sources"} — tap to read the passage
                  </div>
                  <div className="cites">
                    {msg.citations.map((c, idx) => {
                      const doc = docById(c.docId);
                      const key = msg.id + ":" + idx;
                      const open = openCites.has(key);
                      return (
                        <button
                          type="button"
                          className={"cite" + (open ? " active" : "")}
                          key={idx}
                          onClick={() => toggleCite(key)}
                          aria-expanded={open}
                        >
                          <i className="ti ti-file-text" />
                          {(doc?.title ?? "Document") + " · p." + c.page}
                          <i className={"ti cite-caret " + (open ? "ti-chevron-up" : "ti-chevron-down")} />
                        </button>
                      );
                    })}
                  </div>
                  {msg.citations.map((c, idx) => {
                    const key = msg.id + ":" + idx;
                    if (!openCites.has(key)) return null;
                    const doc = docById(c.docId);
                    return (
                      <div className="cite-quote anim-in" key={"q" + idx}>
                        <p>“{c.quote}”</p>
                        <span className="cq-src">
                          <i className="ti ti-file-text" />
                          {(doc?.title ?? "Document") + " · p." + c.page}
                        </span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        ))}

        {thinking && (
          <div className="msg bot anim-in">
            <div className="bubble kb-search">
              <i className="ti ti-search" />
              <span>Searching {CORPUS.length} documents…</span>
              <div className="typing">
                <span />
                <span />
                <span />
              </div>
            </div>
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="chat-quickbar">
          <div className="qa-scroll">
            {SUGGESTED_QUESTIONS.filter(
              (sq) => !messages.some((m) => m.role === "user" && m.text === sq)
            ).map((sq) => (
              <button className="qa-chip" type="button" key={sq} disabled={busy} onClick={() => ask(sq)}>
                {sq}
              </button>
            ))}
          </div>
          <button className="qa-reset" type="button" onClick={reset} title="Clear conversation" aria-label="Clear conversation">
            <i className="ti ti-refresh" />
          </button>
        </div>
      )}

      <div className="chat-composer">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <i className="ti ti-file-text" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask across all your documents…"
            aria-label="Ask a question"
          />
          <button className="chat-send" type="submit" disabled={!input.trim() || busy} aria-label="Send">
            <i className="ti ti-arrow-up" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Index;
