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

  // Función específica para limpiar y normalizar valores de temperatura
  const cleanTemperatureValue = (tempValue: string): string => {
    console.log("Limpiando temperatura original:", tempValue);
    
    // Caso específico para el formato "2 - 8 °C-2 - 8 °C C"
    if (tempValue.includes("2 - 8") && tempValue.includes("°C")) {
      console.log("Detectado formato específico '2 - 8 °C-2 - 8 °C C'");
      return "2 - 8 °C";
    }
    
    // Caso general para rangos duplicados
    if (tempValue.includes('-') && /\d+\s*-\s*\d+/.test(tempValue)) {
      // Extraer el primer rango de temperatura (X - Y)
      const firstRangeMatch = tempValue.match(/(\d+)\s*-\s*(\d+)/i);
      if (firstRangeMatch) {
        // Reconstruir el formato limpio
        const cleanTemp = `${firstRangeMatch[1]} - ${firstRangeMatch[2]} °C`;
        console.log("Temperatura reconstruida desde el primer rango:", cleanTemp);
        return cleanTemp;
      }
    }
    
    // Procesamiento normal para otros formatos
    let cleanTemp = tempValue
      // Manejar símbolos que aparecen en lugar del símbolo de grados
      .replace(/[\u25ca\u2666◊♦]/g, '°')
      .replace(/C C/g, '°C')
      .replace(/([0-9])\s*C\b/gi, '$1 °C') // Agregar ° antes de C cuando sigue a un número
      .replace(/C\b/g, '°C') // Reemplazar C sola por °C
      .replace(/ ' /g, ' - ')
      .replace(/'/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Eliminar duplicados si existen
    if (cleanTemp.includes('°C') && cleanTemp.indexOf('°C') !== cleanTemp.lastIndexOf('°C')) {
      cleanTemp = cleanTemp.substring(0, cleanTemp.indexOf('°C') + 2);
    }
    
    // Si no tiene el símbolo de grados, agregarlo
    if (!cleanTemp.includes('°') && !cleanTemp.includes('grados')) {
      const tempMatch = cleanTemp.match(/(\d+(?:[.,]\d+)?\s*-\s*\d+(?:[.,]\d+)?|\d+(?:[.,]\d+)?)\s*C?$/i);
      if (tempMatch) {
        cleanTemp = `${tempMatch[1]} °C`;
      }
    }
    
    console.log("Temperatura procesada final:", cleanTemp);
    return cleanTemp;
  };

  // Procesar el contenido del QR
  const processQrData = (data: string) => {
    try {
      console.log("Contenido QR original:", data);
      setError(null); // Limpiar errores previos
      setProcessedData(null); // Limpiar datos procesados previos
      
      // Crear un objeto para almacenar los datos
      const jsonData = {} as Record<string, string | number>;
      
      // Limpiar el contenido de caracteres especiales
      let cleanData = data.trim();
      
      // Log para diagnóstico
      console.log("Contenido limpio para procesar:", cleanData);
      
      // CASO 1: Formato JSON estándar
      try {
        // Intentar parsear como JSON válido
        if (cleanData.startsWith('{') && cleanData.endsWith('}')) {
          console.log("Detectado formato JSON estándar");
          const parsedData = JSON.parse(cleanData);
          console.log("JSON parseado correctamente:", parsedData);
          
          // Mapear los campos del JSON a los campos esperados
          if (parsedData["Código"]) jsonData['codigo'] = parsedData["Código"];
          if (parsedData["Marca"]) jsonData['marca'] = parsedData["Marca"];
          if (parsedData["Descripción"]) jsonData['descripcion'] = parsedData["Descripción"];
          if (parsedData["Unidad"]) jsonData['unidadBase'] = parsedData["Unidad"];
          if (parsedData["Lote"]) jsonData['lote'] = parsedData["Lote"];
          if (parsedData["Fecha Expiración"]) jsonData['fechaExpiracion'] = parsedData["Fecha Expiración"];
          if (parsedData["Area"]) jsonData['division'] = parsedData["Area"];
          if (parsedData["Sublinea"]) jsonData['sublinea'] = parsedData["Sublinea"];
          if (parsedData["Temperatura"]) {
            // Usar la función especializada para limpiar la temperatura
            jsonData['temperatura'] = cleanTemperatureValue(parsedData["Temperatura"].toString());
          }
          
          // Si se encontraron datos, procesarlos
          if (Object.keys(jsonData).length > 0) {
            console.log("Datos procesados del formato JSON:", jsonData);
            setProcessedData(jsonData);
            return;
          }
        }
      } catch (jsonError) {
        console.log("Error al parsear JSON:", jsonError);
        // Continuar con otros métodos si falla el parseo JSON
      }
      
      // CASO 2: Formato JSON distorsionado
      try {
        // El lector puede distorsionar caracteres JSON
        // ¨ (¨) = {
        // [ = "
        // Ñ (Ñ) = :
        // * = }
        // ' = -
        // C C = °C
        if (cleanData.includes('¨') || cleanData.includes('[') || 
            cleanData.includes('Ñ') || cleanData.includes('*')) {
          console.log("Detectado formato JSON distorsionado");
          
          // Convertir el formato distorsionado a JSON
          let jsonString = cleanData
            .replace(/¨/g, '{') // ¨ -> {
            .replace(/\[/g, '"') // [ -> "
            .replace(/Ñ/g, ':') // Ñ -> :
            .replace(/\*/g, '}') // * -> }
            .replace(/'/g, '-') // ' -> -
            .replace(/C C/g, '°C'); // C C -> °C
          
          // Corregir nombres de campos con acentos que se pierden
          jsonString = jsonString
            .replace(/"Cdigo":/g, '"Código":') 
            .replace(/"Descripcin":/g, '"Descripción":') 
            .replace(/"Fecha Expiracin":/g, '"Fecha Expiración":');
          
          console.log("Formato convertido a JSON:", jsonString);
          
          try {
            // Intentar parsear como JSON
            const parsedData = JSON.parse(jsonString);
            console.log("JSON distorsionado parseado correctamente:", parsedData);
            
            // Mapear los campos del JSON a los campos esperados
            // Buscar con y sin acentos para mayor compatibilidad
            if (parsedData["Código"] || parsedData["Cdigo"] || parsedData["Codigo"]) {
              jsonData['codigo'] = parsedData["Código"] || parsedData["Cdigo"] || parsedData["Codigo"];
            }
            
            if (parsedData["Marca"]) {
              jsonData['marca'] = parsedData["Marca"];
            }
            
            if (parsedData["Descripción"] || parsedData["Descripcin"] || parsedData["Descripcion"]) {
              jsonData['descripcion'] = parsedData["Descripción"] || parsedData["Descripcin"] || parsedData["Descripcion"];
            }
            
            if (parsedData["Unidad"]) {
              jsonData['unidadBase'] = parsedData["Unidad"];
            }
            
            if (parsedData["Lote"]) {
              jsonData['lote'] = parsedData["Lote"];
            }
            
            if (parsedData["Fecha Expiración"] || parsedData["Fecha Expiracin"] || parsedData["Fecha"]) {
              jsonData['fechaExpiracion'] = parsedData["Fecha Expiración"] || parsedData["Fecha Expiracin"] || parsedData["Fecha"];
            }
            
            if (parsedData["Area"] || parsedData["Área"]) {
              jsonData['division'] = parsedData["Area"] || parsedData["Área"];
            }
            
            if (parsedData["Sublinea"]) {
              jsonData['sublinea'] = parsedData["Sublinea"];
            }
            
            if (parsedData["Temperatura"] || parsedData["Temp"]) {
              // Obtener el valor de temperatura de cualquiera de las claves posibles
              let temp = parsedData["Temperatura"] || parsedData["Temp"] || "";
              
              // Usar la función especializada para limpiar la temperatura
              jsonData['temperatura'] = cleanTemperatureValue(temp.toString());
            }
            
            // Si se encontraron datos, procesarlos
            if (Object.keys(jsonData).length > 0) {
              console.log("Datos procesados del formato JSON distorsionado:", jsonData);
              setProcessedData(jsonData);
              return;
            }
          } catch (convertError) {
            console.log("Error al parsear el JSON convertido:", convertError);
            // Continuar con otros métodos si falla el parseo JSON
          }
        }
      } catch (distortedError) {
        console.log("Error al procesar formato distorsionado:", distortedError);
        // Continuar con otros métodos
      }
      
      // CASO 3: Formato específico reportado por el usuario
      // "CdigoÑ '02MarcaÑ fenDescripciWÑ nidadÑ 888Fecha cinÑ '08'29AreaÑ atorioSublineaÑ Ñ"
      if (cleanData.includes('digo') && cleanData.includes('arca') && 
          (cleanData.includes('scripciW') || cleanData.includes('nidad'))) {
        console.log("Procesando formato específico reportado por el usuario");
        
        // Extraer código
        const codigoMatch = cleanData.match(/[Cc]digo\s*[Ñ]?\s*([^A-Z]+)/);
        if (codigoMatch) jsonData['codigo'] = codigoMatch[1].replace(/'/g, '-').trim();
        
        // Extraer marca
        const marcaMatch = cleanData.match(/[Mm]arca\s*[Ñ]?\s*([^A-Z]+)/);
        if (marcaMatch) jsonData['marca'] = marcaMatch[1].trim();
        
        // Extraer descripción
        const descMatch = cleanData.match(/[Dd]escripci[WÑ]?\s*[Ñ]?\s*([^A-Z]+)/);
        if (descMatch) jsonData['descripcion'] = descMatch[1].replace(/'/g, '-').trim();
        
        // Extraer unidad
        const unidadMatch = cleanData.match(/[Uu]nidad\s*[Ñ]?\s*([^A-Z]+)/);
        if (unidadMatch) {
          const unidadValue = unidadMatch[1].trim();
          jsonData['unidadBase'] = unidadValue;
        }
        
        // Extraer fecha
        const fechaMatch = cleanData.match(/[Ff]echa\s*[cC]in\s*[Ñ]?\s*([^A-Z]+)/);
        if (fechaMatch) {
          let fechaValue = fechaMatch[1].replace(/'/g, '-').trim();
          // Si es formato '08'29, convertir a 2025-08-29
          if (fechaValue.match(/^\d{2}'\d{2}$/)) {
            fechaValue = `2025-${fechaValue.replace("'", "-")}`;
          }
          jsonData['fechaExpiracion'] = fechaValue;
        }
        
        // Extraer área
        const areaMatch = cleanData.match(/[Aa]rea\s*[Ñ]?\s*([^A-Z]+)/);
        if (areaMatch) {
          const areaValue = areaMatch[1].trim();
          if (areaValue.includes('atorio')) {
            jsonData['division'] = 'Laboratorio';
          } else {
            jsonData['division'] = areaValue;
          }
        }
        
        // Extraer sublínea
        const sublineaMatch = cleanData.match(/[Ss]ublinea\s*[Ñ]?\s*([^A-Z]+)/);
        if (sublineaMatch) jsonData['sublinea'] = sublineaMatch[1].trim();
        
        // Extraer temperatura
        const tempMatch = cleanData.match(/[Tt]emperatura\s*[Ñ]?\s*([^A-Z]+)/);
        if (tempMatch) {
          // Usar la función especializada para limpiar la temperatura
          jsonData['temperatura'] = cleanTemperatureValue(tempMatch[1].trim());
        }
        
        // Si se encontraron datos, procesarlos
        if (Object.keys(jsonData).length > 0) {
          console.log("Datos procesados del formato específico reportado:", jsonData);
          setProcessedData(jsonData);
          return;
        }
      }
      
      // CASO 4: Formato de texto plano con pares clave-valor
      if (Object.keys(jsonData).length === 0) {
        console.log("Intentando procesar como texto plano con pares clave-valor");
        
        // Buscar pares clave-valor en el texto
        const keyValuePattern = /([A-Za-z\u00f3\u00e1\u00e9\u00ed\u00fa\u00f1]+)[:\s]+([^,\n\r]+)/g;
        let match;
        
        while ((match = keyValuePattern.exec(cleanData)) !== null) {
          let key = match[1].trim().toLowerCase();
          let value = match[2].trim();
          
          // Usar la función processKeyValuePair para procesar cada par clave-valor
          processKeyValuePair(key, value, jsonData);
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
  

  // Función para procesar un par clave-valor y agregarlo al objeto JSON
  const processKeyValuePair = (key: string, value: string, jsonData: Record<string, string | number>) => {
    // Normalizar la clave
    let normalizedKey = key.toLowerCase();
    
    // Mapear claves específicas a nombres estandarizados
    if (key === 'CODIGO' || key === 'COD') normalizedKey = 'codigo';
    else if (key === 'DESCRIPCION' || key === 'DESC') normalizedKey = 'descripcion';
    else if (key === 'MARCA') normalizedKey = 'marca';
    else if (key === 'AREA') normalizedKey = 'division';
    else if (key === 'SUBLINEA') normalizedKey = 'sublinea';
    else if (key === 'TEMP' || key === 'TEMPERATURA') normalizedKey = 'temperatura';
    else normalizedKey = key.toLowerCase();
    
    // Limpiar el valor
    let cleanValue = value.replace(/'/g, '-');
    
    // Procesamiento especial para temperatura
    if (normalizedKey === 'temperatura') {
      jsonData[normalizedKey] = cleanTemperatureValue(cleanValue);
    }
    // Intentar convertir a número si es posible y no es temperatura
    else if (/^\d+$/.test(cleanValue)) {
      jsonData[normalizedKey] = parseInt(cleanValue);
    } else {
      jsonData[normalizedKey] = cleanValue;
    }
    
    console.log(`Par clave-valor procesado: ${normalizedKey} = ${jsonData[normalizedKey]}`);
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
