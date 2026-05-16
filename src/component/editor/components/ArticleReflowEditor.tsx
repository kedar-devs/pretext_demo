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

/** Easing for reflow layout; disabled while dragging/resizing so the pointer stays tight. */
const REFLOW_LAYOUT_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
const REFLOW_LAYOUT_MS = 380;
/** Ripple delay from distance to the image that moved (ms per px of separation). */
const RIPPLE_MS_PER_PX = 0.48;
const MAX_RIPPLE_STAGGER_MS = 540;
const RIPPLE_CLEAR_MS = 1150;

const BODY_FONT =
  '400 17px Inter, ui-sans-serif, "Helvetica Neue", Helvetica, Arial, sans-serif';

export type TextImageWrapMode = "single-side" | "both-sides";
/**
 * 
 * @param raw 
 * @param imageDetail 
 * @returns 
 * basically takes ur raw data (content part of the form ) and image details and mixes them together to create a reflow doc that will be used as your base for prepare function for pretext
 */

function normalizeDoc(raw: string, imageDetail: ImageProps[]): ReflowDoc {
  if(!raw) return parseReflowDoc(INITIAL_REFLOW_JSON)!;
  const GAP=12;
  const data=JSON.stringify({
    version: REFLOW_VERSION,
    bodyText: raw,
    images: imageDetail.map((im,index) => ({
      id: im.file.name,
      url: im.url,
      x: index*(100+GAP),
      y: 0,
      width: 100,
      height: 100,
    })),
  } satisfies ReflowDoc);
  
  
  const parsed = parseReflowDoc(data);
  if (parsed) return parsed;
  return parseReflowDoc(INITIAL_REFLOW_JSON)!;
}

type FreeSpan = { l: number; r: number };

/**
 * 
 * @param im 
 * @param lineTop 
 * @param lineHeight 
 * @returns 
 */ 
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

function rippleStaggerFromOrigin(
  cx: number,
  cy: number,
  sampleX: number,
  sampleY: number,
): number {
  const dist = Math.hypot(sampleX - cx, sampleY - cy);
  return Math.min(dist * RIPPLE_MS_PER_PX, MAX_RIPPLE_STAGGER_MS);
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
  /** Controlled wrap mode. Use with `onTextImageWrapChange`. */
  textImageWrap?: TextImageWrapMode;
  onTextImageWrapChange?: (mode: TextImageWrapMode) => void;
  /** Initial mode when `textImageWrap` is not controlled (default `both-sides`). */
  defaultTextImageWrap?: TextImageWrapMode;
};

