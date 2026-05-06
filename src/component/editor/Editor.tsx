import { useState } from "react";
import TextBlock from "../textbox";


function Editor() {
    const [text, setText] = useState("")
    const [width, setWidth] = useState(0)

  return (
    <div className=" w-full h-full p-4">
        <div className="w-full h-full bg-gray-100 rounded-lg p-4 border border-black">
            <textarea value={text} onChange={(e) => setText(e.target.value)} />
            <input type="range" min={10} max={1000} step={10} value={width} onChange={(e) => setWidth(Number(e.target.value))} />
            <TextBlock text={text} width={width} />
        </div>
    </div>
  )
}

export default Editor;