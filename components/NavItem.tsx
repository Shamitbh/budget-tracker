"use client";
import Link from 'next/link';
import React from "react";
import {useMantineColorScheme} from "@mantine/core";

interface Props {
    name: string;
    Icon: React.ElementType;
    href: string;
    isActive?: boolean;
    collapsed: boolean;
    // children: React.ReactNode;
}

export default function NavItem({name, Icon, href, isActive, collapsed}: Props) {
    const {colorScheme} = useMantineColorScheme();
    const selectedLight = 'bg-emerald-100 text-emerald-900 shadow-sm';
    const selectedDark = 'bg-emerald-900/60 text-emerald-100';
    return (
        <Link
            href={href}
            className={`flex flex-row py-2.5 px-3 gap-x-3 items-center rounded-lg transition-colors
                ${isActive && (colorScheme == 'dark'? selectedDark : selectedLight)} 
                ${colorScheme == 'dark' ? "hover:bg-slate-800" :"hover:bg-slate-200"}`}
        >
            <Icon
                stroke={1.5}
                className={isActive ? "text-emerald-600" : "text-slate-500"}
            />
            {!collapsed && <span className="grow text-sm">
          {name}
        </span>}
            {/*{children}*/}
        </Link>
    )
}
