import {Button, Group, NumberInput, Stack, TextInput} from "@mantine/core";
import {DateInput} from "@mantine/dates";
import {useForm} from "@mantine/form";
import {Goal} from "@/lib/Interfaces";

interface Props {
    onFormClose: () => void;
    onAddGoal: (name: string, amount: number, date: Date) => void | Promise<void>;
    onEditGoal: (goal: Goal) => void | Promise<void>;
    currentGoal?: Goal;
}

export default function AddGoalForm({onFormClose, onAddGoal, onEditGoal, currentGoal}: Props) {
    const form = useForm({
        initialValues: {
            goalName: currentGoal?.goal_name ?? "",
            goalAmount: currentGoal?.amt_goal ?? 0,
            goalDate: currentGoal ? new Date(currentGoal.goal_date) : new Date(),
        },
        validate: {
            goalName: (value) => value.trim() ? null : "Goal name is required",
            goalAmount: (value) => value > 0 ? null : "Amount must be greater than zero",
            goalDate: (value) => value < new Date(new Date().setHours(0, 0, 0, 0)) ? "Target date cannot be in the past" : null,
        },
    });

    const handleSubmit = async (values: typeof form.values) => {
        if (currentGoal) {
            await onEditGoal({...currentGoal, goal_name: values.goalName.trim(), amt_goal: values.goalAmount, goal_date: values.goalDate});
        } else {
            await onAddGoal(values.goalName.trim(), values.goalAmount, values.goalDate);
        }
        form.reset();
        onFormClose();
    };

    return (
        <form onSubmit={form.onSubmit(handleSubmit)}>
            <Stack spacing="md">
                <TextInput label="Goal name" placeholder="e.g. Summer vacation" withAsterisk {...form.getInputProps("goalName")}/>
                <NumberInput
                    label="Target amount"
                    min={0}
                    precision={2}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, "")}
                    formatter={(value) => !Number.isNaN(parseFloat(value)) ? `$ ${value}` : "$ "}
                    withAsterisk
                    {...form.getInputProps("goalAmount")}
                />
                <DateInput label="Target date" placeholder="Choose a date" minDate={new Date()} withAsterisk {...form.getInputProps("goalDate")}/>
                <Group position="right" mt="sm">
                    <Button type="button" variant="default" onClick={onFormClose}>Cancel</Button>
                    <Button type="submit">{currentGoal ? "Save changes" : "Add goal"}</Button>
                </Group>
            </Stack>
        </form>
    );
}
