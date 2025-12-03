from flask import Blueprint, request, jsonify, session
from app.acto_parroquia.controlador_acto_parroquia import (
    listar_acto_parroquia, agregar_acto_parroquia, 
    actualizar_acto_parroquia, eliminar_acto_parroquia, 
    obtener_combos_ap
)

acto_parroquia_bp = Blueprint('acto_parroquia', __name__)

@acto_parroquia_bp.route('/', methods=['GET'])
def listar():
    id_usuario = session.get('idUsuario')
    rol = session.get('rol_sistema')
    if not id_usuario: return jsonify({'error': 'No autorizado'}), 401
    datos = listar_acto_parroquia(id_usuario, rol)
    return jsonify(datos), 200

@acto_parroquia_bp.route('/guardar', methods=['POST'])
def guardar():
    d = request.get_json()
    ok, msg = agregar_acto_parroquia(d['idActo'], d['idParroquia'], d['dia'], d['hora'], d['costo'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@acto_parroquia_bp.route('/actualizar/<int:id>', methods=['PUT'])
def actualizar(id):
    d = request.get_json()
    ok, msg = actualizar_acto_parroquia(id, d['idActo'], d['idParroquia'], d['dia'], d['hora'], d['costo'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@acto_parroquia_bp.route('/eliminar/<int:id>', methods=['DELETE'])
def eliminar(id):
    ok, msg = eliminar_acto_parroquia(id)
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@acto_parroquia_bp.route('/combos', methods=['GET'])
def combos():
    id_usuario = session.get('idUsuario')
    rol = session.get('rol_sistema')
    datos = obtener_combos_ap(id_usuario, rol)
    return jsonify(datos), 200