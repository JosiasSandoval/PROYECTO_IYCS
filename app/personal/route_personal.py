from flask import Blueprint, jsonify, request
from app.personal.controlador_personal import (
    obtener_personales,
    obtener_personal_por_id,
    registrar_personal,
    actualizar_personal,
    eliminar_personal,
    actualizar_estado_personal
)

personal_bp = Blueprint('personal', __name__)

# ================== LISTAR TODOS ==================
@personal_bp.route('/personales', methods=['GET'])
def listar_personales():
    datos = obtener_personales()
    return jsonify({
        "success": True,
        "mensaje": "Personal obtenido correctamente",
        "datos": datos
    }), 200

# ================== OBTENER UNO ==================
@personal_bp.route('/personales/<int:idPersonal>', methods=['GET'])
def obtener_personal(idPersonal):
    personal = obtener_personal_por_id(idPersonal)
    if personal:
        return jsonify({
            "success": True,
            "mensaje": "Personal encontrado",
            "datos": personal
        }), 200
    else:
        return jsonify({"success": False, "mensaje": "Personal no encontrado"}), 404

# ================== REGISTRAR ==================
@personal_bp.route('/personales', methods=['POST'])
def crear_personal():
    data = request.get_json()
    if not data or "email" not in data or "clave" not in data or "nombPers" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400
    
    exito, mensaje = registrar_personal(data)
    
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR (COMPLETO) ==================
@personal_bp.route('/personales/<int:idPersonal>', methods=['PUT'])
def editar_personal(idPersonal):
    data = request.get_json()
    if not data or "email" not in data or "nombPers" not in data or "idUsuario" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400

    exito, mensaje = actualizar_personal(idPersonal, data)
    
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
@personal_bp.route('/personales/<int:idUsuario>/estado', methods=['PATCH'])
def cambiar_estado_personal(idUsuario):
    data = request.get_json()
    if "estadoCuenta" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_personal(idUsuario, data["estadoCuenta"])
    
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado correctamente"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@personal_bp.route('/personales/<int:idPersonal>', methods=['DELETE'])
def borrar_personal(idPersonal):
    exito, mensaje = eliminar_personal(idPersonal)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500