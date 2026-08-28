import {IconPlus} from "@tabler/icons-react";
import React, {forwardRef} from "react";
import {cn} from "@/lib/utils";

interface ExpenseAddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    label?: string;
}

const ExpenseAddButton = forwardRef<HTMLButtonElement, ExpenseAddButtonProps>(
    ({label = "Add expense", className, ...props}, ref) => (
        <button
            ref={ref}
            type="button"
            aria-label={label}
            title={label}
            className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white shadow-sm hover:bg-teal-600 disabled:pointer-events-none disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500",
                className,
            )}
            {...props}
        >
            <IconPlus size={21} stroke={2} aria-hidden="true"/>
        </button>
    ),
);

ExpenseAddButton.displayName = "ExpenseAddButton";

export default ExpenseAddButton;
