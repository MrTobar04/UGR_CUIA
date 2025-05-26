import gc
import re
import io
import json
import os
from datetime import datetime, timedelta
from tempfile import NamedTemporaryFile

import bcrypt
import cv2
import jwt
import numpy as np
from bson.objectid import ObjectId
from flask import Flask, render_template, request, jsonify, send_file
from flask_pymongo import PyMongo
from pydub import AudioSegment

from utils.ar_render import mostrarModelo
from utils.audio_processing import recognize_audio, respuesta_inteligente
from utils.content import recomendar_elementos, desplegar_contenido, recomendar_preguntas
from utils.consultadb import generarTokenUsuario, consultarDatos
from utils.face_detect import detectar_cara, obtener_face_encoding

app = Flask(__name__)



@app.route('/')
def signin():
    return render_template('login.html')


@app.route('/register')
def register():
    return render_template('register.html')

@app.route('/home')
def home():
    return render_template('home.html')

@app.route('/select')
def select():
    return render_template('select.html')

@app.route('/search')
def search():
    return render_template('search.html')

@app.route('/favorites')
def favorites():
    return render_template('favorites.html')

@app.route('/account')
def account():
    return render_template('account.html')

@app.route('/quiz')
def quiz():
    return render_template('quiz.html')

@app.route('/audio_capture')
def audio_capture():
    return render_template('audio_capture.html')

@app.route('/next-image', methods=['POST'])
def next_image():
    try:
        # Recibe el string del body
        datos = request.get_json()

        rutaModelo = datos.get('ruta_modelo')
        aEscala = datos.get('a_escala')

        # Procesamiento 
        processed_img = mostrarModelo(rutaModelo, aEscala)

        # Codifica el frame como PNG
        _, buffer = cv2.imencode('.png', processed_img)
        img_io = io.BytesIO(buffer.tobytes())

        # Limpieza
        del processed_img, buffer
        gc.collect()

        return send_file(img_io, mimetype='image/png')

    except Exception as e:
        print("Error:", e)
        return {'error': str(e)}, 500
    

@app.route('/register-face', methods=['POST'])
def register_face():
    try:
        file = request.files.get('image')
        if file is None:
            return {'error': 'No se envió ninguna imagen'}, 400

        # Leer la imagen con OpenCV
        file_bytes = np.frombuffer(file.read(), np.uint8)
        imagen = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        face_encoding = obtener_face_encoding(imagen)

        # Convertir el encoding a string (por ejemplo, como JSON serializado)
        face_encoding_str = json.dumps(face_encoding)

        return {'face_encoding': face_encoding_str}, 200

    except Exception as e:
        print("Error:", e)
        return {'error': str(e)}, 500
    


@app.route('/detect-face', methods=['POST'])
def detect_face():
    try:
        file = request.files.get('image')
        if file is None:
            return {'error': 'No se envió ninguna imagen'}, 400

        # Leer la imagen con OpenCV
        file_bytes = np.frombuffer(file.read(), np.uint8)
        imagen = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        deteccion, idUsuario, nombreUsuario = detectar_cara(imagen)
        usuarios = []

        for i, id_u in enumerate(idUsuario):
            usuarios.append({
                'id': id_u,
                'nombre_usuario': nombreUsuario[i],
                'token': generarTokenUsuario(id_u)
            })

        if deteccion:
             return jsonify({
            'mensaje': 'Login existoso.',
            'usuario': usuarios
        }), 200
        else:
            return {'mensaje': 'Error en Login: Las caras no coinciden'}, 401
        
    except Exception as e:
        print("Error:", e)
        if(str(e) == "Múltiples caras detectadas."):
            return {'error': str(e)}, 422
        else: 
            return {'error': str(e)}, 500
        



    
# Ruta POST para recibir el diccionario y devolver recomendaciones
@app.route('/obras_similares', methods=['POST'])
def obras_similares():
    datos = request.get_json()
    if not datos:
        return jsonify({"error": "Entrada inválida, se esperaba un JSON con etiquetas y pesos"}), 400

    recomendaciones = recomendar_elementos(datos)
    return jsonify({"recomendaciones": recomendaciones})




@app.route('/recomendaciones', methods=['GET'])
def recomendaciones():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        tokenUsuario = None
    else:
        tokenUsuario = auth_header.split(" ")[1]  # Formato esperado: "Bearer <token>"

    resultado = consultarDatos("usuarios", ["etiquetas"], token = tokenUsuario).get_json()

    # Accede a la lista interna dentro de la tupla
    lista_de_dicts = resultado["consulta"][0]["etiquetas"]


    # Convierte a diccionario usando comprensión
    diccionario_pesos = {item['etiqueta']: item['valor'] for item in lista_de_dicts}
    
    recomendaciones = recomendar_elementos(diccionario_pesos)
    return jsonify({"recomendaciones": recomendaciones})






