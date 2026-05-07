import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PhotoIcon } from "@heroicons/react/24/outline";
import {
  layoutNextLineRange,
  materializeLineRange,
  prepareWithSegments,
  type LayoutCursor,
} from "@chenglou/pretext";
import {
  INITIAL_REFLOW_JSON,
  parseReflowDoc,
  type ReflowDoc,
  type ReflowImage,
} from "../lib/reflowContent";

const LINE_HEIGHT = 26;
const BODY_FONT =
  '400 17px Inter, ui-sans-serif, "Helvetica Neue", Helvetica, Arial, sans-serif';
const MAX_IMAGES = 3;
const MIN_LINE_WIDTH = 48;

export type ArticleReflowEditorHandle = {
  getImagesForSubmit: () => { url: string; file: File }[];
};

type Props = {
  value: string;
  onChange: (json: string) => void;
  onBlur?: () => void;
  initialImageFiles?: readonly { id: string; file: File }[];
};

function normalizeDoc(raw: string): ReflowDoc {
  const parsed = parseReflowDoc(raw);
  if (parsed) return parsed;
  return parseReflowDoc(INITIAL_REFLOW_JSON)!;
}

function leftGutterForLine(
  lineTop: number,
  lineHeight: number,
  containerWidth: number,
  images: ReflowImage[],
): number {
  const y1 = lineTop;
  const y2 = lineTop + lineHeight;
  let g = 0;
  for (const im of images) {
    const iy1 = im.y;
    const iy2 = im.y + im.height;
    if (y2 <= iy1 || y1 >= iy2) continue;
    const right = im.x + im.width;
    if (right <= 0) continue;
    g = Math.max(g, Math.min(right, containerWidth));
  }
  return g;
}

function layoutReflowLines(
  bodyText: string,
  containerWidth: number,
  images: ReflowImage[],
): { lines: { text: string; y: number; gutter: number }[]; height: number } {
  if (containerWidth < MIN_LINE_WIDTH) {
    return { lines: [], height: LINE_HEIGHT };
  }
  const text = bodyText.length ? bodyText : " ";
  const prepared = prepareWithSegments(text, BODY_FONT, {
    whiteSpace: "pre-wrap",
  });
  const lines: { text: string; y: number; gutter: number }[] = [];
  let cursor: LayoutCursor = { segmentIndex: 0, graphemeIndex: 0 };
  let y = 0;
  let guard = 0;
  while (guard++ < 8000) {
    const gutter = leftGutterForLine(y, LINE_HEIGHT, containerWidth, images);
    const lw = Math.max(MIN_LINE_WIDTH, containerWidth - gutter);
    const range = layoutNextLineRange(prepared, cursor, lw);
    if (!range) break;
    const line = materializeLineRange(prepared, range);
    lines.push({ text: line.text, y, gutter });
    const next = range.end;
    if (
      next.segmentIndex === cursor.segmentIndex &&
      next.graphemeIndex === cursor.graphemeIndex
    ) {
      break;
    }
    cursor = next;
    y += LINE_HEIGHT;
  }
  const height = Math.max(y + LINE_HEIGHT, 120);
  return { lines, height };
}

