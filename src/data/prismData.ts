import {
  FileText,
  Scale,
  Briefcase,
  LineChart,
  ShieldCheck,
  Handshake,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface PrismDoc {
  id: string;
  title: string;
  type: string;
  pages: number;
  updated: string;
  icon: LucideIcon;
  accent: string; // hsl spectrum var index
}

export interface Citation {
  docId: string;
  page: number;
  quote: string;
}

export interface PrismAnswer {
  summary: string;
  citations: Citation[];
}

export const DOCUMENTS: PrismDoc[] = [
  {
    id: "ma-2026",
    title: "Project Helios — M&A Agreement",
    type: "Merger Agreement",
    pages: 214,
    updated: "2 days ago",
    icon: Handshake,
    accent: "1",
  },
  {
    id: "noncompete",
    title: "Executive Employment & Non-Compete",
    type: "Employment",
    pages: 38,
    updated: "Yesterday",
    icon: Briefcase,
    accent: "2",
  },
  {
    id: "ip-policy",
    title: "Global IP Assignment Policy",
    type: "Policy",
    pages: 19,
    updated: "5 days ago",
    icon: ShieldCheck,
    accent: "3",
  },
  {
    id: "q4-report",
    title: "Q4 FY25 Board Financial Report",
    type: "Financials",
    pages: 64,
    updated: "1 week ago",
    icon: LineChart,
    accent: "4",
  },
  {
    id: "msa",
    title: "Master Services Agreement — Acme",
    type: "Contract",
    pages: 47,
    updated: "3 weeks ago",
    icon: Scale,
    accent: "5",
  },
  {
    id: "dpa",
    title: "Data Processing Addendum (GDPR)",
    type: "Compliance",
    pages: 22,
    updated: "1 month ago",
    icon: FileText,
    accent: "1",
  },
];

export const SUGGESTED_QUESTIONS = [
  "What was the policy discussed in the latest M&A document?",
  "What is the non-compete duration for executives?",
  "Are there any change-of-control payouts?",
  "How is liability capped in the Acme MSA?",
];

/* A small, deterministic "RAG" engine for the demo. Keyword-matched answers,
   each grounded in direct quotations from the mock corpus. */
const KNOWLEDGE: { match: string[]; answer: PrismAnswer }[] = [
  {
    match: ["policy", "m&a", "ma", "merger", "helios", "latest"],
    answer: {
      summary:
        "The latest M&A document (Project Helios) centers on a Retention & Integration Policy. It commits the acquirer to preserve the target's existing equity-vesting schedules and establishes a $40M retention pool for key employees through the integration period.",
      citations: [
        {
          docId: "ma-2026",
          page: 112,
          quote:
            "The Acquirer shall maintain, for a period of not less than twelve (12) months following the Closing, the Target's existing equity vesting schedules without acceleration or modification.",
        },
        {
          docId: "ma-2026",
          page: 118,
          quote:
            "A Retention Pool of forty million dollars ($40,000,000) shall be established and allocated to Key Employees identified in Schedule 6.4 over the Integration Period.",
        },
      ],
    },
  },
  {
    match: ["non-compete", "noncompete", "compete", "duration", "executive", "restrict"],
    answer: {
      summary:
        "Executive non-compete obligations run for 12 months post-termination and are limited to direct competitors within the company's core markets. The restriction is explicitly void where unenforceable by local law.",
      citations: [
        {
          docId: "noncompete",
          page: 14,
          quote:
            "For twelve (12) months following the Termination Date, the Executive shall not provide services to any Direct Competitor operating within the Restricted Territory.",
        },
        {
          docId: "noncompete",
          page: 15,
          quote:
            "Nothing herein shall be construed to impose a restriction broader than permitted by the governing law of the Executive's primary work location.",
        },
      ],
    },
  },
  {
    match: ["change of control", "change-of-control", "payout", "golden", "severance", "trigger"],
    answer: {
      summary:
        "Yes. A double-trigger change-of-control provision pays out accelerated equity plus 1.5× base salary, but only if the executive is terminated without cause within 12 months of the transaction.",
      citations: [
        {
          docId: "ma-2026",
          page: 141,
          quote:
            "Upon a Change of Control followed by a Qualifying Termination within twelve months, all unvested equity awards shall immediately vest in full.",
        },
        {
          docId: "noncompete",
          page: 22,
          quote:
            "The Executive shall be entitled to a lump-sum payment equal to one-and-one-half (1.5x) times Base Salary upon a double-trigger event.",
        },
      ],
    },
  },
  {
    match: ["liability", "cap", "limitation", "msa", "acme", "damages"],
    answer: {
      summary:
        "In the Acme MSA, aggregate liability is capped at the fees paid in the trailing 12 months. The cap explicitly does not apply to breaches of confidentiality or indemnification obligations.",
      citations: [
        {
          docId: "msa",
          page: 29,
          quote:
            "Each party's aggregate liability shall not exceed the total fees paid or payable in the twelve (12) months preceding the event giving rise to the claim.",
        },
        {
          docId: "msa",
          page: 30,
          quote:
            "The foregoing limitation shall not apply to breaches of Section 8 (Confidentiality) or a party's indemnification obligations under Section 11.",
        },
      ],
    },
  },
  {
    match: ["ip", "intellectual property", "assignment", "invention", "ownership"],
    answer: {
      summary:
        "Under the Global IP Assignment Policy, all work-product created in the scope of employment is assigned to the company at the moment of creation, with a carve-out for pre-existing personal IP that is properly disclosed.",
      citations: [
        {
          docId: "ip-policy",
          page: 4,
          quote:
            "All Inventions conceived or reduced to practice in the course of employment are hereby assigned to the Company effective upon creation.",
        },
        {
          docId: "ip-policy",
          page: 9,
          quote:
            "Pre-Existing IP disclosed in Exhibit A shall remain the sole property of the Employee and is expressly excluded from this assignment.",
        },
      ],
    },
  },
  {
    match: ["revenue", "financial", "q4", "growth", "report", "margin", "earnings"],
    answer: {
      summary:
        "Q4 FY25 revenue reached $312M, up 28% year-over-year, with gross margin expanding to 71%. The board report flags deferred revenue as the leading indicator of FY26 momentum.",
      citations: [
        {
          docId: "q4-report",
          page: 6,
          quote:
            "Total revenue for Q4 FY25 was $312.4M, representing a 28% increase over the prior-year period.",
        },
        {
          docId: "q4-report",
          page: 11,
          quote:
            "Gross margin expanded 240 basis points to 71%, driven primarily by infrastructure efficiency gains.",
        },
      ],
    },
  },
  {
    match: ["gdpr", "data", "privacy", "processing", "dpa", "subprocessor", "compliance"],
    answer: {
      summary:
        "The Data Processing Addendum binds the processor to GDPR Article 28 obligations, requires 48-hour breach notification, and lets the controller object to any new sub-processor within 14 days.",
      citations: [
        {
          docId: "dpa",
          page: 7,
          quote:
            "The Processor shall notify the Controller without undue delay and in any event within forty-eight (48) hours of becoming aware of a Personal Data Breach.",
        },
        {
          docId: "dpa",
          page: 12,
          quote:
            "The Controller may object to the appointment of a new Sub-Processor within fourteen (14) days of notice on reasonable data-protection grounds.",
        },
      ],
    },
  },
];

const FALLBACK: PrismAnswer = {
  summary:
    "I searched across all 6 documents in your library but couldn't find a confident match for that. Try asking about the M&A retention policy, executive non-compete terms, the Acme liability cap, IP assignment, Q4 financials, or GDPR data processing.",
  citations: [],
};

export function answerQuestion(question: string): PrismAnswer {
  const q = question.toLowerCase();
  let best: { score: number; answer: PrismAnswer } | null = null;
  for (const entry of KNOWLEDGE) {
    const score = entry.match.reduce((acc, kw) => (q.includes(kw) ? acc + 1 : acc), 0);
    if (score > 0 && (!best || score > best.score)) {
      best = { score, answer: entry.answer };
    }
  }
  return best ? best.answer : FALLBACK;
}

export function docById(id: string): PrismDoc | undefined {
  return DOCUMENTS.find((d) => d.id === id);
}
