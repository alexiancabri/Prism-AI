import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UploadCloud, ArrowRight } from "lucide-react";
import TutorialTour, { type TourStep } from "./TutorialTour";

const PHASE_KEY = "prism_onboard_phase"; // "connect" | "tour" | "done"

const TOUR_STEPS: TourStep[] = [
  {
    selector: '[data-tour="nav"]',
    title: "Your workspace",
    body: "Everything in Prism is one click away from this sidebar.",
  },
  {
    selector: '[data-tour="nav-sources"]',
    title: "Connect a source",
    body: "Upload PDFs or Word docs here to index them. Drive, Notion & SharePoint are coming soon.",
  },
  {
    selector: '[data-tour="nav-chat"]',
    title: "Ask anything",
    body: "Ask questions across every indexed document — answers come back with the exact quotes and sources.",
  },
  {
    selector: '[data-tour="nav-dashboard"]',
    title: "Track usage",
    body: "See documents indexed, queries today, and your recent questions at a glance.",
  },
  {
    selector: '[data-tour="account"]',
    title: "You're all set",
    body: "Manage your org and sign out here. Head to Sources, upload a document, then ask your first question.",
  },
];

const INTEGRATIONS = ["Google Drive", "Notion", "SharePoint", "Slack"];

function readSources(): string[] {
  try {
    const raw = localStorage.getItem("prism_onboarding");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { sources?: string[] };
    return parsed.sources ?? [];
  } catch {
    return [];
  }
}

export default function FirstRun() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"connect" | "tour" | "done">("done");
  const [sources] = useState<string[]>(readSources);

  // Decide the initial phase once on mount.
  useEffect(() => {
    const stored = localStorage.getItem(PHASE_KEY) as
      | "connect"
      | "tour"
      | "done"
      | null;
    setPhase(stored ?? "connect");
  }, []);

  function advance(next: "tour" | "done") {
    localStorage.setItem(PHASE_KEY, next);
    setPhase(next);
  }

  if (phase === "done") return null;

  if (phase === "tour") {
    return <TutorialTour steps={TOUR_STEPS} onClose={() => advance("done")} />;
  }

  // phase === "connect"
  const sourceLine =
    sources.length > 0
      ? `You told us your knowledge lives in ${sources.join(", ")}.`
      : "Bring your documents into Prism to start asking questions.";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b0b0f] p-7 shadow-2xl">
        <span className="app-kicker">Welcome to Prism</span>
        <h2 className="mt-3 text-xl font-semibold tracking-tight text-neutral-100">
          Connect your first source
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">
          {sourceLine} Live connectors are on the way — for now, upload a
          document and Prism will index it instantly.
        </p>

        <button
          onClick={() => {
            advance("tour");
            navigate("/sources");
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#3b82f6]"
        >
          <UploadCloud className="h-4 w-4" /> Upload a document
        </button>

        <div className="mt-5">
          <div className="app-mono mb-2 text-[10px] uppercase tracking-wider text-neutral-600">
            Or connect (coming soon)
          </div>
          <div className="grid grid-cols-2 gap-2">
            {INTEGRATIONS.map((name) => (
              <div
                key={name}
                className="flex items-center justify-between rounded-lg border border-white/10 px-3 py-2 text-sm text-neutral-400"
              >
                {name}
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-neutral-500">
                  Soon
                </span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => advance("tour")}
          className="mt-5 flex w-full items-center justify-center gap-1 text-sm font-medium text-neutral-400 hover:text-neutral-200"
        >
          Skip — show me around <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
