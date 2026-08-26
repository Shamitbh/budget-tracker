"use client";

import {useEffect, useState} from "react";
import {
    Avatar,
    Badge,
    Button,
    Group,
    Modal,
    Paper,
    Stack,
    Text,
    TextInput,
    Title,
    useMantineTheme,
} from "@mantine/core";
import {useForm} from "@mantine/form";
import {IconAt, IconKey, IconTrash, IconUser} from "@tabler/icons-react";
import {deleteUser, getAuth, sendPasswordResetEmail, updateEmail, updateProfile, User} from "firebase/auth";
import toast from "react-hot-toast";

import {useAuth} from "@/app/context";
import Loading from "@/app/loading";
import LoginMantine from "@/components/LoginMantine";

export default function ProfilePage() {
    const {user, loading} = useAuth();
    const {colorScheme} = useMantineTheme();
    const [deleteOpened, setDeleteOpened] = useState(false);
    const [savingName, setSavingName] = useState(false);
    const [savingEmail, setSavingEmail] = useState(false);

    const nameForm = useForm({
        initialValues: {name: user?.displayName ?? ""},
        validate: {name: (value) => value.trim() ? null : "Display name is required"},
    });
    const emailForm = useForm({
        initialValues: {email: user?.email ?? ""},
        validate: {email: (value) => /^\S+@\S+$/.test(value) ? null : "Enter a valid email"},
    });

    useEffect(() => {
        if (user) {
            nameForm.setFieldValue("name", user.displayName ?? "");
            emailForm.setFieldValue("email", user.email ?? "");
        }
    }, [user]);

    if (loading) return <Loading/>;
    if (!user) return <LoginMantine/>;

    const usesPassword = user.providerData.some((provider) => provider.providerId === "password");
    const providerName = usesPassword ? "Email and password" : "Google";

    return (
        <div className={`p-6 ${colorScheme === "dark" ? "text-white" : "text-slate-900"}`}>
            <div className="mb-8">
                <Title order={1}>Profile</Title>
                <Text color="dimmed">Manage your personal details and account security.</Text>
            </div>

            <div className="grid max-w-5xl gap-5 lg:grid-cols-[280px_1fr]">
                <Paper radius="md" withBorder p="xl" className="self-start text-center">
                    <Avatar
                        src={user.photoURL || "/default_profile_pic.webp"}
                        alt={user.displayName || "Profile image"}
                        size={112}
                        radius={112}
                        mx="auto"
                        imageProps={{referrerPolicy: "no-referrer"}}
                    />
                    <Title order={3} mt="md">{user.displayName || "Argonaut user"}</Title>
                    <Text size="sm" color="dimmed" mt={4}>{user.email}</Text>
                    <Badge mt="md" variant="light">Signed in with {providerName}</Badge>
                </Paper>

                <Stack spacing="lg">
                    <Paper radius="md" withBorder p="lg">
                        <Group mb="lg"><IconUser size={20}/><Title order={3}>Personal information</Title></Group>
                        <form onSubmit={nameForm.onSubmit(async ({name}) => {
                            setSavingName(true);
                            try {
                                await updateProfile(user, {displayName: name.trim()});
                                toast.success("Display name updated");
                            } catch (error) {
                                toast.error(error instanceof Error ? error.message : "Unable to update display name");
                            } finally {
                                setSavingName(false);
                            }
                        })}>
                            <Group align="flex-end">
                                <TextInput className="flex-1" label="Display name" placeholder="Your name" {...nameForm.getInputProps("name")}/>
                                <Button type="submit" loading={savingName}>Save name</Button>
                            </Group>
                        </form>
                    </Paper>

                    <Paper radius="md" withBorder p="lg">
                        <Group mb="lg"><IconAt size={20}/><Title order={3}>Email address</Title></Group>
                        {usesPassword ? (
                            <form onSubmit={emailForm.onSubmit(async ({email}) => {
                                setSavingEmail(true);
                                try {
                                    await updateEmail(user, email.trim());
                                    toast.success("Email address updated");
                                } catch (error) {
                                    toast.error(error instanceof Error ? error.message : "Unable to update email address");
                                } finally {
                                    setSavingEmail(false);
                                }
                            })}>
                                <Group align="flex-end">
                                    <TextInput className="flex-1" label="Email" type="email" {...emailForm.getInputProps("email")}/>
                                    <Button type="submit" loading={savingEmail}>Save email</Button>
                                </Group>
                            </form>
                        ) : (
                            <Text color="dimmed">Your email is managed by Google: {user.email}</Text>
                        )}
                    </Paper>

                    <Paper radius="md" withBorder p="lg">
                        <Group mb="xs"><IconKey size={20}/><Title order={3}>Security</Title></Group>
                        <Text size="sm" color="dimmed" mb="lg">
                            {usesPassword ? "Send password reset instructions to your email address." : "Password and sign-in security are managed by Google."}
                        </Text>
                        {usesPassword && (
                            <Button variant="light" onClick={async () => {
                                if (!user.email) return;
                                try {
                                    await sendPasswordResetEmail(getAuth(), user.email);
                                    toast.success("Password reset email sent");
                                } catch (error) {
                                    toast.error(error instanceof Error ? error.message : "Unable to send reset email");
                                }
                            }}>Send password reset email</Button>
                        )}
                    </Paper>

                    <Paper radius="md" withBorder p="lg" sx={{borderColor: "var(--mantine-color-red-5)"}}>
                        <Title order={3} color="red">Danger zone</Title>
                        <Text size="sm" color="dimmed" mt={4} mb="lg">Permanently delete your account and revoke access to Argonaut.</Text>
                        <Button color="red" variant="light" leftIcon={<IconTrash size={16}/>} onClick={() => setDeleteOpened(true)}>Delete account</Button>
                    </Paper>
                </Stack>
            </div>

            <DeleteAccountModal user={user} opened={deleteOpened} onClose={() => setDeleteOpened(false)}/>
        </div>
    );
}

function DeleteAccountModal({user, opened, onClose}: {user: User; opened: boolean; onClose: () => void}) {
    return (
        <Modal opened={opened} onClose={onClose} title="Delete account?" centered>
            <Text>This permanently deletes your authentication account. This action cannot be undone.</Text>
            <Group position="right" mt="xl">
                <Button variant="default" onClick={onClose}>Cancel</Button>
                <Button color="red" onClick={async () => {
                    try {
                        await deleteUser(user);
                        toast.success("Account deleted");
                        onClose();
                    } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Unable to delete account");
                    }
                }}>Delete account</Button>
            </Group>
        </Modal>
    );
}
