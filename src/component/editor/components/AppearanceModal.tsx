import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { PencilSquareIcon, PrinterIcon } from "@heroicons/react/24/solid";
import { useCurrentFormStore } from "../store/form.store";
import { useNavigate } from "react-router-dom";
import { HuePicker } from "react-color";


type AppearanceModalProps = {
    open: boolean;
    textImageWrap: "single-side" | "both-sides";
    onTextImageWrapChange: (mode: "single-side" | "both-sides") => void;
    ArticletextColor: string;
    onTextColorChange: (color: string) => void;
    onClose: () => void;
};

function AppearanceModal({ open, onClose, textImageWrap, onTextImageWrapChange,ArticletextColor, onTextColorChange }: AppearanceModalProps) {
    const titleId = useId();
    const navigate = useNavigate();
    const { uuid } = useCurrentFormStore();

    const closeRef = useRef<HTMLButtonElement>(null);
    const [textColor, setTextColor] = useState("#1c1917");
    const [textImageWrapMode, setTextImageWrapMode] = useState("both-sides");

    const handleTextImageWrapChange = (mode: "single-side" | "both-sides") => {
        setTextImageWrapMode(mode);
        onTextImageWrapChange(mode);
    }
    useEffect(() => {
        setTextImageWrapMode(textImageWrap);
        setTextColor(ArticletextColor);
    }, [textImageWrap, ArticletextColor]);

    const handleTextColorChange = (color: string) => {
        setTextColor(color);
        onTextColorChange(color);
    }


    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        closeRef.current?.focus();
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            window.removeEventListener("keydown", onKey);
            document.body.style.overflow = prevOverflow;
        };
    }, [open, onClose]);

    if (!open) return null;
    const handleEdit = () => {
        onClose();
        navigate(`/editor/${uuid}`);
    }

    const shell = (
        <div className="fixed inset-0 z-[100] font-mono print:hidden">
            <button
                type="button"
                className="absolute inset-0 bg-black/20 backdrop-blur-[1px]"
                aria-label="Close appearance"
                onClick={onClose}
            />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="absolute bottom-[5.75rem] right-6 w-[min(calc(100vw-3rem),20rem)] overflow-hidden rounded-3xl border border-gray-200/80 bg-white text-left shadow-[0_12px_40px_-8px_rgba(30,27,75,0.18)] sm:bottom-24 sm:right-8"
            >
                <header className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 pb-3 pt-4">
                    <h2 id={titleId} className="text-lg font-bold tracking-tight text-gray-900">
                        Appearance
                    </h2>
                    <button
                        ref={closeRef}
                        type="button"
                        className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
                        aria-label="Close"
                        onClick={onClose}
                    >
                        <XMarkIcon className="h-5 w-5" aria-hidden />
                    </button>
                </header>

                <div className="space-y-5 px-5 py-5">
                    <div className="grid grid-cols-2 gap-3">
                        <Link
                            to="/editor"
                            onClick={handleEdit}
                            className="flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-2xl bg-violet-100 py-3 text-indigo-950 no-underline transition hover:bg-violet-200/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-800"
                        >
                            <PencilSquareIcon className="h-6 w-6" aria-hidden />
                            <span className="text-xs font-bold tracking-wide">EDIT</span>
                        </Link>
                        <button
                            type="button"
                            className="flex min-h-[3.25rem] flex-col items-center justify-center gap-1 rounded-2xl bg-gray-200 py-3 text-gray-700 transition hover:bg-gray-300/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500"
                            onClick={() => {
                                onClose();
                                requestAnimationFrame(() => window.print());
                            }}
                        >
                            <PrinterIcon className="h-6 w-6" aria-hidden />
                            <span className="text-xs font-bold tracking-wide">PRINT</span>
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-2">
                            <span className="text-sm font-semibold text-gray-800">Image Text Wrap :</span>
                            <div className="flex items-center border w-fit rounded-lg">
                            {(
                                [
                                ["single-side", "Single side"],
                                ["both-sides", "Both sides"],
                                ] as const
                            ).map(([mode, label]) => (
                                <button
                                key={mode}
                                type="button"
                                onClick={() => handleTextImageWrapChange(mode)}
                                className={`rounded px-2 py-1 text-xs font-medium transition-colors sm:text-sm ${
                                    textImageWrapMode === mode?"bg-violet-600 text-white": "hover:bg-current/10"
                                }`}
                                >
                                {label}
                                </button>
                            ))}
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center  gap-2">
                            <span className="text-sm font-semibold text-gray-800">Text Color :</span>
                            <span className="h-4 w-4 shrink-0 rounded-full bg-gray-600 cursor-pointer" style={{ backgroundColor: textColor }} aria-hidden  />
                            </div>
                            <div className=" mt-1 overflow-y-auto rounded-2xl w-full">
                            <HuePicker color={textColor} onChange={(color) => handleTextColorChange(color.hex)}  className="w-full" />
                            </div>
                            
                        </div>
                        {/* <input
                            type="range"
                            min={0}
                            max={100}
                            value={textWarmth}
                            onChange={(e) => setTextWarmth(Number(e.target.value))}
                            className="appearance-range h-2 w-full cursor-pointer"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={textWarmth}
                            aria-label="Text warmth"
                        /> */}
                    </div>
                </div>

                <footer className="border-t border-violet-100/60 bg-violet-50/90 px-5 py-3">
                    <p className="text-center text-[11px] font-medium tracking-wide text-gray-500">
                        Theme auto-saves
                    </p>
                </footer>
            </div>
        </div>
    );

    return createPortal(shell, document.body);
}

export default AppearanceModal;