@app.route('/desplegar_por_etiqueta', methods=['POST'])
def desplegar_por_etiqueta():
    datos = request.get_data(as_text=True)
    if datos is None:
            return {'error': 'No se envió ninguna etiqueta'}, 400

    contenido = desplegar_contenido(datos, False)
    return jsonify({"contenido": contenido})






@app.route('/upload_audio', methods=['POST'])
def upload_audio():
    if 'audio' not in request.files:
        return jsonify({'error': 'No se envió archivo de audio'}), 400

    raw_file = request.files['audio']


    # Guardar el archivo temporalmente (probablemente .webm u .ogg)
    with NamedTemporaryFile(delete=False, suffix=".webm") as temp_in:
        temp_in.write(raw_file.read())
        temp_in.flush()
        temp_in_path = temp_in.name

    # Convertir a .wav con pydub
    try:
        audio = AudioSegment.from_file(temp_in_path)
        with NamedTemporaryFile(delete=False, suffix=".wav") as temp_out:
            audio.export(temp_out.name, format="wav")
            wav_path = temp_out.name

        texto = recognize_audio(wav_path)
        os.remove(temp_in_path)
        os.remove(wav_path)

        return jsonify({'texto': texto})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    



@app.route('/pregunta_inteligente', methods=['POST'])
def pregunta_inteligente():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        tokenUsuario = None
    else:
        tokenUsuario = auth_header.split(" ")[1]  # Formato esperado: "Bearer <token>"

    if 'audio' not in request.files:
        return jsonify({'error': 'No se envió archivo de audio'}), 400

    raw_file = request.files['audio']
    obra = request.form.get('obra')
    pregunta_quiz = request.form.get('pregunta_quiz')
    historial = request.form.get('historial')

    
    try:
        historial = json.loads(historial) if historial else None
    except json.JSONDecodeError:
        return jsonify({'error': 'Historial no es un JSON válido'}), 400
        

    # Guardar archivo temporalmente
    with NamedTemporaryFile(delete=False, suffix=".webm") as temp_in:
        temp_in.write(raw_file.read())
        temp_in.flush()
        temp_in_path = temp_in.name

    try:
        # Convertir a .wav con pydub
        audio = AudioSegment.from_file(temp_in_path)
        with NamedTemporaryFile(delete=False, suffix=".wav") as temp_out:
            audio.export(temp_out.name, format="wav")
            wav_path = temp_out.name

        # Procesar audio
        pregunta = recognize_audio(wav_path)  
        respuesta = respuesta_inteligente(pregunta, tokenUsuario, obra, pregunta_quiz, historial)  

        # Dividir antes de cada 'COMANDO' usando lookahead
        partes = re.split(r'(?=COMANDO)', respuesta)

        # Limpiar espacios en blanco
        partes = [parte.strip() for parte in partes if parte.strip()]


        # mostramos comando si lo hubiera
        if(len(partes) == 2):
            respuesta = partes[0]
            comando = partes[1]
        else:
            comando = None

        # Limpiar archivos temporales
        os.remove(temp_in_path)
        os.remove(wav_path)

        return jsonify({'pregunta': pregunta, 'respuesta': respuesta, 'comando': comando})
    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500
    



@app.route('/generate_quiz', methods=['GET'])
def generate_quiz():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        tokenUsuario = None
    else:
        tokenUsuario = auth_header.split(" ")[1]  # Formato esperado: "Bearer <token>"

    resultado = consultarDatos("usuarios", ["etiquetas"], token = tokenUsuario).get_json()

    # Accede a las etiquetas
    lista_de_dicts = resultado["consulta"][0]["etiquetas"]

    # Convierte a diccionario usando comprensión
    diccionario_pesos = {item['etiqueta']: item['valor'] for item in lista_de_dicts}
    
    recomendaciones = recomendar_preguntas(diccionario_pesos)
    return jsonify({"recomendaciones": recomendaciones})








# Conexion a MongoDB

app.config['MONGO_URI'] = "mongodb://localhost:27017/MuseoVirtual"
mongo = PyMongo(app)
usuarios = mongo.db.usuarios



# Clave secreta para JWT
JWT_SECRET = 'clave_secreta_super_segura'




