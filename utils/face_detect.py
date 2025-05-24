import cv2
import numpy as np
from utils.consultadb import consultarDatos

fr = cv2.FaceRecognizerSF.create("utils/dnn/face_recognition_sface_2021dec.onnx", "")



def obtener_face_encoding(cara):
    h, w, _ = cara.shape
    detector = cv2.FaceDetectorYN.create("utils/dnn/face_detection_yunet_2023mar.onnx", config="", input_size=(w,h),  score_threshold=0.7)
    ret, detectCara = detector.detect(cara)
    
    if(len(detectCara) > 1):
        raise Exception("Múltiples caras detectadas.")
    
    caraCrop = fr.alignCrop(cara, detectCara[0])
    face_encoding = fr.feature(caraCrop)

    return face_encoding



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
        codcara = fr.feature(caracrop)
        for i in range(len(registro)):
            codRegistro = np.array(registro[i]["face_encoding"], dtype=np.float32)
            semejanza = fr.match(codRegistro, codcara, cv2.FaceRecognizerSF_FR_COSINE)
            if semejanza > 0.5:
                deteccion = True
                idUsuario.append(registro[i]["_id"])
                nombreUsuario.append(registro[i]["nombre_usuario"])
                

    return deteccion, idUsuario, nombreUsuario
        
