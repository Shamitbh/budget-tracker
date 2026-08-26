"use client";
import React, {useEffect, useState} from 'react';
import {useAuth} from "@/app/context";
import {useMantineColorScheme} from '@mantine/core';
import Loading from "@/app/loading";
import { getMonthMetadata } from '@/lib/firebase';

import {
    BarChart,
    Card,
    Flex,
    Grid,
    Metric,
    ProgressBar,
    Tab,
    TabGroup,
    TabList,
    TabPanel,
    TabPanels,
    Text,
} from "@tremor/react";

type monthData = {
    category: string;
    budgetAmount: number;
    "Amount Spent": number;
    "Amount Left": number;
    "Amount Over": number;
}

export default function Page() {
    const {user, loading} = useAuth();
    const {colorScheme} = useMantineColorScheme();

    // this is typed just as a dict so that it can be used with charts
    const [categoryBudgets, setCategoryBudgets] = useState<{[key : string] : string | number;}[]>([]);
    const [budgetInfo, setBudgetInfo] = useState<{[key : string] : number;}>({
            totalSpent : 0,
            totalBudget: 0,
            budgetsExceeded: 0,
        });

    useEffect(() => {
        if (user) {
            getMonthMetadata(user).then(([categories, monthSummary]) => {
            // getCategoryBudgets(user).then(data => {
                const info = {
                    totalSpent : 0,
                    totalBudget: 0,
                    budgetsExceeded: 0,
                }
                const categoryData: monthData[] = [];
                // const categoryData : {[key : string] : string | number}[] = []
    
                categories.forEach((cb) => {
                    // generate meta-stats about budgets
                    let amtSpent = monthSummary["categoryTotals"][cb.name] || 0;
                    let amtLeft = cb["amount"] - amtSpent;
                    let amtOver = 0
                    
                    info.totalSpent += amtSpent,
                    info.totalBudget += cb["amount"]
                    
                    if (amtLeft < 0) {
                        amtOver = amtSpent - cb["amount"];
                        amtSpent = cb["amount"]; // not ideal
                        amtLeft = 0;                    
                        info.budgetsExceeded += 1
                    }
    
                    // add calculated fields to CategoryBudgets for bar chart display
                    const chartData: monthData = {
                        category: cb.name,
                        budgetAmount: cb["amount"],
                        "Amount Spent" : amtSpent,
                        "Amount Left" : amtLeft,
                        "Amount Over" : amtOver
                    }
                    // console.log(chartData)
                    categoryData.push(chartData)
                })
    
                setBudgetInfo(info);
                setCategoryBudgets(categoryData);
                // console.log(categoryData)
            }).catch(error => console.error("Unable to load budget analysis", error))
            
        }
                                  
    }, [user])

    if (loading) {
        return <Loading/>; // Or return a loading spinner
    }

    if (!user) {
        return <p>Please log in</p>
        // return <LoginMantine/>;
    }

    const numberFormatter = (number: number) =>
        `$ ${Intl.NumberFormat("us").format(number).toString()}`
    const budgetPercent = budgetInfo.totalBudget > 0
        ? Math.round(budgetInfo.totalSpent / budgetInfo.totalBudget * 100)
        : 0;

    return (
        <Flex className={`p-4 ${colorScheme == 'dark' ? "dark" : ""}`}>
            <TabGroup className="mt-2 flex-grow">
                <TabList>
                    <Tab>Budgets</Tab>
                    <Tab>Spending</Tab>
                    <Tab>Income</Tab>
                </TabList>

                <Grid numItemsMd={2} numItemsLg={2} className="gap-6 mt-6">
                    <Card>
                        <Flex alignItems="start">
                            <div className="truncate">
                                <Text>Spent so far</Text>
                                <Metric className="truncate">
                                    ${ `${Intl.NumberFormat("us").format(budgetInfo.totalSpent as number)}`}
                                </Metric>
                            </div>
                        </Flex>
                        <Flex className="mt-4 space-x-2">
                            <Text className="truncate">
                                {`${budgetPercent}%`}
                            </Text>
                            <Text>{`$ ${Intl.NumberFormat("us").format(budgetInfo.totalBudget)}`}</Text>
                        </Flex>
                        <ProgressBar value={budgetPercent} className="mt-2" />
                    </Card>
                    <Card>
                        <Flex alignItems="start">
                            <div className="truncate">
                                <Text>Budgets exceeded</Text>
                                <Metric className="truncate">{budgetInfo.budgetsExceeded} / {categoryBudgets.length}</Metric>
                            </div>
                        </Flex>
                        
                    </Card>
                </Grid>
                <TabPanels>
                    <TabPanel>
                        <Flex className='mt-6'>
                            <Card>
                                <BarChart
                                    className="grow h-80"
                                    data={categoryBudgets}
                                    index="category"
                                    categories={["Amount Spent", "Amount Left", "Amount Over"]}
                                    colors={["teal", "gray", "fuchsia"]}
                                    valueFormatter={numberFormatter}
                                    stack={true}
                                    layout="vertical"
                                    yAxisWidth={90}
                                />
                            </Card>
                        </Flex>
                    </TabPanel>

                    <TabPanel>
                        <Card className="mt-6 text-center">
                            <Metric>Spending insights are coming soon</Metric>
                            <Text className="mt-2">We’re preparing reliable trends across multiple months.</Text>
                        </Card>
                    </TabPanel>

                    <TabPanel>
                        <div className="mt-6">
                            <Card className="text-center">
                                <Metric>Income tracking is coming soon</Metric>
                                <Text className="mt-2">Income tools will appear here when they are ready.</Text>
                            </Card>
                        </div>
                    </TabPanel>
                
                </TabPanels>
            </TabGroup>
           
        </Flex>
    );
}
