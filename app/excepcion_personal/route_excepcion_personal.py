from flask import Blueprint, jsonify, request
from app.excepcion_personal.controlador_excepcion_personal import (
    obtener_excepciones,
    obtener_excepcion_por_id,
    registrar_excepcion,
    actualizar_excepcion,
    actualizar_estado_excepcion,
    eliminar_excepcion,
    obtener_lista_simple_personal # Importar la función auxiliar
)

# --- IMPORTANTE ---
# Debes registrar este blueprint en tu app/__init__.py:
# 1. from app.excepcion_personal.route_excepcion_personal import excepcion_bp
# 2. app.register_blueprint(excepcion_bp, url_prefix='/api/excepcion')

excepcion_bp = Blueprint('excepcion_personal', __name__)

# ================== LISTAR TODOS ==================
@excepcion_bp.route('/excepciones', methods=['GET'])
def listar_excepciones():
    datos = obtener_excepciones()
    return jsonify({"success": True, "datos": datos}), 200

# ================== OBTENER UNO ==================
@excepcion_bp.route('/excepciones/<int:id>', methods=['GET'])
def obtener_excepcion(id):
    dato = obtener_excepcion_por_id(id)
    if dato:
        return jsonify({"success": True, "datos": dato}), 200
    else:
        return jsonify({"success": False, "mensaje": "Excepción no encontrada"}), 404

# ================== REGISTRAR ==================
@excepcion_bp.route('/excepciones', methods=['POST'])
def crear_excepcion():
    data = request.get_json()
    if not data or "nombreExcepcion" not in data or "idPersonal" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400
    
    exito, mensaje = registrar_excepcion(data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ==================
@excepcion_bp.route('/excepciones/<int:id>', methods=['PUT'])
def editar_excepcion(id):
    data = request.get_json()
    if not data or "nombreExcepcion" not in data or "idPersonal" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400

    exito, mensaje = actualizar_excepcion(id, data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
@excepcion_bp.route('/excepciones/<int:id>/estado', methods=['PATCH'])
def cambiar_estado_excepcion(id):
    data = request.get_json()
    if "estado" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_excepcion(id, data["estado"])
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@excepcion_bp.route('/excepciones/<int:id>', methods=['DELETE'])
def borrar_excepcion(id):
    exito, mensaje = eliminar_excepcion(id)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== RUTA AUXILIAR PARA EL MODAL ==================
@excepcion_bp.route('/lista-personal', methods=['GET'])
def listar_personal_simple():
    datos = obtener_lista_simple_personal()
    return jsonify({"success": True, "datos": datos}), 200