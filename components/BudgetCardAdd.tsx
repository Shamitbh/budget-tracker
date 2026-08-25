"use client";

import React from "react";
import {Badge, Button, Group, Paper, Progress, Text, ThemeIcon, Title} from "@mantine/core";
import {IconEdit, IconTrash} from "@tabler/icons-react";

import {icons} from "@/lib/icons";
import {Category} from "@/lib/Interfaces";

interface BudgetCardAddProps {
    category: Category;
    spent: number;
    onEdit: () => void;
    onDelete: () => void;
}

export default function BudgetCardAdd({category, spent, onEdit, onDelete}: BudgetCardAddProps) {
    const icon = icons.find((candidate) => candidate.name === category.icon)
        ?? icons.find((candidate) => candidate.name === "dashboard");
    const remaining = category.amount - spent;
    const progress = category.amount > 0 ? Math.min((spent / category.amount) * 100, 100) : 0;
    const overBudget = category.amount > 0 && spent > category.amount;

    return (
        <Paper radius="md" withBorder p="lg" data-test="budget-card">
            <Group position="apart" align="flex-start">
                <Group spacing="sm">
                    <ThemeIcon size="lg" variant="light">{icon?.component}</ThemeIcon>
                    <div>
                        <Title order={3} data-test="budget-name">{category.name}</Title>
                        <Text size="sm" color="dimmed" data-test="budget-amount">
                            ${category.amount.toFixed(2)} monthly budget
                        </Text>
                    </div>
                </Group>
                <Badge color={overBudget ? "red" : "green"}>
                    {overBudget ? `$${Math.abs(remaining).toFixed(2)} over` : `$${remaining.toFixed(2)} left`}
                </Badge>
            </Group>

            <Group position="apart" mt="lg" mb={5}>
                <Text size="sm" color="dimmed">${spent.toFixed(2)} spent</Text>
                <Text size="sm" color="dimmed">{category.amount > 0 ? `${Math.round((spent / category.amount) * 100)}%` : "Tracking only"}</Text>
            </Group>
            <Progress value={progress} color={overBudget ? "red" : "blue"}/>

            <Group position="right" mt="lg">
                <Button variant="subtle" leftIcon={<IconEdit size={16}/>} onClick={onEdit}>Edit</Button>
                <Button variant="subtle" color="red" leftIcon={<IconTrash size={16}/>} onClick={onDelete}>Remove</Button>
            </Group>
        </Paper>
    );
}
