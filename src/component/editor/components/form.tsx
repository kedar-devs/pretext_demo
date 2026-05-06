import { articleSchema } from "../schemas/article";
import { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { EditorFormProps } from "../interface/editor_form";
import { z } from "zod";
import { useCurrentFormStore, useFormStore } from "../store/form.store";
import { useImageStore } from "../store/image.store";
import { useNavigate } from "react-router-dom";
import { INITIAL_ARTICLE_JSON } from "../lib/articleBlocks";
import { getLatestArticleHydration } from "../lib/hydrateFromStores";
import {
  ArticleBodyEditor,
  type ArticleBodyEditorHandle,
} from "./ArticleBodyEditor";

function EditorForm() {
  const { addFormDetail, clearAll: clearFormStore } = useFormStore();
  const { addImageDetail, clearAll: clearImageStore } = useImageStore();
  const { setCurrentFormData } = useCurrentFormStore();
  const navigate = useNavigate();
  const bodyRef = useRef<ArticleBodyEditorHandle>(null);

  const [hydration] = useState(() =>
    getLatestArticleHydration(
      useFormStore.getState().formDetail,
      useImageStore.getState().imageDetail,
    ),
  );

  const [editorSession, setEditorSession] = useState(0);

  const sourceStillPresent = useFormStore((s) =>
    hydration ? s.formDetail.some((f) => f.uuid === hydration.sourceUuid) : false,
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<z.infer<typeof articleSchema>>({
    resolver: zodResolver(articleSchema),
    defaultValues:
      hydration?.defaults ?? {
        title: "",
        subtitle: "",
        content: INITIAL_ARTICLE_JSON,
        author: "",
      },
  });

  const resetBlank = () => {
    clearFormStore();
    clearImageStore();
    reset({
      title: "",
      subtitle: "",
      content: INITIAL_ARTICLE_JSON,
      author: "",
    });
    setEditorSession((n) => n + 1);
  };

  const onSubmit = (data: z.infer<typeof articleSchema>) => {
    const uuid = Date.now();
    const formDetail: EditorFormProps = {
      uuid,
      title: data.title,
      subtitle: data.subtitle,
      content: data.content,
      author: data.author,
    };
    addFormDetail(formDetail);
    setCurrentFormData(uuid);
    const imgs = bodyRef.current?.getImagesForSubmit() ?? [];
    addImageDetail(
      imgs.map((img) => ({
        uuid,
        url: img.url,
        file: img.file,
      })),
    );

    navigate("/");
  };

  const initialImageFiles =
    hydration && sourceStillPresent
      ? hydration.initialImageFileEntries
      : undefined;

  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-[#fcf8ff]">
      {hydration && sourceStillPresent && (
        <div className="mb-4 w-1/2 rounded-lg border border-violet-200 bg-violet-50 px-4 py-3 text-left text-sm text-violet-950">
          <p className="m-0 font-medium">Loaded from your in-memory stores</p>
          <p className="mt-1 mb-2 text-violet-900/90">
            Title, body, and images are prefilled from the latest entry in{" "}
            <code className="rounded bg-white/80 px-1">formDetail</code> and matching
            rows in <code className="rounded bg-white/80 px-1">imageDetail</code>{" "}
            (same article <code className="rounded bg-white/80 px-1">uuid</code>).
          </p>
          <button
            type="button"
            className="rounded border border-violet-300 bg-white px-3 py-1 text-xs font-medium text-violet-900 hover:bg-violet-100"
            onClick={resetBlank}
          >
            Clear stores &amp; blank form
          </button>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(onSubmit)(e);
        }}
        className="flex h-full w-1/2 flex-col items-center justify-center"
      >
        <div className="flex h-full w-full flex-col items-center justify-center gap-y-5">
          <input
            {...register("title")}
            className="w-full rounded-md border border-gray-300 p-2 text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Title of your article"
          />
          {errors.title && (
            <p className="text-red-500">{errors.title.message}</p>
          )}
          <input
            {...register("subtitle")}
            className="w-full rounded-md border border-gray-300 p-2 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Subtitle of your article if any..."
          />
          {errors.subtitle && (
            <p className="text-red-500">{errors.subtitle.message}</p>
          )}

          <div className="w-full">
            <label className="mb-1 block text-left text-sm font-medium text-gray-700">
              Article body
            </label>
            <Controller
              name="content"
              control={control}
              render={({ field }) => (
                <ArticleBodyEditor
                  key={editorSession}
                  ref={bodyRef}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  initialImageFiles={initialImageFiles}
                />
              )}
            />
            {errors.content && (
              <p className="mt-1 text-left text-sm text-red-500">
                {errors.content.message}
              </p>
            )}
          </div>

          <input
            {...register("author")}
            className="w-full rounded-md border border-gray-300 p-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Author of your article"
          />
          {errors.author && (
            <p className="text-red-500">{errors.author.message}</p>
          )}

          <button
            type="submit"
            className="h-12 w-36 rounded-md bg-blue-800 capitalize text-white"
          >
            Publish
          </button>
        </div>
      </form>
    </div>
  );
}
export default EditorForm;
