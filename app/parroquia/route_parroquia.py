from flask import Blueprint, request, jsonify, abort, g, redirect, url_for
from app.parroquia.controlador_parroquia import(
    get_obtener_mapa_datos,
    ubicar_parroquia,
    obtener_informacion_parroquia
)

parroquia_bp=Blueprint('parroquia',__name__)

@parroquia_bp.route('/datos', methods=['GET'])
def obtener_ubicacion():
    try:
        busqueda = request.args.get('busqueda')
        if busqueda:
            datos = ubicar_parroquia(busqueda)
        else:
            datos = get_obtener_mapa_datos()
        return jsonify({'datos': datos})
    except Exception as e:
        print(f"Error al procesar la solicitud de ubicación: {e}")
        return jsonify({'datos': []})

@parroquia_bp.route('/informacion/<int:idParroquia>',methods=['GET'])
def informacion_parroquia(idParroquia):
    try:
        datos=obtener_informacion_parroquia(idParroquia)
        return jsonify  ({'datos':datos})
    except Exception as e:
        print(f"Error al procesar la solicitud de información de la parroquia:{e}")
        return jsonify({'datos':[]})