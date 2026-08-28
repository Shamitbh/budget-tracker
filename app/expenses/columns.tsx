"use client";

import {ColumnDef} from "@tanstack/react-table";
import {Expense} from "@/lib/Interfaces";
import {ArrowUpDown} from "lucide-react"
import {formatCurrency} from "@/lib/utils";

/*
Columns are where you define the core of what your table will look like. They define the data that will be displayed, how it will be formatted, sorted and filtered.
 */


export const columns: ColumnDef<Expense>[] = [
    {
        accessorKey: "name",
        header: () => {
            return <div className="text-left">Name</div>;
        },
    },
    {
        accessorKey: "amount",
        header: ({column}) => {
            return (
                <div className="flex justify-end">
                    <button
                        type="button"
                        className="inline-flex items-center gap-1.5 rounded px-1 py-1 hover:text-foreground"
                        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                    >
                        Amount
                        <ArrowUpDown className="h-3.5 w-3.5"/>
                    </button>
                </div>
            )
        },
        cell: ({row}) => {
            const amount = parseFloat(row.getValue("amount"));
            return <div className="text-right font-semibold tabular-nums">{formatCurrency(amount)}</div>

        }
    },
    {
        accessorKey: "categoryID",
        header: ({column}) => {
            return (
                <button
                    type="button"
                    className="inline-flex items-center gap-1.5 rounded px-1 py-1 hover:text-foreground"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Category
                    <ArrowUpDown className="h-3.5 w-3.5"/>
                </button>
            )
        },
    },
    {
        accessorKey: "date",
        header: () => <div className="text-right">Date</div>,
        cell: ({getValue}) => <div className="text-right text-muted-foreground">{String(getValue() ?? "")}</div>,
    },
    // {
    //     accessorKey: "actions",
    //     header: "Actions",
    //     id: "actions",
    //     cell: ({row}) => {
    //         const expense: Expense = row.original
    //
    //         return (
    //             <DropdownMenu>
    //                 <DropdownMenuTrigger asChild>
    //                     <Button variant="ghost" className="h-8 w-8 p-0">
    //                         <span className="sr-only">Open menu</span>
    //                         <MoreHorizontal className="h-4 w-4"/>
    //                     </Button>
    //                 </DropdownMenuTrigger>
    //                 <DropdownMenuContent align="end">
    //                     <DropdownMenuLabel>Actions</DropdownMenuLabel>
    //                     <DropdownMenuItem
    //                         onClick={() => navigator.clipboard.writeText(expense.id)}
    //                     >
    //                         Copy Expense ID
    //                     </DropdownMenuItem>
    //                     <DropdownMenuSeparator/>
    //                     <DropdownMenuItem>
    //                         <Link href={`/expenses/${expense.id}`}>
    //                             View Expense Details
    //                         </Link>
    //                     </DropdownMenuItem>
    //                     <DropdownMenuItem
    //                         onClick={() => console.log("View Category")}
    //                     >
    //                         View Category
    //                     </DropdownMenuItem>
    //                     <DropdownMenuItem>
    //                         <button
    //                             className={"text-red-600 font-bold cursor-pointer"}
    //                             onClick={() => {
    //                                 console.log("Delete")
    //                             }}
    //
    //                         >
    //
    //                             Delete
    //                         </button>
    //                     </DropdownMenuItem>
    //                 </DropdownMenuContent>
    //             </DropdownMenu>
    //         )
    //     },
    // },

]
