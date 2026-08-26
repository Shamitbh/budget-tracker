import {Badge, Text, ThemeIcon, Title} from "@mantine/core";
import {IconChartPie, IconPigMoney, IconReceipt, IconTargetArrow} from "@tabler/icons-react";
import LoginMantine from "@/components/LoginMantine";

const features = [
    {icon: IconReceipt, title: "Track spending", description: "Keep everyday and recurring expenses organized."},
    {icon: IconChartPie, title: "Plan budgets", description: "Set category targets and see what remains at a glance."},
    {icon: IconTargetArrow, title: "Reach goals", description: "Turn savings goals into visible, measurable progress."},
];

export default function LandingPage() {
    return (
        <div className="min-h-full bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
            <div className="mx-auto grid max-w-6xl items-center gap-12 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
                <div>
                    <Badge size="lg" variant="light" leftSection={<IconPigMoney size={14}/>}>Simple personal finance</Badge>
                    <Title order={1} mt="lg" className="max-w-2xl text-4xl leading-tight sm:text-5xl">
                        Make every dollar easier to understand.
                    </Title>
                    <Text size="lg" color="dimmed" mt="md" maw={600}>
                        Budget Tracker brings expenses, budgets, and savings goals together in one calm workspace.
                    </Text>
                    <div className="mt-10 grid gap-5 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        {features.map(({icon: Icon, title, description}) => (
                            <div key={title}>
                                <ThemeIcon size="lg" variant="light"><Icon size={20}/></ThemeIcon>
                                <Text weight={600} mt="sm">{title}</Text>
                                <Text size="sm" color="dimmed" mt={3}>{description}</Text>
                            </div>
                        ))}
                    </div>
                </div>
                <LoginMantine/>
            </div>
        </div>
    );
}
