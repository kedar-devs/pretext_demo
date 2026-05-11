import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  layoutNextLineRange,
  materializeLineRange,
  prepareWithSegments,
  type LayoutCursor,
} from "@chenglou/pretext";

import {
  INITIAL_REFLOW_JSON,
  parseReflowDoc,
  REFLOW_VERSION,
  type ReflowDoc,
  type ReflowImage,
} from "../lib/reflowContent";
import { useCurrentFormStore, useFormStore } from "../store/form.store";
import { useImageStore } from "../store/image.store";
import type { ImageProps } from "../interface/editor_form";

const LINE_HEIGHT = 26;
const MIN_LINE_WIDTH = 64;


const BODY_FONT =
  '400 17px Inter, ui-sans-serif, "Helvetica Neue", Helvetica, Arial, sans-serif';

export type TextImageWrapMode = "single-side" | "both-sides";

function normalizeDoc(raw: string, imageDetail: ImageProps[]): ReflowDoc {
  if(!raw) return parseReflowDoc(INITIAL_REFLOW_JSON)!;
  const data=JSON.stringify({
    version: REFLOW_VERSION,
    bodyText: raw,
    images: imageDetail.map((im) => ({
      id: im.file.name,
      url: im.url,
      x: 0,
      y: 0,
      width: 100,
      height: 100,
    })),
  } satisfies ReflowDoc);
  
  
  const parsed = parseReflowDoc(data);
  if (parsed) return parsed;
  return parseReflowDoc(INITIAL_REFLOW_JSON)!;
}

/** Half-open horizontal span [l, r) in container coordinates. */
type FreeSpan = { l: number; r: number };

function horizontalOverlapWithLine(
  im: ReflowImage,
  lineTop: number,
  lineHeight: number,
): boolean {
  const y1 = lineTop;
  const y2 = lineTop + lineHeight;
  const iy1 = im.y;
  const iy2 = im.y + im.height;
  return !(y2 <= iy1 || y1 >= iy2);
}

function subtractBlockedX(
  spans: FreeSpan[],
  b1: number,
  b2: number,
): FreeSpan[] {
  if (b2 <= b1) return spans;

  const out: FreeSpan[] = [];

  for (const s of spans) {
    if (s.r <= b1 || s.l >= b2) {
      out.push(s);
      continue;
    }
    if (s.l < b1) {
      const piece: FreeSpan = { l: s.l, r: Math.min(s.r, b1) };
      if (piece.r - piece.l >= MIN_LINE_WIDTH) out.push(piece);
    }
    if (s.r > b2) {
      const piece: FreeSpan = { l: Math.max(s.l, b2), r: s.r };
      if (piece.r - piece.l >= MIN_LINE_WIDTH) out.push(piece);
    }
  }

  return out;
}

/**
 * Free horizontal bands for this text row (same baseline), left to right.
 * When an image overlaps this row vertically, the line is split: text flows
 * in the left margin, then continues after the image on the right.
 */
function getFreeRegionsForLine(
  lineTop: number,
  lineHeight: number,
  containerWidth: number,
  images: ReflowImage[],
): { left: number; width: number }[] {
  let spans: FreeSpan[] = [{ l: 0, r: containerWidth }];

  for (const im of images) {
    if (!horizontalOverlapWithLine(im, lineTop, lineHeight)) continue;

    const b1 = Math.max(0, im.x);
    const b2 = Math.min(containerWidth, im.x + im.width);
    spans = subtractBlockedX(spans, b1, b2);
  }

  if (spans.length === 0) {
    return [{ left: 0, width: Math.max(MIN_LINE_WIDTH, containerWidth) }];
  }

  spans.sort((a, b) => a.l - b.l);

  return spans.map((s) => ({
    left: s.l,
    width: Math.max(MIN_LINE_WIDTH, s.r - s.l),
  }));
}

/** Text stays on one side of overlapping images (by image horizontal center). */
function getSingleSideRegionsForLine(
  lineTop: number,
  lineHeight: number,
  containerWidth: number,
  images: ReflowImage[],
): { left: number; width: number }[] {
  let left = 0;
  let right = containerWidth;

  for (const im of images) {
    if (!horizontalOverlapWithLine(im, lineTop, lineHeight)) continue;

    const imageCenter = im.x + im.width / 2;

    if (imageCenter < containerWidth / 2) {
      left = Math.max(left, im.x + im.width);
    } else {
      right = Math.min(right, im.x);
    }
  }

  const width = Math.max(MIN_LINE_WIDTH, right - left);
  return [{ left, width }];
}

function getRegionsForLine(
  mode: TextImageWrapMode,
  lineTop: number,
  lineHeight: number,
  containerWidth: number,
  images: ReflowImage[],
): { left: number; width: number }[] {
  if (mode === "single-side") {
    return getSingleSideRegionsForLine(
      lineTop,
      lineHeight,
      containerWidth,
      images,
    );
  }
  return getFreeRegionsForLine(
    lineTop,
    lineHeight,
    containerWidth,
    images,
  );
}

