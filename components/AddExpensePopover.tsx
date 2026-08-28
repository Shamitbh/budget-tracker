import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {IconPlus} from "@tabler/icons-react";
import {Button, Input, NumberInput, useMantineColorScheme, useMantineTheme} from "@mantine/core";
import {useRef, useState} from "react";
import {CategoryPicker} from "@/components/CategoryPicker";
import toast from "react-hot-toast";
import {ExpenseClass} from "@/lib/Interfaces";
import {addOrUpdateExpense} from "@/lib/firebase";
import {useAuth} from "@/app/context";
import ExpenseAddButton from "@/components/ExpenseAddButton";

interface AddExpensePopoverProps {
    month?: number;
    year?: number;
}

export default function AddExpensePopover({month, year}: AddExpensePopoverProps) {
    const {colorScheme} = useMantineColorScheme();
    return (
        <Popover>
            <PopoverTrigger asChild>
                <ExpenseAddButton/>
            </PopoverTrigger>
            <PopoverContent className={colorScheme === "dark" ? "border-border bg-popover text-popover-foreground shadow-2xl" : ""}>
                <AddExpenseForm month={month} year={year}/>
            </PopoverContent>
        </Popover>
    )
}

function AddExpenseForm({month, year}: {month?: number; year?: number}) {
    const {user} = useAuth();
    const {colorScheme} = useMantineTheme();
    const darkModeClass = `${colorScheme == 'dark' ? "text-white" : ""} `
    const width = `w-[200px]`;
    const halfWidth = `w-[98px]`;
    const nameRef = useRef<HTMLInputElement>(null);
    const priceRef = useRef<HTMLInputElement>(null);
    const [category, setCategory] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const handleCategoryChange = (category: string) => {
        setCategory(category);
    }
    return (
        <>
            <div className={darkModeClass + " grid grid-cols-1 place-items-center space-y-1"}>

                <div className={"flex justify-center w-full gap-1"}>
                    <Input
                        placeholder={"Name"}
                        className={halfWidth}
                        ref={nameRef}
                        // onChange={() => {
                        //     console.log(nameRef.current?.value)
                        // }}
                    />
                    <NumberInput
                        className={halfWidth}
                        defaultValue={0.00}
                        ref={priceRef}
                        precision={2}
                        min={-1}
                        step={1}
                        parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                        formatter={(value) =>
                            !Number.isNaN(parseFloat(value))
                                ? `$ ${value}`.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ',')
                                : '$ '
                        }
                    />


                </div>
                <div className={width + " pb-3"}>
                    <CategoryPicker
                        value={category}

                        onCategoryChange={handleCategoryChange}

                    />
                </div>


                <div className={""}>
                    <Button
                        loading={submitting}
                        onClick={async () => {
                            if (nameRef.current?.value == "") {
                                toast.error("Please enter a name")
                                return;
                            }
                            if (category == "") {
                                toast.error("Please choose a category")
                                return;
                            }

                            // first, make expense class
                            const priceString = priceRef.current?.value.replace(/\$|,/g, ''); // Remove the dollar sign and comma
                            const price = priceString ? parseFloat(priceString) : 0;
                            // console.log("Price: ", price)

                            // TODO: way to have default date (today) as ExpenseClass default?
                            const today = new Date();
                            const expense = new ExpenseClass(
                                nameRef.current!.value,
                                category,
                                price,
                                "",
                                "",
                                month ?? today.getMonth() + 1,
                                year ?? today.getFullYear(),
                            )
                            if (price <= 0) {
                                toast.error("Expense amount must be greater than zero");
                                return;
                            }
                            setSubmitting(true);
                            try {
                                await addOrUpdateExpense(user, expense);
                                toast.success(`Added ${expense.name}`);
                                if (nameRef.current) nameRef.current.value = "";
                                if (priceRef.current) priceRef.current.value = "";
                                setCategory("");
                            } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Unable to add expense");
                            } finally {
                                setSubmitting(false);
                            }

                        }}
                        variant={"outline"}
                    >
                        <IconPlus/>

                    </Button>
                </div>
            </div>
        </>
    )
}
