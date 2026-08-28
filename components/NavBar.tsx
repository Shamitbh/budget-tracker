// noinspection JSIgnoredPromiseFromCall

"use client";
// import {useEffect, useState} from 'react';

import {
    IconChartAreaLine,
    IconDashboard,
    IconFingerprint,
    IconLogout,
    IconMoneybag,
    IconReceipt2,
    IconSettings,
    IconPigMoney,
} from '@tabler/icons-react';
import {usePathname} from 'next/navigation'
import NavItem from '@/components/NavItem';
import {useMantineColorScheme} from "@mantine/core";
import {useAuth} from "@/app/context";
// import Link from 'next/link';
// import ThemeSwitcher from "@/components/ThemeSwitcher";

const data = [
    {link: '/', label: 'Dashboard', icon: IconDashboard},
    {link: '/analysis', label: 'Analysis', icon: IconChartAreaLine},
    {link: '/expenses', label: 'Expenses', icon: IconReceipt2},
    {link: '/budgets', label: 'Budgets', icon: IconMoneybag},
    {link: '/settings', label: 'Settings', icon: IconSettings},
    {link: '/goals', label: 'Goals', icon: IconPigMoney}
];

interface Props {
    collapsed: boolean;
}

export default function NavBar({collapsed}: Props) {
  const pathname = usePathname();
  const {colorScheme} = useMantineColorScheme();
  const {user, loading, isGuest, signOut} = useAuth();
  if (!loading && !user) return null;
  // NOTE: seems like transitions work without setting animationCompleted?
//   let animationDuration = 100;
//   const [animationCompleted, setAnimationCompleted] = useState(true);

//   useEffect(() => {
//     setAnimationCompleted(false);
//     const timer: NodeJS.Timeout = setTimeout(() => {
//         setAnimationCompleted(true);
//     }, animationDuration);
//     return () => clearTimeout(timer);
//   }, [animationDuration, collapsed])

  return (
    <aside className={`flex absolute md:relative h-full z-30 border-r shadow-xl md:shadow-sm
            ${colorScheme == 'dark' ? "bg-slate-950/80" : "bg-slate-50"}
            ${collapsed ? "-translate-x-full w-64 md:translate-x-0 md:w-[4.5rem]" : "translate-x-0 w-64"} transition-all duration-200`}>
      <nav className="flex flex-col m-3 gap-2 divide-y w-full">
          {/* <div className="flex flex-row px-2 py-1 gap-3 items-center">
            {animationCompleted && !collapsed && 
                <Link href="/" 
                    className={`text-2xl font-bold justify-self-start transition-all`}
              >Budget Tracker
              </Link>}
              
            {animationCompleted && !collapsed && 
                <Link href="/" 
                    className="text-xs bg-slate-200 rounded-sm p-1"
                >v0.2
                </Link>}
                
            {animationCompleted && !collapsed &&
                    <ThemeSwitcher/>
                }
            <div
                className={`cursor-pointer grow items-center`}
                onClick={() => {
                    setCollapsed(!collapsed);
                    setAnimationCompleted(false);
                }}
            >
                <IconArrowsExchange
                    color={'black'}
                />
            </div>
          </div> */}
            
          <div className="flex flex-col gap-y-3 pt-3">
              {data.map((item) => (
                  
                  <div key={item.label}>
                      <NavItem
                        name={item.label}
                        Icon={item.icon}
                        href={item.link}
                        key={item.label}
                        isActive={pathname.endsWith(item.link)}
                        collapsed={collapsed}
                    />
                      {/* TODO: .endsWith won't work for dynamic paths */}
                  </div>
              ))}
          </div>

        <div className="flex flex-col gap-y-3 pt-3 mt-auto">
            <div>
                <NavItem
                    name="My Profile"
                    Icon={IconFingerprint}
                    href={"/profile"}
                    isActive={pathname.startsWith("/profile")}
                    collapsed={collapsed}
                />
            </div>
            
            <div onClick={() => {
                void signOut();
            }}>
                <NavItem
                    name={isGuest ? "Exit demo" : "Logout"}
                    Icon={IconLogout}
                    href={"/login"}
                    isActive={pathname.startsWith("/debug")}
                    collapsed={collapsed}
                />
            </div>
        </div>
    </nav>
  </aside>
  )
}
