"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search, Filter, FileDown } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

// Datos de ejemplo
const movimientosData = [
  {
    id: 1,
    fecha: "2025-05-18T14:30:00",
    tipo: "Salida",
    producto: {
      codigo: "INS-001",
      descripcion: "Guantes de Nitrilo Talla M",
    },
    cantidad: 5,
    lote: "L-123",
    area: "Quirófano 2",
    usuario: {
      nombre: "Dr. Carlos Méndez",
      avatar: "",
      iniciales: "CM",
      departamento: "Cirugía",
    },
  },
  {
    id: 2,
    fecha: "2025-05-18T11:15:00",
    tipo: "Entrada",
    producto: {
      codigo: "INS-002",
      descripcion: "Jeringas Desechables 5ml",
    },
    cantidad: 200,
    lote: "L-456",
    area: "Almacén Principal",
    usuario: {
      nombre: "Dra. Laura Sánchez",
      avatar: "",
      iniciales: "LS",
      departamento: "Farmacia",
    },
  },
  {
    id: 3,
    fecha: "2025-05-17T16:45:00",
    tipo: "Salida",
    producto: {
      codigo: "INS-003",
      descripcion: "Vendas Elásticas 10cm",
    },
    cantidad: 2,
    lote: "L-789",
    area: "Emergencias",
    usuario: {
      nombre: "Dr. Miguel Ángel",
      avatar: "",
      iniciales: "MA",
      departamento: "Emergencias",
    },
  },
  {
    id: 4,
    fecha: "2025-05-17T09:30:00",
    tipo: "Salida",
    producto: {
      codigo: "INS-004",
      descripcion: "Mascarillas Quirúrgicas",
    },
    cantidad: 15,
    lote: "L-012",
    area: "Hospitalización",
    usuario: {
      nombre: "Dra. Ana Gómez",
      avatar: "",
      iniciales: "AG",
      departamento: "Pediatría",
    },
  },
  {
    id: 5,
    fecha: "2025-05-16T14:20:00",
    tipo: "Entrada",
    producto: {
      codigo: "INS-005",
      descripcion: "Batas Desechables",
    },
    cantidad: 30,
    lote: "L-345",
    area: "Almacén Principal",
    usuario: {
      nombre: "Dr. Roberto Díaz",
      avatar: "",
      iniciales: "RD",
      departamento: "Logística",
    },
  },
  {
    id: 6,
    fecha: "2025-05-16T10:15:00",
    tipo: "Salida",
    producto: {
      codigo: "INS-001",
      descripcion: "Guantes de Nitrilo Talla M",
    },
    cantidad: 3,
    lote: "L-123",
    area: "Consulta Externa",
    usuario: {
      nombre: "Dra. Patricia López",
      avatar: "",
      iniciales: "PL",
      departamento: "Dermatología",
    },
  },
  {
    id: 7,
    fecha: "2025-05-15T16:30:00",
    tipo: "Entrada",
    producto: {
      codigo: "INS-003",
      descripcion: "Vendas Elásticas 10cm",
    },
    cantidad: 25,
    lote: "L-789",
    area: "Almacén Principal",
    usuario: {
      nombre: "Dr. Javier Martínez",
      avatar: "",
      iniciales: "JM",
      departamento: "Traumatología",
    },
  },
]

