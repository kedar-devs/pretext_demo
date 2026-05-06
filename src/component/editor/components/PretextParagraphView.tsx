import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  materializeRichInlineLineRange,
  prepareRichInline,
  walkRichInlineLineRanges,
} from "@chenglou/pretext/rich-inline";
import type { TextSpan } from "../lib/articleBlocks";
import { spansToRichInlineItems } from "../lib/articleBlocks";

const LINE_HEIGHT_PX = 26;

function fragmentStyle(span: TextSpan | undefined): CSSProperties {
  if (!span) return { font: "400 17px Inter, sans-serif" };
  const marks = span.marks;
  return {
    fontWeight: marks.includes("bold") ? 700 : 400,
    textDecoration: marks.includes("underline") ? "underline" : undefined,
    backgroundColor: marks.includes("highlight") ? "#fef08a" : undefined,
  };
}

type Props = {
  spans: TextSpan[];
  className?: string;
};

export function PretextParagraphView({ spans, className }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const plain = spans.map((s) => s.text).join("");
  const isEmpty = !plain.trim();

  useLayoutEffect(() => {
    if (isEmpty) return;
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.getBoundingClientRect().width;
      if (w > 0) setWidth(w);
    });
    ro.observe(el);
    const w0 = el.getBoundingClientRect().width;
    if (w0 > 0) setWidth(w0);
    return () => ro.disconnect();
  }, [isEmpty]);

  const items = useMemo(() => spansToRichInlineItems(spans), [spans]);
  const prepared = useMemo(() => {
    if (isEmpty) return null;
    return prepareRichInline(items);
  }, [items, isEmpty]);

  const lines = useMemo(() => {
    if (!prepared) return [];
    const acc: ReturnType<typeof materializeRichInlineLineRange>[] = [];
    walkRichInlineLineRanges(prepared, width, (range) => {
      acc.push(materializeRichInlineLineRange(prepared, range));
    });
    return acc;
  }, [prepared, width]);

  if (isEmpty) {
    return (
      <div
        className={className}
        style={{
          fontSize: 17,
          lineHeight: `${LINE_HEIGHT_PX}px`,
          fontFamily:
            'Inter, ui-sans-serif, "Helvetica Neue", Helvetica, Arial, sans-serif',
          color: "#9ca3af",
          fontStyle: "italic",
        }}
      >
        Empty paragraph — double-click to edit
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{
        fontSize: 17,
        lineHeight: `${LINE_HEIGHT_PX}px`,
        fontFamily: 'Inter, ui-sans-serif, "Helvetica Neue", Helvetica, Arial, sans-serif',
        textAlign: "left",
      }}
    >
      {lines.map((line, lineIndex) => (
        <div
          key={lineIndex}
          style={{
            whiteSpace: "pre",
            minHeight: LINE_HEIGHT_PX,
            width: "100%",
          }}
        >
          {line.fragments.map((fr, j) => {
            const span = spans[fr.itemIndex];
            const pad = fr.gapBefore > 0 ? { paddingLeft: fr.gapBefore } : {};
            return (
              <span key={j} style={{ ...fragmentStyle(span), ...pad }}>
                {fr.text}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
