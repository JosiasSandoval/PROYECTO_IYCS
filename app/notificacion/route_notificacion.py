from flask import Blueprint, jsonify, session
# Importamos las funciones del controlador que acabamos de crear
from app.notificacion.controlador_notificacion import (
    obtener_conteo_no_leidas, 
    listar_notificaciones_usuario, 
    marcar_todas_leidas
)

notificacion_bp = Blueprint('notificacion_bp', __name__)

@notificacion_bp.route('/conteo', methods=['GET'])
def endpoint_conteo():
    if 'idUsuario' not in session:
        return jsonify({'count': 0})
    
    conteo = obtener_conteo_no_leidas(session['idUsuario'])
    return jsonify({'count': conteo})

@notificacion_bp.route('/listar', methods=['GET'])
def endpoint_listar():
    if 'idUsuario' not in session:
        return jsonify([])

    lista = listar_notificaciones_usuario(session['idUsuario'])
    return jsonify(lista)

@notificacion_bp.route('/marcar_leida', methods=['POST'])
def endpoint_marcar_leida():
    if 'idUsuario' not in session:
        return jsonify({'status': 'error', 'msg': 'No sesión'})

    exito = marcar_todas_leidas(session['idUsuario'])
    
    if exito:
        return jsonify({'status': 'ok'})
    else:
        return jsonify({'status': 'error', 'msg': 'Fallo BD'}), 500 