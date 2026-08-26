"use client";

import React, {useState} from "react";
import {Anchor, Button, Divider, Group, Modal, Paper, PaperProps, PasswordInput, Stack, Text, TextInput, Title} from "@mantine/core";
import {useDisclosure, useToggle} from "@mantine/hooks";
import {useForm} from "@mantine/form";
import {IconBrandGoogle, IconCompass} from "@tabler/icons-react";
import {
    createUserWithEmailAndPassword,
    getAuth,
    GoogleAuthProvider,
    sendPasswordResetEmail,
    signInWithEmailAndPassword,
    signInWithPopup,
    updateProfile,
} from "firebase/auth";
import toast from "react-hot-toast";

import {useAuth} from "@/app/context";
import {auth, ensureUserInDatabase, saveUserToDatabase} from "@/lib/firebase";

export default function LoginMantine(props: PaperProps) {
    const {continueAsGuest} = useAuth();
    const [type, toggle] = useToggle(["login", "register"]);
    const [resetOpened, {open: openReset, close: closeReset}] = useDisclosure(false);
    const [submitting, setSubmitting] = useState(false);
    const form = useForm({
        initialValues: {email: "", name: "", password: ""},
        validate: {
            name: (value) => type === "register" && !value.trim() ? "Name is required" : null,
            email: (value) => /^\S+@\S+$/.test(value) ? null : "Enter a valid email",
            password: (value) => value.length >= 6 ? null : "Password must contain at least 6 characters",
        },
    });

    const signInWithGoogle = async () => {
        try {
            const result = await signInWithPopup(auth, new GoogleAuthProvider());
            await ensureUserInDatabase(result.user);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Unable to sign in with Google");
        }
    };

    const handleSubmit = async (values: typeof form.values) => {
        setSubmitting(true);
        try {
            if (type === "register") {
                const result = await createUserWithEmailAndPassword(auth, values.email, values.password);
                await updateProfile(result.user, {displayName: values.name.trim()});
                await saveUserToDatabase(result.user);
                toast.success("Your account is ready");
            } else {
                const result = await signInWithEmailAndPassword(auth, values.email, values.password);
                await ensureUserInDatabase(result.user);
            }
        } catch (error) {
            toast.error(error instanceof Error ? error.message : `Unable to ${type}`);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Paper radius="lg" p="xl" withBorder shadow="sm" {...props}>
            <Title order={2}>{type === "login" ? "Welcome back" : "Create your account"}</Title>
            <Text color="dimmed" size="sm" mt={4}>
                {type === "login" ? "Sign in to continue managing your money." : "Start building a clearer picture of your finances."}
            </Text>

            <Button fullWidth mt="xl" variant="default" leftIcon={<IconBrandGoogle size={18}/>} onClick={signInWithGoogle}>
                Sign in with Google
            </Button>
            <Divider label="or use email" labelPosition="center" my="lg"/>

            <form onSubmit={form.onSubmit(handleSubmit)}>
                <Stack spacing="md">
                    {type === "register" && <TextInput label="Name" placeholder="Your name" withAsterisk {...form.getInputProps("name")}/>}
                    <TextInput label="Email" placeholder="hello@you.com" withAsterisk {...form.getInputProps("email")}/>
                    <PasswordInput label="Password" placeholder="Your password" withAsterisk {...form.getInputProps("password")}/>
                    <Group position="apart">
                        <Anchor component="button" type="button" size="sm" onClick={() => {form.clearErrors(); toggle();}}>
                            {type === "register" ? "Already have an account? Sign in" : "Need an account? Register"}
                        </Anchor>
                        {type === "login" && <Anchor component="button" type="button" size="sm" onClick={openReset}>Forgot password?</Anchor>}
                    </Group>
                    <Button type="submit" fullWidth loading={submitting}>{type === "login" ? "Sign in" : "Register"}</Button>
                </Stack>
            </form>

            <Divider label="or explore first" labelPosition="center" my="lg"/>
            <Button fullWidth variant="light" leftIcon={<IconCompass size={18}/>} onClick={continueAsGuest}>Continue as guest</Button>
            <Text size="xs" color="dimmed" align="center" mt="sm">Try the app with sample data. Guest changes disappear when this tab closes.</Text>

            <ForgotPasswordModal opened={resetOpened} onClose={closeReset}/>
        </Paper>
    );
}

function ForgotPasswordModal({opened, onClose}: {opened: boolean; onClose: () => void}) {
    const form = useForm({initialValues: {email: ""}, validate: {email: (value) => /^\S+@\S+$/.test(value) ? null : "Enter a valid email"}});
    return (
        <Modal opened={opened} onClose={onClose} title="Reset your password" centered>
            <form onSubmit={form.onSubmit(async ({email}) => {
                try {
                    await sendPasswordResetEmail(getAuth(), email);
                    toast.success("Password reset email sent");
                    onClose();
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Unable to send reset email");
                }
            })}>
                <TextInput label="Email" placeholder="hello@you.com" withAsterisk {...form.getInputProps("email")}/>
                <Group position="right" mt="xl"><Button variant="default" onClick={onClose}>Cancel</Button><Button type="submit">Send reset email</Button></Group>
            </form>
        </Modal>
    );
}
