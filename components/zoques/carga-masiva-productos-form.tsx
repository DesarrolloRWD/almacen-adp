"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import * as XLSX from "xlsx"
import { NuevoProductoZoques, saveProductoZoques } from "@/lib/api"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, FileSpreadsheet, Upload, AlertCircle, CheckCircle2, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export default function CargaMasivaProductosForm() {
  const [isUploading, setIsUploading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  // Definir el tipo para el estado de procesamiento
  type ProcessingStatusType = {
    total: number
    processed: number
    success: number
    failed: number
    inProgress: boolean
    error: string | null
    warnings: string[]
    results: {
      success: boolean
      message: string
      timestamp: string
    }[]
  }
  
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatusType>({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    inProgress: false,
    error: null,
    warnings: [],
    results: []
  })
  // Estado adicional para el progreso visual de la barra (más fluido)
  const [visualProgress, setVisualProgress] = useState(0)
  const [errors, setErrors] = useState<string[]>([])

  // Función para manejar la selección de archivo
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Verificar que sea un archivo Excel
    if (!selectedFile.name.endsWith('.xlsx') && !selectedFile.name.endsWith('.xls')) {
      toast.error("Por favor, seleccione un archivo Excel válido (.xlsx o .xls)")
      return
    }

    setFile(selectedFile)
    setIsUploading(true)

    try {
      // Leer el archivo Excel
      const data = await readExcelFile(selectedFile)
      
      // Mostrar vista previa de los primeros 5 registros
      setPreviewData(data.slice(0, 5))
      
      toast.success(`Archivo cargado: ${selectedFile.name} (${data.length} registros)`)
    } catch (error) {
      // Error silencioso - no mostrar en consola
      toast.error("Error al procesar el archivo Excel. Verifique el formato.")
    } finally {
      setIsUploading(false)
    }
  }

  // Función para leer el archivo Excel
  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'binary' })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)
          resolve(jsonData)
        } catch (error) {
          reject(error)
        }
      }
      
      reader.onerror = (error) => reject(error)
      reader.readAsBinaryString(file)
    })
  }

  // Función para actualizar el progreso visual de forma directa
  const updateVisualProgress = (currentProcessed: number, total: number) => {
    // Calcular el porcentaje exacto basado en el progreso real
    const exactProgress = (currentProcessed / total) * 100;
    setVisualProgress(exactProgress);
  };
  
  // Función para procesar y enviar los datos
  const processAndUpload = async () => {
    if (!file) {
      toast.error("Por favor, seleccione un archivo Excel primero")
      return
    }

    try {
      // Leer todos los datos del archivo
      const allData = await readExcelFile(file)
      
      if (!allData || allData.length === 0) {
        toast.error("El archivo no contiene datos válidos")
        return
      }
      
      // Iniciar el procesamiento
      setProcessingStatus((prev: ProcessingStatusType) => ({
        ...prev,
        total: allData.length,
        processed: 0,
        success: 0,
        failed: 0,
        inProgress: true,
        error: null,
        warnings: [],
        results: [{
          success: true,
          message: `Iniciando procesamiento de ${allData.length} productos...`,
          timestamp: new Date().toLocaleTimeString()
        }]
      }))
      
      // Reiniciar el progreso visual
      setVisualProgress(0)
      
      setErrors([])
      
      // Procesar los datos en lotes más grandes para acelerar el proceso
      const batchSize = 10 // Aumentar el tamaño del lote para procesar más rápido
      const newErrors: string[] = []
      const successMessages: string[] = []
      
      for (let i = 0; i < allData.length; i += batchSize) {
        const batch = allData.slice(i, i + batchSize)
        const batchNumber = Math.floor(i / batchSize) + 1
        const totalBatches = Math.ceil(allData.length / batchSize)
        
        // Procesamiento silencioso - sin logs en consola
        
        // Mapear los datos al formato esperado por la API y validar campos requeridos
        const productos = batch.map(item => {
          // Mapear los nombres de columnas del Excel a los campos de la API
          // Función auxiliar para obtener un valor que puede ser numérico o string
          const getValueAsString = (obj: any, key: string): string => {
            const value = obj[key];
            if (value === undefined || value === null) return "";
            return String(value); // Convertir a string cualquier tipo de valor
          };
          
          // Función para buscar un valor en múltiples claves posibles
          const getValueFromMultipleKeys = (obj: any, keys: string[]): string => {
            for (const key of keys) {
              const value = getValueAsString(obj, key);
              if (value) return value;
            }
            return "";
          };

          // Buscar el código en diferentes variantes de nombres de columnas
          const codigo = 
            getValueAsString(item, 'Código / Catálogo / Sku') || 
            getValueAsString(item, 'Código / Cátalogo / Sku') ||
            getValueAsString(item, 'Código') ||
            getValueAsString(item, 'Codigo') ||
            getValueAsString(item, 'codigo') ||
            getValueAsString(item, 'Catalogo') ||
            getValueAsString(item, 'Catálogo') ||
            getValueAsString(item, 'SKU') ||
            getValueAsString(item, 'Sku') ||
            ""
          
          // Buscar la descripción en diferentes variantes
          const descripcion = 
            getValueAsString(item, 'Descripción') ||
            getValueAsString(item, 'Descripcion') ||
            getValueAsString(item, 'descripcion') ||
            ""
          
          // Asegurarse de que tenga al menos código y descripción
          if (!codigo || !descripcion) {
            newErrors.push(`Producto sin código o descripción: ${JSON.stringify(item)}`)
            return null
          }
          
          // Crear objeto con los campos requeridos por la API
          const producto = {
            codigo: codigo,
            descripcion: descripcion,
            catalogo: codigo, // Usar el mismo valor que código
            marca: getValueAsString(item, 'Marca'),
            unidad: getValueAsString(item, 'Unidad'),
            // El campo lote es completamente opcional, puede ser null
            ...(getValueAsString(item, 'Lote') ? { lote: getValueAsString(item, 'Lote') } : {}),
            // Agregar campos adicionales requeridos
            division: getValueFromMultipleKeys(item, ['Division', 'División']),
            linea: getValueFromMultipleKeys(item, [
              'Linea', 
              'Línea', 
              'Línea (Area)', 
              'Línea (Área)', 
              'Linea (Area)', 
              'Linea (Área)',
              'Línea (area)',
              'Línea (área)',
              'Línea (Área)'
            ]),
            sublinea: getValueFromMultipleKeys(item, ['Sublinea', 'Sublínea']),
            temperatura: getValueFromMultipleKeys(item, ['Temperatura', 'Temperatura de Almacenamiento']),
            pzsPorUnidad: Number(getValueAsString(item, 'Piezas por Unidad') || 1),
            piezas: Number(getValueAsString(item, 'Piezas') || 0),
            fechaExpiracion: getValueAsString(item, 'Fecha Expiracion') || new Date().toISOString().split('T')[0],
            tipoMovimiento: "ENTRADA",
            movimientoArea: "ALMACEN GENERAL"
          }
          
          return producto
        }).filter(Boolean)
        
        // Procesamiento silencioso - sin logs de depuración
        
        // Si no hay productos válidos en este lote, continuar con el siguiente
        if (productos.length === 0) {
          setProcessingStatus((prev: ProcessingStatusType) => {
            const newProcessed = prev.processed + batch.length;
            // Actualizar el progreso visual de forma fluida
            updateVisualProgress(newProcessed, prev.total);
            
            return {
              ...prev,
              processed: newProcessed,
              failed: prev.failed + batch.length,
              warnings: [...prev.warnings, `Lote ${batchNumber}: No hay productos válidos para procesar`],
              results: [...prev.results, {
                success: false,
                message: `Lote ${batchNumber}: No hay productos válidos para procesar`,
                timestamp: new Date().toLocaleTimeString()
              }]
            };
          })
          newErrors.push(`Lote ${batchNumber}: No hay productos válidos para procesar`)
          continue
        }
        
        try {
          // Mensaje de estado
          const processingMsg = `Procesando lote ${batchNumber}/${totalBatches} (${productos.length} productos)...`
          successMessages.push(processingMsg)
          setProcessingStatus((prev: ProcessingStatusType) => ({
            ...prev,
            results: [...prev.results, {
              success: true,
              message: processingMsg,
              timestamp: new Date().toLocaleTimeString()
            }]
          }))
          setErrors([...newErrors])
          
          // Configurar un timeout para la petición
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 segundos de timeout
          
          // Envío silencioso - sin logs en consola
          
          // Enviar los datos al endpoint con timeout
          const response = await fetch('/api/zoques/productos/carga-masiva', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productos),
            signal: controller.signal
          })
          
          // Limpiar el timeout
          clearTimeout(timeoutId)
          
          const result = await response.json()
          
          if (!response.ok) {
            const errorMsg = `Error en lote ${batchNumber}/${totalBatches}: ${result.error || response.statusText}`
            // Error silencioso - no mostrar en consola
            newErrors.push(errorMsg)
            setProcessingStatus((prev: ProcessingStatusType) => {
              const newProcessed = prev.processed + batch.length;
              // Actualizar el progreso visual de forma fluida
              updateVisualProgress(newProcessed, prev.total);
              
              return {
                ...prev,
                processed: newProcessed,
                failed: prev.failed + batch.length,
                warnings: [...prev.warnings, errorMsg],
                results: [...prev.results, {
                  success: false,
                  message: errorMsg,
                  timestamp: new Date().toLocaleTimeString()
                }]
              };
            })
          } else {
            const successMsg = `Lote ${batchNumber}/${totalBatches}: ${batch.length} productos procesados correctamente`
            // Éxito silencioso - no mostrar en consola
            successMessages.push(successMsg)
            setProcessingStatus((prev: ProcessingStatusType) => {
              const newProcessed = prev.processed + batch.length;
              // Actualizar el progreso visual de forma fluida
              updateVisualProgress(newProcessed, prev.total);
              
              return {
                ...prev,
                processed: newProcessed,
                success: prev.success + batch.length,
                results: [...prev.results, {
                  success: true,
                  message: successMsg,
                  timestamp: new Date().toLocaleTimeString()
                }]
              };
            })
          }
        } catch (error) {
          const isTimeout = error instanceof Error && error.name === 'AbortError'
          const errorMsg = isTimeout
            ? `Timeout en lote ${batchNumber}/${totalBatches}: La operación tardó demasiado tiempo`
            : `Error en lote ${batchNumber}/${totalBatches}: ${error instanceof Error ? error.message : String(error)}`
          
          // Error silencioso - no mostrar en consola
          newErrors.push(errorMsg)
          setProcessingStatus((prev: ProcessingStatusType) => {
            const newProcessed = prev.processed + batch.length;
            // Actualizar el progreso visual de forma fluida
            updateVisualProgress(newProcessed, prev.total);
            
            return {
              ...prev,
              processed: newProcessed,
              failed: prev.failed + batch.length,
              warnings: [...prev.warnings, errorMsg],
              results: [...prev.results, {
                success: false,
                message: errorMsg,
                timestamp: new Date().toLocaleTimeString()
              }]
            };
          })
        }
        
        // Actualizar errores en cada iteración
        setErrors([...newErrors])
        
        // Esperar un tiempo mínimo entre lotes para no sobrecargar la API
        if (i + batchSize < allData.length) {
          await new Promise(resolve => setTimeout(resolve, 500)) // Reducir el tiempo entre lotes
        }
      }
      
      // Mostrar mensajes de éxito junto con los errores
      if (successMessages.length > 0) {
        setErrors([...newErrors, "", "Resumen de operaciones exitosas:", ...successMessages])
      } else if (newErrors.length > 0) {
        setErrors(newErrors)
      }
      
      // Finalizar el procesamiento
      setProcessingStatus((prev: ProcessingStatusType) => {
        // Asegurar que el progreso visual llegue al 100% al finalizar
        updateVisualProgress(prev.total, prev.total);
        
        return { 
          ...prev, 
          inProgress: false,
          results: [...prev.results, {
            success: true,
            message: `Procesamiento finalizado. Total: ${prev.total}, Exitosos: ${prev.success}, Fallidos: ${prev.failed}`,
            timestamp: new Date().toLocaleTimeString()
          }]
        };
      })
    } catch (error) {
      // Error silencioso - no mostrar en consola
      toast.error("Error al procesar el archivo. Por favor, intente de nuevo.")
      setProcessingStatus((prev: ProcessingStatusType) => ({
        ...prev,
        inProgress: false,
        error: error instanceof Error ? error.message : "Error desconocido"
      }))
    }
  }

  // Función para reiniciar el formulario
  const resetForm = () => {
    setFile(null)
    setPreviewData([])
    setProcessingStatus({
      total: 0,
      processed: 0,
      success: 0,
      failed: 0,
      inProgress: false,
      error: null,
      warnings: [],
      results: []
    } as ProcessingStatusType)
    setVisualProgress(0)
    setErrors([])
  }
  
  // Función para descargar la plantilla de ejemplo
  const downloadTemplate = async () => {
    try {
      // Cargar el archivo JSON de ejemplo
      const response = await fetch('/plantilla-carga-masiva-productos.json')
      if (!response.ok) {
        throw new Error('No se pudo cargar la plantilla')
      }
      
      const data = await response.json()
      
      // Convertir a Excel
      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Productos")
      
      // Descargar el archivo
      XLSX.writeFile(workbook, "plantilla-carga-masiva-productos.xlsx")
      
      toast.success("Plantilla descargada correctamente")
    } catch (error) {
      // Error silencioso - no mostrar en consola
      toast.error("Error al descargar la plantilla")
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="excel-file" className="text-base">Archivo Excel</Label>
            <div className="flex items-center gap-4">
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isUploading || processingStatus.inProgress}
                className="flex-1"
              />
              {file && (
                <Button 
                  variant="outline" 
                  onClick={resetForm}
                  disabled={isUploading || processingStatus.inProgress}
                >
                  Limpiar
                </Button>
              )}
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Seleccione un archivo Excel (.xlsx o .xls) con los datos de los productos a registrar.
                El archivo debe contener las columnas: "Código / Catálogo / Sku", "Descripción", "Marca", "Unidad", "División", "Línea (Area)", "Sublinea", "Temperatura de Almacenamiento".
                El campo "Lote" es completamente opcional y puede omitirse o dejarse vacío si no aplica.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar Plantilla
              </Button>
            </div>
          </div>

          {isUploading && (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-naval-600" />
              <span className="ml-2">Cargando archivo...</span>
            </div>
          )}

          {file && previewData.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-naval-600" />
                <h3 className="text-lg font-medium">Vista previa ({file.name})</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-muted">
                      {Object.keys(previewData[0]).map((key) => (
                        <th key={key} className="border px-3 py-2 text-left">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, index) => (
                      <tr key={index} className="border-b">
                        {Object.values(row).map((value: any, i) => (
                          <td key={i} className="border px-3 py-2">{value?.toString() || ""}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              <div className="text-sm text-muted-foreground">{processingStatus.success} exitosos, {processingStatus.failed} fallidos</div>
            </div>
          )}

          {processingStatus.inProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Procesando registros...</span>
                <span>{processingStatus.processed} de {processingStatus.total}</span>
              </div>
              <Progress value={visualProgress} />
            </div>
          )}

          {!processingStatus.inProgress && processingStatus.processed > 0 && (
            <div className="mt-4">
              <h3 className="text-lg font-medium">Resultados del procesamiento</h3>
              <div className="mt-2 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Resumen</h4>
                    <p>Total de registros: {processingStatus.total}</p>
                    <p>Procesados: {processingStatus.processed}</p>
                    <p>Exitosos: {processingStatus.success}</p>
                    <p>Fallidos: {processingStatus.failed}</p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <h4 className="font-medium">Estado</h4>
                    {processingStatus.error && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{processingStatus.error}</AlertDescription>
                      </Alert>
                    )}
                    
                    {processingStatus.success > 0 && processingStatus.failed === 0 && (
                      <Alert className="mt-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle>Éxito</AlertTitle>
                        <AlertDescription>
                          Todos los productos fueron procesados correctamente.
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {processingStatus.failed > 0 && processingStatus.success > 0 && (
                      <Alert className="mt-2 bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        <AlertTitle>Advertencia</AlertTitle>
                        <AlertDescription>
                          Algunos productos fueron procesados correctamente, pero otros fallaron.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                
                {processingStatus.total <= 10 && (
                  <div className="mt-4 space-y-2">
                    <h3 className="text-lg font-medium">Registro de operaciones</h3>
                    <div className="space-y-2">
                      {processingStatus.results.map((result, index) => (
                        <div key={index} className={`p-3 border rounded-md ${result.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                          <div className="flex items-start gap-2">
                            {result.success ? <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" /> : <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />}
                            <div>
                              <p className={`font-medium ${result.success ? 'text-green-700' : 'text-red-700'}`}>{result.message}</p>
                              <p className="text-xs text-muted-foreground">{result.timestamp}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Advertencias */}
                {processingStatus.warnings.length > 0 && (
                  <div className="border rounded-lg p-4 bg-yellow-50">
                    <h4 className="font-medium mb-2">Advertencias</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      {processingStatus.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-4">
            <Button
              variant="default"
              onClick={processAndUpload}
              disabled={!file || isUploading || processingStatus.inProgress}
              className="gap-2"
            >
              {processingStatus.inProgress ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Procesar y Cargar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
