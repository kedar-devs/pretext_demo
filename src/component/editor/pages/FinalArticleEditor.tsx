import { ArticleReflowEditor } from "../components/ArticleReflowEditor";
import { useState, useEffect, useRef } from "react";
import { PrinterIcon } from "@heroicons/react/24/outline";
import { SketchPicker } from "react-color";
import { useCurrentFormStore } from "../store/form.store";
import { Link } from "react-router-dom";

export default function FinalArticleEditor() {
  const { uuid } = useCurrentFormStore();
  const [bgColor, setBgColor] = useState<string>("#fcf8ff");
  const [textColor, setTextColor] = useState<string>("#000000");
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
    <div className="page-container flex h-full min-h-0 w-full flex-col items-center justify-center gap-y-2 overflow-y-auto bg bg-[#fcf8ff] px-2 py-3 sm:gap-y-4 sm:p-4 md:px-6">
      <div className="flex w-full shrink-0 flex-wrap justify-center gap-2 print:hidden sm:justify-end sm:gap-x-2">
        <Link
          to={`/editor/${uuid}`}
          className="flex min-h-[44px] min-w-0 items-center justify-center gap-x-2 rounded-md bg-blue-800 px-3 py-2 text-sm capitalize text-white sm:px-4 sm:text-base"
        >
          Edit Article
        </Link>
        <button
          className="flex min-h-[44px] min-w-0 items-center justify-center gap-x-2 rounded-md bg-green-800 px-3 py-2 text-sm capitalize text-white sm:px-4 sm:text-base"
          onClick={() => {
            window.print();
          }}
        >
          <PrinterIcon className="size-5 shrink-0 sm:size-6" /> Print Article{" "}
        </button>
      </div>
      <div className="article-reflow-canvas flex h-auto min-h-0 w-full flex-1 flex-col sm:h-full">
        <div className="flex w-full max-w-full flex-col flex-wrap gap-3 rounded-t-xl border border-gray-300 bg-gray-200 p-3 text-black print:hidden sm:w-full sm:flex-row sm:items-center sm:gap-x-4 sm:p-4 md:max-w-[90%] lg:max-w-[85%] xl:max-w-[50%]">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-base font-bold sm:text-lg">Background Color:</h2>
          <div className="relative" ref={bgColorRef}>
            <div className="w-12 h-4">
              <div
                className="w-full h-full"
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
                  onChangeComplete={(c) => setBgColor(c.hex)}
                />
              </div>
            )}
            </div>
            </div>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h2 className="text-base font-bold sm:text-lg">Text Color:</h2>
            <div className="relative " ref={textColorRef}>
              <div className="w-12 h-4">
                <div
                  className="w-full h-full"
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
                    onChangeComplete={(c) => setTextColor(c.hex)}
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
