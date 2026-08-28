import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import {DateData} from "@/lib/Interfaces";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function getCurrentDate(): DateData {
    const date = new Date()
    return {
        monthName: date.toLocaleString('default', {month: 'long'}),
        day: date.getDate(),
        month: date.getMonth() + 1,
        year: date.getFullYear()
    }
}

export const formatCurrency = (value: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
}).format(Number.isFinite(value) ? value : 0);