# Registrar nuevo usuario
@app.route('/usuarios', methods=['POST'])
def registrar_usuario():
    data = request.get_json()
    nombre_usuario = data.get('nombre_usuario')
    correo = data.get('correo')
    password = data.get('password')
    face_encoding = data.get('face_encoding')


    if usuarios.find_one({'correo': correo}):
        return jsonify({'mensaje': 'El correo ya está registrado'}), 409

    hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

    usuario = {
        'nombre_usuario': nombre_usuario,
        'correo': correo,
        'contraseña': hashed,
        'face_encoding': face_encoding,
        'favoritos': [],
        'etiquetas': [],
        'quiz_realizados': 0,
        'puntuacion': 0,
        'asistente_voz': True,
        'token': None
    }

    usuarios.insert_one(usuario)
    return jsonify({'mensaje': 'Usuario registrado con éxito'}), 201





# Iniciar sesión
@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    correo = data.get('correo')
    contraseña = data.get('contraseña')

    usuario = usuarios.find_one({'correo': correo})
    if not usuario:
        return jsonify({'mensaje': 'Usuario no encontrado'}), 404

    if not bcrypt.checkpw(contraseña.encode('utf-8'), usuario['contraseña']):
        return jsonify({'mensaje': 'Contraseña incorrecta'}), 401

    token = jwt.encode({
        'id': str(usuario['_id']),
        'correo': usuario['correo'],
        'exp': datetime.utcnow() + timedelta(hours=2)
    }, JWT_SECRET, algorithm='HS256')

    usuarios.update_one({'_id': usuario['_id']}, {'$set': {'token': token}})

    return jsonify({
        'mensaje': 'Inicio de sesión exitoso',
        'token': token,
        'usuario': {
            'id': str(usuario['_id']),
            'nombre_usuario': usuario['nombre_usuario'],
            'correo': usuario['correo']
        }
    }), 200





# Verificar token
@app.route('/verificar-token', methods=['GET'])
def verificar_token():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'mensaje': 'Token no proporcionado'}), 401

    try:
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return jsonify({'mensaje': 'Token válido', 'datos': decoded}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'mensaje': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'mensaje': 'Token inválido'}), 401









@app.route('/usuarios/etiqueta', methods=['POST'])
def actualizar_etiqueta():
    # 1. Leer token de cabecera (se asume formato "Bearer <token>")
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'mensaje': 'No se proporcionó el token de autenticación'}), 401

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'mensaje': 'Formato de token inválido'}), 401
    token = parts[1]

    try:
        # 2. Verificar y decodificar el JWT
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        usuario_id = decoded.get('id')
        if not usuario_id:
            return jsonify({'mensaje': 'Token inválido: ID no encontrado'}), 400

        # 3. Traer el usuario de la BD
        usuario = usuarios.find_one({'_id': ObjectId(usuario_id)})
        if not usuario:
            return jsonify({'mensaje': 'Usuario no encontrado'}), 404

        # 4. Leer etiqueta del body
        data = request.get_json()
        etiqueta_nueva = data.get('etiqueta')
        if not etiqueta_nueva:
            return jsonify({'mensaje': 'No se proporcionó la etiqueta'}), 400

        # 5. Buscar en el array de etiquetas
        etiquetas = usuario.get('etiquetas', [])
        encontrada = next((e for e in etiquetas if e.get('etiqueta') == etiqueta_nueva), None)

        # 6. Actualizar o insertar
        if encontrada:
            encontrada['valor'] += 1
        else:
            etiquetas.append({'etiqueta': etiqueta_nueva, 'valor': 1})

        # 7. Persistir cambios
        usuarios.update_one(
            {'_id': ObjectId(usuario_id)},
            {'$set': {'etiquetas': etiquetas}}
        )

        # 8. Devolver usuario actualizado (opcional, puedes cambiar qué campos incluir)
        usuario_actualizado = usuarios.find_one({'_id': ObjectId(usuario_id)})
        usuario_actualizado['_id'] = str(usuario_actualizado['_id'])
        return jsonify({
            'mensaje': 'Etiqueta actualizada correctamente',
            'usuario': usuario_actualizado
        }), 200

    except jwt.ExpiredSignatureError:
        return jsonify({'mensaje': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'mensaje': 'Token inválido'}), 401
    except Exception as e:
        return jsonify({'mensaje': 'Error al procesar la solicitud', 'error': str(e)}), 400







