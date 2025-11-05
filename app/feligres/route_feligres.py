from flask import Blueprint, jsonify, request
from app.feligres.controlador_feligres import (
    obtener_feligreses,
    obtener_feligres_por_id,
    registrar_feligres,
    actualizar_feligres,
    eliminar_feligres,
    actualizar_estado_feligres
)

feligres_bp = Blueprint('feligres', __name__)

# ================== LISTAR TODOS ==================
@feligres_bp.route('/feligreses', methods=['GET'])
def listar_feligreses():
    datos = obtener_feligreses()
    return jsonify({
        "success": True,
        "mensaje": "Feligreses obtenidos correctamente",
        "datos": datos
    }), 200

# ================== OBTENER UNO ==================
@feligres_bp.route('/feligreses/<int:idFeligres>', methods=['GET'])
def obtener_feligres(idFeligres):
    feligres = obtener_feligres_por_id(idFeligres)
    if feligres:
        return jsonify({
            "success": True,
            "mensaje": "Feligrés encontrado",
            "datos": feligres
        }), 200
    else:
        return jsonify({"success": False, "mensaje": "Feligrés no encontrado"}), 404

# ================== REGISTRAR ==================
@feligres_bp.route('/feligreses', methods=['POST'])
def crear_feligres():
    data = request.get_json()
    if not data or "email" not in data or "clave" not in data or "nombFel" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400
    
    exito, mensaje = registrar_feligres(data)
    
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR (COMPLETO) ==================
@feligres_bp.route('/feligreses/<int:idFeligres>', methods=['PUT'])
def editar_feligres(idFeligres):
    data = request.get_json()
    if not data or "email" not in data or "nombFel" not in data or "idUsuario" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400

    exito, mensaje = actualizar_feligres(idFeligres, data)
    
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
@feligres_bp.route('/feligreses/<int:idUsuario>/estado', methods=['PATCH'])
def cambiar_estado_feligres(idUsuario):
    data = request.get_json()
    if "estadoCuenta" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_feligres(idUsuario, data["estadoCuenta"])
    
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado correctamente"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@feligres_bp.route('/feligreses/<int:idFeligres>', methods=['DELETE'])
def borrar_feligres(idFeligres):
    exito, mensaje = eliminar_feligres(idFeligres)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500