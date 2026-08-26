'use client';
import {Button, Container, Text, Title} from '@mantine/core';
import LoginMantine from "@/components/LoginMantine";
import {useAuth} from "@/app/context";

export default function Login() {
    const {user, isGuest, signOut} = useAuth();
    if (user) {
        return (
            <Container size="xs" py="xl">
                <Title order={2}>{isGuest ? "You’re exploring as a guest" : `Welcome, ${user.displayName || "back"}`}</Title>
                <Text color="dimmed" mt="sm" mb="lg">
                    {isGuest ? "Your demo changes are kept only in this browser tab." : "You’re already signed in to Argonaut."}
                </Text>
                <Button variant="outline" onClick={() => void signOut()}>{isGuest ? "Exit demo" : "Sign out"}</Button>
            </Container>
        )
    } else {
        return (
            <Container
                my={"md"}
            >
                <LoginMantine/>
            </Container>
        )
    }
}

