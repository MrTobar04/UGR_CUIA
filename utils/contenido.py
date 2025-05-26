import json
import random
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

json_obras = 'static\json\obras.json'
json_preguntas = 'static\json\preguntas.json'

def recomendar_elementos(diccionario_pesos):
    
    # Cargar los datos
    with open(json_obras, 'r', encoding='utf-8') as f:
        elementos = json.load(f)

    # Obtener todas las etiquetas únicas
    todas_etiquetas = set()
    for elemento in elementos:
        todas_etiquetas.update(elemento.get("etiquetas", []))
    todas_etiquetas = sorted(list(todas_etiquetas))  # mantener orden consistente

    # Crear diccionario de índice por etiqueta
    etiqueta_a_indice = {etiqueta: idx for idx, etiqueta in enumerate(todas_etiquetas)}
    
    # Vector del usuario (basado en los pesos)
    vector_usuario = np.zeros(len(todas_etiquetas))
    for etiqueta, peso in diccionario_pesos.items():
        if etiqueta in etiqueta_a_indice:
            vector_usuario[etiqueta_a_indice[etiqueta]] = peso

    # Matriz de vectores de elementos
    vectores_elementos = []
    ids_elementos = []
    for elemento in elementos:
        vector = np.zeros(len(todas_etiquetas))
        for etiqueta in elemento.get("etiquetas", []):
            if etiqueta in etiqueta_a_indice:
                vector[etiqueta_a_indice[etiqueta]] = 1
        vectores_elementos.append(vector)
        ids_elementos.append(elemento["id"])

    # Calcular similitudes de coseno
    similitudes = cosine_similarity([vector_usuario], vectores_elementos)[0]

    # Juntar IDs y similitudes
    elementos_con_similitud = list(zip(ids_elementos, similitudes))

    # Mezclar para romper empates
    random.shuffle(elementos_con_similitud)

    # Ordenar por similitud descendente
    elementos_con_similitud.sort(key=lambda x: x[1], reverse=True)

    # Devolver los 5 mejores IDs
    mejores_ids = [elem[0] for elem in elementos_con_similitud[:5]]

    return mejores_ids








def desplegar_contenido(etiqueta, obtener_todos):
    
    # Cargar el archivo JSON
    with open(json_obras, 'r', encoding='utf-8') as f:
        datos = json.load(f)

    # Filtrar los objetos que contienen la etiqueta
    ids_filtrados = [item['id'] for item in datos if etiqueta in item.get('etiquetas', [])]

    if(obtener_todos):
        return ids_filtrados
    
    # Seleccionar hasta 5 IDs aleatorios
    ids_random = random.sample(ids_filtrados, min(5, len(ids_filtrados)))

    return ids_random






def recomendar_preguntas(diccionario_pesos, ruido_maximo=0.05, top_k_pool=30, 
                        random_multiplier_range=(0.8, 1.2)):
    # Cargar los datos
    with open(json_preguntas, 'r', encoding='utf-8') as f:
        elementos = json.load(f)

    # Obtener todas las etiquetas únicas
    todas_etiquetas = sorted({etiqueta for elemento in elementos for etiqueta in elemento.get("etiquetas", [])})

    # Crear diccionario de índice por etiqueta
    etiqueta_a_indice = {etiqueta: idx for idx, etiqueta in enumerate(todas_etiquetas)}

    # Vector del usuario
    vector_usuario = np.zeros(len(todas_etiquetas))
    for etiqueta, peso in diccionario_pesos.items():
        if etiqueta in etiqueta_a_indice:
            vector_usuario[etiqueta_a_indice[etiqueta]] = peso

    # Vectores de los elementos
    vectores_elementos = []
    ids_elementos = []
    for elemento in elementos:
        vector = np.zeros(len(todas_etiquetas))
        for etiqueta in elemento.get("etiquetas", []):
            if etiqueta in etiqueta_a_indice:
                vector[etiqueta_a_indice[etiqueta]] = 1
        vectores_elementos.append(vector)
        ids_elementos.append(elemento["id"])

    # Calcular similitudes de coseno
    similitudes = cosine_similarity([vector_usuario], vectores_elementos)[0]

    # Agregar ruido aleatorio
    similitudes_con_ruido = similitudes + np.random.uniform(-ruido_maximo, ruido_maximo, size=similitudes.shape)

    # Juntar IDs y similitudes con ruido
    elementos_con_similitud = list(zip(ids_elementos, similitudes_con_ruido))

    # Ordenar por similitud descendente
    elementos_con_similitud.sort(key=lambda x: x[1], reverse=True)

    # Seleccionar grupo más grande de candidatos
    elementos_pool = elementos_con_similitud[:top_k_pool]

    # Aplicar multiplicadores aleatorios para variar el orden
    elementos_mult = [
        (elem_id, score * np.random.uniform(random_multiplier_range[0], random_multiplier_range[1]))
        for (elem_id, score) in elementos_pool
    ]

    # Re-ordenar con los nuevos scores
    elementos_mult.sort(key=lambda x: x[1], reverse=True)

    # Seleccionar los 10 mejores del grupo procesado
    mejores_ids = [elem[0] for elem in elementos_mult[:10]]

    # Reordenar aleatoriamente los 10 seleccionados
    np.random.shuffle(mejores_ids)

    return mejores_ids