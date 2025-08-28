import { NextResponse } from 'next/server';

type PrintType = 'qr' | 'barcode' | 'qr-large';

/* 
  ===============================
  FUNCIÓN: Generar etiqueta QR normal (50x30mm)
  ===============================
*/
function generatePrintableHTML(imageData: string, productInfo: any, type: PrintType = 'qr') {
  // Extraemos los campos del producto
  const { codigo, descripcion, lote, fechaExpiracion, temperatura } = productInfo;
  
  // Plantilla HTML con CSS para impresión
  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Etiqueta - ${codigo}</title>
    <style>
      * {
        box-sizing: border-box; /* Hace que padding/border no desajusten el ancho */
        margin: 0;
        padding: 0;
      }
  
      /* Define tamaño físico del papel/etiqueta */
      @page {
        size: 50mm 30mm; /* 50mm ancho x 30mm alto */
        margin: 0;       /* sin márgenes extras */
      }
  
      html, body {
        width: 50mm;              /* ancho etiqueta */
        height: 24mm;             /* alto visible (ajustable) */
        font-family: Arial, sans-serif; /* fuente básica */
        font-size: 6pt;           /* tamaño pequeño para que quepa todo */
        display: flex;            /* usa flexbox para organizar */
        flex-direction: row;      /* QR a la izquierda, info a la derecha */
        align-items: center;      /* centra verticalmente */
        justify-content: space-between; /* separa QR e info */
        padding: 1mm;             /* margen interno */
        overflow: hidden;         /* evita desbordes */
        transform: translateX(5.5mm); /* corrige corte izquierdo en algunas impresoras */
      }
  
      /* Contenedor QR */
      .qr-container {
        flex: 0 0 21mm;  /* ancho fijo 21mm */
        height: 28mm;    /* altura casi completa */
        display: flex;
        align-items: center;
        justify-content: center;
      }
  
      .qr-code {
        width: 21mm;     /* tamaño exacto del QR */
        height: 21mm;
        object-fit: contain; /* asegura que no se deforme */
      }
  
      /* Contenedor de texto del producto */
      .product-info {
        flex: 1;                  /* ocupa el resto del espacio */
        height: 28mm;
        display: flex;
        flex-direction: column;   /* apila texto en columna */
        justify-content: center;  /* centra verticalmente */
      }
  
      .product-info p {
        margin: 0 0 0.6mm 0;   /* separación mínima entre líneas */
        line-height: 1.0;      /* compacto */
        white-space: nowrap;   /* evita salto de línea */
        overflow: hidden;      /* corta si el texto es largo */
        text-overflow: ellipsis; /* agrega ... si el texto no cabe */
        font-size: 6pt;
      }
  
      .label {
        font-weight: bold; /* resalta las etiquetas */
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
      // Autoimprime al cargar
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

/* 
  ===============================
  FUNCIÓN: Generar etiqueta QR grande (10x10 cm)
  ===============================
*/
function generateLargeQRHTML(imageData: string, record: any) {
  const codeType = 'qr'; 
  const codeTypeLabel = 'QR';
  const formatLabel = '10x10 cm';

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <title>Imprimir Código ${codeTypeLabel} - ${record.codigo}</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        text-align: center;
      }
      .container {
        max-width: 400px;     /* ancho de la tarjeta (ajustable) */
        margin: 0 auto;
        padding: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        background-color: #f9f9f9;
      }
      .qr-image {
        max-width: 250px;     /* tamaño del QR */
        margin: 15px auto;
      }
      .product-info {
        text-align: left;
        margin-top: 15px;
        padding: 10px;
        background-color: #f0f0f0;
        border-radius: 5px;
        font-size: 12px;
      }
      .product-info p {
        margin: 5px 0;
      }
      .footer {
        margin-top: 15px;
        font-size: 11px;
        color: #666;
      }
      @media print {
        .no-print { display: none; }
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h3>Código ${codeTypeLabel} - ${record.descripcion}</h3>
      ${codeType === 'qr' ? `<p>Formato: ${formatLabel}</p>` : ''}
      <img src="${imageData}" alt="Código QR" class="qr-image" />
      <div class="product-info">
        <p><strong>Código:</strong> ${record.codigo}</p>
        ${codeType === 'qr' ? `
        <p><strong>Marca:</strong> ${record.marca}</p>
        <p><strong>Descripción:</strong> ${record.descripcion}</p>
        <p><strong>Unidad:</strong> ${record.unidad}</p>
        <p><strong>Lote:</strong> ${record.lote}</p>
        <p><strong>Área:</strong> ${record.area}</p>
        <p><strong>Fecha Exp.:</strong> ${new Date(record.fechaExpiracion).toLocaleDateString("es-ES")}</p>
        ` : `<p><strong>Lote:</strong> ${record.lote}</p>`}
      </div>
      <div class="footer">
        Generado el ${new Date().toLocaleDateString()} a las ${new Date().toLocaleTimeString()}
      </div>
      <button class="no-print" onclick="window.print();window.close()" 
        style="margin-top:20px;padding:8px 16px;background:#4338ca;color:white;border:none;border-radius:4px;cursor:pointer">
        Imprimir
      </button>
    </div>
    <script>
      // Autoimprime al cargar
      window.onload = function() {
        setTimeout(function() {
          window.print();
        }, 500);
      }
    </script>
  </body>
  </html>
  `;

  return html;
}

/* 
  ===============================
  FUNCIÓN: Generar etiqueta Código de Barras (50x30mm)
  ===============================
*/
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
        flex-direction: column;  /* apila barcode arriba, info abajo */
        align-items: center;
        justify-content: center;
        padding: 1mm;
        overflow: hidden;
        transform: translateX(5.5mm); /* corrige corte izquierdo */
      }
  
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
  
      .label { font-weight: bold; }
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
        // Genera el código de barras dinámicamente
        JsBarcode("#barcode", "${barcodeValue}", {
          format: "CODE128",  /* formato estándar */
          lineColor: "#000",  /* color negro */
          width: 1,           /* grosor de barras */
          height: 40,         /* altura del código */
          displayValue: false /* no muestra el texto debajo */
        });
        
        // Autoimprime
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

/* 
  ===============================
  API: POST para imprimir etiquetas
  ===============================
*/
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
    } else if (type === 'qr-large') {
      if (!imageData || !productInfo) {
        return NextResponse.json({ error: 'Datos de imagen o producto no proporcionados' }, { status: 400 });
      }
      printableHTML = generateLargeQRHTML(imageData, productInfo);
    } else {
      if (!imageData || !productInfo) {
        return NextResponse.json({ error: 'Datos de imagen o producto no proporcionados' }, { status: 400 });
      }
      printableHTML = generatePrintableHTML(imageData, productInfo, 'qr');
    }
    
    console.log(`HTML imprimible generado para la etiqueta tipo: ${type}`);
    
    // Devuelve el HTML como respuesta
    return new NextResponse(printableHTML, {
      headers: { 'Content-Type': 'text/html' },
    });
    
  } catch (error) {
    console.error('Error al procesar la solicitud de impresión:', error);
    return NextResponse.json({ error: 'Error al procesar la solicitud de impresión' }, { status: 500 });
  }
}
