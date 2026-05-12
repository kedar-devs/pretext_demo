import { ArticleReflowEditor } from "../components/ArticleReflowEditor";
import { useState, useEffect, useRef } from "react";
import { PencilSquareIcon, PrinterIcon } from "@heroicons/react/24/outline";
import { type ColorResult, SketchPicker } from "react-color";
import { useCurrentFormStore } from "../store/form.store";
import { Link } from "react-router-dom";

export default function FinalArticleEditor() {
  const { uuid } = useCurrentFormStore();
  const [bgColor, setBgColor] = useState<string>("#f8f6f3");
  const [textColor, setTextColor] = useState<string>("#1c1917");
  const [bgColorPicker, setBgColorPicker] = useState<boolean>(false);
  const [textColorPicker, setTextColorPicker] = useState<boolean>(false);
  const bgColorRef = useRef<HTMLDivElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
  
      if (
        bgColorRef.current &&
        !bgColorRef.current.contains(target)
      ) {
        setBgColorPicker(false);
      }
  
      if (
        textColorRef.current &&
        !textColorRef.current.contains(target)
      ) {
        setTextColorPicker(false);
      }
    }
  
    document.addEventListener("mousedown", handleClickOutside);
  
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // if(!uuid) return <div className="w-full h-full flex justify-center items-center">No article found</div>;
  return (
    <div className="page-container flex h-full min-h-0 w-full flex-col items-center justify-center gap-y-2 overflow-y-auto bg-gradient-to-br from-slate-200/90 via-stone-100 to-zinc-200/80 px-2 py-3 text-slate-800 sm:gap-y-4 sm:p-4 md:px-6">
      <div className="flex w-full shrink-0 flex-wrap justify-center gap-3 print:hidden sm:justify-end">
        <Link
          to={`/editor/${uuid}`}
          className="group inline-flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-slate-800 to-slate-950 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/35 ring-1 ring-white/15 transition duration-200 hover:from-slate-700 hover:to-slate-900 hover:shadow-xl hover:shadow-slate-900/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 active:scale-[0.98] sm:px-5 sm:text-base"
        >
          <PencilSquareIcon className="size-5 shrink-0 text-white/85 transition group-hover:text-white sm:size-5" />
          Edit article
        </Link>
        <button
          type="button"
          className="inline-flex min-h-[44px] min-w-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-teal-700 px-4 py-2.5 text-sm font-medium text-white shadow-lg shadow-teal-900/30 ring-1 ring-white/20 transition duration-200 hover:from-emerald-400 hover:to-teal-600 hover:shadow-xl hover:shadow-teal-900/35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 active:scale-[0.98] sm:px-5 sm:text-base"
          onClick={() => {
            window.print();
          }}
        >
          <PrinterIcon className="size-5 shrink-0 text-white/90 sm:size-5" />
          Print article
        </button>
      </div>
      <div className="article-reflow-canvas flex h-auto min-h-0 w-full flex-1 flex-col sm:h-full">
        <div className="flex w-full max-w-full flex-col flex-wrap gap-3 rounded-t-xl border border-white/60 bg-white/75 p-3 text-slate-700 shadow-sm backdrop-blur-md print:hidden sm:w-full sm:flex-row sm:items-center sm:gap-x-4 sm:p-4 md:max-w-[90%] lg:max-w-[85%] xl:max-w-[50%]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-base font-semibold tracking-tight text-slate-800 sm:text-lg">Background color</h2>
          <div className="relative" ref={bgColorRef}>
            <div className="h-5 w-12 overflow-hidden rounded-md border border-slate-300/80 shadow-inner ring-1 ring-black/5">
              <div
                className="h-full w-full cursor-pointer transition-opacity hover:opacity-90"
                style={{ backgroundColor: bgColor }}
                onClick={() => setBgColorPicker((v) => !v)}
              ></div>
            </div>
            {bgColorPicker && (
              <div
                className="absolute left-0 top-full z-50 mt-1 max-h-[min(70vh,420px)] max-w-[min(calc(100vw-1.5rem),280px)] overflow-y-auto sm:max-h-none sm:max-w-none"
                onClick={(e) => e.stopPropagation()}
              >
                <SketchPicker
                  color={bgColor}
                  onChangeComplete={(c:ColorResult) => setBgColor(c.hex)}
                />
              </div>
            )}
            </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-base font-semibold tracking-tight text-slate-800 sm:text-lg">Text color</h2>
            <div className="relative" ref={textColorRef}>
              <div className="h-5 w-12 overflow-hidden rounded-md border border-slate-300/80 shadow-inner ring-1 ring-black/5">
                <div
                  className="h-full w-full cursor-pointer transition-opacity hover:opacity-90"
                  style={{ backgroundColor: textColor }}
                  onClick={() => setTextColorPicker((v) => !v)}
                ></div>
              </div>
              {textColorPicker && (
                <div
                  className="absolute left-0 top-full z-50 mt-1 max-h-[min(70vh,420px)] max-w-[min(calc(100vw-1.5rem),280px)] overflow-y-auto sm:max-h-none sm:max-w-none"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SketchPicker
                    color={textColor}
                    onChangeComplete={(c:ColorResult) => setTextColor(c.hex)}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        <ArticleReflowEditor bgColor={bgColor} textColor={textColor} />
      </div>
    </div>
  );
}
