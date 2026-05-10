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
    <div className="w-full h-full flex flex-col justify-center items-center overflow-y-auto bg bg-[#fcf8ff] p-4 gap-y-4 page-container">
      <div className=" w-full flex justify-end gap-x-2 print:hidden">
        <Link
          to={`/editor/${uuid}`}
          className="bg-blue-800 text-white px-4 py-2 rounded-md capitalize flex justify-center items-center gap-x-2"
        >
          Edit Article
        </Link>
        <button
          className="bg-green-800 text-white px-4 py-2 rounded-md capitalize flex justify-center items-center gap-x-2"
          onClick={() => {
            window.print();
          }}
        >
          <PrinterIcon className="size-6" /> Print Article{" "}
        </button>
      </div>
      <div className="article-reflow-canvas w-full h-full">
        <div className=" w-1/2 bg-gray-200 rounded-t-xl text-black border border-gray-300 p-4 justify-start items-start print:hidden flex gap-x-4 items-center">
          <div className=" flex items-center gap-x-2">
          <h2 className="text-lg font-bold">Background Color:</h2>
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
                className="absolute left-0 top-full z-50 mt-1"
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
            <div className=" flex items-center gap-x-2 ">
            <h2 className="text-lg font-bold">Text Color:</h2>
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
                  className="absolute left-0 top-full z-50 mt-1"
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
