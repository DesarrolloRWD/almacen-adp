"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import QRCode from "react-qr-code"
import { ProductoZoques } from "@/lib/api"

interface ProductoQRDialogProps {
  isOpen: boolean
  onClose: () => void
  producto: ProductoZoques | null
}

export default function ProductoQRDialog({
  isOpen,
  onClose,
  producto
}: ProductoQRDialogProps) {
  const [qrValue, setQrValue] = useState<string>("")
  
  // Función para formatear la fecha (YYYY-MM-DD)
  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'null';
    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0]; // Formato YYYY-MM-DD
    } catch (error) {
      return dateString;
    }
  };

  useEffect(() => {
    if (producto) {
      // Crear un objeto con la información relevante para el QR
      const qrData = {
        Código: producto.codigo,
        Marca: producto.marca,
        Descripción: producto.descripcionCorta || producto.descripcion,
        Unidad: producto.unidad,
        Lote: producto.lote || 'null',
        'Fecha Expiración': formatDate(producto.fechaExpiracion),
        Area: producto.division,
        Sublinea: producto.sublinea,
        Temperatura: producto.temperatura || 'null'
      }
      
      // Convertir a JSON string para el QR
      setQrValue(JSON.stringify(qrData))
    }
  }, [producto])

  // Función para imprimir en impresora Zebra
  const handlePrint = async () => {
    if (!producto) return
    
    try {
      // Crear un elemento canvas temporal para generar la imagen
      const canvas = document.createElement("canvas")
      const qrCodeElement = document.getElementById("qr-code")
      
      if (qrCodeElement) {
        // Obtener dimensiones del QR
        const width = qrCodeElement.offsetWidth
        const height = qrCodeElement.offsetHeight
        
        // Configurar el canvas
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext("2d")
        
        if (ctx) {
          // Convertir el elemento SVG a una imagen
          const svgData = new XMLSerializer().serializeToString(qrCodeElement.querySelector("svg")!)
          const img = new Image()
          
          img.onload = async () => {
            // Dibujar la imagen en el canvas
            ctx.fillStyle = "white"
            ctx.fillRect(0, 0, width, height)
            ctx.drawImage(img, 0, 0)
            
            // Convertir el canvas a una URL de datos
            const dataUrl = canvas.toDataURL("image/png")
            
            // Preparar los datos para la impresora Zebra
            const zebraData = {
              imageData: dataUrl,
              productInfo: {
                codigo: producto.codigo,
                descripcion: producto.descripcionCorta || producto.descripcion,
                lote: producto.lote || 'N/A',
                fechaExpiracion: formatDate(producto.fechaExpiracion),
                temperatura: producto.temperatura || 'N/A'
              }
            }
            
            // Enviar a la API de impresión
            try {
              // Aquí iría la llamada a la API de impresión
              // Por ahora mostramos un mensaje de éxito
              alert('Enviado a la impresora Zebra')
              
              // En una implementación real:
              // const response = await fetch('/api/print/zebra', {
              //   method: 'POST',
              //   headers: { 'Content-Type': 'application/json' },
              //   body: JSON.stringify(zebraData)
              // })
              // 
              // if (!response.ok) {
              //   throw new Error('Error al enviar a la impresora')
              // }
              // 
              // const result = await response.json()
              // console.log('Impresión exitosa:', result)
            } catch (error) {
              console.error('Error al imprimir:', error)
              alert('Error al enviar a la impresora')
            }
          }
          
          img.src = "data:image/svg+xml;base64," + btoa(svgData)
        }
      }
    } catch (error) {
      console.error('Error al preparar la impresión:', error)
      alert('Error al preparar la impresión')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Código QR del Producto</DialogTitle>
        </DialogHeader>
        
        {producto ? (
          <div className="flex flex-col items-center justify-center py-4 space-y-4">
            <div id="qr-code" className="bg-white p-4 rounded-md mx-auto">
              <QRCode
                value={qrValue}
                size={200}
                level="H"
                bgColor="#FFFFFF"
                fgColor="#000000"
              />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="font-semibold text-base">Datos del QR:</h3>
              <div className="text-sm text-left bg-gray-50 p-3 rounded-md">
                <p><span className="font-medium">Código:</span> {producto.codigo}</p>
                <p><span className="font-medium">Marca:</span> {producto.marca}</p>
                <p><span className="font-medium">Descripción:</span> {producto.descripcionCorta || producto.descripcion}</p>
                <p><span className="font-medium">Unidad:</span> {producto.unidad}</p>
                <p><span className="font-medium">Lote:</span> {producto.lote || 'null'}</p>
                <p><span className="font-medium">Fecha Expiración:</span> {formatDate(producto.fechaExpiracion)}</p>
                <p><span className="font-medium">Area:</span> {producto.division}</p>
                <p><span className="font-medium">Sublinea:</span> {producto.sublinea}</p>
                <p><span className="font-medium">Temperatura:</span> {producto.temperatura || 'null'}</p>
              </div>
            </div>
            
            <Button onClick={handlePrint} className="w-full">
              <Printer className="mr-2 h-4 w-4" />
              Imprimir en Zebra
            </Button>
          </div>
        ) : (
          <div className="py-4 text-center text-muted-foreground">
            No hay información disponible para generar el QR
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
