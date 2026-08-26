"use client";

import {useState} from "react";
import {
    ActionIcon,
    Badge,
    Button,
    Group,
    Menu,
    Modal,
    NumberInput,
    Paper,
    Popover,
    Progress,
    Stack,
    Text,
    Title,
} from "@mantine/core";
import {useForm} from "@mantine/form";
import {IconDots, IconEdit, IconPlus, IconTrash} from "@tabler/icons-react";
import {User} from "firebase/auth";
import toast from "react-hot-toast";

import AddGoalForm from "@/components/AddEditGoalForm";
import {deleteGoal, editGoal} from "@/lib/firebase";
import {Goal} from "@/lib/Interfaces";

interface GoalCardProps {
    user: User | null;
    goal: Goal;
}

const formatCurrency = (amount: number) => new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
}).format(amount);

export default function GoalCard({user, goal}: GoalCardProps) {
    const [editOpened, setEditOpened] = useState(false);
    const [deleteOpened, setDeleteOpened] = useState(false);
    const saved = Math.min(goal.amt_saved, goal.amt_goal);
    const remaining = Math.max(goal.amt_goal - goal.amt_saved, 0);
    const progress = goal.amt_goal > 0 ? Math.min((goal.amt_saved / goal.amt_goal) * 100, 100) : 0;
    const complete = remaining === 0;

    return (
        <>
            <Paper radius="md" withBorder p="lg">
                <Group position="apart" align="flex-start" noWrap>
                    <div>
                        <Title order={3}>{goal.goal_name}</Title>
                        <Text size="sm" color="dimmed">Target {new Date(goal.goal_date).toLocaleDateString()}</Text>
                    </div>
                    <Menu position="bottom-end" withinPortal>
                        <Menu.Target>
                            <ActionIcon variant="subtle" aria-label={`Manage ${goal.goal_name}`}><IconDots size={20}/></ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Item icon={<IconEdit size={16}/>} onClick={() => setEditOpened(true)}>Edit goal</Menu.Item>
                            <Menu.Item color="red" icon={<IconTrash size={16}/>} onClick={() => setDeleteOpened(true)}>Delete goal</Menu.Item>
                        </Menu.Dropdown>
                    </Menu>
                </Group>

                <Group position="apart" mt="xl" mb={6}>
                    <Text size="sm" color="dimmed">{formatCurrency(saved)} saved</Text>
                    <Badge color={complete ? "green" : "blue"}>{complete ? "Complete" : `${Math.round(progress)}%`}</Badge>
                </Group>
                <Progress value={progress} color={complete ? "green" : "blue"} size="md" radius="xl"/>

                <Group position="apart" mt="lg" align="flex-end">
                    <div>
                        <Text size="xs" color="dimmed">Remaining</Text>
                        <Text weight={600}>{formatCurrency(remaining)}</Text>
                    </div>
                    {!complete && <AddFundsPopover goal={goal} user={user} remaining={remaining}/>}
                </Group>
            </Paper>

            <Modal opened={editOpened} onClose={() => setEditOpened(false)} title="Edit savings goal" centered>
                <AddGoalForm
                    currentGoal={goal}
                    onFormClose={() => setEditOpened(false)}
                    onAddGoal={() => undefined}
                    onEditGoal={async (updatedGoal) => {
                        await editGoal(user, updatedGoal);
                        toast.success(`${updatedGoal.goal_name} updated`);
                    }}
                />
            </Modal>

            <Modal opened={deleteOpened} onClose={() => setDeleteOpened(false)} title="Delete savings goal?" centered>
                <Text>Delete <strong>{goal.goal_name}</strong>? This cannot be undone.</Text>
                <Group position="right" mt="xl">
                    <Button variant="default" onClick={() => setDeleteOpened(false)}>Cancel</Button>
                    <Button color="red" onClick={async () => {
                        await deleteGoal(user, goal.id);
                        setDeleteOpened(false);
                        toast.success(`${goal.goal_name} deleted`);
                    }}>Delete goal</Button>
                </Group>
            </Modal>
        </>
    );
}

function AddFundsPopover({goal, user, remaining}: {goal: Goal; user: User | null; remaining: number}) {
    const [opened, setOpened] = useState(false);
    const form = useForm({
        initialValues: {amount: 0},
        validate: {amount: (value) => value <= 0 ? "Amount must be greater than zero" : value > remaining ? "Amount exceeds the remaining goal" : null},
    });

    return (
        <Popover opened={opened} onChange={setOpened} position="bottom-end" withArrow shadow="md">
            <Popover.Target>
                <Button variant="light" leftIcon={<IconPlus size={16}/>} onClick={() => setOpened((value) => !value)}>Add savings</Button>
            </Popover.Target>
            <Popover.Dropdown>
                <form onSubmit={form.onSubmit(async ({amount}) => {
                    await editGoal(user, {...goal, amt_saved: goal.amt_saved + amount});
                    toast.success(`${formatCurrency(amount)} added to ${goal.goal_name}`);
                    form.reset();
                    setOpened(false);
                })}>
                    <Stack spacing="sm">
                        <NumberInput
                            label="Amount"
                            min={0}
                            max={remaining}
                            precision={2}
                            autoFocus
                            {...form.getInputProps("amount")}
                        />
                        <Button type="submit" fullWidth>Add savings</Button>
                    </Stack>
                </form>
            </Popover.Dropdown>
        </Popover>
    );
}
