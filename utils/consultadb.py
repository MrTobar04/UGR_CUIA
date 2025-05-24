from pymongo import MongoClient
import jwt
import datetime
from bson.objectid import ObjectId
from pymongo import MongoClient
from flask import Flask, request, jsonify


# Conexión local (localhost) por defecto en el puerto 27017
client = MongoClient("mongodb://localhost:27017/")

# Selecciona la base de datos
db = client["MuseoVirtual"]


# Clave secreta (igual que en Express.js para mantener compatibilidad)
JWT_SECRET = 'clave_secreta_super_segura'


from flask import jsonify
from bson import ObjectId
import jwt

def consultarDatos(tabla, camposConsulta, campoCondicion=None, valorCondicion=None, token=None):
    # Selecciona la colección
    coleccion = db[tabla]

    # Proyección: solo mostrar los campos consultados
    proyeccion = {campo: 1 for campo in camposConsulta}
    if "_id" not in camposConsulta:
        proyeccion["_id"] = 0

    # Manejo del token
    if token:
      
        decoded_token = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = decoded_token.get("id")
        if not user_id:
            raise Exception("No se encontró el usuario")
            
        campoCondicion = "_id"
        valorCondicion = ObjectId(user_id)



    # Filtro de búsqueda
    filtro = {campoCondicion: valorCondicion} if campoCondicion and valorCondicion else {}

    # Ejecutar la consulta
    resultados = coleccion.find(filtro, proyeccion)

    # Convertir a lista de diccionarios
    lista_resultado = []
    for doc in resultados:
        item = {campo: doc.get(campo, None) for campo in camposConsulta}
        lista_resultado.append(item)

    return jsonify({"consulta": lista_resultado})

            



def generarTokenUsuario(user_id):
    coleccion = db["usuarios"]

    try:
        # Validar tipo correcto para el ID
        if isinstance(user_id, list):
            raise TypeError("El ID no puede ser una lista.")
        
        # Convertir a ObjectId (esto puede lanzar ValueError si el ID no es válido)
        object_id = ObjectId(user_id)

        # Buscar el usuario
        usuario = coleccion.find_one({"_id": object_id})
        if not usuario:
            return {
                "mensaje": "Usuario no encontrado",
                "error": "No existe un usuario con ese ID",
                "status": 404
            }

        # Crear token
        payload = {
            "id": str(object_id),
            "correo": usuario["correo"],
            "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
        }

        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")

        # Guardar token en el usuario
        coleccion.update_one(
            {"_id": object_id},
            {"$set": {"token": token}}
        )

        return token

    except Exception as e:
        return {
            "mensaje": "Error al generar token",
            "error": str(e),
            "status": 500
        }
    

    