export const ArticleReflowEditor = forwardRef<ArticleReflowEditorHandle, Props>(
  function ArticleReflowEditor(
    { value, onChange, onBlur, initialImageFiles },
    ref,
  ) {
    const fileByImageId = useRef<Map<string, File>>(new Map());
    const [doc, setDoc] = useState<ReflowDoc>(() => normalizeDoc(value));
    const skipSync = useRef(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(560);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [drag, setDrag] = useState<{
      id: string;
      ox: number;
      oy: number;
    } | null>(null);

    const initialFilesKey = initialImageFiles
      ? initialImageFiles.map((e) => e.id).join("|")
      : "";

    useLayoutEffect(() => {
      if (!initialImageFiles?.length) return;
      for (const { id, file } of initialImageFiles) {
        fileByImageId.current.set(id, file);
      }
    }, [initialFilesKey, initialImageFiles]);

    useEffect(() => {
      if (skipSync.current) {
        skipSync.current = false;
        return;
      }
      setDoc(normalizeDoc(value));
    }, [value]);

    const persist = (next: ReflowDoc) => {
      setDoc(next);
      skipSync.current = true;
      onChange(JSON.stringify(next));
    };

    const docRef = useRef(doc);
    docRef.current = doc;

    const persistRef = useRef(persist);
    persistRef.current = persist;

    useImperativeHandle(
      ref,
      () => ({
        getImagesForSubmit: () => {
          const out: { url: string; file: File }[] = [];
          const d = docRef.current;
          for (const im of d.images) {
            const file = fileByImageId.current.get(im.id);
            if (file) out.push({ url: im.url, file });
          }
          return out;
        },
      }),
      [],
    );

    useLayoutEffect(() => {
      const el = containerRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => {
        const w = el.getBoundingClientRect().width;
        if (w > 0) setWidth(w);
      });
      ro.observe(el);
      const w0 = el.getBoundingClientRect().width;
      if (w0 > 0) setWidth(w0);
      return () => ro.disconnect();
    }, []);

    const { lines, height } = useMemo(
      () => layoutReflowLines(doc.bodyText, width, doc.images),
      [doc.bodyText, doc.images, width],
    );

    const canvasHeight = height + 200;

    const setBodyText = (bodyText: string) => {
      persist({ ...doc, bodyText });
    };

    const onImagePointerDown = (e: React.PointerEvent, im: ReflowImage) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = containerRef.current!.getBoundingClientRect();
      setDrag({
        id: im.id,
        ox: e.clientX - rect.left - im.x,
        oy: e.clientY - rect.top - im.y,
      });
    };

    useEffect(() => {
      if (!drag) return;
      const move = (e: PointerEvent) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left - drag.ox;
        const y = e.clientY - rect.top - drag.oy;
        const prev = docRef.current;
        const nextImages = prev.images.map((im) => {
          if (im.id !== drag.id) return im;
          const maxX = Math.max(0, width - im.width);
          const maxY = Math.max(0, canvasHeight - im.height);
          return {
            ...im,
            x: Math.min(Math.max(0, x), maxX),
            y: Math.min(Math.max(0, y), maxY),
          };
        });
        const next = { ...prev, images: nextImages };
        persistRef.current(next);
      };
      const up = () => {
        setDrag(null);
        onBlur?.();
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
      return () => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
    }, [drag, width, canvasHeight, onBlur]);

    const addImages = (files: FileList | null) => {
      if (!files?.length) return;
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) return;
      const room = MAX_IMAGES - doc.images.length;
      if (room <= 0) {
        alert(`Up to ${MAX_IMAGES} images.`);
        return;
      }
      const take = list.slice(0, room);
      const nextImgs = [...doc.images];
      for (let i = 0; i < take.length; i++) {
        const file = take[i]!;
        const id = crypto.randomUUID();
        fileByImageId.current.set(id, file);
        const idx = nextImgs.length;
        nextImgs.push({
          id,
          url: URL.createObjectURL(file),
          x: 20 + (idx % 2) * 140,
          y: 24 + Math.floor(idx / 2) * 120,
          width: 120,
          height: 100,
        });
      }
      persist({ ...doc, images: nextImgs });
    };

    const removeImage = (id: string) => {
      const im = doc.images.find((x) => x.id === id);
      if (im) URL.revokeObjectURL(im.url);
      fileByImageId.current.delete(id);
      persist({ ...doc, images: doc.images.filter((x) => x.id !== id) });
    };

    return (
      <div className="w-full rounded-lg border border-gray-200 bg-white p-3 text-left shadow-sm">

        <label className="mb-1 block text-sm font-medium text-gray-700">
          Body text
        </label>
        <textarea
          value={doc.bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          onBlur={onBlur}
          rows={5}
          className="mb-3 w-full rounded-md border border-gray-300 p-2 font-sans text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500 max-h-80 overflow-y-auto"
          placeholder="Write your article. Newlines are preserved (pre-wrap)."
        />

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded border border-violet-200 bg-violet-50 px-2 py-1 text-sm text-violet-900"
            onClick={() => fileInputRef.current?.click()}
          >
            <PhotoIcon className="h-5 w-5" />
            Add images ({doc.images.length}/{MAX_IMAGES})
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              addImages(e.target.files);
              e.target.value = "";
            }}
          />
        </div>

        {/* <p className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">
          Live reflow preview — drag images
        </p>
        <div
          ref={containerRef}
          className="relative w-full rounded-md border border-gray-200 bg-[#fafafa] h-64 overflow-y-auto"
          // style={{ minHeight: canvasHeight }}
        >
          <div
            className="pointer-events-none absolute inset-0 z-0 text-left"
            style={{
              font: BODY_FONT,
              lineHeight: `${LINE_HEIGHT}px`,
              fontFamily:
                'Inter, ui-sans-serif, "Helvetica Neue", Helvetica, Arial, sans-serif',
            }}
          >
            {lines.map((ln, i) => (
              <div
                key={i}
                className="absolute whitespace-pre"
                style={{
                  left: ln.gutter,
                  top: ln.y,
                  maxWidth: width - ln.gutter,
                }}
              >
                {ln.text}
              </div>
            ))}
          </div>

          {doc.images.map((im) => (
            <div
              key={im.id}
              className="absolute z-10 cursor-grab select-none overflow-hidden rounded-md border-2 border-violet-400 bg-white shadow-md active:cursor-grabbing"
              style={{
                left: im.x,
                top: im.y,
                width: im.width,
                height: im.height,
              }}
              onPointerDown={(e) => onImagePointerDown(e, im)}
            >
              <img
                src={im.url}
                alt=""
                className="h-full w-full object-cover"
                draggable={false}
              />
              <button
                type="button"
                className="pointer-events-auto absolute right-0 top-0 bg-white/90 px-1 text-[10px] text-red-600"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(im.id);
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {!doc.bodyText.trim() && (
          <p className="mt-2 text-sm text-amber-700">
            Add some body text before publishing.
          </p>
        )} */}
      </div>
    );
  },
);
