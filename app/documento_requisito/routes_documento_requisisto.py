from flask import Blueprint, request, jsonify, session
from app.documento_requisito.controlador_documento_requisisto import (
    listar_documentos, agregar_documento, actualizar_documento,
    eliminar_documento, cambiar_aprobacion_documento, obtener_combos_doc
)

documento_bp = Blueprint('documento', __name__)

@documento_bp.route('/', methods=['GET'])
def listar():
    id_usuario = session.get('idUsuario')
    rol = session.get('rol_sistema')
    if not id_usuario: return jsonify({'error': 'No autorizado'}), 401
    datos = listar_documentos(id_usuario, rol)
    return jsonify(datos), 200

@documento_bp.route('/guardar', methods=['POST'])
def guardar():
    d = request.get_json()
    ok, msg = agregar_documento(d['idReserva'], d['idActoReq'], d['estado'], d['observacion'], d['vigencia'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@documento_bp.route('/actualizar/<int:id>', methods=['PUT'])
def actualizar(id):
    d = request.get_json()
    ok, msg = actualizar_documento(id, d['idReserva'], d['idActoReq'], d['estado'], d['observacion'], d['vigencia'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@documento_bp.route('/aprobacion/<int:id>', methods=['PATCH'])
def aprobacion(id):
    d = request.get_json()
    ok, msg = cambiar_aprobacion_documento(id, d['aprobado'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@documento_bp.route('/eliminar/<int:id>', methods=['DELETE'])
def eliminar(id):
    ok, msg = eliminar_documento(id)
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@documento_bp.route('/combos', methods=['GET'])
def combos():
    id_usuario = session.get('idUsuario')
    rol = session.get('rol_sistema')
    datos = obtener_combos_doc(id_usuario, rol)
    return jsonify(datos), 200