export function ArticleReflowEditor({
  textImageWrap: controlledTextImageWrap,
  defaultTextImageWrap = "both-sides",
}: ArticleReflowEditorProps) {
  const { getFormDetail } = useFormStore();
  const { getImageDetail } = useImageStore();
  const { uuid } = useCurrentFormStore();
  if(!uuid) return null;
  const formDetail = getFormDetail(uuid);
  const imageDetail = getImageDetail(uuid);

  const [doc, setDoc] = useState<ReflowDoc>(() => normalizeDoc(formDetail.content,imageDetail));

  const docRef = useRef(doc);
  docRef.current = doc;

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

  useEffect(() => {
    setUncontrolledWrap(defaultTextImageWrap);
  }, [defaultTextImageWrap]);

  const persist = (next: ReflowDoc) => {
    setDoc(next);
  };

  /** Snapshot of the image when a drag/resize gesture begins (for “did it actually move?”). */
  const gestureImageStartRef = useRef<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  /** Latest doc while dragging/resizing; avoids stale closure on pointerup. */
  const lastLayoutDuringGestureRef = useRef(doc);

  const rippleGenRef = useRef(0);
  const [ripple, setRipple] = useState<{
    gen: number;
    cx: number;
    cy: number;
  } | null>(null);

  useEffect(() => {
    if (!ripple) return;
    const t = window.setTimeout(() => setRipple(null), RIPPLE_CLEAR_MS);
    return () => clearTimeout(t);
  }, [ripple]);

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

  const layoutTransitionOn = !drag && !resize;

  const imageMotionStyle = layoutTransitionOn
    ? {
        transitionProperty: "left, top, width, height",
        transitionDuration: `${REFLOW_LAYOUT_MS}ms`,
        transitionTimingFunction: REFLOW_LAYOUT_EASE,
      }
    : undefined;

  const onPointerDown = (
    e: React.PointerEvent,
    im: ReflowImage,
  ) => {
    e.stopPropagation();

    const rect = containerRef.current!.getBoundingClientRect();

    gestureImageStartRef.current = {
      id: im.id,
      x: im.x,
      y: im.y,
      width: im.width,
      height: im.height,
    };

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

    gestureImageStartRef.current = {
      id: im.id,
      x: im.x,
      y: im.y,
      width: im.width,
      height: im.height,
    };

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

    lastLayoutDuringGestureRef.current = docRef.current;

    const move = (e: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();

      if (!rect) return;

      const prev = lastLayoutDuringGestureRef.current;

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

      const nextDoc = {
        ...prev,
        images: nextImages,
      };
      lastLayoutDuringGestureRef.current = nextDoc;
      persist(nextDoc);
    };

    const up = () => {
      const latest = lastLayoutDuringGestureRef.current;
      const gestureStart = gestureImageStartRef.current;
      gestureImageStartRef.current = null;

      const activeId = drag?.id ?? resize?.id;
      const endIm =
        activeId && latest.images.find((im) => im.id === activeId);

      if (
        gestureStart &&
        endIm &&
        gestureStart.id === endIm.id &&
        (Math.abs(endIm.x - gestureStart.x) > 0.75 ||
          Math.abs(endIm.y - gestureStart.y) > 0.75 ||
          Math.abs(endIm.width - gestureStart.width) > 0.75 ||
          Math.abs(endIm.height - gestureStart.height) > 0.75)
      ) {
        rippleGenRef.current += 1;
        setRipple({
          gen: rippleGenRef.current,
          cx: endIm.x + endIm.width / 2,
          cy: endIm.y + endIm.height / 2,
        });
      }

      setDrag(null);
      setResize(null);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);

    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [drag, resize, width, canvasHeight]);

  return (
    <div className="h-full w-4/5 rounded-lg p-2 sm:p-3 md:p-4 font-serif" >
      <div className="flex w-full flex-col items-center justify-center gap-y-1 px-1 sm:gap-y-2 sm:px-2">
        <h1 className="w-full break-words text-center text-2xl font-bold sm:text-3xl md:text-4xl">{formDetail.title}</h1>
        <h2 className="w-full break-words text-center text-lg font-bold sm:text-xl md:text-2xl">{formDetail.subtitle}</h2>
      </div>
      <div className="mt-2 flex w-full justify-center sm:mt-auto sm:justify-end">
          <h1 className="max-w-full break-words px-1 text-center text-xs font-bold sm:text-right sm:text-sm"> - {formDetail.author}</h1>
        </div>
      
      <div
        ref={containerRef}
        className="relative rounded-md "
        // style={{
        //   height: 600,
        // }}
      >
        
        
        <div
          className="absolute inset-0 z-0 text-left select-text motion-reduce:[&>div]:!transition-none"
          style={{
            font: BODY_FONT,
            lineHeight: `${LINE_HEIGHT}px`,
          }}
        >
          {lines.map((line, i) => {
            const lineCenterX = line.left + line.width / 2;
            const lineCenterY = line.y + LINE_HEIGHT / 2;
            const staggerMs = ripple
              ? rippleStaggerFromOrigin(
                  ripple.cx,
                  ripple.cy,
                  lineCenterX,
                  lineCenterY,
                )
              : 0;

            return (
              <div
                key={i}
                className="absolute whitespace-pre-wrap font-serif"
                style={{
                  top: line.y,
                  left: line.left,
                  width: line.width,
                  ...(layoutTransitionOn
                    ? {
                        transitionProperty: "top, left, width",
                        transitionDuration: `${REFLOW_LAYOUT_MS}ms`,
                        transitionTimingFunction: REFLOW_LAYOUT_EASE,
                        transitionDelay: `${staggerMs}ms`,
                      }
                    : {}),
                }}
              >
                <span
                  key={ripple ? `r-${ripple.gen}-${i}` : `n-${i}`}
                  className={
                    ripple
                      ? "article-reflow-line-wave font-serif"
                      : "font-serif"
                  }
                  style={
                    ripple
                      ? { animationDelay: `${staggerMs}ms` }
                      : undefined
                  }
                >
                  {line.text}
                </span>
              </div>
            );
          })}
        </div>

        {doc.images.map((im) => {
          const icx = im.x + im.width / 2;
          const icy = im.y + im.height / 2;
          const staggerMs = ripple
            ? rippleStaggerFromOrigin(ripple.cx, ripple.cy, icx, icy)
            : 0;

          return (
          <div
            key={im.id}
            className="absolute z-10 overflow-hidden rounded-lg border-2 border-violet-500 bg-white shadow-lg motion-reduce:!transition-none"
            style={{
              left: im.x,
              top: im.y,
              width: im.width,
              height: im.height,
              ...(imageMotionStyle
                ? {
                    ...imageMotionStyle,
                    transitionDelay: `${staggerMs}ms`,
                  }
                : {}),
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
          );
        })}
      </div>
      
    </div>
  );
}


