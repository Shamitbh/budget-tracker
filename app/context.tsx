"use client";

import {createContext, ReactNode, useContext, useEffect, useMemo, useState} from "react";
import {onAuthStateChanged, User} from "firebase/auth";
import {auth} from "@/lib/firebase";
import {clearGuestSession, GUEST_USER_ID, hasGuestSession, initializeGuestData, isGuestUser} from "@/lib/guestData";

interface AuthContextValue {
    user: User | null;
    loading: boolean;
    isGuest: boolean;
    continueAsGuest: () => void;
    signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

const guestUser = {
    uid: GUEST_USER_ID,
    displayName: "Guest",
    email: null,
    photoURL: null,
    providerData: [],
} as unknown as User;

export function AuthProvider({children}: {children: ReactNode}) {
    const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
    const [guest, setGuest] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => onAuthStateChanged(auth, (nextUser) => {
        setFirebaseUser(nextUser);
        if (!nextUser) setGuest(hasGuestSession());
        setLoading(false);
    }), []);

    const value = useMemo<AuthContextValue>(() => ({
        user: firebaseUser ?? (guest ? guestUser : null),
        loading,
        isGuest: guest,
        continueAsGuest: () => {
            initializeGuestData();
            setGuest(true);
        },
        signOut: async () => {
            if (firebaseUser) await auth.signOut();
            clearGuestSession();
            setGuest(false);
        },
    }), [firebaseUser, guest, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
}

export {isGuestUser};
