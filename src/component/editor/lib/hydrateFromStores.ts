import type { EditorFormProps, ImageProps } from "../interface/editor_form";
import {
  parseArticleBlocks,
  rebindImageBlocksWithStoreFiles,
  blocksFromPlainTextContent,
  type ArticleBlock,
} from "./articleBlocks";
import {
  parseReflowDoc,
  rebindReflowDocImages,
  reflowDocFromArticleBlocks,
  reflowDocFromBlockJsonOnly,
} from "./reflowContent";

export type EditorHydration = {
  sourceUuid: number;
  defaults: {
    title: string;
    subtitle: string;
    content: string;
    author: string;
  };
  initialImageFileEntries: { id: string; file: File }[];
};

function blocksFromStoredContent(raw: string): ArticleBlock[] {
  const parsed = parseArticleBlocks(raw);
  if (parsed) return parsed;
  return blocksFromPlainTextContent(raw);
}

/**
 * Build form defaults + image file bindings from the last entry in `formDetail`,
 * re-attaching `File` objects from `imageDetail` for the same article `uuid`.
 * Prefers v2 reflow JSON when stored; otherwise migrates legacy block JSON.
 */
export function getLatestArticleHydration(
  formDetail: EditorFormProps[],
  imageDetail: ImageProps[],
): EditorHydration | null {
  const last = formDetail[formDetail.length - 1];
  if (!last) return null;

  const imgs = imageDetail.filter((i) => i.uuid === last.uuid);

  const v2 = parseReflowDoc(last.content);
  if (v2) {
    const { doc, fileEntries } = rebindReflowDocImages(v2, imgs);
    return {
      sourceUuid: last.uuid,
      defaults: {
        title: last.title,
        subtitle: last.subtitle ?? "",
        content: JSON.stringify(doc),
        author: last.author ?? "",
      },
      initialImageFileEntries: fileEntries,
    };
  }

  const blocks = blocksFromStoredContent(last.content);
  const { blocks: rebound, fileEntries } = rebindImageBlocksWithStoreFiles(
    blocks,
    imgs,
  );
  const hasImages = rebound.some((b) => b.type === "image");
  const doc = hasImages
    ? reflowDocFromArticleBlocks(rebound)
    : reflowDocFromBlockJsonOnly(rebound);

  return {
    sourceUuid: last.uuid,
    defaults: {
      title: last.title,
      subtitle: last.subtitle ?? "",
      content: JSON.stringify(doc),
      author: last.author ?? "",
    },
    initialImageFileEntries: fileEntries,
  };
}
