import { articleSchema } from "../schemas/article";
import { useState,useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import type{ EditorFormProps } from "../interface/editor_form";
import { z } from "zod";
import { useCurrentFormStore, useFormStore } from "../store/form.store";
import { useImageStore } from "../store/image.store";
import { useNavigate } from "react-router-dom";
function EditorForm() {
    const { addFormDetail } = useFormStore();
    const { addImageDetail } = useImageStore();
    const { setCurrentFormData } = useCurrentFormStore();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors }, reset } = useForm<z.infer<typeof articleSchema>>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: "",
            subtitle: "",
            content: "",
            author: "",
        },
    });
    const [imageUrls,setImageUrls] = useState<{name:string,url:string}[]>([]);
    const [imageFiles,setImageFiles] = useState<File[]>([]);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            if(imageUrls.length + files.length > 3) {
                alert("You can only upload up to 3 images");
                return;
            }
            const newImageUrls = Array.from(files).map((file) => URL.createObjectURL(file));
            const newImageFiles = Array.from(files);
            setImageUrls((prev) => [...prev, ...newImageUrls.map((url,index) => ({name:newImageFiles[index].name,url}))]);
            setImageFiles((prev) => [...prev, ...newImageFiles]);
        }
    };
    const handleImageDelete = (url: string,name:string) => {
        setImageUrls((prev) => prev.filter((u) => u.url !== url));
        setImageFiles((prev) => prev.filter((f) => f.name !== name));
        
    };

    const onSubmit = (data: z.infer<typeof articleSchema>) => {
        const uuid = new Date().getTime();
        const formDetail: EditorFormProps = {
            uuid,
            title: data.title,
            subtitle: data.subtitle,
            content: data.content,
            author: data.author,
        };
        addFormDetail(formDetail);
        addImageDetail(imageUrls.map(({url,name}) => ({
            uuid,
            url,
            file: imageFiles.find((file) => file.name === name)!,
        })));
        setCurrentFormData(uuid);
        navigate("/editor/final");
    };

    return (
        <div className=" w-full h-full flex flex-col justify-center items-center overflow-y-auto bg bg-[#fcf8ff]">
        
        <form onSubmit={(e)=>{
            e.preventDefault();
            handleSubmit(onSubmit)(e);
        }} className=" w-1/2 h-full flex flex-col justify-center items-center ">
            <div className=" w-full h-full flex flex-col justify-center items-center gap-y-5">
                <input {...register("title")} className="w-full rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-2xl font-bold" placeholder="Title of your article" />
                {errors.title && <p className="text-red-500">{errors.title.message}</p>}
                <input {...register("subtitle")} className="w-full rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xl font-bold" placeholder="Subtitle of your article if any..." />
                {errors.subtitle && <p className="text-red-500">{errors.subtitle.message}</p>}
                <textarea {...register("content")} className="w-full h-48 overflow-y-auto rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" placeholder="Content of your article" />
                {errors.content && <p className="text-red-500">{errors.content.message}</p>}
                <input {...register("author")} className="w-full rounded-md p-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base" placeholder="Author of your article" />
                {errors.author && <p className="text-red-500">{errors.author.message}</p>}
                <input type="file" multiple onChange={handleImageUpload} className="w-full hidden" ref={imageInputRef} accept="image/*" />
                <button className=" w-48 h-48 flex flex-col justify-center items-center border border-gray-300 rounded-md border-dashed" onClick={(e) => {
                    e.preventDefault();
                    imageInputRef.current?.click()
                }}>
                    <PhotoIcon className="w-24 h-24 text-[#875afd]" />
                    <p className="text-sm text-gray-500">Add images</p>
                    <p className="text-xs text-gray-500">You can add up to 3 images</p>
                    <p className="text-xs text-gray-500">{imageUrls.length}/{3}</p>
                </button>
                <div className=" w-full flex flex-wrap gap-6 justify-center items-center mt-2">
                    {imageUrls.map(({url,name}) => (
                        <div
                        key={url}
                        className="relative overflow-hidden rounded-md border-2 border-violet-400 bg-white shadow-md w-24 h-24"
                      >
                        <img
                          src={url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          className="pointer-events-auto absolute right-0 top-0 bg-white/90 px-1 text-[10px] text-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleImageDelete(url,name);
                          }}
                        >
                          <XMarkIcon className="w-5 h-5 text-red-500 bg-transparent" />
                        </button>
                      </div>
                    ))}
                </div>
               <div className=" w-full flex justify-center items-center gap-x-4">
                <button type="submit" className="w-36 h-12 bg-blue-800 text-white rounded-md capitalize">Publish</button>
                <button type="button" className="w-36 h-12 bg-red-800 text-white rounded-md capitalize" onClick={() => {
                    setImageUrls([]);
                    setImageFiles([]);
                    reset();
                }}>Clear</button>

                </div>
            </div>
        </form>
        </div>
    )
}
export default EditorForm;