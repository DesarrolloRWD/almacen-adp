"use client"

import { useState } from "react"
import { useAuth } from "@/hooks"
import Link from "next/link"
import { Bell, Search, User, HelpCircle, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("")
  const { logout, user } = useAuth()

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-white px-4 sm:px-6 shadow-sm">
      <div className="hidden md:flex md:flex-1">
        <form className="relative w-full max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar insumos, medicamentos..."
            className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4">
        <Button variant="ghost" size="icon" className="text-naval-600 hover:text-naval-700 hover:bg-naval-50">
          <HelpCircle className="h-5 w-5" />
          <span className="sr-only">Ayuda</span>
        </Button>

        <Button variant="ghost" size="icon" className="relative text-naval-600 hover:text-naval-700 hover:bg-naval-50">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
            3
          </Badge>
          <span className="sr-only">Notificaciones</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-naval-50">
              <Avatar className="h-8 w-8 border-2 border-naval-100">
                {user?.image ? (
                  <AvatarImage 
                    src={user.image} 
                    alt={user?.nombre || "Usuario"} 
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "/placeholder.svg";
                    }} 
                  />
                ) : (
                  <AvatarImage src="/placeholder.svg" alt={user?.nombre || "Usuario"} />
                )}
                <AvatarFallback className="bg-naval-100 text-naval-700">
                  {user?.nombre ? user.nombre.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">
                  {user ? (
                    user.nombre && user.apdPaterno && user.apdMaterno ? 
                      `${user.nombre} ${user.apdPaterno} ${user.apdMaterno}` : 
                      (user.nombre || "Teniente Elyel Sánchez")
                  ) : "Teniente Elyel Sánchez"}
                </p>
                <p className="text-xs text-muted-foreground">@{user?.usuario || user?.nombre || "usuario"}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/configuracion" className="w-full cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Configuración
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer text-red-500 focus:text-red-500"
              onClick={() => logout()}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
