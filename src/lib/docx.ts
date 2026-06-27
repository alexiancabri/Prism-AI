function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

/**
 * Highlight the block element of a rendered .docx whose text best matches the
 * cited quote, and scroll it into view. Paragraph-level (not word-level) since
 * the quote is an approximate substring of the document text — we pick the
 * block with the highest token overlap and tint it.
 */
export function highlightDocParagraph(
  container: HTMLElement,
  quote: string,
): void {
  const qTokens = new Set(
    norm(quote)
      .split(" ")
      .filter((w) => w.length >= 3),
  );
  if (!qTokens.size) return;

  const blocks = container.querySelectorAll<HTMLElement>(
    "p, li, h1, h2, h3, h4, h5, h6, td, blockquote",
  );
  let best: HTMLElement | null = null;
  let bestScore = 0;
  blocks.forEach((el) => {
    el.classList.remove("doc-hl");
    const tTokens = new Set(norm(el.textContent || "").split(" "));
    let overlap = 0;
    qTokens.forEach((w) => {
      if (tTokens.has(w)) overlap++;
    });
    const score = overlap / qTokens.size;
    if (score > bestScore) {
      bestScore = score;
      best = el;
    }
  });

  if (best && bestScore >= 0.4) {
    best.classList.add("doc-hl");
    best.scrollIntoView({ block: "center", behavior: "smooth" });
  }
}
