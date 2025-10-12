from flask import Blueprint, request, jsonify, abort, g, redirect, url_for
from app.parroquia.controlador_parroquia import(
    get_obtener_mapa_datos
)

parroquia_bp=Blueprint('parroquia',__name__)

@parroquia_bp.route('/datos', methods=['GET'])
def obtener_ubicacion():
    try:
        datos_mapa=get_obtener_mapa_datos()
        return jsonify(datos_mapa)
    except Exception as e:
        print("Error al procesar los solicitud de ubicación: {e}")
        return[]