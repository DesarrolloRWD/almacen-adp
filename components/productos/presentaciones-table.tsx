'use client'

import { useEffect, useState } from 'react'
import { Presentacion, getPresentaciones, getPresentacionEspecifica } from '@/lib/api'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Filter, ShoppingCart, Plus, Trash, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ScrollArea } from "@/components/ui/scroll-area"

export function PresentacionesTable() {
  const [presentaciones, setPresentaciones] = useState<Presentacion[]>([])
  const [presentacionesFiltradas, setPresentacionesFiltradas] = useState<Presentacion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [tipoSeleccionado, setTipoSeleccionado] = useState<string>('todos')
  const [presentacionesSeleccionadas, setPresentacionesSeleccionadas] = useState<Presentacion[]>([])
  const [loadingPresentacion, setLoadingPresentacion] = useState(false)

  useEffect(() => {
    async function fetchPresentaciones() {
      try {
        setLoading(true)
        const data = await getPresentaciones()
        setPresentaciones(data)
        setPresentacionesFiltradas(data)
        setError(null)
      } catch (err) {
        console.error('Error al cargar presentaciones:', err)
        setError('No se pudieron cargar las presentaciones. Intente nuevamente más tarde.')
      } finally {
        setLoading(false)
      }
    }

    fetchPresentaciones()
  }, [])

  // Función para filtrar presentaciones
  useEffect(() => {
    let filtradas = presentaciones
    
    // Filtrar por búsqueda
    if (busqueda.trim() !== '') {
      const termino = busqueda.toLowerCase()
      filtradas = filtradas.filter(p => 
        (p.item?.codigo?.toLowerCase() || '').includes(termino) ||
        (p.item?.descripcion?.toLowerCase() || '').includes(termino) ||
        (p.tipoPresentacion?.toLowerCase() || '').includes(termino) ||
        (p.descripcionPresentacion?.toLowerCase() || '').includes(termino) ||
        (p.lote?.toLowerCase() || '').includes(termino)
      )
    }
    
    // Filtrar por tipo
    if (tipoSeleccionado !== 'todos') {
      filtradas = filtradas.filter(p => 
        (p.tipoPresentacion?.toLowerCase() || '') === tipoSeleccionado.toLowerCase()
      )
    }
    
    setPresentacionesFiltradas(filtradas)
  }, [busqueda, tipoSeleccionado, presentaciones])

  // Obtener tipos únicos para el filtro
  const tiposUnicos = ['todos', ...new Set(presentaciones.map(p => p.tipoPresentacion || '').filter(Boolean))]
  
  // Función para agregar una presentación al carrito
  const agregarPresentacion = async (id: number) => {
    try {
      setLoadingPresentacion(true)
      //console.log('Obteniendo presentación con ID:', id) // Log para depuración
      const presentacion = await getPresentacionEspecifica(id)
      
      if (presentacion) {
        //console.log('Presentación obtenida:', presentacion) // Log para depuración
        // Verificar si ya existe en el carrito
        const yaExiste = presentacionesSeleccionadas.some(p => p.id === presentacion.id)
        
        if (!yaExiste) {
          setPresentacionesSeleccionadas(prev => [...prev, presentacion])
        }
      }
    } catch (error) {
      console.error('Error al agregar presentación:', error)
    } finally {
      setLoadingPresentacion(false)
    }
  }
  
  // Función para eliminar una presentación del carrito
  const eliminarPresentacion = (id: number) => {
    setPresentacionesSeleccionadas(prev => prev.filter(p => p.id !== id))
  }
  
  // Función para generar salida de las presentaciones seleccionadas
  const generarSalida = () => {
    // Aquí se implementaría la lógica para generar la salida
    //console.log('Generando salida para:', presentacionesSeleccionadas)
    // Por ahora solo mostraremos un mensaje
    alert(`Se generaría salida para ${presentacionesSeleccionadas.length} presentaciones seleccionadas`)
  }

  return (
    <div>
      {/* Buscador y filtros */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-naval-600" />
          <Input
            type="text"
            placeholder="Buscar por producto, usuario o área..."
            className="pl-8 border-naval-200 focus-visible:ring-naval-500"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        
        <Select value={tipoSeleccionado} onValueChange={setTipoSeleccionado}>
          <SelectTrigger className="w-[180px] border-naval-200 focus:ring-naval-500">
            <SelectValue placeholder="Todos los tipos" />
          </SelectTrigger>
          <SelectContent>
            {tiposUnicos.map(tipo => (
              <SelectItem key={tipo} value={tipo}>
                {tipo === 'todos' ? 'Todos los tipos' : tipo}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        

        <Sheet>
          <SheetTrigger asChild>
            <Button className="bg-naval-600 hover:bg-naval-700 relative">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Carrito
              {presentacionesSeleccionadas.length > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {presentacionesSeleccionadas.length}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px] sm:w-[540px] border-l border-naval-200 flex flex-col">
            <SheetHeader>
              <SheetTitle className="text-naval-800 flex items-center">
                <ShoppingCart className="mr-2 h-5 w-5 text-naval-600" />
                Presentaciones Seleccionadas
              </SheetTitle>
              <SheetDescription>
                Seleccione las presentaciones para generar una salida
              </SheetDescription>
            </SheetHeader>
            
            <div className="flex-grow flex flex-col min-h-0">
              {presentacionesSeleccionadas.length > 0 && (
                <div className="flex justify-between items-center mt-4 mb-2 px-1">
                  <div className="text-sm font-medium text-naval-700">{presentacionesSeleccionadas.length} {presentacionesSeleccionadas.length === 1 ? 'elemento' : 'elementos'}</div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs h-8"
                    onClick={() => setPresentacionesSeleccionadas([])}
                  >
                    Limpiar todo
                  </Button>
                </div>
              )}
              
              <div className="border-t border-naval-100 my-2"></div>
              
              <ScrollArea className="flex-grow overflow-auto">
                {presentacionesSeleccionadas.length === 0 ? (
                  <div className="py-12 text-center text-naval-500 flex flex-col items-center">
                    <ShoppingCart className="h-12 w-12 text-naval-200 mb-4" />
                    <p className="font-medium">No hay presentaciones seleccionadas</p>
                    <p className="mt-2 text-sm max-w-xs">Haga clic en el botón "+" en la tabla para agregar presentaciones al carrito.</p>
                  </div>
                ) : (
                  <div className="space-y-3 px-1">
                    {presentacionesSeleccionadas.map((presentacion) => (
                      <div key={presentacion.id} className="flex items-center justify-between p-3 border border-naval-200 rounded-md hover:bg-naval-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-naval-800 truncate">{presentacion.item?.codigo} - {presentacion.tipoPresentacion}</div>
                          <div className="text-sm text-naval-500 truncate">{presentacion.descripcionPresentacion}</div>
                          <div className="flex items-center mt-1 flex-wrap gap-2">
                            <Badge variant="outline" className="bg-naval-50 text-naval-700 border-naval-200">
                              {presentacion.lote}
                            </Badge>
                            <span className="text-sm text-naval-600">
                              {presentacion.cantidad?.toLocaleString() || '0'} unidades
                            </span>
                            <span className="text-xs text-naval-400">
                              Equiv: {presentacion.equivalenciaEnBase?.toLocaleString() || '0'}
                            </span>
                          </div>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="ml-2 text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 flex-shrink-0"
                          onClick={() => eliminarPresentacion(presentacion.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
            
            <div className="mt-auto pt-4 border-t border-naval-100">
              <div className="flex justify-between text-sm font-medium text-naval-700 mb-2">
                <span>Total de presentaciones:</span>
                <span>{presentacionesSeleccionadas.length}</span>
              </div>
              
              <div className="flex justify-between text-sm font-medium text-naval-700 mb-4">
                <span>Total de unidades:</span>
                <span>{presentacionesSeleccionadas.reduce((total, p) => total + (p.cantidad || 0), 0).toLocaleString()}</span>
              </div>
              
              <SheetFooter>
                <SheetClose asChild>
                  <Button variant="outline" className="border-naval-200 text-naval-700">
                    <X className="h-4 w-4 mr-2" />
                    Cerrar
                  </Button>
                </SheetClose>
                <Button 
                  className="bg-naval-600 hover:bg-naval-700"
                  onClick={generarSalida}
                  disabled={presentacionesSeleccionadas.length === 0}
                >
                  Generar Salida
                </Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
              <TableHeader className="bg-naval-50">
                <TableRow>
                  <TableHead className="text-naval-700">Código</TableHead>
                  <TableHead className="text-naval-700">Descripción</TableHead>
                  <TableHead className="text-naval-700">Tipo</TableHead>
                  <TableHead className="text-naval-700">Descripción</TableHead>
                  <TableHead className="text-naval-700">Lote</TableHead>
                  <TableHead className="text-naval-700">Cantidad</TableHead>
                  <TableHead className="text-naval-700">Equivalencia</TableHead>
                  <TableHead className="text-naval-700">Total</TableHead>
                  <TableHead className="text-naval-700 text-center">+</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presentacionesFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-naval-500">
                      {presentaciones.length === 0 ? 'No hay presentaciones disponibles' : 'No se encontraron resultados para la búsqueda'}
                    </TableCell>
                  </TableRow>
                ) : (
                  presentacionesFiltradas.map((presentacion) => (
                    <TableRow key={presentacion.id} className="hover:bg-naval-50">
                      <TableCell className="font-medium">{presentacion.item?.codigo}</TableCell>
                      <TableCell>{presentacion.item?.descripcion}</TableCell>
                      <TableCell>{presentacion.tipoPresentacion}</TableCell>
                      <TableCell>{presentacion.descripcionPresentacion}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-naval-50 text-naval-700 border-naval-200">{presentacion.lote}</Badge>
                      </TableCell>
                      <TableCell>{presentacion.cantidad?.toLocaleString() || '0'}</TableCell>
                      <TableCell>{presentacion.equivalenciaEnBase?.toLocaleString() || '0'}</TableCell>
                      <TableCell>{presentacion.totalEquivalenciaEnBase?.toLocaleString() || '0'}</TableCell>
                      <TableCell>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 bg-naval-600 text-white hover:bg-naval-700 rounded-full"
                                onClick={() => agregarPresentacion(presentacion.id)}
                                disabled={loadingPresentacion || presentacionesSeleccionadas.some(p => p.id === presentacion.id)}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Agregar al carrito</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
    </div>
  )
}

export default PresentacionesTable
