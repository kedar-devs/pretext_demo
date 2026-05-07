import { articleBlocksPlainText, type ArticleBlock } from "./articleBlocks";

export const REFLOW_VERSION = 2 as const;

export type ReflowImage = {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
};

export type ReflowDoc = {
  version: typeof REFLOW_VERSION;
  bodyText: string;
  images: ReflowImage[];
};

export const INITIAL_REFLOW_JSON = JSON.stringify({
  version: REFLOW_VERSION,
  bodyText: "",
  images: [],
} satisfies ReflowDoc);

export function parseReflowDoc(raw: string): ReflowDoc | null {
  try {
    const o = JSON.parse(raw) as unknown;
    if (!o || typeof o !== "object") return null;
    const v = o as Partial<ReflowDoc>;
    if (v.version !== REFLOW_VERSION) return null;
    if (typeof v.bodyText !== "string") return null;
    if (!Array.isArray(v.images)) return null;
    return v as ReflowDoc;
  } catch (e) {
    console.log("this is error", e);
    return null;
  }
}

export function reflowDocHasText(doc: ReflowDoc): boolean {
  return doc.bodyText.trim().length > 0;
}

/** Build a reflow document from ordered article blocks (paragraphs + images). */
export function reflowDocFromArticleBlocks(blocks: ArticleBlock[]): ReflowDoc {
  const textParts: string[] = [];
  const images: ReflowImage[] = [];
  let imgIdx = 0;
  for (const b of blocks) {
    if (b.type === "paragraph") {
      textParts.push(b.spans.map((s) => s.text).join(""));
    } else {
      images.push({
        id: b.id,
        url: b.url,
        x: 16 + (imgIdx % 2) * 132,
        y: 20 + Math.floor(imgIdx / 2) * 118,
        width: 120,
        height: 108,
      });
      imgIdx++;
    }
  }
  return {
    version: REFLOW_VERSION,
    bodyText: textParts.join("\n\n"),
    images,
  };
}

/** Legacy block JSON → reflow doc (images dropped; text only). */
export function reflowDocFromBlockJsonOnly(blocks: ArticleBlock[]): ReflowDoc {
  return {
    version: REFLOW_VERSION,
    bodyText: articleBlocksPlainText(blocks),
    images: [],
  };
}

import type { ImageProps } from "../interface/editor_form";

/** Re-create blob URLs and ids from stored files (order matches `doc.images`). */
export function rebindReflowDocImages(
  doc: ReflowDoc,
  storeImages: ImageProps[],
): { doc: ReflowDoc; fileEntries: { id: string; file: File }[] } {
  const fileEntries: { id: string; file: File }[] = [];
  const images = doc.images.map((im, i) => {
    const src = storeImages[i];
    if (!src) return im;
    try {
      URL.revokeObjectURL(im.url);
    } catch {
      /* ignore */
    }
    const id = crypto.randomUUID();
    const url = URL.createObjectURL(src.file);
    fileEntries.push({ id, file: src.file });
    return { ...im, id, url };
  });
  return { doc: { ...doc, images }, fileEntries };
}