# Obtener datos de usuario
@app.route('/datos_usuario', methods=['GET'])
def datos_usuario():
    tokenJWT = request.headers.get('Authorization')

    if not tokenJWT:
        return jsonify({'mensaje': 'Token no proporcionado'}), 401

    

    try:
        consulta = consultarDatos("usuarios", 
                                  ["nombre_usuario", "correo", "favoritos", "etiquetas", "quiz_realizados", "puntuacion", "asistente_voz"], 
                                  token=tokenJWT).get_json()
        
        return jsonify({'mensaje': 'Token válido', 'datos': consulta["consulta"][0]}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'mensaje': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'mensaje': 'Token inválido'}), 401


# Actualizar puntuacion
@app.route('/actualizar_puntuacion', methods=['POST'])
def actualizar_puntuacion():
    tokenJWT = request.headers.get('Authorization')
    data = request.get_json()
    notaQuiz = data.get("puntuacion")

    if not tokenJWT:
        return jsonify({'mensaje': 'Token no proporcionado'}), 401


    try:
        consulta = consultarDatos("usuarios", ["quiz_realizados", "puntuacion"], token=tokenJWT).get_json()
        quiz_realizados = consulta["consulta"][0]["quiz_realizados"]
        puntuacion = consulta["consulta"][0]["puntuacion"]

        
        usuarios.update_one({'token': tokenJWT}, {'$set': {'quiz_realizados': quiz_realizados + 1}})
        usuarios.update_one({'token': tokenJWT}, {'$set': {'puntuacion': puntuacion+notaQuiz}})


        return jsonify({'mensaje': 'Puntuacion Actualizada'}), 200
    except jwt.ExpiredSignatureError:
        return jsonify({'mensaje': 'Token expirado'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'mensaje': 'Token inválido'}), 401





@app.route('/usuarios/favoritos', methods=['POST'])
def actualizar_favorito():
    # 1. Leer token de cabecera (se asume formato "Bearer <token>")
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'mensaje': 'No se proporcionó el token de autenticación'}), 401

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'mensaje': 'Formato de token inválido'}), 401
    token = parts[1]

    data = request.get_json()
    favorito = data.get('favorito')

    try:

        # 2. Verificar y decodificar el JWT
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        usuario_id = decoded.get('id')
        if not usuario_id:
            return jsonify({'mensaje': 'Token inválido: ID no encontrado'}), 400
        
        usuario = usuarios.find_one({"_id": ObjectId(usuario_id)})

        if not usuario:
            return jsonify({'mensaje': 'Usuario no encontrado'}), 404

        favoritos = usuario.get('favoritos', [])

        if favorito in favoritos:
            favoritos.remove(favorito)
            accion = 'removido'
        else:
            favoritos.append(favorito)
            accion = 'agregado'

        usuarios.update_one(
            {"_id": ObjectId(usuario_id)},
            {"$set": {"favoritos": favoritos}}
        )

        usuario_actualizado = usuarios.find_one({"_id": ObjectId(usuario_id)})

        return jsonify({
            'mensaje': 'Favorito actualizado correctamente',
            'usuario': {
                'id': str(usuario_actualizado['_id']),
                'favoritos': usuario_actualizado.get('favoritos', []),
                'accion': accion
            }
        }), 200

    except Exception as e:
        return jsonify({'mensaje': 'Error al procesar el token o actualizar el favorito', 'error': str(e)}), 400






@app.route('/usuarios/asistente_voz', methods=['POST'])
def asistente_voz():
    # 1. Leer token de cabecera (se asume formato "Bearer <token>")
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return jsonify({'mensaje': 'No se proporcionó el token de autenticación'}), 401

    parts = auth_header.split()
    if len(parts) != 2 or parts[0].lower() != 'bearer':
        return jsonify({'mensaje': 'Formato de token inválido'}), 401
    token = parts[1]

    data = request.get_json()
    asistente_voz = data.get('asistente_voz')

    try:

        # 2. Verificar y decodificar el JWT
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        usuario_id = decoded.get('id')
        if not usuario_id:
            return jsonify({'mensaje': 'Token inválido: ID no encontrado'}), 400
        
        usuario = usuarios.find_one({"_id": ObjectId(usuario_id)})

        if not usuario:
            return jsonify({'mensaje': 'Usuario no encontrado'}), 404

        usuarios.update_one(
            {"_id": ObjectId(usuario_id)},
            {"$set": {"asistente_voz": asistente_voz}}
        )

        return jsonify({
            'mensaje': 'Asistente Modificado Correctamente'
        }), 200

    except Exception as e:
        return jsonify({'mensaje': 'Error al procesar el token o actualizar el favorito', 'error': str(e)}), 400











if __name__ == '__main__':
    # Inicia Flask en el puerto 8080
    app.run(host='0.0.0.0', port=8080, debug=False, ssl_context=('cert.pem', 'key.pem'))
