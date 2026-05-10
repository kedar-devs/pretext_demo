/****
 * 
 * Basic Experimental Textbox Component
 * This component is used to display a text block in a given width and height.
 */

import { useMemo } from "react";
import { layout, prepare } from "@chenglou/pretext";


const FONT = "16px Inter";
const LINE_HEIGHT_PX = 24;

function TextBlock({ text, width }: { text: string, width: number }) {
  const prepared = useMemo(() => prepare(text, FONT), []);

  const { height } = useMemo(
    () => layout(prepared, width, LINE_HEIGHT_PX),
    [prepared],
  );

  return (
    <div
      style={{
        width: width,
        height,
        font: FONT,
        lineHeight: `${LINE_HEIGHT_PX}px`,
      }}
    >
      {text}
    </div>
  );
}

export default TextBlock;
