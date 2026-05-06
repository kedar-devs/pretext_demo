import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  BoldIcon,
  PhotoIcon,
  PlusIcon,
  UnderlineIcon,
} from "@heroicons/react/24/outline";
import {
  articleBlocksHaveText,
  domToSpans,
  newParagraphBlock,
  parseArticleBlocks,
  spansToHtml,
  type ArticleBlock,
  type ParagraphBlock,
} from "../lib/articleBlocks";
import { PretextParagraphView } from "./PretextParagraphView";

const HIGHLIGHT_COLOR = "#fef08a";
const MAX_IMAGES = 3;

export type ArticleBodyEditorHandle = {
  getImagesForSubmit: () => { url: string; file: File }[];
};

type Props = {
  value: string;
  onChange: (json: string) => void;
  onBlur?: () => void;
  initialImageFiles?: readonly { id: string; file: File }[];
};

function normalizeBlocks(parsed: ArticleBlock[] | null): ArticleBlock[] {
  if (!parsed || parsed.length === 0) {
    return [newParagraphBlock()];
  }
  return parsed.map((b) => {
    if (b.type === "paragraph") {
      return {
        ...b,
        spans: b.spans?.length ? b.spans : [{ text: "", marks: [] }],
      };
    }
    return { type: "image", id: b.id, url: b.url };
  });
}

