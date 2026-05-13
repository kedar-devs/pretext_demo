import { articleSchema } from "../schemas/article";
import { useState,useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { XMarkIcon, PhotoIcon } from "@heroicons/react/24/outline";
import type{ EditorFormProps } from "../interface/editor_form";
import { z } from "zod";
import { useCurrentFormStore, useFormStore } from "../store/form.store";
import { useImageStore } from "../store/image.store";
import { useNavigate, useParams } from "react-router-dom";
import toast,{Toaster} from "react-hot-toast";
function EditorForm() {
    const { id } = useParams();
    const { addFormDetail, getFormDetail } = useFormStore();
    const { addImageDetail, getImageDetail, clearAll: clearImageDetail } = useImageStore();
    const { setCurrentFormData } = useCurrentFormStore();
    
    const navigate = useNavigate();
    
    const [imageUrls,setImageUrls] = useState<{name:string,url:string}[]>([]);
    const [imageFiles,setImageFiles] = useState<File[]>([]);
    const [uuid,setUuid] = useState<number | null>(null);

    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const autoResizeTextArea = () => {
        const textArea = textAreaRef.current;
        if(!textArea) return;
        textArea.style.height = 'auto';
        textArea.style.height = `${textArea.scrollHeight}px`;

    }

    useEffect(() => {
        if(id!==undefined && id!==null && id!=='') {
            setUuid(Number(id));
            const formDetail = getFormDetail(Number(id));
            if (formDetail) {
            const defaultValues: z.infer<typeof articleSchema> = {
                title: formDetail.title,
                subtitle: formDetail.subtitle,
                content: formDetail.content,
                author: formDetail.author,
            };
            const imageDetail = getImageDetail(Number(id));
            console.log(imageDetail);
            setImageUrls(imageDetail.map((image) => ({name:image.file.name,url:image.url})));
            setImageFiles(imageDetail.map((image) => image.file));
            // clearImageDetail();
            reset(defaultValues);
        }
        } else {
            setUuid(null);
        }
    }, [id]);
    const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<z.infer<typeof articleSchema>>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: "",
            subtitle: "",
            content: "",
            author: "",
        },
    });
    const contentValue = watch("content");

    useEffect(() => {
        autoResizeTextArea();
    }, [contentValue]);
    const imageInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            if(imageUrls.length + files.length > 3) {
                toast.error("You can only upload up to 3 images");
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
        console.log(uuid,data);
        if(uuid!==null && uuid!==undefined && uuid!==0 ) {
            addFormDetail({
                uuid,
                title: data.title,
                subtitle: data.subtitle,
                content: data.content,
                author: data.author,
            });
            clearImageDetail();
            addImageDetail(imageUrls.map(({url,name}) => ({
                uuid,
                url,
                file: imageFiles.find((file) => file.name === name)!,
            })));
            setCurrentFormData(uuid);
            
            navigate("/editor/final");
        } else {
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
    }
    };

    return (
        <div className="flex min-h-full w-full flex-col items-center bg-[#fcf8ff] px-3 py-6 sm:px-4 sm:py-8 md:px-6">
        <Toaster />
        <form onSubmit={(e)=>{
            e.preventDefault();
            handleSubmit(onSubmit)(e);
        }} className="flex w-full h-full max-w-3xl flex-col items-center sm:max-w-4xl lg:w-1/2 lg:max-w-none lg:p-2 ">
            <div className="flex  w-full flex-col items-center gap-y-4 sm:gap-y-5">
                <input {...register("title")} className="w-full rounded-md border-0 border-b-2 border-gray-300 p-2 text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-xl md:text-2xl bg-transparent" placeholder="Title of your article" />
                {errors.title && <p className="text-red-500">{errors.title.message}</p>}
                <input {...register("subtitle")} className="w-full rounded-md border-0 border-b-2 border-gray-300 p-2 text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-lg md:text-xl bg-transparent" placeholder="Subtitle of your article if any..." />
                {errors.subtitle && <p className="text-red-500">{errors.subtitle.message}</p>}
                <textarea {...register("content")} ref={(e)=>{
                    register("content").ref(e);
                    textAreaRef.current = e;
                }} onInput={autoResizeTextArea} 
                rows={1}
                className="w-full min-h-40 resize-none overflow-hidden rounded-md bg-transparent border-0 border-b-2 border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base" placeholder="Content of your article" />
                {errors.content && <p className="text-red-500">{errors.content.message}</p>}
                <input {...register("author")} className="w-full rounded-md bg-transparent border-0 border-b-2 border-gray-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-base" placeholder="Author of your article" />
                {errors.author && <p className="text-red-500">{errors.author.message}</p>}
                <input type="file" multiple onChange={handleImageUpload} className="w-full hidden" ref={imageInputRef} accept="image/*" />
                <button className="flex h-40 w-40 flex-col items-center justify-center rouded-md border border-dashed border-gray-300 sm:h-44 sm:w-44 md:h-48 md:w-48" onClick={(e) => {
                    e.preventDefault();
                    imageInputRef.current?.click()
                }}>
                    <PhotoIcon className="h-16 w-16 text-[#875afd] sm:h-20 sm:w-20 md:h-24 md:w-24" />
                    <p className="text-sm text-gray-500">Add images</p>
                    <p className="text-xs text-gray-500">You can add up to 3 images</p>
                    <p className="text-xs text-gray-500">{imageUrls.length}/{3}</p>
                </button>
                <div className="mt-2 flex w-full flex-wrap items-center justify-center gap-4 sm:gap-6">
                    {imageUrls.map(({url,name}) => (
                        <div
                        key={url}
                        className="relative h-24 w-24 overflow-hidden rounded-md border-2 border-violet-400 bg-white shadow-md sm:h-28 sm:w-28"
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
               <div className="flex w-full flex-col items-stretch justify-center gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                <button type="submit" className="min-h-[44px] w-full rounded-md bg-blue-800 px-4 py-3 text-sm capitalize text-white sm:h-12 sm:w-36 sm:py-0 sm:text-base">Publish</button>
                <button type="button" className="min-h-[44px] w-full rounded-md bg-red-800 px-4 py-3 text-sm capitalize text-white sm:h-12 sm:w-36 sm:py-0 sm:text-base" onClick={() => {
                    setImageUrls([]);
                    setImageFiles([]);
                    reset({
                        title: "",
                        subtitle: "",
                        content: "",
                        author: "",
                    });
                }}>Clear</button>

                </div>
            </div>
        </form>
        </div>
    )
}
export default EditorForm;