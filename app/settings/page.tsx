"use client";

import Link from "next/link";
import {Button, Group, Paper, SegmentedControl, Stack, Text, ThemeIcon, Title, useMantineColorScheme} from "@mantine/core";
import {IconMoonStars, IconSun, IconUserCircle} from "@tabler/icons-react";
import {useAuth} from "@/app/context";
import Loading from "@/app/loading";
import LoginMantine from "@/components/LoginMantine";

export default function SettingsPage() {
    const {user, loading, isGuest} = useAuth();
    const {colorScheme, toggleColorScheme} = useMantineColorScheme();

    if (loading) return <Loading/>;
    if (!user) return <LoginMantine/>;

    return (
        <div className={`p-6 ${colorScheme === "dark" ? "text-white" : "text-slate-900"}`}>
            <div className="mb-8">
                <Title order={1}>Settings</Title>
                <Text color="dimmed">Customize how Argonaut looks and manage your account.</Text>
            </div>
            <Stack spacing="lg" maw={760}>
                <Paper radius="md" withBorder p="lg">
                    <Group position="apart" align="flex-start">
                        <Group align="flex-start" noWrap>
                            <ThemeIcon size="lg" variant="light">
                                {colorScheme === "dark" ? <IconMoonStars size={20}/> : <IconSun size={20}/>}
                            </ThemeIcon>
                            <div>
                                <Title order={3}>Appearance</Title>
                                <Text size="sm" color="dimmed">Choose the color scheme used throughout the app.</Text>
                            </div>
                        </Group>
                        <SegmentedControl
                            value={colorScheme}
                            onChange={(value) => toggleColorScheme(value as "light" | "dark")}
                            data={[{label: "Light", value: "light"}, {label: "Dark", value: "dark"}]}
                        />
                    </Group>
                </Paper>
                <Paper radius="md" withBorder p="lg">
                    <Group position="apart" align="center">
                        <Group align="flex-start" noWrap>
                            <ThemeIcon size="lg" variant="light"><IconUserCircle size={20}/></ThemeIcon>
                            <div>
                                <Title order={3}>Account</Title>
                                <Text size="sm" color="dimmed">{isGuest ? "Demo changes last for this browser tab only." : "Update your name, email, password, or account access."}</Text>
                                <Text size="sm" mt={6}>{isGuest ? "Guest session" : user.email}</Text>
                            </div>
                        </Group>
                        <Button component={Link} href="/profile" variant="light">{isGuest ? "About guest mode" : "Manage profile"}</Button>
                    </Group>
                </Paper>
            </Stack>
        </div>
    );
}
