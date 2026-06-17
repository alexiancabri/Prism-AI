import { useLayoutEffect, useState } from "react";

export interface TourStep {
  selector: string;
  title: string;
  body: string;
}

const BOT = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M12 3 L21 20 L3 20 Z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M7 20 L15.5 6" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

const CARD_W = 320;

export default function TutorialTour({
  steps,
  onClose,
}: {
  steps: TourStep[];
  onClose: () => void;
}) {
  const [i, setI] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const step = steps[i];

  useLayoutEffect(() => {
    const update = () => {
      const el = document.querySelector(step.selector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    // re-measure briefly to stay aligned through CSS transitions
    const id = window.setInterval(update, 300);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.clearInterval(id);
    };
  }, [step.selector]);

  const pad = 6;
  const hl = rect
    ? {
        top: rect.top - pad,
        left: rect.left - pad,
        width: rect.width + pad * 2,
        height: rect.height + pad * 2,
      }
    : null;

  // Place the card to the right of the target, clamped to the viewport.
  let cardTop = window.innerHeight / 2 - 110;
  let cardLeft = window.innerWidth / 2 - CARD_W / 2;
  if (rect) {
    cardLeft = rect.right + 16;
    cardTop = rect.top;
    if (cardLeft + CARD_W > window.innerWidth - 12) {
      cardLeft = rect.left - CARD_W - 16; // fall back to the left side
    }
    cardLeft = Math.max(12, Math.min(cardLeft, window.innerWidth - CARD_W - 12));
    cardTop = Math.max(12, Math.min(cardTop, window.innerHeight - 220));
  }

  const last = i === steps.length - 1;

  return (
    <>
      {hl ? (
        <div
          className="tour-highlight"
          style={{ top: hl.top, left: hl.left, width: hl.width, height: hl.height }}
        />
      ) : (
        <div
          className="fixed inset-0 z-[71]"
          style={{ boxShadow: "inset 0 0 0 9999px rgba(0,0,0,0.66)" }}
        />
      )}

      <div className="tour-card" style={{ top: cardTop, left: cardLeft }}>
        <div className="tour-bot">
          <div className="av">{BOT}</div>
          <div className="nm">
            Prism guide
            <span>Tutorial</span>
          </div>
        </div>
        <h4>{step.title}</h4>
        <p>{step.body}</p>
        <div className="tour-foot">
          <div className="tour-dots">
            {steps.map((_, k) => (
              <i key={k} className={k === i ? "on" : ""} />
            ))}
          </div>
          <div className="tour-actions">
            <button className="tour-skip" onClick={onClose}>
              Skip
            </button>
            {i > 0 && (
              <button
                className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:bg-white/5"
                onClick={() => setI(i - 1)}
              >
                Back
              </button>
            )}
            <button
              className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#3b82f6]"
              onClick={() => (last ? onClose() : setI(i + 1))}
            >
              {last ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
