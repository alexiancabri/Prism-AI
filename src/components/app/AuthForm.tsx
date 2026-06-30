import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import PrismAuthScene, {
  type PrismSceneHandle,
} from "@/components/app/PrismAuthScene";
import "@/styles/prism-landing.css";
import "@/styles/prism-auth.css";

interface Props {
  mode: "login" | "signup";
}

const PRISM_MARK = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="M12 3 L21 20 L3 20 Z"
      stroke="#fafafa"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    <path d="M7 20 L15.5 6" stroke="#3b82f6" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function AuthForm({ mode }: Props) {
  const { signIn, signUp, session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Field-completion ("light") state, driven by a debounce on each field.
  const [emailLit, setEmailLit] = useState(false);
  const [passwordLit, setPasswordLit] = useState(false);

  const sceneRef = useRef<PrismSceneHandle>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const burstFired = useRef(false);

  const isLogin = mode === "login";
  const emailValid = EMAIL_RE.test(email);
  const passwordValid = password.length >= 6;

  // Debounced "finished typing email" → light pulse through the prism.
  useEffect(() => {
    if (!emailValid) {
      setEmailLit(false);
      return;
    }
    const id = window.setTimeout(() => {
      setEmailLit(true);
      sceneRef.current?.pulse("email");
    }, 520);
    return () => window.clearTimeout(id);
  }, [email, emailValid]);

  // Debounced "finished typing password" → light pulse.
  useEffect(() => {
    if (!passwordValid) {
      setPasswordLit(false);
      return;
    }
    const id = window.setTimeout(() => {
      setPasswordLit(true);
      sceneRef.current?.pulse("password");
    }, 520);
    return () => window.clearTimeout(id);
  }, [password, passwordValid]);

  // Both fields complete → one full-spectrum burst (guarded against repeats).
  useEffect(() => {
    if (emailLit && passwordLit) {
      if (!burstFired.current) {
        burstFired.current = true;
        sceneRef.current?.pulse("burst");
      }
    } else {
      burstFired.current = false;
    }
  }, [emailLit, passwordLit]);

  // Redirect once the session is actually established (avoids a race where we
  // navigate before the auth context updates and ProtectedRoute bounces back).
  useEffect(() => {
    if (session) navigate("/chat", { replace: true });
  }, [session, navigate]);

  // Card 3D tilt + cursor spotlight; ambient glow follows the cursor.
  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const card = cardRef.current;
    if (card) {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
      const ang = (Math.atan2(py - 0.5, px - 0.5) * 180) / Math.PI;
      card.style.setProperty("--ang", `${ang.toFixed(0)}deg`);
      const rx = (0.5 - py) * 7;
      const ry = (px - 0.5) * 9;
      card.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
    }
    if (glowRef.current) {
      glowRef.current.style.setProperty("--gx", `${e.clientX}px`);
      glowRef.current.style.setProperty("--gy", `${e.clientY}px`);
    }
  }

  function handlePointerLeave() {
    if (cardRef.current) cardRef.current.style.transform = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        // Navigation happens in the session effect above.
      } else {
        const { session: newSession } = await signUp(email, password);
        if (!newSession) {
          // Project requires email confirmation — no session yet.
          setNotice(
            "Account created. Check your inbox to confirm your email, then sign in.",
          );
        }
        // If a session was returned, the session effect navigates.
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="prism-landing prism-auth"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <PrismAuthScene ref={sceneRef} />
      <div className="cursor-glow" ref={glowRef} aria-hidden="true" />

      <div
        ref={cardRef}
        className={`auth-card${emailLit && passwordLit ? " charged" : ""}`}
      >
        <a className="auth-brand" href="/">
          {PRISM_MARK}
          prism
        </a>

        <span className="eyebrow auth-eyebrow">
          <span className="dot" />
          {isLogin ? "Secure workspace access" : "Refract your first source free"}
        </span>

        <h1 className="auth-title">
          {isLogin ? (
            <>
              Sign in to <span className="accent">Prism</span>
            </>
          ) : (
            <>
              Create your <span className="accent">workspace</span>
            </>
          )}
        </h1>
        <p className="auth-sub">
          {isLogin
            ? "Ask anything across your documents and get cited answers instantly."
            : "Connect a source and start asking in plain English in minutes."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className={`auth-field${emailLit ? " lit" : ""}`}>
            <label className="auth-label" htmlFor="email">
              Work email
            </label>
            <div className={`auth-input-box${emailLit ? " is-lit" : ""}`}>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="auth-input"
              />
              <span className="auth-sweep" aria-hidden="true" />
            </div>
          </div>

          <div className={`auth-field${passwordLit ? " lit" : ""}`}>
            <label className="auth-label" htmlFor="password">
              Password
            </label>
            <div className={`auth-input-box${passwordLit ? " is-lit" : ""}`}>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="auth-input"
              />
              <span className="auth-sweep" aria-hidden="true" />
            </div>
          </div>

          {error && <div className="auth-alert err">{error}</div>}
          {notice && <div className="auth-alert ok">{notice}</div>}

          <button type="submit" disabled={busy} className="btn btn-primary auth-btn">
            {busy ? (
              "Please wait…"
            ) : isLogin ? (
              <>
                Sign in <i className="ti ti-arrow-right" />
              </>
            ) : (
              <>
                Create account <i className="ti ti-arrow-right" />
              </>
            )}
          </button>
        </form>

        <p className="auth-foot">
          {isLogin ? (
            <>
              No account? <Link to="/signup">Sign up</Link>
            </>
          ) : (
            <>
              Already have an account? <Link to="/login">Sign in</Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
