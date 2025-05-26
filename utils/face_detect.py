import cv2
import numpy as np
import base64
from cryptography.fernet import Fernet
from utils.consultadb import consultarDatos
import os
from dotenv import load_dotenv

# Cargar variables del archivo .env
load_dotenv()

# Obtener la clave desde las variables de entorno
key_str = os.getenv("SECRET_KEY")
if not key_str:
    raise ValueError("SECRET_KEY no encontrada en .env")

# Convertir a bytes para usar con Fernet
SECRET_KEY = key_str.encode()
fernet = Fernet(SECRET_KEY)

# Inicializar modelos
fr = cv2.FaceRecognizerSF.create("utils/dnn/face_recognition_sface_2021dec.onnx", "")




# Serializar, encriptar y desencriptar
def encriptar_face_encoding(encoding: np.ndarray) -> str:
    datos_bytes = encoding.tobytes()
    encrypted = fernet.encrypt(datos_bytes)
    return base64.b64encode(encrypted).decode('utf-8')

def desencriptar_face_encoding(encrypted_string: str) -> np.ndarray:
    encrypted_bytes = base64.b64decode(encrypted_string.encode('utf-8'))
    decrypted = fernet.decrypt(encrypted_bytes)
    array = np.frombuffer(decrypted, dtype=np.float32)
    return array.reshape((1, 128))


# Crear encoding facial y encriptar
def obtener_face_encoding(cara):
    h, w, _ = cara.shape
    detector = cv2.FaceDetectorYN.create("utils/dnn/face_detection_yunet_2023mar.onnx", config="", input_size=(w,h),  score_threshold=0.7)
    ret, detectCara = detector.detect(cara)
    
    if(len(detectCara) > 1):
        raise Exception("Múltiples caras detectadas.")
    
    caraCrop = fr.alignCrop(cara, detectCara[0])
    face_encoding = fr.feature(caraCrop)

    return encriptar_face_encoding(face_encoding)


# Comparar encoding facial encriptado
def detectar_cara(imagenEvaluada):
    deteccion = False
    idUsuario = []
    nombreUsuario = []

    h, w, _ = imagenEvaluada.shape
    detector = cv2.FaceDetectorYN.create("utils/dnn/face_detection_yunet_2023mar.onnx", config="", input_size=(w,h),  score_threshold=0.7)
    ret, caras = detector.detect(imagenEvaluada)

    if caras is not None and len(caras) > 1:
        raise Exception("Múltiples caras detectadas.")
    
    consulta = consultarDatos("usuarios", ["face_encoding", "_id", "nombre_usuario"]).get_json()
    registro = consulta["consulta"]

    for cara in caras:
        caracrop = fr.alignCrop(imagenEvaluada, cara)
        codcara = fr.feature(caracrop).reshape((1, 128))

        for i in range(len(registro)):
            codRegistro = desencriptar_face_encoding(registro[i]["face_encoding"])
            semejanza = fr.match(codRegistro, codcara, cv2.FaceRecognizerSF_FR_COSINE)
            if semejanza > 0.5:
                deteccion = True
                idUsuario.append(registro[i]["_id"])
                nombreUsuario.append(registro[i]["nombre_usuario"])

    return deteccion, idUsuario, nombreUsuario