export const ArticleBodyEditor = forwardRef<ArticleBodyEditorHandle, Props>(
  function ArticleBodyEditor(
    { value, onChange, onBlur, initialImageFiles },
    ref,
  ) {
    const fileByImageId = useRef<Map<string, File>>(new Map());
    const [blocks, setBlocks] = useState<ArticleBlock[]>(() =>
      normalizeBlocks(parseArticleBlocks(value)),
    );
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editVersion, setEditVersion] = useState(0);
    const editRef = useRef<HTMLDivElement>(null);
    const savedRangeRef = useRef<Range | null>(null);
    const skipExternalSync = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dragBlockId = useRef<string | null>(null);

    const initialFilesKey = initialImageFiles
      ? initialImageFiles.map((e) => e.id).join("|")
      : "";

    useLayoutEffect(() => {
      if (!initialImageFiles?.length) return;
      for (const { id, file } of initialImageFiles) {
        fileByImageId.current.set(id, file);
      }
    }, [initialFilesKey, initialImageFiles]);

    useImperativeHandle(
      ref,
      () => ({
        getImagesForSubmit: () => {
          const out: { url: string; file: File }[] = [];
          for (const b of blocks) {
            if (b.type !== "image") continue;
            const file = fileByImageId.current.get(b.id);
            if (file) {
              out.push({ url: b.url, file });
            }
          }
          return out;
        },
      }),
      [blocks],
    );

    useEffect(() => {
      if (skipExternalSync.current) {
        skipExternalSync.current = false;
        return;
      }
      const parsed = parseArticleBlocks(value);
      setBlocks(normalizeBlocks(parsed));
    }, [value]);

    const commitParagraph = useCallback(
      (id: string, el: HTMLDivElement | null) => {
        if (!el) return;
        const spans = domToSpans(el);
        setBlocks((prev) => {
          const next = prev.map((b) =>
            b.type === "paragraph" && b.id === id ? { ...b, spans } : b,
          );
          skipExternalSync.current = true;
          onChange(JSON.stringify(next));
          return next;
        });
      },
      [onChange],
    );

    const beginEdit = (id: string) => {
      setEditVersion((v) => v + 1);
      setEditingId(id);
      queueMicrotask(() => {
        const el = editRef.current;
        if (!el) return;
        el.focus();
        const sel = window.getSelection();
        if (!sel) return;
        sel.removeAllRanges();
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        sel.addRange(range);
      });
    };

    const endEdit = () => {
      if (!editingId) return;
      const id = editingId;
      commitParagraph(id, editRef.current);
      setEditingId(null);
    };

    const toolbarMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        savedRangeRef.current = sel.getRangeAt(0).cloneRange();
      }
    };

    const restoreSelection = () => {
      const r = savedRangeRef.current;
      if (!r) return;
      const sel = window.getSelection();
      if (!sel) return;
      sel.removeAllRanges();
      sel.addRange(r);
    };

    const exec = (command: string, valueArg?: string) => {
      const el = editRef.current;
      if (!el) return;
      el.focus();
      restoreSelection();
      document.execCommand(command, false, valueArg);
      savedRangeRef.current = null;
    };

    const imageCount = useMemo(
      () => blocks.filter((b) => b.type === "image").length,
      [blocks],
    );

    const insertImageFiles = (files: FileList | null) => {
      if (!files?.length) return;
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;
      setBlocks((prev) => {
        const currentImages = prev.filter((b) => b.type === "image").length;
        const room = MAX_IMAGES - currentImages;
        if (room <= 0) {
          alert(`You can only embed up to ${MAX_IMAGES} images in the article.`);
          return prev;
        }
        const take = list.slice(0, room);
        if (list.length > room) {
          alert(`Only ${room} more image(s) allowed (max ${MAX_IMAGES} total).`);
        }
        const additions: ArticleBlock[] = [];
        for (const file of take) {
          const id = crypto.randomUUID();
          fileByImageId.current.set(id, file);
          additions.push({
            type: "image",
            id,
            url: URL.createObjectURL(file),
          });
        }
        const idx = prev.findIndex((b) => b.id === editingId);
        const insertAt = idx >= 0 ? idx + 1 : prev.length;
        const next = [...prev];
        next.splice(insertAt, 0, ...additions);
        skipExternalSync.current = true;
        onChange(JSON.stringify(next));
        return next;
      });
    };

    const moveBlockToStart = useCallback(
      (fromId: string) => {
        setBlocks((prev) => {
          const from = prev.findIndex((b) => b.id === fromId);
          if (from <= 0) return prev;
          const item = prev[from];
          const rest = prev.filter((_, i) => i !== from);
          const next = [item, ...rest];
          skipExternalSync.current = true;
          onChange(JSON.stringify(next));
          return next;
        });
      },
      [onChange],
    );

    const removeImage = (id: string) => {
      setBlocks((prev) => {
        const b = prev.find((x) => x.type === "image" && x.id === id);
        if (b && b.type === "image") {
          URL.revokeObjectURL(b.url);
        }
        fileByImageId.current.delete(id);
        const next = prev.filter((x) => x.id !== id);
        skipExternalSync.current = true;
        onChange(JSON.stringify(next));
        return next;
      });
    };

    const moveBlock = (fromId: string, toBeforeId: string | null) => {
      setBlocks((prev) => {
        const from = prev.findIndex((b) => b.id === fromId);
        if (from < 0) return prev;
        const item = prev[from];
        const rest = prev.filter((_, i) => i !== from);
        let insertIndex = rest.length;
        if (toBeforeId) {
          const j = rest.findIndex((b) => b.id === toBeforeId);
          if (j >= 0) insertIndex = j;
        }
        const next = [
          ...rest.slice(0, insertIndex),
          item,
          ...rest.slice(insertIndex),
        ];
        skipExternalSync.current = true;
        onChange(JSON.stringify(next));
        return next;
      });
    };

    const addParagraph = () => {
      setBlocks((prev) => {
        const next = [...prev, newParagraphBlock()];
        skipExternalSync.current = true;
        onChange(JSON.stringify(next));
        return next;
      });
    };

    const editingParagraph = useMemo(
      () =>
        editingId
          ? (blocks.find((b) => b.id === editingId && b.type === "paragraph") as
              | ParagraphBlock
              | undefined)
          : undefined,
      [blocks, editingId],
    );

    const editingHtml = useMemo(() => {
      if (!editingParagraph) return "";
      return spansToHtml(editingParagraph.spans);
    }, [editingParagraph]);

    return (
      <div className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm">
        <div className="mb-3 flex flex-wrap items-center gap-2 border-b border-gray-100 pb-3">
          <span className="mr-2 text-xs font-medium uppercase tracking-wide text-gray-500">
            Format
          </span>
          <button
            type="button"
            className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-40"
            disabled={!editingId}
            onMouseDown={toolbarMouseDown}
            onClick={() => exec("bold")}
            title="Bold"
          >
            <BoldIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-sm hover:bg-gray-100 disabled:opacity-40"
            disabled={!editingId}
            onMouseDown={toolbarMouseDown}
            onClick={() => exec("underline")}
            title="Underline"
          >
            <UnderlineIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="rounded border border-gray-200 bg-amber-50 px-2 py-1 text-sm hover:bg-amber-100 disabled:opacity-40"
            disabled={!editingId}
            onMouseDown={toolbarMouseDown}
            onClick={() => exec("backColor", HIGHLIGHT_COLOR)}
            title="Highlight"
          >
            Hi
          </button>
          <div className="mx-2 h-6 w-px bg-gray-200" />
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-violet-50 px-2 py-1 text-sm text-violet-900 hover:bg-violet-100"
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoIcon className="h-5 w-5" />
            Image ({imageCount}/{MAX_IMAGES})
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              insertImageFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-gray-200 bg-white px-2 py-1 text-sm hover:bg-gray-50"
            onClick={addParagraph}
          >
            <PlusIcon className="h-5 w-5" />
            Paragraph
          </button>
          <p className="w-full text-xs text-gray-500">
            Double-click a paragraph to edit. Drag image cards to reorder them in the
            article. Paragraph layout is computed with{" "}
            <code className="rounded bg-gray-100 px-1">@chenglou/pretext</code>{" "}
            <code className="rounded bg-gray-100 px-1">rich-inline</code>.
          </p>
        </div>

        <div
          className="flex min-h-[200px] flex-col gap-0"
          onDragOver={(e) => e.preventDefault()}
        >
          <div
            className="mb-1 min-h-[10px] rounded border border-transparent hover:border-dashed hover:border-gray-300"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const from = dragBlockId.current;
              if (!from) return;
              moveBlockToStart(from);
            }}
            title="Drop zone: start of article"
          />

          {blocks.map((b, index) => (
            <div key={b.id} className="relative mb-2">
              {b.type === "image" ? (
                <div
                  draggable
                  onDragStart={() => {
                    dragBlockId.current = b.id;
                  }}
                  onDragEnd={() => {
                    dragBlockId.current = null;
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = dragBlockId.current;
                    if (!from || from === b.id) return;
                    moveBlock(from, b.id);
                  }}
                  className="flex items-start gap-2 rounded-lg border border-dashed border-violet-300 bg-violet-50/40 p-2"
                >
                  <span className="cursor-grab select-none text-xs text-gray-400 active:cursor-grabbing">
                    ⋮⋮
                  </span>
                  <img
                    src={b.url}
                    alt=""
                    className="max-h-40 max-w-full rounded object-contain"
                    draggable={false}
                  />
                  <button
                    type="button"
                    className="ml-auto shrink-0 text-sm text-red-600 hover:underline"
                    onClick={() => removeImage(b.id)}
                  >
                    Remove
                  </button>
                </div>
              ) : editingId === b.id ? (
                <div
                  key={`${b.id}-edit-${editVersion}`}
                  ref={editRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[3rem] w-full rounded-md border border-blue-400 bg-white p-2 text-left outline-none"
                  style={{
                    fontSize: 17,
                    lineHeight: "26px",
                    fontFamily:
                      'Inter, ui-sans-serif, "Helvetica Neue", Helvetica, Arial, sans-serif',
                  }}
                  dangerouslySetInnerHTML={{ __html: editingHtml }}
                  onBlur={() => {
                    endEdit();
                    onBlur?.();
                  }}
                />
              ) : (
                <div
                  role="button"
                  tabIndex={0}
                  onDoubleClick={() => beginEdit(b.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      beginEdit(b.id);
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = dragBlockId.current;
                    if (!from) return;
                    moveBlock(from, b.id);
                  }}
                  className="cursor-text rounded-md border border-transparent p-2 hover:border-gray-200"
                >
                  <PretextParagraphView spans={b.spans} />
                </div>
              )}

              {index < blocks.length - 1 && (
                <div
                  className="mt-2 h-3 w-full rounded border border-transparent hover:border-dashed hover:border-gray-300"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const from = dragBlockId.current;
                    if (!from) return;
                    const next = blocks[index + 1];
                    moveBlock(from, next?.id ?? null);
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {!articleBlocksHaveText(blocks) && (
          <p className="mt-2 text-sm text-amber-700">
            Add some text in a paragraph before publishing.
          </p>
        )}
      </div>
    );
  },
);
