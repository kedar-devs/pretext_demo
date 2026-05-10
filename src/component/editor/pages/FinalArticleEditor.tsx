import { ArticleReflowEditor } from "../components/ArticleReflowEditor";
import { PrinterIcon } from "@heroicons/react/24/outline";
import {useCurrentFormStore} from "../store/form.store";
import { Link } from "react-router-dom";

export default function FinalArticleEditor() {
  const { uuid } = useCurrentFormStore();
  if(!uuid) return <div className="w-full h-full flex justify-center items-center">No article found</div>;
  return (
    <div className="w-full h-full flex flex-col justify-center items-center overflow-y-auto bg bg-[#fcf8ff] p-4 gap-y-4 page-container">
      <div className=" w-full flex justify-end gap-x-2 print:hidden">
        <Link to={`/editor/${uuid}`} className="bg-blue-800 text-white px-4 py-2 rounded-md capitalize flex justify-center items-center gap-x-2">Edit Article</Link>
        <button className="bg-green-800 text-white px-4 py-2 rounded-md capitalize flex justify-center items-center gap-x-2" onClick={()=>{
          window.print();
        }} ><PrinterIcon className="size-6" /> Print Article </button>

      </div>
      <div className="article-reflow-canvas w-full h-full">
      <ArticleReflowEditor />
      </div>
    </div>
);
}