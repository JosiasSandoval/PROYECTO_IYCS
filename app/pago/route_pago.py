from flask import Blueprint, jsonify, request
from app.pago.controlador_pago import (
    obtener_pagos,
    obtener_pago_por_id,
    registrar_pago,
    actualizar_pago,
    actualizar_vigencia_pago,
    eliminar_pago
)

pago_bp = Blueprint('pago', __name__)

# ================== LISTAR TODOS ==================
@pago_bp.route('/pagos', methods=['GET'])
def listar_pagos():
    datos = obtener_pagos()
    return jsonify({"success": True, "datos": datos}), 200

# ================== OBTENER UNO ==================
@pago_bp.route('/pagos/<int:id>', methods=['GET'])
def obtener_pago(id):
    dato = obtener_pago_por_id(id)
    if dato:
        return jsonify({"success": True, "datos": dato}), 200
    else:
        return jsonify({"success": False, "mensaje": "Pago no encontrado"}), 404

# ================== REGISTRAR ==================
@pago_bp.route('/pagos', methods=['POST'])
def crear_pago():
    data = request.get_json()
    if not data or "idReserva" not in data or "idMetodo" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400
    
    exito, mensaje = registrar_pago(data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ==================
@pago_bp.route('/pagos/<int:id>', methods=['PUT'])
def editar_pago(id):
    data = request.get_json()
    if not data or "idReserva" not in data or "idMetodo" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400

    exito, mensaje = actualizar_pago(id, data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (VIGENCIA) ==================
@pago_bp.route('/pagos/<int:id>/estado', methods=['PATCH'])
def cambiar_vigencia_pago(id):
    data = request.get_json()
    if "estado" not in data: # 'estado' se refiere a la vigencia
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_vigencia_pago(id, data["estado"])
    if exito:
        return jsonify({"success": True, "mensaje": "Vigencia actualizada"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar vigencia"}), 500

# ================== ELIMINAR ==================
@pago_bp.route('/pagos/<int:id>', methods=['DELETE'])
def borrar_pago(id):
    exito, mensaje = eliminar_pago(id)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500