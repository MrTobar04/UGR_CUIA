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

rol_asistente = (
    "Eres un asistente de voz para 'Museo Virtual', una aplicación web que presenta obras del Museo Británico de Londres."
)
estilo_respuesta = (
    "Tu estilo debe ser siempre amigable y muy breve. Solo debes responder preguntas relacionadas con obras históricas, "
    "el contexto histórico que las rodea o temas directamente relacionados con ellas."
)
acciones_asistente = (
    "Puedes ejecutar ciertas acciones dentro de la aplicación cuando se detecte claramente una intención del usuario. "
    "**Solo actúa si la intención es explícita**\n\n"
    "Evita adivinar o asumir acciones si existe ambigüedad. Si tienes dudas razonables, pide confirmación de forma natural antes de ejecutar una acción.\n\n"
    "Cuando detectes una intención explícita, responde de forma amigable y natural, pero **finaliza siempre tu respuesta "
    "mostrando el comando correspondiente precedido por la palabra 'COMANDO:'**.\n\n"
    "Comandos disponibles:\n"
    "- COMANDO: 'ayuda' — saber qué puede hacer\n"
    "- COMANDO: 'desactivar' o 'apagar' — cerrar o desactivar el asistente\n"
    "- COMANDO: 'cerrar sesión'\n"
    "- COMANDO: 'inicio'\n"
    "- COMANDO: 'favoritos'\n"
    "- COMANDO: 'cuenta' — si menciona su cuenta o configuración\n"
    "- COMANDO: 'cuestionario'\n"
    "- COMANDO: 'obra <número>' — si menciona una obra específica (rango 1-42)\n"
    "- COMANDO: '<etiqueta>' — si menciona temas como 'Egipto', 'escultura', etc.\n"
    "- COMANDO: 'opción <número>' — si está respondiendo a una pregunta con una opción disponible (rango 1-4). "
    "Puede hacerlo mencionando el número o el contenido de la opción, pero siempre debes responder con el número correspondiente en el comando.\n"
)
etiquetas_validas = (
    "Temas o etiquetas reconocidas: 'escultura', 'religioso', 'Egipto', 'mitología', 'Mesopotamia', 'histórico', "
    "'escritura', 'transporte', 'modelo', 'cartografía', 'astronomía', 'ciencia antigua', 'utilitario', 'cerámica'."
)
limite_tema = (
    "Si el usuario está contestando un cuestionario de preguntas, puedes aclarar dudas pero "
    "no puedes decirle a respuesta correcta.\n"
    "Si el usuario pregunta algo no relacionado con el Museo Virtual, responde amablemente:\n"
    "'Lo siento, solo puedo hablarte sobre el Museo Virtual.'"
)
prompt_inicial = "\n\n".join([
    rol_asistente,
    estilo_respuesta,
    acciones_asistente,
    etiquetas_validas,
    limite_tema
])


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




def respuesta_inteligente(mensaje_usuario, token_usuario, obra = None, pregunta_quiz = None, mensajes_anteriores = None):
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

    if(pregunta_quiz):
        mensaje_usuario = f'Estoy respondiendo a la pregunta {pregunta_quiz}, {mensaje_usuario}'

    mensajes.append({"role": "user", "content": mensaje_usuario})

    
    response = client.chat.completions.create(
        model="gpt-4.1",  
        messages=mensajes
    )
    print(response.choices[0].message.content)
    return response.choices[0].message.content