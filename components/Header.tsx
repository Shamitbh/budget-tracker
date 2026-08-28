"use client";
import { IconMenu2, IconPigMoney } from '@tabler/icons-react'
import Link from 'next/link';
import ThemeSwitcher from "@/components/ThemeSwitcher";
import { useMantineColorScheme, Image } from "@mantine/core";
import { useAuth } from "@/app/context";

interface Props {
//   collapsed: boolean;
  onCollapse: () => void;
}

export default function Header({onCollapse}: Props) {
  const {user} = useAuth();
  const profileURL = user?.photoURL ? user.photoURL : "/default_profile_pic.webp"

  const {colorScheme} = useMantineColorScheme();

  return(
    <header className={`sticky self-start top-0 w-full flex flex-row px-6 py-3 gap-3 border-b items-center ${colorScheme == 'dark' ? "bg-slate-800 border-slate-600" : "bg-slate-100"} z-20`}>
        {user && (
            <button className="cursor-pointer items-center rounded p-1 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500" onClick={onCollapse} aria-label="Toggle navigation">
                <IconMenu2 color={colorScheme === 'dark' ? 'white' : 'gray'}/>
            </button>
        )}
        <Link href="/" className={`flex items-center gap-2 text-xl font-bold tracking-tight ${colorScheme == 'dark'? "text-white" : ""}`}>
            <span className="rounded-lg bg-emerald-600 p-1.5 text-white"><IconPigMoney size={20}/></span>
            Budget Tracker
        </Link>
        
        <div className="ml-auto">
            <ThemeSwitcher />
        </div>
        {user && <Link href="/profile" className="justify-self-end" aria-label="Open profile">
            <Image 
                maw={35} 
                mx="auto" 
                radius="50%" 
                src={profileURL} 
                alt="Profile image" 
                imageProps={{referrerPolicy : "no-referrer"}}
                />
        </Link>}
    </header>
  )
  
}
