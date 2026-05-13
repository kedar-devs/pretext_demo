import { ArticleReflowEditor } from "../components/ArticleReflowEditor";
import { useState } from "react";
import { useCurrentFormStore } from "../store/form.store";

import FloatingActionButton from "../components/FloatingActionButton";
import AppearanceModal from "../components/AppearanceModal";
export default function FinalArticleEditor() {
  const { uuid } = useCurrentFormStore();
  const [textColor, setTextColor] = useState<string>("#1c1917");
  const [textImageWrap, setTextImageWrap] = useState<"single-side" | "both-sides">("both-sides");
  const [fabModalOpen, setFabModalOpen] = useState(false);

  const handleTextColorChange = (color: string) => {
    setTextColor(color);
  }
  const handleTextImageWrapChange = (mode: "single-side" | "both-sides") => {
    setTextImageWrap(mode);
  }
  // useEffect(() => {
  //   function handleClickOutside(event: MouseEvent) {
  //     const target = event.target as Node;
  
  //     if (
  //       bgColorRef.current &&
  //       !bgColorRef.current.contains(target)
  //     ) {
  //       setBgColorPicker(false);
  //     }
  
  //     if (
  //       textColorRef.current &&
  //       !textColorRef.current.contains(target)
  //     ) {
  //       setTextColorPicker(false);
  //     }
  //   }
  
  //   document.addEventListener("mousedown", handleClickOutside);
  
  //   return () => {
  //     document.removeEventListener("mousedown", handleClickOutside);
  //   };
  // }, []);

  if(!uuid) return <div className="w-full h-full flex justify-center items-center text-slate-800 capitalize text-4xl">No article found</div>;
  return (
    <div className="page-container flex h-full min-h-0 w-full flex-col items-center justify-center gap-y-2 overflow-y-auto bg-gradient-to-br from-slate-200/90 via-stone-100 to-zinc-200/80 px-2 py-3 text-slate-800 sm:gap-y-4 sm:p-4 md:px-6">
      <div className="article-reflow-canvas flex h-auto min-h-0 w-full flex-1 flex-col items-center justify-center sm:h-full" style={{ color: textColor }}>
        <ArticleReflowEditor textImageWrap={textImageWrap} />
        <FloatingActionButton ariaLabel="Appearance" onClick={() => setFabModalOpen(true)} />
        <AppearanceModal open={fabModalOpen} onClose={() => setFabModalOpen(false)} ArticletextColor={textColor} onTextColorChange={handleTextColorChange} textImageWrap={textImageWrap} onTextImageWrapChange={handleTextImageWrapChange} />
      </div>
    </div>
  );
}
