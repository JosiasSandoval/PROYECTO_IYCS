from flask import Blueprint, request, jsonify, abort, g, redirect, url_for
from app.parroquia.controlador_parroquia import(
    get_obtener_provincia,
    get_obtener_distrito,
    get_obtener_parroquia_mapa
)

parroquia_bp=Blueprint('parroquia',__name__)

@parroquia_bp.route('/datos', methods=['GET'])
def obtener_ubicacion():
    provincias = get_obtener_provincia()
    distritos = get_obtener_distrito()
    parroquias = get_obtener_parroquia_mapa()
    
    return jsonify({
        'provincias': provincias,
        'distritos': distritos,
        'parroquias': parroquias
    })

