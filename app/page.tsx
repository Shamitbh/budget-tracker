"use client";
import './globals.css';
import React from 'react';
import {useAuth} from "@/app/context";
import {rem,} from '@mantine/core';
import {ThreeColumnLayout} from "@/components/layouts/ThreeColumnLayout";
import {useCategories, useSummary} from "@/lib/firebase";
import {Category, MonthSummary} from "@/lib/Interfaces";

import Loading from "@/app/loading";
import ComponentFrameCenter from "@/components/layouts/ComponentFrameCenter";
import BudgetCard from "@/components/BudgetCard";

import LoadingAtAGlance from "@/components/layouts/LoadingAtAGlance";
import MiniExpenses from "@/components/miniComponents/MiniExpenses";
import MonthlyExpenses from "@/components/MonthlyExpenses";
import LandingPage from "@/components/LandingPage";
import SummaryCards from "@/components/SummaryCards";

const PRIMARY_COL_HEIGHT = rem(400);

export default function Home() {
    const {user, loading} = useAuth();

    const budgets: Category[] | null = useCategories(user);
    const summary: MonthSummary | undefined = useSummary(user);

    if (loading) {
        return <Loading/>; // Or return a loading spinner
    }

    if (!user) {
        return <LandingPage/>;
    }


    return (
        <>
            <div className="mx-auto w-full max-w-screen-2xl px-4 pt-6 sm:px-6 lg:px-8">
                <SummaryCards budgets={budgets} summary={summary}/>
            </div>
            <ThreeColumnLayout
                one={<MiniExpenses/>}
                two={<MonthlyExpensesFrame/>}
                three={<AtAGlance budgets={budgets} summary={summary}/>}
            />
        </>
    )
}

const MonthlyExpensesFrame = () => {
    return (
        <ComponentFrameCenter
            PRIMARY_COL_HEIGHT={PRIMARY_COL_HEIGHT}
            title={"Monthly Expenses"}
        >
            <MonthlyExpenses/>
        </ComponentFrameCenter>
    )
}

interface AtAGlanceProps {
    budgets: Category[] | null;
    summary: MonthSummary | undefined;
}

const AtAGlance = ({budgets, summary}: AtAGlanceProps) => {

    return (
        <>
            <ComponentFrameCenter
                PRIMARY_COL_HEIGHT={"600px"}
                title={"At a Glance"}
            >
                <div
                    className={"grid md:grid-cols-2 sm:grid-cols-1 gap-5"}
                >

                    {budgets ? budgets.map((category: Category) => {
                            return (
                                <BudgetCard
                                    key={category.categoryID}
                                    id={category.categoryID}
                                    budgetName={category.name}
                                    budgetAmount={category.amount}
                                    spent={summary?.categoryTotals[category.name] || 0} // TODO: duplicate spent in Category? old: {category.spent}
                                    iconName={category.icon}
                                />
                            )
                        }) :
                        <LoadingAtAGlance/>
                    }
                </div>


            </ComponentFrameCenter>
        </>
    )
}
