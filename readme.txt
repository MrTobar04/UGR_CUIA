DOCUMENTACIÓN TÉCNICA DE MUSEO VIRTUAL
1. Introducción

Esta documentación describe la arquitectura, módulos y funcionamiento de una aplicación web basada en una arquitectura cliente-servidor, desarrollada con un enfoque modular y tecnologías modernas tanto en el servidor como en el cliente.
2. Arquitectura General

La aplicación sigue una arquitectura cliente-servidor:

    Cliente: Aplicación web desarrollada con tecnologías HTML, CSS, JavaScript y el framework Bootstrap, que permite una interfaz responsive y moderna.

    Servidor: Aplicación desarrollada en Flask, ejecutada localmente. El servidor contiene varios módulos funcionales y se comunica con servicios externos y una base de datos.

3. Componentes del Servidor

El servidor Flask funciona como punto central de procesamiento, y cuenta con los siguientes componentes y módulos:
3.1. Módulos Propios

    face_detect: Módulo de reconocimiento facial. Procesa imágenes y videos para identificar rostros en tiempo real.

    audio_processing: Módulo de reconocimiento de voz. Utiliza la API de Google Speech Recognition para transcribir y analizar comandos de voz.

    ar_render: Módulo de realidad aumentada. Permite la integración de objetos virtuales sobre la imagen de entrada.

    consultadb: Módulo de consulta a la base de datos MongoDB. Gestiona la lectura y escritura de datos relacionados con usuarios, contenido y configuración.

    content: Módulo de filtrado de contenido basado en preferencias del usuario. Aplica lógica personalizada para mostrar contenido relevante.

3.2. Servicios Externos

    API de OpenAI: Utilizada para procesamiento de lenguaje natural, generación de contenido o análisis semántico.

    API de Google Speech Recognition: Utilizada para transcripción y análisis de audio en tiempo real.

3.3. Base de Datos

    MongoDB Local: Base de datos NoSQL que almacena información de usuarios, registros, configuraciones y contenidos personalizados.

4. Aplicación Cliente (Frontend)

La aplicación cliente está desarrollada como una web responsive utilizando Bootstrap. Es responsable de:

    Enviar peticiones al servidor para reconocimiento facial, de voz y AR.

    Mostrar los resultados devueltos por el servidor.

    Filtrar y mostrar contenido personalizado según las preferencias del usuario.

    Interactuar dinámicamente con los módulos del servidor mediante peticiones HTTP/REST.

5. Flujo de Datos

    Captura de datos: El usuario puede subir una imagen, audio o interactuar con la cámara/micrófono.

    Procesamiento en servidor: Los datos son enviados al servidor Flask, que los distribuye entre los módulos correspondientes.

    Consultas y Respuestas: Según el resultado, el servidor puede consultar la base de datos o servicios externos (OpenAI / Google Speech Recognition).

    Respuesta al cliente: Los resultados procesados se devuelven a la interfaz web para su visualización e interacción.

6. Seguridad y Privacidad

    Los datos se almacenan localmente, lo que garantiza mayor privacidad.

    Las conexiones pueden ser protegidas mediante HTTPS si se expone públicamente.

    Se recomienda implementar control de acceso y autenticación de usuarios.


Créditos

    Autor 
    Gabriel Ernesto Tobar Abrego
    Atribución
    © The Trustees of the British Museum. Imagenes y modelos compartidos bajo la licencia Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0). Fuente: https://www.britishmuseum.org/collection/object/Y_EA57365
