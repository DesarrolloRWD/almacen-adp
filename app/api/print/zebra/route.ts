import { NextResponse } from 'next/server';

type PrintType = 'qr' | 'barcode';

// Función para generar HTML imprimible con la etiqueta
function generatePrintableHTML(imageData: string, productInfo: any, type: PrintType = 'qr') {
  const { codigo, descripcion, lote, fechaExpiracion, temperatura } = productInfo;
  
  // Crear un HTML con estilos para impresión
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Etiqueta - ${codigo}</title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
  
      /* Tamaño real de la etiqueta */
      @page {
        size: 50mm 30mm;
        margin: 0;
      }
  
      html, body {
        width: 50mm;
        height: 24mm;
        font-family: Arial, sans-serif;
        font-size: 6pt;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        padding: 1mm;
        overflow: hidden;
        transform: translateX(5.5mm); /* corrige corte izquierdo */
      }
  
      /* QR */
      .qr-container {
        flex: 0 0 21mm;   /* ancho fijo para QR */
        height: 28mm;     /* altura máxima disponible */
        display: flex;
        align-items: center;
        justify-content: center;
      }
  
      .qr-code {
        width: 21mm;  /* tamaño grande pero controlado */
        height: 21mm;
        object-fit: contain;
      }
  
      /* Información */
      .product-info {
        flex: 1;
        height: 28mm;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
  
      .product-info p {
        margin: 0 0 0.6mm 0;  /* menos espacio entre líneas */
        line-height: 1.0;     /* más compacto */
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        font-size: 6pt;
      }
  
      .label {
        font-weight: bold;
      }
    </style>
  </head>
  <body>
    <div class="qr-container">
      <img class="qr-code" src="${imageData}" alt="QR Code">
    </div>
    <div class="product-info">
      <p><span class="label">Cód:</span> ${codigo}</p>
      <p><span class="label">Desc:</span> ${descripcion.length > 15 ? descripcion.substring(0, 15) + '...' : descripcion}</p>
      <p><span class="label">Lote:</span> ${lote}</p>
      <p><span class="label">Exp:</span> ${fechaExpiracion}</p>
      ${temperatura !== 'N/A' ? `<p><span class="label">Temp:</span> ${temperatura}</p>` : ''}
    </div>
  
    <script>
      window.onload = function() {
        setTimeout(() => {
          window.print();
          setTimeout(() => window.close(), 500);
        }, 500);
      }
    </script>
  </body>
  </html>
  `;
  
  
  
  
  
  
  return html;
}

// Función para generar HTML con código de barras
function generateBarcodeHTML(productInfo: any) {
  const { lote, fechaExpiracion } = productInfo;
  const barcodeValue = `${lote}-${fechaExpiracion}`;
  
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Código de Barras - ${lote}</title>
    <style>
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
  
      /* Tamaño real de la etiqueta */
      @page {
        size: 50mm 30mm;
        margin: 0;
      }
  
      html, body {
        width: 50mm;
        height: 24mm;
        font-family: Arial, sans-serif;
        font-size: 6pt;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 1mm;
        overflow: hidden;
        transform: translateX(5.5mm); /* corrige corte izquierdo */
      }
  
      /* Código de barras */
      .barcode-container {
        width: 44mm;
        height: 15mm;
        display: flex;
        align-items: center;
        justify-content: center;
      }
  
      #barcode {
        width: 100%;
        height: 100%;
      }
  
      /* Información */
      .info-container {
        width: 44mm;
        margin-top: 2mm;
        text-align: center;
      }
  
      .info-container p {
        margin: 0.5mm 0;
        line-height: 1.0;
        font-size: 6pt;
      }
  
      .label {
        font-weight: bold;
      }
    </style>
    <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
  </head>
  <body>
    <div class="barcode-container">
      <svg id="barcode"></svg>
    </div>
    <div class="info-container">
      <p><span class="label">Lote:</span> ${lote}</p>
      <p><span class="label">Exp:</span> ${fechaExpiracion}</p>
    </div>
  
    <script>
      window.onload = function() {
        // Generar código de barras
        JsBarcode("#barcode", "${barcodeValue}", {
          format: "CODE128",
          lineColor: "#000",
          width: 1,
          height: 40,
          displayValue: false
        });
        
        // Auto-imprimir
        setTimeout(() => {
          window.print();
          setTimeout(() => window.close(), 500);
        }, 500);
      }
    </script>
  </body>
  </html>
  `;
  
  return html;
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { imageData, productInfo, type = 'qr' } = data;
    
    let printableHTML;
    
    if (type === 'barcode') {
      if (!productInfo) {
        return NextResponse.json({ error: 'Datos del producto no proporcionados' }, { status: 400 });
      }
      printableHTML = generateBarcodeHTML(productInfo);
    } else {
      // Tipo QR (predeterminado)
      if (!imageData || !productInfo) {
        return NextResponse.json({ error: 'Datos de imagen o producto no proporcionados' }, { status: 400 });
      }
      printableHTML = generatePrintableHTML(imageData, productInfo, 'qr');
    }
    
    console.log(`HTML imprimible generado para la etiqueta tipo: ${type}`);
    
    // Devolver el HTML como respuesta
    return new NextResponse(printableHTML, {
      headers: {
        'Content-Type': 'text/html',
      },
    });
    
  } catch (error) {
    console.error('Error al procesar la solicitud de impresión:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de impresión' }, { status: 500 });
  }
}
