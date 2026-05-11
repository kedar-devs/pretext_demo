import { useState } from "react";
import TextBlock from "../textbox";


function Editor() {
    const [text, setText] = useState("")
    const [width, setWidth] = useState(0)

  return (
    <div className="h-full min-h-0 w-full p-2 sm:p-4">
        <div className="flex h-full min-h-0 w-full max-w-full flex-col gap-3 overflow-x-auto overflow-y-auto rounded-lg border border-black bg-gray-100 p-3 sm:gap-4 sm:p-4">
            <textarea value={text} onChange={(e) => setText(e.target.value)} className="box-border min-h-[120px] w-full resize-y rounded border border-gray-200 p-2 text-sm sm:min-h-[140px] sm:text-base" />
            <input type="range" min={10} max={1000} step={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} className="w-full max-w-full sm:max-w-md" />
            <TextBlock text={text} width={width} />
        </div>
    </div>
  )
}

export default Editor;