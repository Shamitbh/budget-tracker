"use client";

import {ColumnDef} from "@tanstack/react-table";
import {Expense} from "@/lib/Interfaces";
import {formatCurrency} from "@/lib/utils";
import {ExpenseSortButton} from "@/components/ExpenseTablePrimitives";

/*
Columns are where you define the core of what your table will look like. They define the data that will be displayed, how it will be formatted, sorted and filtered.
 */


export const columns: ColumnDef<Expense>[] = [
    {
        accessorKey: "name",
        header: ({column}) => {
            return <ExpenseSortButton label="Name" direction={column.getIsSorted()} onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}/>;
        },
    },
    {
        accessorKey: "categoryID",
        header: ({column}) => {
            return (
                <ExpenseSortButton label="Category" direction={column.getIsSorted()} onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}/>
            )
        },
    },
    {
        accessorKey: "amount",
        header: ({column}) => {
            return (
                <ExpenseSortButton label="Amount" align="right" direction={column.getIsSorted()} onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}/>
            )
        },
        cell: ({row}) => {
            const amount = parseFloat(row.getValue("amount"));
            return <div className="text-right font-semibold tabular-nums">{formatCurrency(amount)}</div>

        }
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
