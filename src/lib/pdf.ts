import { pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/TextLayer.css";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";

// Vite-friendly worker resolution (pdf.js v4 ships an .mjs worker).
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

/** Page number from a citation location like "p. 3" or "p. 3 (part 2)". */
export function pageFromLocation(location: string): number {
  const m = /p\.\s*(\d+)/i.exec(location || "");
  return m ? parseInt(m[1], 10) : 1;
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}.%]+/gu, "");
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * react-pdf `customTextRenderer` that highlights the words of `quote` on the
 * page. Best-effort token matching: the cited quote is extracted by pdfplumber
 * with odd spacing (esp. tables), so exact phrase matching against pdf.js's
 * text layer is unreliable — we instead highlight each distinctive word
 * (≥2 chars) from the quote, which marks the relevant cells/region clearly.
 */
export function makeHighlighter(quote: string) {
  const tokens = new Set(
    (quote || "")
      .split(/\s+/)
      .map(normalize)
      .filter((t) => t.length >= 2),
  );
  return ({ str }: { str: string }) => {
    if (!tokens.size || !str) return escapeHtml(str ?? "");
    return str
      .split(/(\s+)/)
      .map((w) => {
        const n = normalize(w);
        return n.length >= 2 && tokens.has(n)
          ? `<mark class="pdf-hl">${escapeHtml(w)}</mark>`
          : escapeHtml(w);
      })
      .join("");
  };
}
