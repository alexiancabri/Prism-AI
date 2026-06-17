import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PrismAuthScene, {
  type PrismSceneHandle,
} from "@/components/app/PrismAuthScene";
import "@/styles/prism-landing.css";
import "@/styles/prism-auth.css";
import "@/styles/prism-onboarding.css";

const PRISM_MARK = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3 L21 20 L3 20 Z"
      stroke="#fafafa"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M7 20 L15.5 6" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

interface Option {
  v: string;
  icon: string;
  label: string;
}
interface Question {
  id: "role" | "team" | "sources" | "goal";
  kicker: string;
  q: string;
  hint: string;
  kind: "single" | "multi";
  options: Option[];
}

const QUESTIONS: Question[] = [
  {
    id: "role",
    kicker: "About you",
    q: "What best describes your role?",
    hint: "We tailor Prism's answers to how your team works.",
    kind: "single",
    options: [
      { v: "legal", icon: "ti-gavel", label: "Legal & compliance" },
      { v: "sales", icon: "ti-businessplan", label: "Sales" },
      { v: "finance", icon: "ti-coin", label: "Finance" },
      { v: "hr", icon: "ti-users", label: "HR & People" },
      { v: "eng", icon: "ti-code", label: "Product & engineering" },
      { v: "other", icon: "ti-briefcase", label: "Operations / other" },
    ],
  },
  {
    id: "team",
    kicker: "About you",
    q: "How big is your team?",
    hint: "This helps us right-size your workspace.",
    kind: "single",
    options: [
      { v: "solo", icon: "ti-user", label: "Just me" },
      { v: "small", icon: "ti-users", label: "2–10 people" },
      { v: "mid", icon: "ti-users-group", label: "11–50 people" },
      { v: "large", icon: "ti-building", label: "50+ people" },
    ],
  },
  {
    id: "sources",
    kicker: "Your knowledge",
    q: "Where does your knowledge live today?",
    hint: "Pick all that apply — Prism connects to each, read-only.",
    kind: "multi",
    options: [
      { v: "Google Drive", icon: "ti-brand-google-drive", label: "Google Drive" },
      { v: "Notion", icon: "ti-brand-notion", label: "Notion" },
      { v: "SharePoint", icon: "ti-cloud", label: "SharePoint" },
      { v: "PDFs & Word docs", icon: "ti-file-text", label: "PDFs & Word docs" },
      { v: "Confluence", icon: "ti-news", label: "Confluence" },
      { v: "Slack", icon: "ti-brand-slack", label: "Slack" },
    ],
  },
  {
    id: "goal",
    kicker: "Your goal",
    q: "What should Prism help with first?",
    hint: "You can change this anytime.",
    kind: "single",
    options: [
      { v: "find", icon: "ti-search", label: "Find answers fast" },
      { v: "onboard", icon: "ti-rocket", label: "Onboard new hires" },
      { v: "research", icon: "ti-zoom-check", label: "Research & due diligence" },
      { v: "draft", icon: "ti-quote", label: "Draft with citations" },
      { v: "comply", icon: "ti-shield-check", label: "Stay compliant" },
    ],
  },
];

const ASK_EXAMPLE: Record<string, string> = {
  legal: "What's our data-retention obligation under the Acme MSA?",
  sales: "What's included in the Enterprise tier vs. Team?",
  finance: "What were our Q4 travel expenses by department?",
  hr: "How many PTO days carry over into next year?",
  eng: "How do we rotate production API keys?",
  other: "What's our refund policy for annual plans?",
};

interface Answers {
  role?: string;
  team?: string;
  sources: string[];
  goal?: string;
}

