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

type WrapInfo = {
  left: number;
  right: number;
};

function getWrapForLine(
  lineTop: number,
  lineHeight: number,
  containerWidth: number,
  images: ReflowImage[],
): WrapInfo {
  const y1 = lineTop;
  const y2 = lineTop + lineHeight;

  let left = 0;
  let right = containerWidth;

  for (const im of images) {
    const iy1 = im.y;
    const iy2 = im.y + im.height;

    const overlaps = !(y2 <= iy1 || y1 >= iy2);

    if (!overlaps) continue;

    const imageCenter = im.x + im.width / 2;

    if (imageCenter < containerWidth / 2) {
      left = Math.max(left, im.x + im.width);
    } else {
      right = Math.min(right, im.x);
    }
  }

  return {
    left,
    right,
  };
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
    const wrap = getWrapForLine(
      y,
      LINE_HEIGHT,
      containerWidth,
      images,
    );

    const lineWidth = Math.max(
      MIN_LINE_WIDTH,
      wrap.right - wrap.left,
    );

    const range = layoutNextLineRange(prepared, cursor, lineWidth);

    if (!range) break;

    const line = materializeLineRange(prepared, range);

    lines.push({
      text: line.text,
      y,
      left: wrap.left,
      width: lineWidth,
    });

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

  return {
    lines,
    height: Math.max(y + LINE_HEIGHT, 400),
  };
}

type ArticleReflowEditorProps = {
  bgColor: string;
  textColor: string;
}
export function ArticleReflowEditor({ bgColor, textColor }: ArticleReflowEditorProps) {
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
    () => layoutReflowLines(doc.bodyText, width, doc.images),
    [doc.bodyText, width, doc.images],
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
    <div className="w-full h-full rounded-lg p-3 shadow-sm " style={{ backgroundColor: bgColor, color: textColor }}>
      <div className="flex flex-col w-full justify-center items-center gap-y-2">
        <h1 className="text-4xl font-bold">{formDetail.title}</h1>
        <h2 className="text-2xl font-bold">{formDetail.subtitle}</h2>
      </div>
      <div
        ref={containerRef}
        className="relative overflow-auto rounded-md h-[85%]"
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
      <div className=" w-full flex justify-end mt-auto">
          <h1 className="text-sm font-bold"> - {formDetail.author}</h1>
        </div>
    </div>
  );
}


