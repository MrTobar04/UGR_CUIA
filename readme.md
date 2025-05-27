# Museo Virtual

Esta aplicación llamada **Museo Virtual** ha sido desarrollada en un entorno Windows. Permite explorar modelos 3D interactivos de obras del museo, y opcionalmente ofrece un asistente de voz basado en la API de OpenAI.

## Requisitos Previos

Antes de ejecutar la aplicación, asegúrese de tener instalado:

- Python 3.8 o superior
- Una conexión a internet (para funciones en línea)
- Una cuenta con API Key de OpenAI si desea usar el asistente de voz (requiere cuenta de pago)
- MongoDB instalado y en funcionamiento
- OpenSSL (para generar certificados HTTPS)

## Pasos para la instalación y ejecución

1. **Descargar el repositorio**
   - Clone este repositorio en su máquina local o descárguelo como archivo ZIP.

2. **Instalar dependencias de Python**
   - Desde la terminal, ubíquese en el directorio raíz del proyecto y ejecute:
     ```
     pip install -r requirements.txt
     ```

3. **Instalar MongoDB**
   - Descargue e instale el gestor de base de datos MongoDB desde la página oficial:
     https://www.mongodb.com/try/download/community
   - Asegúrese de que el servicio de MongoDB esté activo antes de iniciar la aplicación.

4. **Crear archivo `.env`**
   - En la raíz del proyecto, cree un archivo llamado `.env` y añada el siguiente contenido:

     ```
     # Clave para OpenAI
     OpenAI_API_Key=

     # Clave para encriptar face encodings
     SECRET_KEY=D4q6V-SYXmZxAOcEZJmFV4Xo_lUpC9dQ7Uop-3y2n6Q=

     # JWT para tokens
     JWT_SECRET=clave_secreta_super_segura
     ```

   > ⚠️ No comparta este archivo ni lo suba al repositorio.

5. **Crear certificados para HTTPS**
   - Para habilitar el acceso a **cámara y micrófono**, la aplicación requiere ejecutarse sobre HTTPS.
   - Genere los certificados `cert.pem` y `key.pem` en el directorio raíz del proyecto usando OpenSSL:

     ```
     openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out cert.pem
     ```

   - En navegadores modernos es obligatorio HTTPS para acceder a la cámara y el micrófono.

6. **(Opcional) Configurar asistente de voz**
   - Para usar el asistente de voz, ingrese una clave API válida en el campo `OpenAI_API_Key` del archivo `.env`.

7. **Descargar modelos 3D**
   - Los modelos 3D **no se incluyen** en este repositorio.
   - Puede descargarlos gratuitamente desde Sketchfab, en el perfil oficial del British Museum:
     https://sketchfab.com/britishmuseum/models

8. **Ubicar los modelos 3D**
   - Una vez descargados, coloque los archivos de los modelos en la siguiente ruta dentro del proyecto:
     ```
     static/src/3dmodels
     ```

9. **Ejecutar la aplicación**
   - Desde la terminal, dentro del directorio del proyecto, ejecute:
     ```
     python app.py
     ```

## Notas adicionales

- Esta aplicación ha sido probada únicamente en sistemas Windows.
- Dados los certificados utilizados, la aplicación solo puede ser utilizada en Firefox, para utilizarse en Google Chrome, se recomienda utilizar otro tipo de certificados.
- Asegúrese de que el servicio de MongoDB esté corriendo correctamente antes de iniciar la aplicación.
- Si tiene problemas con la visualización de modelos 3D, verifique que su navegador soporte WebGL y que los modelos estén correctamente ubicados.
- La ejecución sobre HTTPS es necesaria para el acceso a cámara y micrófono.
- El archivo `.env` debe mantenerse privado por razones de seguridad.

---

© 2025 - Museo Virtual | Proyecto educativo sin fines de lucro.
