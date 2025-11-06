from flask import Blueprint, jsonify, request
from app.requisito.controlador_requisito import (
    obtener_requisitos,
    obtener_requisito_por_id,
    registrar_requisito,
    actualizar_requisito,
    actualizar_estado_requisito,
    eliminar_requisito
)

# --- IMPORTANTE ---
# Debes registrar este blueprint en tu app/__init__.py:
# 1. from app.requisito.route_requisito import requisito_bp
# 2. app.register_blueprint(requisito_bp, url_prefix='/api/requisito')

requisito_bp = Blueprint('requisito', __name__)

# ================== LISTAR TODOS ==================
@requisito_bp.route('/requisitos', methods=['GET'])
def listar_requisitos():
    datos = obtener_requisitos()
    return jsonify({"success": True, "datos": datos}), 200

# ================== OBTENER UNO ==================
@requisito_bp.route('/requisitos/<int:id>', methods=['GET'])
def obtener_requisito(id):
    dato = obtener_requisito_por_id(id)
    if dato:
        return jsonify({"success": True, "datos": dato}), 200
    else:
        return jsonify({"success": False, "mensaje": "Requisito no encontrado"}), 404

# ================== REGISTRAR ==================
@requisito_bp.route('/requisitos', methods=['POST'])
def crear_requisito():
    data = request.get_json()
    if not data or "nombRequisito" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400
    
    exito, mensaje = registrar_requisito(data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ==================
@requisito_bp.route('/requisitos/<int:id>', methods=['PUT'])
def editar_requisito(id):
    data = request.get_json()
    if not data or "nombRequisito" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400

    exito, mensaje = actualizar_requisito(id, data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
@requisito_bp.route('/requisitos/<int:id>/estado', methods=['PATCH'])
def cambiar_estado_requisito(id):
    data = request.get_json()
    if "estado" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_requisito(id, data["estado"])
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@requisito_bp.route('/requisitos/<int:id>', methods=['DELETE'])
def borrar_requisito(id):
    exito, mensaje = eliminar_requisito(id)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500