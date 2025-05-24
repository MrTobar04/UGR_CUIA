import gc
import cv2
import numpy as np
import time
import utils.cuia as cuia
import utils.droidCam as camara
# import utils.camara as camara

# --- Inicialización una vez ---
cameraMatrix = camara.cameraMatrix
distCoeffs = camara.distCoeffs

modelo = None
modeloCargado = "ninguno"
escalaCargada = None

webcam = None
escena = None  # Usamos un tamaño base, luego adaptamos con cada imagen

# Detector ArUco reutilizable
diccionario_aruco = cv2.aruco.getPredefinedDictionary(cv2.aruco.DICT_5X5_50)
detector_aruco = cv2.aruco.ArucoDetector(diccionario_aruco)

# --- Función principal ---
def mostrarModelo(rutaModelo, aEscala=False):
    global modeloCargado, modelo, escena, webcam, alto, ancho, escalaCargada

    start_total = time.time()

    if escena is None:
        print("no entiendo nada")
        
    if rutaModelo != modeloCargado or escalaCargada != aEscala:
        t1 = time.time()

         # Liberar modelo y escena anteriores si existen
        if modelo is not None:
            del modelo
            modelo = None
        if escena is not None:
            escena.scene.clear()
            del escena
            escena = None

        gc.collect()  # Forzar recolección de basura

        modeloCargado = rutaModelo
        escalaCargada = aEscala
        
        modelo = cuia.modeloGLTF(rutaModelo)
        modelo.rotar((np.pi / 2.0, 0, 0))

        if not aEscala:
            radio_inicial = modelo.model_obj.get_world_bounding_sphere()[3]
            radio_objetivo = 0.1052
            factor_escalado = radio_objetivo / radio_inicial
            modelo.escalar(factor_escalado)

            traslado_x = -modelo.model_obj.get_world_bounding_sphere()[0]
            traslado_y = -modelo.model_obj.get_world_bounding_sphere()[1]
            modelo.trasladar([traslado_x, traslado_y, 0])

        modelo.flotar()

        print(f"[✔] Modelo cargado y preparado en {time.time() - t1:.2f} segundos.")

    if webcam is None:
        t2 = time.time()
        cam = 2  # o dirección IP de cámara
        bk = cuia.bestBackend(cam)
        webcam = cv2.VideoCapture(cam, bk)
        ancho = int(webcam.get(cv2.CAP_PROP_FRAME_WIDTH))
        alto = int(webcam.get(cv2.CAP_PROP_FRAME_HEIGHT))
        print(f"[✔] Webcam inicializada en {time.time() - t2:.4f} segundos.")

    t3 = time.time()
    ret, imagen = webcam.read()
    if not ret:
        webcam.set(cv2.CAP_PROP_POS_FRAMES, 0)
        success, imagen = webcam.read()
        if not success:
            raise ValueError("No se pudo leer un nuevo frame del video.")
    #print(f"[✔] Frame capturado en {time.time() - t3:.4f} segundos.")

    if escena is None:
        t4 = time.time()
        escena = cuia.escenaPYGFX(fov(cameraMatrix, ancho, alto), ancho, alto)
        escena.agregar_modelo(modelo)
        escena.ilumina_modelo(modelo)
        escena.iluminar()
        print(f"[✔] Escena creada en {time.time() - t4:.4f} segundos.")

    t5 = time.time()
    ret, poses = detectarPose(imagen, 0.15)
    #print(f"[✔] Detección de pose en {time.time() - t5:.4f} segundos.")

    if ret:
        for _, (rvec, tvec) in poses.items():
            M = fromOpencvToPygfx(rvec, tvec)
            escena.actualizar_camara(M)
            render = escena.render()
            render_bgr = cv2.cvtColor(render, cv2.COLOR_RGBA2BGRA)
            print(f"[✔] Modelo renderizado en {time.time() - start_total:.4f} segundos totales.")
            return cuia.alphaBlending(render_bgr, imagen)

    print(f"[✔] Proceso completado en {time.time() - start_total:.4f} segundos sin detección.")
    return imagen

# --- Utilidades ---

def fromOpencvToPygfx(rvec, tvec):
    pose = np.eye(4, dtype=np.float32)
    pose[:3, 3] = tvec.flatten()
    pose[:3, :3] = cv2.Rodrigues(rvec)[0]
    pose[1:3, :] *= -1  # Ajuste a coordenadas Pygfx
    return np.linalg.inv(pose)

def detectarPose(frame, tam):
    bboxs, ids, _ = detector_aruco.detectMarkers(frame)
    if ids is None:
        return False, {}

    objPoints = np.array([
        [-tam / 2.0, tam / 2.0, 0.0],
        [tam / 2.0, tam / 2.0, 0.0],
        [tam / 2.0, -tam / 2.0, 0.0],
        [-tam / 2.0, -tam / 2.0, 0.0]
    ])
    
    poses = {}
    for i, corners in enumerate(bboxs):
        ret, rvec, tvec = cv2.solvePnP(objPoints, corners[0], cameraMatrix, distCoeffs)
        if ret:
            poses[i] = (rvec, tvec)
    return True, poses

def fov(K, width, height):
    fovx = 2 * np.arctan(width / (2 * K[0, 0]))
    fovy = 2 * np.arctan(height / (2 * K[1, 1]))
    return max(np.degrees(fovx), np.degrees(fovy))
