export interface EditorFormProps {
    uuid: number;
    title: string;
    subtitle?: string;
    content: string;
    author?: string;
}

export interface EditedFormStoreProps {
    formDetail: EditorFormProps[];
    addFormDetail: (formDetail: EditorFormProps) => void;
    getFormDetail: (uuid: number) => EditorFormProps;
    deleteFormDetail: (uuid: number) => void;
    clearAll: () => void;
}

export interface ImageProps {
    uuid: number;
    url: string;
    file: File;
}

export interface EditedImageStoreProps {
    imageDetail: ImageProps[];
    addImageDetail: (imageDetail: ImageProps[]) => void;
    getImageDetail: (uuid: number) => ImageProps;
    deleteImageDetail: (uuid: number) => void;
    clearAll: () => void;
}

export interface currentFormDataStoreProps {
    uuid: number | null;
    setCurrentFormData: (uuid: number) => void;
    clearCurrentFormData: () => void;
}

