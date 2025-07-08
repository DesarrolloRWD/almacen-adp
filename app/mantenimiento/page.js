function MantenimientoPage() {
    return (
      <html>
        <head>
          <title>Sitio en Mantenimiento | Hospital Naval</title>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style dangerouslySetInnerHTML={{ __html: `
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              background-color: #f0f4f8;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              width: 100vw;
              padding: 20px;
            }
            .container {
              width: 90%;
              max-width: 500px;
              background-color: white;
              border-radius: 10px;
              box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
              padding: 30px;
              text-align: center;
            }
            .logo {
              max-width: 150px;
              margin-bottom: 20px;
            }
            h1 {
              color: #1a365d;
              font-size: 28px;
              margin-bottom: 20px;
            }
            .progress-bar {
              height: 8px;
              background-color: #e2e8f0;
              border-radius: 4px;
              overflow: hidden;
              margin: 30px 0;
            }
            .progress {
              width: 75%;
              height: 100%;
              background-color: #3182ce;
            }
            p {
              color: #4a5568;
              font-size: 16px;
              line-height: 1.6;
              margin-bottom: 15px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e2e8f0;
              color: #718096;
              font-size: 14px;
            }
          `}} />
        </head>
        <body>
          <div className="container">
            <img 
              src="/LG1.jpg" 
              alt="Hospital Naval Logo" 
              className="logo" 
            />
            
            <h1>Sitio en Mantenimiento</h1>
            
            <div className="progress-bar">
              <div className="progress"></div>
            </div>
            
            <p>
              Estamos realizando mejoras en el sistema para ofrecerle una mejor experiencia.
            </p>
            
            <p>
              El servicio estará disponible nuevamente en breve. Agradecemos su paciencia.
            </p>
            
            <div className="footer">
              <p>Sistema de Almacén | Hospital Naval</p>
              <p>© 2025 - Todos los derechos reservados</p>
            </div>
          </div>
        </body>
      </html>
    );
  }
  
  export default MantenimientoPage;
  