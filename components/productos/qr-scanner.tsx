"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Check, Copy } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

interface QrScannerProps {
  onScanSuccess: (data: Record<string, any>) => void;
  onCancel: () => void;
}

export default function QrScanner({ onScanSuccess, onCancel }: QrScannerProps): JSX.Element {
  const [manualInput, setManualInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<Record<string, any> | null>(null);

  const handleManualSubmit = () => {
    if (!manualInput.trim()) {
      setError("Por favor ingresa el contenido del código QR");
      return;
    }

    // Procesar el contenido del QR
    processQrData(manualInput);
  };

  const handleConfirmData = () => {
    if (processedData) {
      onScanSuccess(processedData);
    }
  };

  // Procesar el contenido del QR
  const processQrData = (data: string) => {
    try {
      console.log("Contenido QR original:", data);
      setError(null); // Limpiar errores previos
      setProcessedData(null); // Limpiar datos procesados previos
      
      // El lector reemplaza caracteres JSON de la siguiente manera:
      // ¨ (¨) = {
      // [ = "
      // Ñ (Ñ) = :
      // * = }
      
      // Verificar si es el formato distorsionado del lector
      if (data.includes('¨') || data.includes('[') || data.includes('Ñ') || data.includes('*')) {
        console.log("Detectado formato distorsionado del lector QR, intentando convertir a JSON");
        
        // Convertir el formato distorsionado a JSON
        let jsonString = data
          .replace(/¨/g, '{') // ¨ -> {
          .replace(/\[/g, '"') // [ -> "
          .replace(/Ñ/g, ':') // Ñ -> :
          .replace(/\*/g, '}'); // * -> }
        
        console.log("Formato convertido a JSON:", jsonString);
        
        try {
          // Intentar parsear como JSON
          const jsonData = JSON.parse(jsonString);
          console.log("Datos procesados como JSON convertido:", jsonData);
          setProcessedData(jsonData);
          return;
        } catch (convertError) {
          console.log("Error al parsear el JSON convertido:", convertError);
          // Continuar con otros métodos de procesamiento
        }
      }
      
      // Limpiar el contenido de caracteres especiales al inicio
      let cleanData = data.trim().replace(/^\s*[¨"'\s]+/, "");
      
      // Intentar procesar como JSON válido estándar
      try {
        // Verificar si el contenido parece ser JSON (comienza con { y termina con })
        if (cleanData.startsWith('{') && cleanData.endsWith('}')) {
          const jsonData = JSON.parse(cleanData);
          console.log("Datos procesados como JSON válido:", jsonData);
          setProcessedData(jsonData);
          return;
        }
      } catch (jsonError) {
        console.log("No es un JSON válido, intentando otros formatos...");
      }
      
      // Si no es JSON, intentar procesar como el formato distorsionado
      
      // Crear un objeto para almacenar los datos
      const jsonData = {} as Record<string, string | number>;
      
      // Formato específico del lector QR externo
      // Ejemplo: ¨[codigo[Ñ[56535[,[marca[Ñ[ROCHE[,[descripcion[Ñ[ere[,[unidad[Ñ[PZ[,[lote[Ñ[LT001[*
      console.log("Intentando procesar formato específico del lector QR con Ñ");
      
      // Eliminar el asterisco final y caracteres especiales al inicio
      cleanData = cleanData.replace(/^\s*¨/, "").replace(/\*$/, '');
      console.log("Datos limpiados:", cleanData);
      
      // Dividir por comas para procesar cada sección
      const sections = cleanData.split(',').map(s => s.trim()).filter(s => s);
      console.log("Secciones separadas por coma:", sections);
      
      // Procesar cada sección
      for (const section of sections) {
        console.log("Procesando sección:", section);
        
        try {
          // Extraer el nombre del campo (entre los primeros corchetes)
          const fieldMatch = section.match(/\[(\w+)\]/);
          if (!fieldMatch) {
            console.log("No se encontró el nombre del campo en:", section);
            continue;
          }
          
          let key = fieldMatch[1].toLowerCase();
          
          // Extraer el valor (entre el tercer y cuarto corchete)
          // Buscamos el patrón [Ñ[valor[
          const valueMatch = section.match(/\[Ñ\]\[([^\[]+)/);
          if (!valueMatch) {
            console.log("No se encontró el valor para el campo", key);
            
            // Intentar con un patrón alternativo si no se encuentra el valor con Ñ
            const altMatch = section.match(/\[(\w+)\]\[.\]\[([^\[]+)/);
            if (altMatch && altMatch.length >= 3) {
              key = altMatch[1].toLowerCase();
              let value = altMatch[2].trim();
              
              // Eliminar el corchete final si existe
              value = value.replace(/\[$/, '');
              
              console.log(`Campo extraído (alt): ${key}, Valor extraído: ${value}`);
              
              // Mapeo de campos específicos
              if (key === 'unidad') {
                key = 'unidadBase';
              }
              
              // Intentar convertir a número si es posible
              if (/^\d+$/.test(value)) {
                jsonData[key] = parseInt(value);
              } else {
                jsonData[key] = value;
              }
              
              console.log(`Campo procesado (alt): ${key} = ${jsonData[key]}`);
            }
            continue;
          }
          
          let value = valueMatch[1].trim();
          
          // Eliminar el corchete final si existe
          value = value.replace(/\[$/, '');
          
          console.log(`Campo extraído: ${key}, Valor extraído: ${value}`);
          
          // Mapeo de campos específicos
          if (key === 'unidad') {
            key = 'unidadBase';
          }
          
          // Intentar convertir a número si es posible
          if (/^\d+$/.test(value)) {
            jsonData[key] = parseInt(value);
          } else {
            jsonData[key] = value;
          }
          
          console.log(`Campo procesado: ${key} = ${jsonData[key]}`);
        } catch (error) {
          console.log("Error procesando sección:", section, error);
        }
      }
      
      // Si se encontraron datos, procesarlos
      if (Object.keys(jsonData).length > 0) {
        console.log("Datos procesados del formato específico:", jsonData);
        setProcessedData(jsonData);
        return;
      }
      
      // Método 1: Intentar dividir por comas (formato distorsionado)
      if (cleanData.includes(',')) {
        const parts = cleanData.split(',').map(part => part.trim()).filter(part => part);
        console.log("Partes separadas por coma:", parts);
        
        // Procesar cada parte
        for (const part of parts) {
          // Buscar patrones como [codigo[Ñ [PROD'001[ o [codigo[Ñ [PROD'001[
          const textMatch = part.match(/\[(\w+)\][\[ÑÑ]\s*\[([^\[\]]+)\[/);
          
          if (textMatch) {
            // Mapear los nombres de campos a los nombres esperados por el formulario
            let key = textMatch[1].toLowerCase();
            let value = textMatch[2];
            
            // Mapeo de campos específicos
            if (key === 'unidad') {
              key = 'unidadBase'; // Mapear 'unidad' a 'unidadBase' para el formulario
            }
            
            // Limpiar el valor
            value = value.replace(/'/g, '-');
            value = value.replace(/«/g, 'o');
            
            jsonData[key] = value;
            console.log(`Campo de texto encontrado: ${key} = ${value}`);
            continue;
          }
          
          // Buscar patrones numéricos
          const numMatch = part.match(/\[(\w+)\][\[ÑÑ]\s*(\d+)/);
          
          if (numMatch) {
            // Mapear los nombres de campos a los nombres esperados por el formulario
            let key = numMatch[1].toLowerCase();
            const value = parseInt(numMatch[2]);
            
            // Mapeo de campos específicos
            if (key === 'unidad') {
              key = 'unidadBase'; // Mapear 'unidad' a 'unidadBase' para el formulario
            }
            
            jsonData[key] = value;
            console.log(`Campo numérico encontrado: ${key} = ${value}`);
            continue;
          }
          
          // Patrón genérico
          const genericMatch = part.match(/\[(\w+)\][^\[]*([^\[,]+)/);
          
          if (genericMatch) {
            // Mapear los nombres de campos a los nombres esperados por el formulario
            let key = genericMatch[1].toLowerCase();
            const valueStr = genericMatch[2].trim();
            
            // Mapeo de campos específicos
            if (key === 'unidad') {
              key = 'unidadBase'; // Mapear 'unidad' a 'unidadBase' para el formulario
            }
            
            // Intentar convertir a número si es posible
            const numValue = parseInt(valueStr);
            const value = isNaN(numValue) ? valueStr : numValue;
            
            jsonData[key] = value;
            console.log(`Campo genérico encontrado: ${key} = ${value}`);
          }
        }
      }
      
      // Método 2: Si no se encontraron datos con el método 1, intentar extraer líneas clave-valor
      if (Object.keys(jsonData).length === 0) {
        // Buscar todos los pares clave-valor usando una expresión regular más general
        const keyValuePattern = /["']?(\w+)["']?\s*[:\[ÑÑ]\s*["']?([^,\[\]{}]+)["']?/g;
        let match;
        
        while ((match = keyValuePattern.exec(cleanData)) !== null) {
          // Mapear los nombres de campos a los nombres esperados por el formulario
          let key = match[1].toLowerCase();
          let value = match[2].trim();
          
          // Mapeo de campos específicos
          if (key === 'unidad') {
            key = 'unidadBase'; // Mapear 'unidad' a 'unidadBase' para el formulario
          }
          
          // Limpiar el valor
          value = value.replace(/'/g, '-');
          value = value.replace(/«/g, 'o');
          
          // Intentar convertir a número si es posible
          if (/^\d+$/.test(value)) {
            jsonData[key] = parseInt(value);
          } else {
            jsonData[key] = value;
          }
          
          console.log(`Par clave-valor encontrado: ${key} = ${jsonData[key]}`);
        }
      }
      
      // Verificar que tenemos al menos algunos datos básicos
      if (Object.keys(jsonData).length === 0) {
        // Último intento: mostrar el contenido original y pedir al usuario que lo verifique
        setError("No se pudo extraer información del código QR automáticamente. Por favor verifica el formato o intenta copiar y pegar nuevamente.");
        console.log("No se pudo procesar el contenido del QR en ningún formato conocido");
        return;
      }
      
      console.log("Datos procesados del QR:", jsonData);
      setProcessedData(jsonData);
    } catch (err) {
      console.error("Error al procesar el QR:", err);
      setError("Error al procesar el código QR: " + (err as Error).message);
    }
  };

  // Función para formatear valores para mostrarlos
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === 'object' && value instanceof Date) {
      return value.toLocaleDateString('es-MX');
    }
    return String(value);
  };

  return (
    <Card className="w-full mx-auto">
      <CardHeader>
        <CardTitle>Escanear Código QR</CardTitle>
        <CardDescription>
          Utiliza un lector externo para escanear el código QR del producto
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!processedData ? (
          <div className="space-y-4">
            <div>
              <label htmlFor="manualInput" className="block text-sm font-medium mb-1">
                Contenido del Código QR
              </label>
              <div className="flex">
                <Input
                  id="manualInput"
                  placeholder="Pega aquí el contenido escaneado"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  onClick={handleManualSubmit}
                  className="ml-2"
                >
                  Procesar
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Puedes pegar el contenido JSON completo o el texto escaneado por el lector.
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
              <h4 className="text-sm font-medium mb-2">Instrucciones:</h4>
              <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                <li>Utiliza tu lector de QR externo para escanear el código</li>
                <li>Copia el contenido del QR</li>
                <li>Pega el contenido en el campo de arriba</li>
                <li>Haz clic en "Procesar"</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-200 mb-4">
              <h3 className="text-sm font-medium text-blue-800 mb-1">Datos procesados del código QR</h3>
              <p className="text-xs text-blue-700">Verifica que los datos sean correctos antes de confirmar</p>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/3">Campo</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(processedData).map(([key, value]) => (
                    <TableRow key={key}>
                      <TableCell className="font-medium capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </TableCell>
                      <TableCell>
                        {typeof value === 'number' ? (
                          <Badge variant="outline" className="bg-blue-50 text-blue-800 hover:bg-blue-100">
                            {formatValue(value)}
                          </Badge>
                        ) : (
                          formatValue(value)
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button 
                variant="outline" 
                onClick={() => {
                  setProcessedData(null);
                  setManualInput('');
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmData} className="bg-green-600 hover:bg-green-700">
                <Check className="h-4 w-4 mr-2" />
                Confirmar y usar datos
              </Button>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        {!processedData && (
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
