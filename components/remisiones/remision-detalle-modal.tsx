"use client";

import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RemisionDetallada } from "@/lib/api";
import { Button } from "@/components/ui/button";
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle } from "lucide-react";

interface RemisionDetalleModalProps {
  remision: RemisionDetallada | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RemisionDetalleModal({
  remision,
  isOpen,
  onClose,
}: RemisionDetalleModalProps) {
  if (!remision) return null;

  const formatDate = (dateString: string | null, compact: boolean = false) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return format(
        date, 
        compact ? "dd/MM/yyyy" : "dd 'de' MMMM 'de' yyyy, HH:mm", 
        { locale: es }
      );
    } catch (error) {
      console.error("Error al formatear fecha:", error);
      return dateString;
    }
  };

  // Custom DialogContent without close button
  const DialogContentWithoutCloseButton = React.forwardRef<
    React.ElementRef<typeof DialogPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
  >(({ className, children, ...props }, ref) => (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
          className
        )}
        {...props}
      >
        {children}
        {/* Close button is intentionally removed here */}
      </DialogPrimitive.Content>
    </DialogPortal>
  ));
  DialogContentWithoutCloseButton.displayName = DialogPrimitive.Content.displayName;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContentWithoutCloseButton className="max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Cabecera con información de la remisión */}
        <div className="border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">Remisión #{remision.informacion.ordenRemision}</DialogTitle>
          </div>
          
          <DialogDescription className="sr-only">Detalles de la remisión y productos incluidos</DialogDescription>
          
          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted-foreground">Fecha:</span>
              <span>{formatDate(remision.informacion.fechaSalida, true)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted-foreground">Entrega:</span>
              <span>{remision.informacion.hospital}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted-foreground">Tipo:</span>
              <span>{remision.informacion.tipoSalida}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-muted-foreground">Almacén:</span>
              <span>{remision.informacion.almacenProveniente}</span>
            </div>
          </div>
        </div>
        
        {/* Sección de productos */}
        <div>
          <div className="flex justify-between items-center border-b pb-2 mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Productos en la Remisión</h3>
              <Badge variant="secondary">
                {remision.detalleRemision.length} productos
              </Badge>
            </div>
          </div>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Código</TableHead>
                  <TableHead className="w-[40%]">Descripción</TableHead>
                  <TableHead className="text-center w-[80px]">Cantidad</TableHead>
                  <TableHead className="w-[80px]">Unidad</TableHead>
                  <TableHead className="text-center w-[100px]">Estado</TableHead>
                  <TableHead>Obaservaciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {remision.detalleRemision.map((producto, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{producto.codigo}</TableCell>
                    <TableCell className="font-medium">{producto.descripcion}</TableCell>
                    <TableCell className="text-center font-semibold">{producto.cantidad}</TableCell>
                    <TableCell>{producto.unidad}</TableCell>
                    <TableCell className="text-center">
                      {producto.confirmacionRecibido ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200 flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Confirmado</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-amber-500 text-amber-700 flex items-center gap-1 whitespace-nowrap">
                          <XCircle className="h-3 w-3" />
                          <span>Pendiente</span>
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {producto.observaciones && (
                        <div className="mb-1">
                          <span className="font-medium">Obs: </span>
                          {producto.observaciones}
                        </div>
                      )}
                      {producto.confirmacionRecibido && (
                        <div className="text-xs text-muted-foreground flex gap-2">
                          <span>Por: <span className="font-medium">{producto.confirmadoPor}</span></span>
                          {producto.fechaConfirmacion && (
                            <span>Fecha: <span className="font-medium">{formatDate(producto.fechaConfirmacion, true)}</span></span>
                          )}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
        
        <div className="flex justify-end mt-4 pt-2 border-t">
          <Button onClick={onClose} variant="outline">
            Cerrar
          </Button>
        </div>
      </DialogContentWithoutCloseButton>
    </Dialog>
  );
}
