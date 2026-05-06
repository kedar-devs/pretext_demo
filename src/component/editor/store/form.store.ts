import { create } from "zustand";
import type{ EditorFormProps, EditedFormStoreProps, currentFormDataStoreProps } from "../interface/editor_form";

export const useFormStore = create<EditedFormStoreProps>((set,get) => ({
    formDetail: [],
    addFormDetail: (formDetail: EditorFormProps) => set((state) => ({ formDetail: [...state.formDetail, formDetail] })),
    getFormDetail: (uuid: number) => get().formDetail.find((form) => form.uuid === uuid)!,
    deleteFormDetail: (uuid: number) => set((state) => ({ formDetail: state.formDetail.filter((form) => form.uuid !== uuid) })),
    clearAll: () => set({ formDetail: [] }),
}));

export const useCurrentFormStore = create<currentFormDataStoreProps>((set) => ({
    uuid: null,
    setCurrentFormData: (uuid: number) => set({ uuid }),
    clearCurrentFormData: () => set({ uuid: null }),
}));

