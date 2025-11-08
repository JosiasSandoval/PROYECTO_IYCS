from flask import Blueprint, jsonify, request
from app.pago_metodo.controlador_pago_metodo import (
    obtener_metodos,
    obtener_metodo_por_id,
    registrar_metodo,
    actualizar_metodo,
    actualizar_estado_metodo,
    eliminar_metodo
)

pago_metodo_bp = Blueprint('pago_metodo', __name__)

# ================== LISTAR TODOS ==================
@pago_metodo_bp.route('/metodos', methods=['GET'])
def listar_metodos():
    datos = obtener_metodos()
    return jsonify({"success": True, "datos": datos}), 200

# ================== OBTENER UNO ==================
@pago_metodo_bp.route('/metodos/<int:id>', methods=['GET'])
def obtener_metodo(id):
    dato = obtener_metodo_por_id(id)
    if dato:
        return jsonify({"success": True, "datos": dato}), 200
    else:
        return jsonify({"success": False, "mensaje": "Método no encontrado"}), 404

# ================== REGISTRAR ==================
@pago_metodo_bp.route('/metodos', methods=['POST'])
def crear_metodo():
    data = request.get_json()
    if not data or "nombMetodo" not in data:
        return jsonify({"success": False, "mensaje": "Nombre no proporcionado"}), 400
    
    exito, mensaje = registrar_metodo(data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ==================
@pago_metodo_bp.route('/metodos/<int:id>', methods=['PUT'])
def editar_metodo(id):
    data = request.get_json()
    if not data or "nombMetodo" not in data:
        return jsonify({"success": False, "mensaje": "Nombre no proporcionado"}), 400

    exito, mensaje = actualizar_metodo(id, data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
@pago_metodo_bp.route('/metodos/<int:id>/estado', methods=['PATCH'])
def cambiar_estado_metodo(id):
    data = request.get_json()
    if "estado" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_metodo(id, data["estado"])
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@pago_metodo_bp.route('/metodos/<int:id>', methods=['DELETE'])
def borrar_metodo(id):
    exito, mensaje = eliminar_metodo(id)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500