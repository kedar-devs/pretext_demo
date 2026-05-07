import { create } from "zustand";
import type{ ImageProps, EditedImageStoreProps } from "../interface/editor_form";

export const useImageStore = create<EditedImageStoreProps>((set,get) => ({
    imageDetail: [],
    addImageDetail: (imageDetail: ImageProps[]) => set((state) => ({ imageDetail: [...state.imageDetail, ...imageDetail] })),
    getImageDetail: (uuid: number) => get().imageDetail.filter((image) => image.uuid === uuid)!,
    deleteImageDetail: (uuid: number) => set((state) => ({ imageDetail: state.imageDetail.filter((image) => image.uuid !== uuid) })),
    clearAll: () => set({ imageDetail: [] }),
}));