function intersects(a: ReflowImage, b: ReflowImage) {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function resolveCollisions(
  moving: ReflowImage,
  all: ReflowImage[],
  width: number,
  height: number,
) {
  let next = { ...moving };

  for (const other of all) {
    if (other.id === next.id) continue;

    if (!intersects(next, other)) continue;

    const pushRight = other.x + other.width + 12;

    if (pushRight + next.width < width) {
      next.x = pushRight;
    } else {
      next.x = 12;
      next.y = other.y + other.height + 12;
    }
  }

  next.x = Math.max(0, Math.min(next.x, width - next.width));
  next.y = Math.max(0, Math.min(next.y, height - next.height));

  return next;
}

function layoutReflowLines(
  bodyText: string,
  containerWidth: number,
  images: ReflowImage[],
  wrapMode: TextImageWrapMode,
) {
  if (containerWidth < MIN_LINE_WIDTH) {
    return {
      lines: [],
      height: LINE_HEIGHT,
    };
  }

  const text = bodyText || " ";

  const prepared = prepareWithSegments(text, BODY_FONT, {
    whiteSpace: "pre-wrap",
  });

  const lines: {
    text: string;
    y: number;
    left: number;
    width: number;
  }[] = [];

  let cursor: LayoutCursor = {
    segmentIndex: 0,
    graphemeIndex: 0,
  };

  let y = 0;
  let guard = 0;

  while (guard++ < 8000) {
    const regions = getRegionsForLine(
      wrapMode,
      y,
      LINE_HEIGHT,
      containerWidth,
      images,
    );

    const rowStart = cursor;
    let stop = false;

    for (const region of regions) {
      const lineWidth = Math.max(MIN_LINE_WIDTH, region.width);

      const range = layoutNextLineRange(prepared, cursor, lineWidth);

      if (!range) {
        stop = true;
        break;
      }

      const line = materializeLineRange(prepared, range);

      lines.push({
        text: line.text,
        y,
        left: region.left,
        width: lineWidth,
      });

      const next = range.end;

      if (
        next.segmentIndex === cursor.segmentIndex &&
        next.graphemeIndex === cursor.graphemeIndex
      ) {
        stop = true;
        break;
      }

      cursor = next;
    }

    if (stop) break;

    if (
      cursor.segmentIndex === rowStart.segmentIndex &&
      cursor.graphemeIndex === rowStart.graphemeIndex
    ) {
      break;
    }

    y += LINE_HEIGHT;
  }

  return {
    lines,
    height: Math.max(y + LINE_HEIGHT, 400),
  };
}

type ArticleReflowEditorProps = {
  bgColor: string;
  textColor: string;
  /** Controlled wrap mode. Use with `onTextImageWrapChange`. */
  textImageWrap?: TextImageWrapMode;
  onTextImageWrapChange?: (mode: TextImageWrapMode) => void;
  /** Initial mode when `textImageWrap` is not controlled (default `both-sides`). */
  defaultTextImageWrap?: TextImageWrapMode;
};

export function ArticleReflowEditor({
  bgColor,
  textColor,
  textImageWrap: controlledTextImageWrap,
  onTextImageWrapChange,
  defaultTextImageWrap = "both-sides",
}: ArticleReflowEditorProps) {
  const { getFormDetail } = useFormStore();
  const { getImageDetail } = useImageStore();
  const { uuid } = useCurrentFormStore();
  if(!uuid) return null;
  const formDetail = getFormDetail(uuid);
  const imageDetail = getImageDetail(uuid);

  const [doc, setDoc] = useState<ReflowDoc>(() => normalizeDoc(formDetail.content,imageDetail));

  const containerRef = useRef<HTMLDivElement>(null);

  const [width, setWidth] = useState(600);

  const [drag, setDrag] = useState<{
    id: string;
    ox: number;
    oy: number;
  } | null>(null);

  const [resize, setResize] = useState<{
    id: string;
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const [uncontrolledWrap, setUncontrolledWrap] = useState<TextImageWrapMode>(
    defaultTextImageWrap,
  );
  const isWrapControlled = controlledTextImageWrap !== undefined;
  const textImageWrap = isWrapControlled
    ? controlledTextImageWrap!
    : uncontrolledWrap;

  const setTextImageWrap = (mode: TextImageWrapMode) => {
    onTextImageWrapChange?.(mode);
    if (!isWrapControlled) setUncontrolledWrap(mode);
  };

  // useEffect(() => {
  //   setDoc(normalizeDoc(formDetail.content,imageDetail));
  // }, [formDetail.content,imageDetail]);

  const persist = (next: ReflowDoc) => {
    setDoc(next);
  };

  useLayoutEffect(() => {
    const el = containerRef.current;

    if (!el) return;

    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setWidth(w);
    });

    ro.observe(el);

    return () => ro.disconnect();
  }, []);

  const { lines, height } = useMemo(
    () =>
      layoutReflowLines(doc.bodyText, width, doc.images, textImageWrap),
    [doc.bodyText, width, doc.images, textImageWrap],
  );

  const canvasHeight = height + 300;

  const onPointerDown = (
    e: React.PointerEvent,
    im: ReflowImage,
  ) => {
    e.stopPropagation();

    const rect = containerRef.current!.getBoundingClientRect();

    setDrag({
      id: im.id,
      ox: e.clientX - rect.left - im.x,
      oy: e.clientY - rect.top - im.y,
    });
  };

  const onResizePointerDown = (
    e: React.PointerEvent,
    im: ReflowImage,
  ) => {
    e.stopPropagation();

    setResize({
      id: im.id,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: im.width,
      startHeight: im.height,
    });
  };

  useEffect(() => {
    if (!drag && !resize) return;

    const move = (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();

      if (!rect) return;

      const prev = doc;

      let nextImages = prev.images;

      if (drag) {
        nextImages = prev.images.map((im) => {
          if (im.id !== drag.id) return im;

          let moved = {
            ...im,
            x: e.clientX - rect.left - drag.ox,
            y: e.clientY - rect.top - drag.oy,
          };

          moved = resolveCollisions(
            moved,
            prev.images,
            width,
            canvasHeight,
          );

          return moved;
        });
      }

      if (resize) {
        nextImages = prev.images.map((im) => {
          if (im.id !== resize.id) return im;

          const dx = e.clientX - resize.startX;
          const dy = e.clientY - resize.startY;

          let resized = {
            ...im,
            width: Math.max(80, resize.startWidth + dx),
            height: Math.max(80, resize.startHeight + dy),
          };

          resized = resolveCollisions(
            resized,
            prev.images,
            width,
            canvasHeight,
          );

          return resized;
        });
      }

      persist({
        ...prev,
        images: nextImages,
      });
    };

    const up = () => {
      setDrag(null);
      setResize(null);
 
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, resize, doc, width, canvasHeight]);

  return (
    <div className="h-full w-full rounded-lg p-2 shadow-sm sm:p-3 md:p-4 " style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="flex w-full flex-col items-center justify-center gap-y-1 px-1 sm:gap-y-2 sm:px-2">
        <h1 className="w-full break-words text-center text-2xl font-bold sm:text-3xl md:text-4xl">{formDetail.title}</h1>
        <h2 className="w-full break-words text-center text-lg font-bold sm:text-xl md:text-2xl">{formDetail.subtitle}</h2>
      </div>
      <div
        className="mt-2 flex w-full flex-wrap items-center justify-center gap-2 px-1 text-sm sm:justify-end sm:px-2"
        role="group"
        aria-label="Text wrap around images"
      >
        <span className="opacity-80">Image text wrap</span>
        <div className="inline-flex rounded-md border border-current/20 p-0.5">
          {(
            [
              ["single-side", "Single side"],
              ["both-sides", "Both sides"],
            ] as const
          ).map(([mode, label]) => (
            <button
              key={mode}
              type="button"
              onClick={() => setTextImageWrap(mode)}
              className={`rounded px-2 py-1 text-xs font-medium transition-colors sm:text-sm ${
                textImageWrap === mode
                  ? "bg-violet-600 text-white"
                  : "hover:bg-current/10"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative h-[min(70vh,520px)] overflow-auto rounded-md sm:h-[75%] md:h-[85%]"
        // style={{
        //   height: 600,
        // }}
      >
        
        
        <div
          className="absolute inset-0 z-0 text-left select-text"
          style={{
            font: BODY_FONT,
            lineHeight: `${LINE_HEIGHT}px`,
          }}
        >
          {lines.map((line, i) => (
            <div
              key={i}
              className="absolute whitespace-pre-wrap"
              style={{
                top: line.y,
                left: line.left,
                width: line.width,
              }}
            >
              {line.text}
            </div>
          ))}
        </div>

        {doc.images.map((im) => (
          <div
            key={im.id}
            className="absolute z-10 overflow-hidden rounded-lg border-2 border-violet-500 bg-white shadow-lg w-full h-full"
            style={{
              left: im.x,
              top: im.y,
              width: im.width,
              height: im.height,
            }}
            onPointerDown={(e) => onPointerDown(e, im)}
          >
            <img
              src={im.url}
              alt=""
              className="h-full w-full object-contain"
              draggable={false}
            />

            <div
              className="absolute bottom-0 right-0 h-4 w-4 cursor-se-resize bg-violet-500"
              onPointerDown={(e) =>
                onResizePointerDown(e, im)
              }
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex w-full justify-center sm:mt-auto sm:justify-end">
          <h1 className="max-w-full break-words px-1 text-center text-xs font-bold sm:text-right sm:text-sm"> - {formDetail.author}</h1>
        </div>
    </div>
  );
}


