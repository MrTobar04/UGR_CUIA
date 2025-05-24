import speech_recognition as sr
from openai import OpenAI
from dotenv import load_dotenv
import os

from utils.consultadb import consultarDatos


# Configura tu API key
load_dotenv()
apikey = os.getenv("OpenAI_API_Key")
client = OpenAI()
personalizacion = None

# Prompt inicial para delimitar el comportamiento del modelo
prompt_inicial = (
    "Eres un asistente de voz para 'Museo Virtual', una aplicación web que presenta obras del Museo Británico de Londres.\n"
    "Tu estilo debe ser siempre amigable y muy breve. Solo debes responder preguntas relacionadas con obras históricas, "
    "el contexto histórico que las rodea o temas directamente relacionados con ellas.\n\n"
    "También puedes ejecutar ciertas acciones dentro de la aplicación. No necesitas que el usuario diga los comandos con exactitud: "
    "interpreta su intención libremente (por ejemplo, si dice 'quiero volver a empezar', 'muéstrame mis favoritos', o 'configuración de mi cuenta').\n\n"
    "Cuando detectes una intención correspondiente a una acción, responde de forma natural y amigable, pero **finaliza siempre tu respuesta mostrando el comando correspondiente precedido por la palabra 'COMANDO:'**.\n"
    "Por ejemplo: 'Claro, te muestro tus favoritas. COMANDO: 'favoritos''.\n\n"
    "Usa los siguientes comandos al interpretar la intención del usuario:\n"
    "- Si el usuario quiere saber qué puede hacer: COMANDO: 'ayuda'\n"
    "- Si el usuario quiere cerrar o desactivar el asistente: COMANDO: 'desactivar' o 'apagar'\n"
    "- Si el usuario quiere cerrar sesión: COMANDO: 'cerrar sesión'\n"
    "- Si el usuario quiere volver a la página de inicio: COMANDO: 'inicio'\n"
    "- Si el usuario quiere ver sus favoritos: COMANDO: 'favoritos'\n"
    "- Si menciona su cuenta o configuración: COMANDO: 'cuenta'\n"
    "- Si quiere hacer un cuestionario: COMANDO: 'cuestionario'\n"
    "- Si menciona una obra con número (por ejemplo, 'obra cinco'): COMANDO: 'obra' seguido de un número (rango del 1 al 42)\n"
    "- Si menciona estilos o temas como 'escultura', 'religioso', 'Egipto', 'mitología', 'Mesopotamia', 'histórico', 'escritura', 'transporte', "
    "'modelo', 'cartografía', 'astronomía', 'ciencia antigua', 'utilitario', 'cerámica': muestra obras relacionadas. COMANDO: '<etiqueta>'\n\n"
    "Si el usuario pregunta algo no relacionado con el Museo Virtual, responde amablemente:\n"
    "'Lo siento, solo puedo hablarte sobre el Museo Virtual.'"
)

def recognize_audio(audio_path):
    r = sr.Recognizer()

    with sr.AudioFile(audio_path) as source:
        audio = r.record(source)

    # Intentamos reconocer el habla utilizando el servicio de Google Speech Recognition
    try:
        # Se llama a recognize_google con el audio capturado y se especifica 'es-ES' para el idioma español
        texto = r.recognize_google(audio, language='es-ES')
        # Si se reconoce el audio, se imprime el texto transcrito
        print("Google Speech Recognition cree que dijiste:", texto)
    except sr.UnknownValueError:
        # Esta excepción se captura cuando el servicio no logra interpretar el audio
        print("Google Speech Recognition no pudo entender el audio")
    except sr.RequestError as e:
        # Esta excepción se maneja en caso de errores en la solicitud (ej. problemas de conectividad)
        print("No se pudieron solicitar resultados del servicio de Google Speech Recognition; {0}".format(e))

    return texto




def respuesta_inteligente(mensaje_usuario, token_usuario, obra = None, mensajes_anteriores = None):
    global personalizacion
    if(personalizacion is None):
        consulta = consultarDatos("usuarios", ["etiquetas", "nombre_usuario"], token = token_usuario).get_json()["consulta"]
        nombre_usuario = consulta[0]["nombre_usuario"]
        personalizacion = f"Estás hablando con {nombre_usuario} y tiene los siguientes gustos: (etiqueta, peso):"
          # Concatenar cada etiqueta y su valor al texto
        for item in consulta[0]["etiquetas"]:
            personalizacion += f"\n{item['etiqueta']}: {item['valor']}"
        

        

    mensajes = [
            {"role": "system", "content": prompt_inicial + personalizacion}
        ]
    
    if(mensajes_anteriores):
        mensajes.extend(mensajes_anteriores)
    else:
        if(obra):
            mensaje_usuario = f'Estoy observando la obra {obra}, {mensaje_usuario}'

    mensajes.append({"role": "user", "content": mensaje_usuario})

    
    response = client.chat.completions.create(
        model="gpt-4.1",  
        messages=mensajes
    )
    print(response.choices[0].message.content)
    return response.choices[0].message.content