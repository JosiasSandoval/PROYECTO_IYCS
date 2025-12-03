from flask import Blueprint, request, jsonify, session
from app.disponibilidad.controlador_disponibilidad import (
    listar_disponibilidad, agregar_disponibilidad, actualizar_disponibilidad,
    eliminar_disponibilidad, cambiar_estado_disponibilidad, obtener_combos_disp
)

disponibilidad_bp = Blueprint('disponibilidad', __name__)

@disponibilidad_bp.route('/', methods=['GET'])
def listar():
    id_usuario = session.get('idUsuario')
    rol = session.get('rol_sistema')
    if not id_usuario: return jsonify({'error': 'No autorizado'}), 401
    datos = listar_disponibilidad(id_usuario, rol)
    return jsonify(datos), 200

@disponibilidad_bp.route('/guardar', methods=['POST'])
def guardar():
    d = request.get_json()
    ok, msg = agregar_disponibilidad(d['dia'], d['inicio'], d['fin'], d['idPP'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@disponibilidad_bp.route('/actualizar/<int:id>', methods=['PUT'])
def actualizar(id):
    d = request.get_json()
    ok, msg = actualizar_disponibilidad(id, d['dia'], d['inicio'], d['fin'], d['idPP'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@disponibilidad_bp.route('/estado/<int:id>', methods=['PATCH'])
def estado(id):
    d = request.get_json()
    ok, msg = cambiar_estado_disponibilidad(id, d['estado'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@disponibilidad_bp.route('/eliminar/<int:id>', methods=['DELETE'])
def eliminar(id):
    ok, msg = eliminar_disponibilidad(id)
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@disponibilidad_bp.route('/combos', methods=['GET'])
def combos():
    id_usuario = session.get('idUsuario')
    rol = session.get('rol_sistema')
    datos = obtener_combos_disp(id_usuario, rol)
    return jsonify(datos), 200