from flask import Blueprint, jsonify, request
from app.disponibilidad.controlador_disponibilidad import (
    obtener_disponibilidades,
    obtener_disponibilidad_por_id,
    registrar_disponibilidad,
    actualizar_disponibilidad,
    actualizar_estado_disponibilidad,
    eliminar_disponibilidad,
    obtener_lista_personal_asignado # Importar la función auxiliar
)

# --- IMPORTANTE ---
# Debes registrar este blueprint en tu app/__init__.py:
# 1. from app.disponibilidad.route_disponibilidad import disponibilidad_bp
# 2. app.register_blueprint(disponibilidad_bp, url_prefix='/api/disponibilidad')

disponibilidad_bp = Blueprint('disponibilidad', __name__)

# ================== LISTAR TODOS ==================
@disponibilidad_bp.route('/disponibilidades', methods=['GET'])
def listar_disponibilidades():
    datos = obtener_disponibilidades()
    return jsonify({"success": True, "datos": datos}), 200

# ================== OBTENER UNO ==================
@disponibilidad_bp.route('/disponibilidades/<int:id>', methods=['GET'])
def obtener_disponibilidad(id):
    dato = obtener_disponibilidad_por_id(id)
    if dato:
        return jsonify({"success": True, "datos": dato}), 200
    else:
        return jsonify({"success": False, "mensaje": "Registro no encontrado"}), 404

# ================== REGISTRAR ==================
@disponibilidad_bp.route('/disponibilidades', methods=['POST'])
def crear_disponibilidad():
    data = request.get_json()
    if not data or "diaSemana" not in data or "idParroquiaPersonal" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400
    
    exito, mensaje = registrar_disponibilidad(data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ==================
@disponibilidad_bp.route('/disponibilidades/<int:id>', methods=['PUT'])
def editar_disponibilidad(id):
    data = request.get_json()
    if not data or "diaSemana" not in data or "idParroquiaPersonal" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400

    exito, mensaje = actualizar_disponibilidad(id, data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
@disponibilidad_bp.route('/disponibilidades/<int:id>/estado', methods=['PATCH'])
def cambiar_estado_disponibilidad(id):
    data = request.get_json()
    if "estado" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_disponibilidad(id, data["estado"])
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@disponibilidad_bp.route('/disponibilidades/<int:id>', methods=['DELETE'])
def borrar_disponibilidad(id):
    exito, mensaje = eliminar_disponibilidad(id)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== RUTA AUXILIAR PARA EL MODAL ==================
@disponibilidad_bp.route('/personal-asignado', methods=['GET'])
def listar_personal_asignado():
    datos = obtener_lista_personal_asignado()
    return jsonify({"success": True, "datos": datos}), 200