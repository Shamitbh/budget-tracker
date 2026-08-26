import {Category, CustomButton, Expense, Goal, MonthSummary} from "@/lib/Interfaces";

export const GUEST_USER_ID = "__budget_tracker_guest__";
const STORAGE_KEY = "budget-tracker-guest-data";
const CHANGE_EVENT = "budget-tracker-guest-data-change";

export type GuestData = {
    categories: Category[];
    expenses: Expense[];
    goals: Goal[];
    buttons: CustomButton[];
};

const now = new Date();
const month = now.getMonth() + 1;
const year = now.getFullYear();

const initialGuestData = (): GuestData => ({
    categories: [
        {categoryID: "guest-food", name: "Food", amount: 300, icon: "dashboard", is_monthly: true, is_deleted: false},
        {categoryID: "guest-groceries", name: "Groceries", amount: 450, icon: "box", is_monthly: true, is_deleted: false},
        {categoryID: "guest-transport", name: "Transportation", amount: 180, icon: "train", is_monthly: true, is_deleted: false},
    ],
    expenses: [
        {id: "guest-coffee", name: "Coffee", categoryID: "Food", amount: 5.75, description: "", vendor: "Corner Cafe", date: new Date(), month, year, is_monthly: false, is_yearly: false, is_deleted: false},
        {id: "guest-groceries-1", name: "Weekly groceries", categoryID: "Groceries", amount: 86.4, description: "", vendor: "Neighborhood Market", date: new Date(), month, year, is_monthly: false, is_yearly: false, is_deleted: false},
        {id: "guest-transit", name: "Transit pass", categoryID: "Transportation", amount: 45, description: "", vendor: "", date: new Date(), month, year, is_monthly: true, is_yearly: false, is_deleted: false},
    ],
    goals: [
        {id: "guest-emergency", goal_name: "Emergency fund", goal_date: new Date(year + 1, 5, 1), amt_goal: 5000, amt_saved: 1850, date_start: new Date()},
    ],
    buttons: [],
});

const revive = (data: GuestData): GuestData => ({
    ...data,
    expenses: data.expenses.map((expense) => ({...expense, date: new Date(expense.date as Date)})),
    goals: data.goals.map((goal) => ({...goal, goal_date: new Date(goal.goal_date), date_start: new Date(goal.date_start)})),
});

export const isGuestUser = (user: {uid: string} | null | undefined) => user?.uid === GUEST_USER_ID;

export const hasGuestSession = (): boolean =>
    typeof window !== "undefined" && Boolean(window.sessionStorage.getItem(STORAGE_KEY));

export const clearGuestSession = (): void => {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(STORAGE_KEY);
};

export function initializeGuestData(): void {
    if (typeof window !== "undefined" && !window.sessionStorage.getItem(STORAGE_KEY)) {
        window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialGuestData()));
    }
}

export function getGuestData(): GuestData {
    if (typeof window === "undefined") return initialGuestData();
    initializeGuestData();
    const stored = window.sessionStorage.getItem(STORAGE_KEY);
    return stored ? revive(JSON.parse(stored) as GuestData) : initialGuestData();
}

export function updateGuestData(update: (data: GuestData) => GuestData): void {
    if (typeof window === "undefined") return;
    const next = update(getGuestData());
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeToGuestData(listener: () => void): () => void {
    if (typeof window === "undefined") return () => undefined;
    window.addEventListener(CHANGE_EVENT, listener);
    return () => window.removeEventListener(CHANGE_EVENT, listener);
}

export function getGuestSummary(targetMonth: number = month, targetYear: number = year): MonthSummary {
    const data = getGuestData();
    const summary: MonthSummary = {monthTotal: 0, categoryTotals: {}};
    data.categories.forEach((category) => {
        summary.categoryTotals[category.categoryID] = 0;
        summary.categoryTotals[category.name] = 0;
    });
    data.expenses.filter((expense) => !expense.is_deleted && expense.month === targetMonth && expense.year === targetYear).forEach((expense) => {
        summary.monthTotal += expense.amount;
        const category = data.categories.find((item) => item.categoryID === expense.categoryID);
        summary.categoryTotals[expense.categoryID] = (summary.categoryTotals[expense.categoryID] ?? 0) + expense.amount;
        if (category) summary.categoryTotals[category.name] = (summary.categoryTotals[category.name] ?? 0) + expense.amount;
    });
    return summary;
}
