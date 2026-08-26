'use client';
import {useEffect} from "react";
import {Container} from '@mantine/core';
import {useRouter} from "next/navigation";
import LoginMantine from "@/components/LoginMantine";
import {useAuth} from "@/app/context";
import Loading from "@/app/loading";

export default function Login() {
    const {user, loading} = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && user) router.replace("/");
    }, [loading, router, user]);

    if (loading || user) return <Loading/>;

    return (
        <Container my="md">
            <LoginMantine/>
        </Container>
    );
}