export default function HistorialMovimientos() {
  const [searchQuery, setSearchQuery] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState("todos")
  const [fechaDesde, setFechaDesde] = useState<Date | undefined>(undefined)
  const [fechaHasta, setFechaHasta] = useState<Date | undefined>(undefined)

  // Filtrar movimientos basados en la búsqueda y filtros
  const filteredMovimientos = movimientosData.filter((movimiento) => {
    // Filtro de búsqueda
    const matchesSearch =
      movimiento.producto.codigo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movimiento.producto.descripcion.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movimiento.usuario.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      movimiento.area.toLowerCase().includes(searchQuery.toLowerCase())

    // Filtro de tipo
    const matchesTipo = tipoFiltro === "todos" || movimiento.tipo === tipoFiltro

    // Filtro de fecha
    const fecha = new Date(movimiento.fecha)
    const matchesFechaDesde = !fechaDesde || fecha >= fechaDesde
    const matchesFechaHasta = !fechaHasta || fecha <= fechaHasta

    return matchesSearch && matchesTipo && matchesFechaDesde && matchesFechaHasta
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar por producto, usuario o área..."
            className="pl-8 border-naval-200 focus-visible:ring-naval-500"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
            <SelectTrigger className="w-[180px] border-naval-200 focus-visible:ring-naval-500">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos los tipos</SelectItem>
              <SelectItem value="Entrada">Entradas</SelectItem>
              <SelectItem value="Salida">Salidas</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-[240px] justify-start text-left font-normal border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
              >
                <Filter className="mr-2 h-4 w-4" />
                {!fechaDesde && !fechaHasta ? (
                  <span>Filtrar por fecha</span>
                ) : (
                  <span>
                    {fechaDesde ? format(fechaDesde, "dd/MM/yyyy") : "Inicio"} -
                    {fechaHasta ? format(fechaHasta, "dd/MM/yyyy") : "Fin"}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <div className="p-4 space-y-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-naval-700">Desde</p>
                  <Calendar mode="single" selected={fechaDesde} onSelect={setFechaDesde} initialFocus />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-naval-700">Hasta</p>
                  <Calendar mode="single" selected={fechaHasta} onSelect={setFechaHasta} initialFocus />
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setFechaDesde(undefined)
                      setFechaHasta(undefined)
                    }}
                    className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
                  >
                    Limpiar
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="outline"
            size="icon"
            className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
          >
            <FileDown className="h-4 w-4" />
            <span className="sr-only">Exportar</span>
          </Button>
        </div>
      </div>

      <div className="rounded-md border border-naval-200">
        <Table>
          <TableHeader className="bg-naval-50">
            <TableRow>
              <TableHead className="text-naval-700">Fecha y Hora</TableHead>
              <TableHead className="text-naval-700">Tipo</TableHead>
              <TableHead className="text-naval-700">Producto</TableHead>
              <TableHead className="text-naval-700">Cantidad</TableHead>
              <TableHead className="text-naval-700">Lote</TableHead>
              <TableHead className="text-naval-700">Área</TableHead>
              <TableHead className="text-naval-700">Usuario</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovimientos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron movimientos.
                </TableCell>
              </TableRow>
            ) : (
              filteredMovimientos.map((movimiento) => (
                <TableRow key={movimiento.id} className="hover:bg-naval-50">
                  <TableCell>{new Date(movimiento.fecha).toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={movimiento.tipo === "Entrada" ? "outline" : "secondary"}
                      className={
                        movimiento.tipo === "Entrada"
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }
                    >
                      {movimiento.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-naval-700">{movimiento.producto.descripcion}</div>
                    <div className="text-xs text-muted-foreground">{movimiento.producto.codigo}</div>
                  </TableCell>
                  <TableCell className="font-medium text-naval-700">{movimiento.cantidad}</TableCell>
                  <TableCell>{movimiento.lote}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-naval-50 text-naval-700 border-naval-200">
                      {movimiento.area}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8 border-2 border-naval-100">
                        <AvatarImage
                          src={movimiento.usuario.avatar || "/placeholder.svg"}
                          alt={movimiento.usuario.nombre}
                        />
                        <AvatarFallback className="bg-naval-100 text-naval-700">
                          {movimiento.usuario.iniciales}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium text-naval-700">{movimiento.usuario.nombre}</div>
                        <div className="text-xs text-muted-foreground">{movimiento.usuario.departamento}</div>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Mostrando <strong>{filteredMovimientos.length}</strong> de <strong>{movimientosData.length}</strong>{" "}
          movimientos
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
          >
            <ChevronsLeft className="h-4 w-4" />
            <span className="sr-only">Primera página</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Página anterior</span>
          </Button>
          <Button variant="outline" size="sm" className="px-4 border-naval-200 text-naval-700">
            Página 1 de 1
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
          >
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">Página siguiente</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="border-naval-200 text-naval-700 hover:bg-naval-50 hover:text-naval-800"
          >
            <ChevronsRight className="h-4 w-4" />
            <span className="sr-only">Última página</span>
          </Button>
        </div>
      </div>
    </div>
  )
}
