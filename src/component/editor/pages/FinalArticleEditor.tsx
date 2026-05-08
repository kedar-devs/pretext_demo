import { ArticleReflowEditor } from "../components/ArticleReflowEditor";
import { PrinterIcon } from "@heroicons/react/24/outline";

export default function FinalArticleEditor() {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center overflow-y-auto bg bg-[#fcf8ff] p-4 gap-y-4">
      <div className=" w-full flex justify-end ">
        <button className="bg-green-800 text-white px-4 py-2 rounded-md capitalize flex justify-center items-center gap-x-2" onClick={()=>{
          window.print();
        }} ><PrinterIcon className="size-6" /> Print Article </button>

      </div>
      <ArticleReflowEditor />
    </div>
);
}