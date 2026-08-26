"use client";

import {useMemo, useState} from "react";
import {Button, Group, Modal, Select, Text, Title, useMantineTheme} from "@mantine/core";
import {IconPlus} from "@tabler/icons-react";
import toast from "react-hot-toast";
import {useAuth} from "@/app/context";
import Loading from "@/app/loading";
import AddGoalForm from "@/components/AddEditGoalForm";
import GoalCard from "@/components/GoalCard";
import LoginMantine from "@/components/LoginMantine";
import {addNewGoal, useGoals} from "@/lib/firebase";

type SortOption = "date" | "name" | "amount";

export default function GoalsPage() {
    const {user, loading} = useAuth();
    const {colorScheme} = useMantineTheme();
    const goals = useGoals(user);
    const [formOpened, setFormOpened] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>("date");

    const sortedGoals = useMemo(() => [...(goals ?? [])].sort((a, b) => {
        if (sortBy === "name") return a.goal_name.localeCompare(b.goal_name);
        if (sortBy === "amount") return a.amt_goal - b.amt_goal;
        return new Date(a.goal_date).getTime() - new Date(b.goal_date).getTime();
    }), [goals, sortBy]);

    if (loading) return <Loading/>;
    if (!user) return <LoginMantine/>;

    return (
        <div className={`p-6 ${colorScheme === "dark" ? "text-white" : "text-slate-900"}`}>
            <Group position="apart" align="flex-start" mb="xl">
                <div>
                    <Title order={1}>Goals</Title>
                    <Text color="dimmed">Turn long-term plans into measurable savings targets.</Text>
                </div>
                <Group>
                    <Select
                        aria-label="Sort goals"
                        value={sortBy}
                        onChange={(value) => setSortBy((value as SortOption | null) ?? "date")}
                        data={[
                            {value: "date", label: "Target date"},
                            {value: "name", label: "Goal name"},
                            {value: "amount", label: "Goal amount"},
                        ]}
                    />
                    <Button leftIcon={<IconPlus size={18}/>} onClick={() => setFormOpened(true)}>Add goal</Button>
                </Group>
            </Group>
            {goals === null ? (
                <Loading/>
            ) : sortedGoals.length === 0 ? (
                <div className="rounded-lg border border-dashed p-10 text-center">
                    <Title order={3}>No savings goals yet</Title>
                    <Text color="dimmed" mt="xs" mb="md">Create a goal and start tracking your progress.</Text>
                    <Button leftIcon={<IconPlus size={18}/>} onClick={() => setFormOpened(true)}>Add your first goal</Button>
                </div>
            ) : (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {sortedGoals.map((goal) => <GoalCard key={goal.id} user={user} goal={goal}/>) }
                </div>
            )}
            <Modal opened={formOpened} onClose={() => setFormOpened(false)} title="Add savings goal" centered>
                <AddGoalForm
                    onFormClose={() => setFormOpened(false)}
                    onAddGoal={async (name, amount, date) => {
                        await addNewGoal(user, name, amount, date);
                        toast.success(`${name} added`);
                    }}
                    onEditGoal={() => undefined}
                />
            </Modal>
        </div>
    );
}
