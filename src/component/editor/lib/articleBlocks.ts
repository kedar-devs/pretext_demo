import type { RichInlineItem } from "@chenglou/pretext/rich-inline";
import type { ImageProps } from "../interface/editor_form";

export type InlineMark = "bold" | "underline" | "highlight";

export type TextSpan = {
  text: string;
  marks: InlineMark[];
};

export type ParagraphBlock = {
  type: "paragraph";
  id: string;
  spans: TextSpan[];
};

export type ImageBlock = {
  type: "image";
  id: string;
  url: string;
};

export type ArticleBlock = ParagraphBlock | ImageBlock;

export const INITIAL_ARTICLE_JSON = JSON.stringify([
  {
    type: "paragraph" as const,
    id: "initial-paragraph",
    spans: [{ text: "", marks: [] as InlineMark[] }],
  },
]);

const BODY_FONT =
  '17px Inter, ui-sans-serif, "Helvetica Neue", Helvetica, Arial, sans-serif';

export function spanToCanvasFont(marks: InlineMark[]): string {
  const weight = marks.includes("bold") ? "700" : "400";
  return `${weight} ${BODY_FONT}`;
}

export function spansToRichInlineItems(spans: TextSpan[]): RichInlineItem[] {
  return spans.map((span) => ({
    text: span.text,
    font: spanToCanvasFont(span.marks),
  }));
}

export function mergeAdjacentSpans(spans: TextSpan[]): TextSpan[] {
  const out: TextSpan[] = [];
  for (const s of spans) {
    if (!s.text) continue;
    const key = s.marks.slice().sort().join(",");
    const prev = out[out.length - 1];
    const prevKey = prev ? prev.marks.slice().sort().join(",") : "";
    if (prev && key === prevKey) {
      prev.text += s.text;
    } else {
      out.push({ text: s.text, marks: [...s.marks] });
    }
  }
  return out.length ? out : [{ text: "", marks: [] }];
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function spansToHtml(spans: TextSpan[]): string {
  let html = "";
  for (const span of spans) {
    let chunk = escapeHtml(span.text).replaceAll("\n", "<br>");
    if (!chunk) continue;
    if (span.marks.includes("highlight")) {
      chunk = `<span data-mark="highlight" style="background-color:#fef08a">${chunk}</span>`;
    }
    if (span.marks.includes("underline")) {
      chunk = `<u>${chunk}</u>`;
    }
    if (span.marks.includes("bold")) {
      chunk = `<strong>${chunk}</strong>`;
    }
    html += chunk;
  }
  return html || "<br>";
}

function markSetFromElement(el: HTMLElement, inherited: Set<InlineMark>): Set<InlineMark> {
  const next = new Set(inherited);
  const tag = el.tagName.toLowerCase();
  if (tag === "b" || tag === "strong") next.add("bold");
  if (tag === "u") next.add("underline");
  if (tag === "span" && el.dataset.mark === "highlight") next.add("highlight");
  const bg = el.style.backgroundColor;
  if (tag === "span" && bg && bg !== "transparent") next.add("highlight");
  return next;
}

export function domToSpans(root: HTMLElement): TextSpan[] {
  const spans: TextSpan[] = [];

  function walk(node: Node, inherited: Set<InlineMark>): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const t = node.textContent ?? "";
      if (t) spans.push({ text: t, marks: [...inherited] });
      return;
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (tag === "br") {
        spans.push({ text: "\n", marks: [...inherited] });
        return;
      }
      const marks = markSetFromElement(el, inherited);
      for (const c of Array.from(el.childNodes)) walk(c, marks);
    }
  }

  walk(root, new Set());
  return mergeAdjacentSpans(spans);
}

export function parseArticleBlocks(raw: string): ArticleBlock[] | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return null;
    return data as ArticleBlock[];
  } catch {
    return null;
  }
}

export function articleBlocksPlainText(blocks: ArticleBlock[]): string {
  return blocks
    .filter((b): b is ParagraphBlock => b.type === "paragraph")
    .map((b) => b.spans.map((s) => s.text).join(""))
    .join("\n");
}

export function articleBlocksHaveText(blocks: ArticleBlock[]): boolean {
  return articleBlocksPlainText(blocks).trim().length > 0;
}

export function newParagraphBlock(): ParagraphBlock {
  return {
    type: "paragraph",
    id: crypto.randomUUID(),
    spans: [{ text: "", marks: [] }],
  };
}

/** When `content` is not JSON blocks (e.g. legacy plain string), wrap as one paragraph. */
export function blocksFromPlainTextContent(text: string): ArticleBlock[] {
  return [
    {
      type: "paragraph",
      id: crypto.randomUUID(),
      spans: [{ text, marks: [] }],
    },
  ];
}

/**
 * Replace each `image` block with a new id + fresh blob URL, consuming
 * `storeImages` in order (same order as `imageDetail` for that article).
 */
export function rebindImageBlocksWithStoreFiles(
  blocks: ArticleBlock[],
  storeImages: ImageProps[],
): { blocks: ArticleBlock[]; fileEntries: { id: string; file: File }[] } {
  const fileEntries: { id: string; file: File }[] = [];
  let imgIndex = 0;
  const next: ArticleBlock[] = [];

  for (const b of blocks) {
    if (b.type !== "image") {
      next.push(b);
      continue;
    }
    const src = storeImages[imgIndex++];
    if (!src) {
      continue;
    }
    const id = crypto.randomUUID();
    try {
      URL.revokeObjectURL(b.url);
    } catch {
      /* ignore */
    }
    const url = URL.createObjectURL(src.file);
    fileEntries.push({ id, file: src.file });
    next.push({ type: "image", id, url });
  }

  return { blocks: next, fileEntries };
}
