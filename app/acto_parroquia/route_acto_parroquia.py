from flask import Blueprint, jsonify, request
from app.acto_parroquia.controlador_acto_parroquia import (
    obtener_asignaciones,
    obtener_asignacion_por_id,
    registrar_asignacion,
    actualizar_asignacion,
    eliminar_asignacion
)

# --- IMPORTANTE ---
# Debes registrar este blueprint en tu app/__init__.py:
# 1. from app.acto_parroquia.route_acto_parroquia import acto_parroquia_bp
# 2. app.register_blueprint(acto_parroquia_bp, url_prefix='/api/acto-parroquia')

acto_parroquia_bp = Blueprint('acto_parroquia', __name__)

# ================== LISTAR TODOS ==================
@acto_parroquia_bp.route('/asignaciones', methods=['GET'])
def listar_asignaciones():
    datos = obtener_asignaciones()
    return jsonify({"success": True, "datos": datos}), 200

# ================== OBTENER UNO ==================
@acto_parroquia_bp.route('/asignaciones/<int:id>', methods=['GET'])
def obtener_asignacion(id):
    dato = obtener_asignacion_por_id(id)
    if dato:
        return jsonify({"success": True, "datos": dato}), 200
    else:
        return jsonify({"success": False, "mensaje": "Asignación no encontrada"}), 404

# ================== REGISTRAR ==================
@acto_parroquia_bp.route('/asignaciones', methods=['POST'])
def crear_asignacion():
    data = request.get_json()
    if not data or "idActo" not in data or "idParroquia" not in data or "diaSemana" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400
    
    exito, mensaje = registrar_asignacion(data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ==================
@acto_parroquia_bp.route('/asignaciones/<int:id>', methods=['PUT'])
def editar_asignacion(id):
    data = request.get_json()
    if not data or "idActo" not in data or "idParroquia" not in data or "diaSemana" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400

    exito, mensaje = actualizar_asignacion(id, data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ELIMINAR ==================
@acto_parroquia_bp.route('/asignaciones/<int:id>', methods=['DELETE'])
def borrar_asignacion(id):
    exito, mensaje = eliminar_asignacion(id)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500