"use client";
import {AuthProvider} from "./context"
import {CacheProvider} from "@emotion/react";
import {ColorScheme, ColorSchemeProvider, MantineProvider, useEmotionCache} from "@mantine/core";
import {useServerInsertedHTML} from "next/navigation";
import "./globals.css";
import Header from "@/components/Header";
import NavBar from "@/components/NavBar";
import {useEffect, useState} from "react";
import Head from "next/head";
import {Toaster} from 'react-hot-toast';
import {Manrope} from "next/font/google";

const manrope = Manrope({subsets: ["latin"], display: "swap"});

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode
}) {
    const cache = useEmotionCache();
    cache.compat = true;

    useServerInsertedHTML(() => (
        <style
            data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(' ')}`}
            dangerouslySetInnerHTML={{
                __html: Object.values(cache.inserted).join(' '),
            }}
        />
    ));


    const [colorScheme, setColorScheme] = useState<ColorScheme>('light');
    const toggleColorScheme = (value?: ColorScheme) => {
        const nextColorScheme = value || (colorScheme === 'dark' ? 'light' : 'dark');
        setColorScheme(nextColorScheme);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("budget-tracker-color-scheme", nextColorScheme);
        }
    };

    const [collapsed, setCollapsed] = useState(false);
    // set collapsed to initially true if on mobile (or any small screen)
    useEffect(() => {
        setCollapsed(window.innerWidth < 640)
        const savedColorScheme = window.localStorage.getItem("budget-tracker-color-scheme");
        if (savedColorScheme === "light" || savedColorScheme === "dark") {
            setColorScheme(savedColorScheme);
        }
    }, [])

    return (
        <>
            <CacheProvider value={cache}>
                <ColorSchemeProvider
                    colorScheme={colorScheme}
                    toggleColorScheme={toggleColorScheme}
                >
                    <MantineProvider
                        theme={{
                            colorScheme,
                            fontFamily: manrope.style.fontFamily,
                            headings: {fontFamily: manrope.style.fontFamily},
                        }}
                        withGlobalStyles
                        withNormalizeCSS
                    >
                        <html lang="en">
                        <Head>
                            <meta charSet="utf-8"/>
                        </Head>

                        <AuthProvider>
                            <body className={`${manrope.className} h-[calc(100vh-0.1rem)] ${colorScheme == 'dark' ? "bg-slate-900" : ""}`}>
                            <Header
                                onCollapse={() => setCollapsed(!collapsed)}
                            />
                            <div className={"flex relative overflow-hidden h-[calc(100%-3.5rem)]"}>
                                <NavBar collapsed={collapsed}/>
                                <main
                                    className={`flex-1 overflow-y-auto ${colorScheme === 'dark' ? "bg-slate-900" : "bg-white"}`}
                                >
                                    {children}
                                </main>

                            </div>

                            <Toaster
                                position={"bottom-right"}
                            />
                            </body>
                        </AuthProvider>
                        </html>
                    </MantineProvider>
                </ColorSchemeProvider>

            </CacheProvider>
        </>

    )
}
