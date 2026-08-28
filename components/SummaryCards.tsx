import {IconPigMoney, IconReceipt2, IconWallet} from "@tabler/icons-react";
import {Category, MonthSummary} from "@/lib/Interfaces";

const money = new Intl.NumberFormat("en-US", {style: "currency", currency: "USD"});

export default function SummaryCards({budgets, summary}: {budgets: Category[] | null; summary?: MonthSummary}) {
    const budget = budgets?.reduce((total, item) => total + item.amount, 0) || 0;
    const spent = summary?.monthTotal || 0;
    const remaining = budget - spent;
    const cards = [
        {label: "Spent this month", value: money.format(spent), icon: IconReceipt2, tone: "text-blue-600 bg-blue-50 dark:bg-blue-950/40"},
        {label: "Monthly budget", value: money.format(budget), icon: IconWallet, tone: "text-violet-600 bg-violet-50 dark:bg-violet-950/40"},
        {label: "Remaining", value: money.format(remaining), icon: IconPigMoney, tone: remaining < 0 ? "text-red-600 bg-red-50 dark:bg-red-950/40" : "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40"},
    ];

    return (
        <section aria-label="Monthly summary" className="mb-6 grid gap-4 sm:grid-cols-3">
            {cards.map(({label, value, icon: Icon, tone}) => (
                <div key={label} className="rounded-xl border bg-card p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-muted-foreground">{label}</p>
                        <span className={`rounded-lg p-2 ${tone}`}><Icon size={20} aria-hidden="true"/></span>
                    </div>
                    <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
                </div>
            ))}
        </section>
    );
}
