import {IconReceiptOff} from "@tabler/icons-react";
import React from "react";
import {TableCell, TableRow} from "@/components/ui/table";

export function ExpenseTableFrame({children}: {children: React.ReactNode}) {
    return <div className="overflow-hidden rounded-xl border bg-card shadow-sm">{children}</div>;
}

export function ExpenseTableEmptyState({colSpan, monthly = false}: {colSpan: number; monthly?: boolean}) {
    return (
        <TableRow className="hover:bg-transparent">
            <TableCell colSpan={colSpan} className="h-48 text-center">
                <div className="mx-auto flex max-w-sm flex-col items-center gap-2 text-muted-foreground">
                    <span className="rounded-full bg-muted p-3"><IconReceiptOff size={26} aria-hidden="true"/></span>
                    <p className="font-semibold text-foreground">No {monthly ? "monthly " : ""}expenses yet</p>
                    <p className="text-sm">Add an expense to start seeing {monthly ? "recurring costs" : "this month’s spending patterns"}.</p>
                </div>
            </TableCell>
        </TableRow>
    );
}

export const expenseTableHeaderClass = "bg-muted/50 [&_th]:h-11 [&_th]:text-xs [&_th]:font-semibold [&_th]:uppercase [&_th]:tracking-wider";
export const expenseTableRowClass = "hover:bg-muted/40 [&_td]:py-3.5";
