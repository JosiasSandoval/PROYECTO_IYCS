from flask import Blueprint, jsonify, request
from app.configuracion.controlador_configuracion import (
    obtener_configs,
    obtener_config_por_id,
    registrar_config,
    actualizar_config,
    actualizar_estado_config,
    eliminar_config
)

# --- IMPORTANTE ---
# Debes registrar este blueprint en tu app/__init__.py:
# 1. from app.configuracion.route_configuracion import configuracion_bp
# 2. app.register_blueprint(configuracion_bp, url_prefix='/api/configuracion')

configuracion_bp = Blueprint('configuracion', __name__)

# ================== LISTAR TODOS ==================
@configuracion_bp.route('/configs', methods=['GET'])
def listar_configs():
    datos = obtener_configs()
    return jsonify({"success": True, "datos": datos}), 200

# ================== OBTENER UNO ==================
@configuracion_bp.route('/configs/<int:id>', methods=['GET'])
def obtener_config(id):
    dato = obtener_config_por_id(id)
    if dato:
        return jsonify({"success": True, "datos": dato}), 200
    else:
        return jsonify({"success": False, "mensaje": "Configuración no encontrada"}), 404

# ================== REGISTRAR ==================
@configuracion_bp.route('/configs', methods=['POST'])
def crear_config():
    data = request.get_json()
    if not data or "nombClave" not in data or "unidad" not in data or "valor" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400
    
    exito, mensaje = registrar_config(data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ==================
@configuracion_bp.route('/configs/<int:id>', methods=['PUT'])
def editar_config(id):
    data = request.get_json()
    # No requerimos nombClave porque no la actualizamos
    if not data or "unidad" not in data or "valor" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400

    exito, mensaje = actualizar_config(id, data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
@configuracion_bp.route('/configs/<int:id>/estado', methods=['PATCH'])
def cambiar_estado_config(id):
    data = request.get_json()
    if "estado" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_config(id, data["estado"])
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@configuracion_bp.route('/configs/<int:id>', methods=['DELETE'])
def borrar_config(id):
    exito, mensaje = eliminar_config(id)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500