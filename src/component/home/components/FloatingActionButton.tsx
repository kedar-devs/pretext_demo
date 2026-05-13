import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Cog8ToothIcon } from "@heroicons/react/24/solid";

const baseStyles =
    "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-blue-800 text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-900 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 active:scale-95 print:hidden sm:bottom-8 sm:right-8";

type FloatingActionButtonProps = {
    ariaLabel: string;
    className?: string;
    children?: ReactNode;
} & ({ to: string; onClick?: never } | { to?: never; onClick: () => void });

function FloatingActionButton(props: FloatingActionButtonProps) {
    const { ariaLabel, className = "", children, ...rest } = props;
    const classNames = `${baseStyles} ${className}`.trim();
    const content = children ?? <Cog8ToothIcon className="h-7 w-7" aria-hidden />;

    if ("to" in rest && rest.to) {
        return (
            <Link to={rest.to} className={classNames} aria-label={ariaLabel}>
                {content}
            </Link>
        );
    }

    return (
        <button type="button" className={classNames} aria-label={ariaLabel} onClick={rest.onClick}>
            {content}
        </button>
    );
}

export default FloatingActionButton;
