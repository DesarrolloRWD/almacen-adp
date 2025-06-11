"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  LayoutDashboard,
  Stethoscope,
  PackageOpen,
  History,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Layers,
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    title: "Insumos Médicos",
    href: "/productos",
    icon: <Stethoscope className="h-5 w-5" />,
  },
  {
    title: "Presentaciones",
    href: "/formatos",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    title: "Entregas",
    href: "/historial",
    icon: <History className="h-5 w-5" />,
  },
  {
    title: "Historial de Salidas",
    href: "/historial-salidas",
    icon: <PackageOpen className="h-5 w-5" />,
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className={cn("relative flex flex-col border-r bg-white shadow-sm", isCollapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 items-center px-4 py-2 border-b bg-naval-600 text-white">
        {!isCollapsed && (
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <ShieldAlert className="h-6 w-6" />
            <span className="font-bold">Hospital Naval</span>
          </Link>
        )}
        {isCollapsed && <ShieldAlert className="h-6 w-6 mx-auto" />}
      </div>
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-3 top-20 h-6 w-6 rounded-full border bg-white shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <ScrollArea className="flex-1">
        <nav className="grid gap-1 px-2 py-3">
          {navItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-naval-50",
                pathname === item.href ? "bg-naval-100 text-naval-700 font-medium" : "text-muted-foreground",
                isCollapsed && "justify-center px-0",
              )}
            >
              {item.icon}
              {!isCollapsed && <span>{item.title}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>
      <div className="p-4 border-t text-center text-xs text-muted-foreground">
        {!isCollapsed && (
          <div className={cn(
            "font-medium py-1 px-2 rounded",
            process.env.NEXT_PUBLIC_APP_ENV === 'production' 
              ? "bg-red-100 text-red-700"
              : process.env.NEXT_PUBLIC_APP_ENV === 'staging'
              ? "bg-yellow-100 text-yellow-700"
              : "bg-blue-100 text-blue-700"
          )}>
            {process.env.NEXT_PUBLIC_APP_ENV?.toUpperCase() || 'DESARROLLO'}
          </div>
        )}
      </div>
    </div>
  )
}
