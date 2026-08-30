"use client";
import {Expense, ExpenseClass} from "@/lib/Interfaces";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow,} from "@/components/ui/table"
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input"
import {CategoryPicker} from "@/components/CategoryPicker";
import {IconPlus} from "@tabler/icons-react";
import ExpenseAddButton from "@/components/ExpenseAddButton";
import {ExpenseSectionHeader, ExpenseSortButton, ExpenseTableEmptyState, ExpenseTableFrame, expenseTableHeaderClass, expenseTableRowClass} from "@/components/ExpenseTablePrimitives";
import {formatCurrency} from "@/lib/utils";
import {ChangeEvent, MutableRefObject, useEffect, useMemo, useRef, useState} from "react";
import {addOrUpdateExpense, deactivateRecurringExpense, useExpenses} from "@/lib/firebase";
import {useAuth} from "@/app/context";
import {debounce} from "lodash"
import {useMantineTheme} from "@mantine/core";
import toast from "react-hot-toast";
import Loading from "@/app/loading";

interface MonthlyExpensesProps {
    width?: string;
    height?: string;
    month?: number;
    year?: number;
}

type MonthlySortKey = "name" | "categoryID" | "amount";

export default function MonthlyExpenses({width = "w-full", height = "h-full", month, year}: MonthlyExpensesProps) {
    const initialExpenseRow = {
        name: "",
        category: "",
        amount: 0,
        description: ""
    };

    const [showForm, setShowForm] = useState<boolean>(false);
    const [newExpenseRow, setNewExpenseRow] = useState(initialExpenseRow);
    const [sort, setSort] = useState<{key: MonthlySortKey; direction: "asc" | "desc"} | null>(null);
    const {user, loading} = useAuth();

    const currentExpenses: Expense[] = useExpenses(user, true, month, year);
    const sortedExpenses = useMemo(() => {
        if (!sort) return currentExpenses;
        return [...currentExpenses].sort((a, b) => {
            const left = a[sort.key];
            const right = b[sort.key];
            const comparison = typeof left === "number" && typeof right === "number"
                ? left - right
                : String(left).localeCompare(String(right), undefined, {sensitivity: "base"});
            return sort.direction === "asc" ? comparison : -comparison;
        });
    }, [currentExpenses, sort]);

    const toggleSort = (key: MonthlySortKey) => {
        setSort((current) => current?.key === key
            ? {key, direction: current.direction === "asc" ? "desc" : "asc"}
            : {key, direction: "asc"});
    };

    const sortDirection = (key: MonthlySortKey) => sort?.key === key ? sort.direction : false;

    // TODO: Too many hooks or re-renders below
    // Updating from MonthlyExpenses is commented out for now
    // const [currentExpenses, setCurrentExpenses] = useState<Expense[]>([]);
    // setCurrentExpenses(useExpenses(user, sampleDateData.month, sampleDateData.year, true));

    // useEffect(() => {
        // if (user) {
            // getExpenses(user, sampleDateData.month, sampleDateData.year, true).then(expenses => {
            //     setCurrentExpenses(expenses)
            //     console.log("Expenses: ", expenses)
            // })
        // }
    // }, [user])

    // TODO replace with custom loading skeleton
    if (loading) return <Loading/>

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>, field: string) => {
        const value = field === 'amount' ? parseFloat(e.target.value) : e.target.value;
        setNewExpenseRow({
            ...newExpenseRow,
            [field]: value,
        });
    };

    const handleCategoryPickerChange = (newValue: string) => {
        setNewExpenseRow({
            ...newExpenseRow,
            category: newValue,
        });
    }

    const handleCellEdit = async (
        newValue: string | number,
        expense: Expense,
        field: keyof Expense
    ) => {
        let processedValue = newValue;

        if (field === "amount") {
            processedValue = parseFloat(String(newValue).replace(/,/g, ""));
        }

        if (expense[field] !== processedValue) {
                const updatedExpense = {
                    ...expense,
                    [field]: processedValue,
                };

                // convert to class for addOrUpdateExpense function
                const exp = updatedExpense;
                const expAsClass = new ExpenseClass(exp.name, exp.categoryID, exp.amount, exp.description, exp.vendor,  exp.month, exp.year, exp.is_monthly, exp.is_yearly, exp.is_deleted);
                expAsClass.id = exp.id;
                expAsClass.recurringExpenseID = exp.recurringExpenseID;
                expAsClass.recurrenceActive = exp.recurrenceActive;
                
                try {
                    await addOrUpdateExpense(user, expAsClass);
                    toast.success("Monthly expense updated");
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to update expense");
                }
        }

        // setCurrentExpenses(updatedExpenses);
    };


    const toggleForm = () => {
        setShowForm(!showForm);
    }

    const stopRecurrence = async (expense: Expense) => {
        if (!expense.recurringExpenseID) return;
        try {
            await deactivateRecurringExpense(user, expense);
            toast.success("Future occurrences stopped");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to stop recurrence");
        }
    };


    const handleSubmit = async () => {
        const today = new Date();
        const _newExpense = new ExpenseClass(
            newExpenseRow.name,
            newExpenseRow.category,
            newExpenseRow.amount,
            newExpenseRow.description,
            "", // vendor
            month ?? today.getMonth() + 1,
            year ?? today.getFullYear(),
            true // is_monthly,
        )

        if (!_newExpense.name.trim() || !_newExpense.categoryID || _newExpense.amount <= 0) {
            toast.error("Enter a name, category, and amount greater than zero");
            return;
        }
        try {
            await addOrUpdateExpense(user, _newExpense, true)
            toast.success("Monthly expense added");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to add monthly expense");
            return;
        }


        // setCurrentExpenses([...currentExpenses, newExpense]);
        toggleForm();

        // reset form fields
        setNewExpenseRow(initialExpenseRow);
    };

    return (
        <div className={`${width} ${height}`}>
            <ExpenseSectionHeader
                title="Monthly Expenses"
                action={<ExpenseAddButton
                    label={showForm ? "Close monthly expense form" : "Add monthly expense"}
                    aria-expanded={showForm}
                    onClick={toggleForm}
                />}
            />
            <ExpenseTableFrame>
            <Table>

                <TableHeader className={expenseTableHeaderClass}>
                    <TableRow>
                        <TableHead><ExpenseSortButton label="Name" direction={sortDirection("name")} onClick={() => toggleSort("name")}/></TableHead>
                        <TableHead><ExpenseSortButton label="Category" direction={sortDirection("categoryID")} onClick={() => toggleSort("categoryID")}/></TableHead>
                        <TableHead><ExpenseSortButton label="Amount" align="right" direction={sortDirection("amount")} onClick={() => toggleSort("amount")}/></TableHead>
                        <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {currentExpenses.length === 0 && !showForm && (
                        <ExpenseTableEmptyState colSpan={4} monthly/>
                    )}
                    {
                        sortedExpenses.map((expense) => {
                                return (
                                    <TableRow key={expense.id} className={expenseTableRowClass}>
                                        <EditableTableCell
                                            className={"w-[150px] text-left"}
                                            initialValue={expense.name}
                                            onEdit={(newValue) => handleCellEdit(newValue, expense, "name")}
                                            type={"text"}
                                        />

                                        <EditableTableCell
                                            className="w-[30px] text-left"
                                            initialValue={expense.categoryID}
                                            onEdit={(newValue) => handleCellEdit(newValue, expense, "categoryID")}
                                            type={"category"}
                                        />
                                        <EditableTableCell
                                            className="w-[100px] text-right font-semibold tabular-nums"
                                            initialValue={`${expense.amount}`}
                                            onEdit={(newValue) => handleCellEdit(newValue, expense, "amount")}
                                            isCurrency
                                        />


                                        <TableCell className="w-[100px] text-right">
                                            {expense.recurringExpenseID && expense.recurrenceActive !== false && (
                                                <Button
                                                    variant={"ghost"}
                                                    size={"sm"}
                                                    title={"Stop creating this expense in future months"}
                                                    onClick={() => void stopRecurrence(expense)}
                                                >
                                                    Stop
                                                </Button>
                                            )}
                                            {expense.recurringExpenseID && expense.recurrenceActive === false && (
                                                <span className={"text-sm text-gray-500"}>Stopped</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                )
                            }
                        )
                    }
                    {showForm &&

                        <TableRow className={expenseTableRowClass}>
                            <TableCell className={""}>
                                <Input
                                    placeholder={"Expense Name"}
                                    onChange={(e) => handleInputChange(e, "name")}
                                />
                            </TableCell>
                            <TableCell className={""}>
                                <CategoryPicker
                                    onCategoryChange={handleCategoryPickerChange}
                                    value={newExpenseRow.category}
                                />

                                {/*<Input*/}
                                {/*    placeholder={""}*/}
                                {/*    onChange={(e) => handleInputChange(e, "category")}*/}
                                {/*/>*/}
                            </TableCell>
                            <TableCell className={""}>
                                <Input
                                    placeholder={"$"}
                                    onChange={(e) => handleInputChange(e, "amount")}
                                />
                            </TableCell>
                            <TableCell className="text-right">
                                <button
                                    type="button"
                                    aria-label="Save monthly expense"
                                    className={"pr-2 pl-2 pb-1"}
                                    onClick={handleSubmit}
                                >
                                    <IconPlus/>
                                </button>
                            </TableCell>
                        </TableRow>
                    }
                    {currentExpenses.length > 0 && (
                        <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell className="text-right font-semibold text-muted-foreground" colSpan={2}>Total</TableCell>
                            <TableCell className="text-right font-bold tabular-nums">
                                {formatCurrency(currentExpenses.reduce((total, expense) => total + expense.amount, 0))}
                            </TableCell>
                            <TableCell/>
                        </TableRow>
                    )}


                </TableBody>
            </Table>
            </ExpenseTableFrame>


        </div>
    )
}


interface EditableTableCellProps {
    initialValue: string | number;
    onEdit: (newValue: string | number) => void;
    isCurrency?: boolean;
    className?: string;
    type?: "text" | "category" | "amount";
}

const EditableTableCell = ({initialValue, onEdit, isCurrency, className, type}: EditableTableCellProps) => {
    const {colorScheme} = useMantineTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState<string | number>(initialValue);
    const inputRef: MutableRefObject<HTMLInputElement | null> = useRef(null);

    const handleClickOutside = (event: MouseEvent) => {
        if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
            handleEdit();
        }
    };

    useEffect(() => {
        if (isEditing) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [isEditing])


    const handleEdit = () => {
        onEdit(value);
        setIsEditing(false);
    }

    const debounceOnEdit = debounce(onEdit, 5000);

    useEffect(() => {
        if (!isEditing) {
            debounceOnEdit(value);
        }
    }, [isEditing])

    const handleCellClick = () => {
        if (!isEditing) {
            setIsEditing(true);
        }
    };
    return (
        <TableCell
            className={`${className}`}
            style={{cursor: isEditing ? 'text' : 'pointer'}}
            onClick={handleCellClick}
        >

            {isEditing ? (
                    type === "category" ? (
                            <CategoryPicker onCategoryChange={(newValue) => {
                                setValue(newValue);
                                handleEdit();
                            }}/>
                        )
                        :
                        <Input
                            type={"text"}
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            onBlur={handleEdit}
                            onKeyDown={(e) => {
                                e.key === 'Enter' && handleEdit()
                            }}
                            className={isCurrency ? "text-center text-mono" : "text-left"}
                        />
                )
                :
                (
                    <span
                        style={{display: 'block', width: '100%', height: '100%'}}
                        onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setIsEditing(true)
                        }}
                    >

                        <span className={`${colorScheme == 'dark' ? "text-white" : ""}`}>

                        {isCurrency ? `$${Number(value).toLocaleString('en-US', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}` : value}
                        </span>
                    </span>
                )
            }
        </TableCell>
    );

}
