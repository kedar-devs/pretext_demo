import type { EditorFormProps, ImageProps } from "../interface/editor_form";
import {
  parseArticleBlocks,
  rebindImageBlocksWithStoreFiles,
  blocksFromPlainTextContent,
  type ArticleBlock,
} from "./articleBlocks";

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
 * re-attaching `File` objects from `imageDetail` for the same article `uuid`
 * (matched in document order to `image` blocks in the stored JSON).
 */
export function getLatestArticleHydration(
  formDetail: EditorFormProps[],
  imageDetail: ImageProps[],
): EditorHydration | null {
  const last = formDetail[formDetail.length - 1];
  if (!last) return null;

  const blocks = blocksFromStoredContent(last.content);
  const imgs = imageDetail.filter((i) => i.uuid === last.uuid);
  const { blocks: rebound, fileEntries } = rebindImageBlocksWithStoreFiles(
    blocks,
    imgs,
  );

  return {
    sourceUuid: last.uuid,
    defaults: {
      title: last.title,
      subtitle: last.subtitle ?? "",
      content: JSON.stringify(rebound),
      author: last.author ?? "",
    },
    initialImageFileEntries: fileEntries,
  };
}