export default function GetStarted() {
  const navigate = useNavigate();
  const sceneRef = useRef<PrismSceneHandle>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ sources: [] });

  const total = QUESTIONS.length;
  const isHow = step >= total;
  const current = QUESTIONS[step];

  function choose(opt: string) {
    sceneRef.current?.pulse("email");
    if (current.kind === "multi") {
      setAnswers((a) => ({
        ...a,
        sources: a.sources.includes(opt)
          ? a.sources.filter((s) => s !== opt)
          : [...a.sources, opt],
      }));
    } else {
      setAnswers((a) => ({ ...a, [current.id]: opt }));
    }
  }

  const canContinue = isHow
    ? true
    : current.kind === "multi"
      ? answers.sources.length > 0
      : !!answers[current.id];

  function next() {
    if (!canContinue) return;
    sceneRef.current?.pulse(step === total - 1 ? "burst" : "password");
    setStep((s) => s + 1);
  }

  function back() {
    setStep((s) => Math.max(0, s - 1));
  }

  function finish() {
    try {
      localStorage.setItem("prism_onboarding", JSON.stringify(answers));
    } catch {
      /* ignore storage failures */
    }
    sceneRef.current?.pulse("burst");
    navigate("/signup");
  }

  // Personalized how-it-works copy.
  const sourceList =
    answers.sources.length > 0
      ? answers.sources.join(", ")
      : "Drive, SharePoint, Notion, and your PDFs";
  const askExample = ASK_EXAMPLE[answers.role ?? "other"] ?? ASK_EXAMPLE.other;

  const HOW = [
    {
      icon: "ti-plug-connected",
      title: "Connect your sources",
      desc: `We securely connect ${sourceList} — read-only, with your existing permissions intact.`,
    },
    {
      icon: "ti-stack-2",
      title: "Index & embed",
      desc: "Every document is parsed, chunked, and embedded into your private vector store — incrementally, so new content is searchable in seconds.",
    },
    {
      icon: "ti-message-2",
      title: "Ask in plain English",
      desc: `Ask things like “${askExample}” and Prism retrieves the most relevant passages before it answers.`,
    },
    {
      icon: "ti-quote",
      title: "Verify with citations",
      desc: "Every answer links back to the exact source, page, and line — so anything Prism says can be traced and trusted.",
    },
  ];

  const segments = total + 1; // questions + the how-it-works step

  return (
    <div className="prism-landing prism-onboard">
      <PrismAuthScene ref={sceneRef} />

      <div className="ob-top">
        <Link className="ob-brand" to="/">
          {PRISM_MARK}
          prism
        </Link>
        <span className="ob-login">
          Already have an account? <Link to="/login">Log in</Link>
        </span>
      </div>

      <div className="ob-main">
        <div className="ob-shell">
          <div className="ob-progress" aria-hidden="true">
            {Array.from({ length: segments }).map((_, i) => (
              <div key={i} className={`ob-seg${i <= step ? " fill" : ""}`}>
                <span />
              </div>
            ))}
          </div>

          <div className="ob-card">
            {!isHow ? (
              <>
                <span className="ob-kicker">
                  <i className="ti ti-sparkles" />
                  {current.kicker} · Step {step + 1} of {segments}
                </span>
                <h1 className="ob-q">{current.q}</h1>
                <p className="ob-hint">{current.hint}</p>

                <div className="ob-options">
                  {current.options.map((opt) => {
                    const selected =
                      current.kind === "multi"
                        ? answers.sources.includes(opt.v)
                        : answers[current.id] === opt.v;
                    return (
                      <button
                        type="button"
                        key={opt.v}
                        className={`ob-option${selected ? " selected" : ""}`}
                        onClick={() => choose(opt.v)}
                        aria-pressed={selected}
                      >
                        <span className="oi">
                          <i className={`ti ${opt.icon}`} />
                        </span>
                        <span className="ol">{opt.label}</span>
                        <i className="ti ti-check ock" />
                      </button>
                    );
                  })}
                </div>

                <div className="ob-actions">
                  <button
                    type="button"
                    className={`ob-back${step === 0 ? " hide" : ""}`}
                    onClick={back}
                  >
                    <i className="ti ti-arrow-left" /> Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={next}
                    disabled={!canContinue}
                  >
                    Continue <i className="ti ti-arrow-right" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="ob-kicker">
                  <i className="ti ti-bulb" />
                  How Prism works
                </span>
                <h1 className="ob-q">
                  Here's how Prism works <span className="accent">for you</span>
                </h1>
                <p className="ob-hint">
                  Four steps from your scattered documents to grounded, cited
                  answers your whole team can trust.
                </p>

                <div className="ob-how">
                  {HOW.map((s, i) => (
                    <div
                      className="ob-stage"
                      key={s.title}
                      style={{ animationDelay: `${i * 0.12}s` }}
                    >
                      <div className="ob-num">{`0${i + 1}`}</div>
                      <div className="sc">
                        <h4>
                          <i className={`ti ${s.icon}`} />
                          {s.title}
                        </h4>
                        <p>{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="ob-actions">
                  <button type="button" className="ob-back" onClick={back}>
                    <i className="ti ti-arrow-left" /> Back
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={finish}
                  >
                    Create your workspace <i className="ti ti-arrow-right" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
