import { z } from "zod";
import { articleBlocksHaveText, parseArticleBlocks } from "../lib/articleBlocks";
import { parseReflowDoc, reflowDocHasText } from "../lib/reflowContent";

export const articleSchema = z.object({
  title: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  content: z
    .string()
    .min(1, "Article body is required"),
    // .refine(
    //   (s) => {
    //     const reflow = parseReflowDoc(s);
    //     if (reflow) return reflowDocHasText(reflow);
    //     const blocks = parseArticleBlocks(s);
    //     return blocks != null && articleBlocksHaveText(blocks);
    //   },
    //   { message: "Write something in the article body" },
    // ),
  author: z.string().min(1).optional(),
});
