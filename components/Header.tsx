"use client";
import { IconMenu2 } from '@tabler/icons-react'
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
            <button className="cursor-pointer items-center rounded p-1" onClick={onCollapse} aria-label="Toggle navigation">
                <IconMenu2 color={colorScheme === 'dark' ? 'white' : 'gray'}/>
            </button>
        )}
        <Link href="/" 
            className={`text-2xl font-bold font-mono justify-self-start transition-all ${colorScheme == 'dark'? "text-amber-50" : ""}`}
            >Argonaut
        </Link>
           
        <Link href="https://github.com/Shamitbh/budget-tracker"
            target="_blank"
            rel="noreferrer"
            className="text-xs font-medium bg-slate-200 text-slate-700 rounded-sm px-2 py-1"
            >GitHub
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
