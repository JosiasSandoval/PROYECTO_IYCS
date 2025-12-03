from flask import Blueprint, jsonify, request
# Asegúrate de que esta ruta de importación sea correcta para tu proyecto
from app.acto_liturgico.controlador_actoLiturgico import (
    obtener_actos,
    obtener_acto_por_id,
    registrar_acto,
    actualizar_acto,
    actualizar_estado_acto,
    eliminar_acto
)

# --- CORRECCIÓN ---
# Quitamos el url_prefix. El __init__.py ya define el prefijo correcto.
acto_liturgico_bp = Blueprint('acto_liturgico', __name__)

# ================== LISTAR TODOS ==================
# Esta ruta ahora será: /api/acto_liturgico/actos
@acto_liturgico_bp.route('/actos', methods=['GET'])
def listar_actos():
    datos = obtener_actos()
    return jsonify({"success": True, "datos": datos}), 200

# ================== OBTENER UNO ==================
# Esta ruta ahora será: /api/acto_liturgico/actos/<id>
@acto_liturgico_bp.route('/actos/<int:idActo>', methods=['GET'])
def obtener_acto(idActo):
    acto = obtener_acto_por_id(idActo)
    if acto:
        return jsonify({"success": True, "datos": acto}), 200
    else:
        return jsonify({"success": False, "mensaje": "Acto no encontrado"}), 404

# ================== REGISTRAR (VALIDACIÓN MEJORADA) ==================
@acto_liturgico_bp.route('/actos', methods=['POST'])
def crear_acto():
    data = request.get_json()
    
    # Campos obligatorios del nuevo modal
    campos_requeridos = ["nombActo", "numParticipantes", "tipoParticipantes","imgActo"]
    
    if not data or not all(campo in data for campo in campos_requeridos):
        return jsonify({"success": False, "mensaje": "Datos incompletos. Faltan campos obligatorios."}), 400
    
    exito, mensaje = registrar_acto(data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR (VALIDACIÓN MEJORADA) ==================
@acto_liturgico_bp.route('/actos/<int:idActo>', methods=['PUT'])
def editar_acto(idActo):
    data = request.get_json()

    # Campos obligatorios del nuevo modal
    campos_requeridos = ["nombActo", "numParticipantes", "tipoParticipantes", "imgActo"]

    if not data or not all(campo in data for campo in campos_requeridos):
        return jsonify({"success": False, "mensaje": "Datos incompletos. Faltan campos obligatorios."}), 400

    exito, mensaje = actualizar_acto(idActo, data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
# Esta ruta ahora será: /api/acto_liturgico/actos/<id>/estado
@acto_liturgico_bp.route('/actos/<int:idActo>/estado', methods=['PATCH'])
def cambiar_estado_acto(idActo):
    data = request.get_json()
    if "estado" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_acto(idActo, data["estado"])
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@acto_liturgico_bp.route('/actos/<int:idActo>', methods=['DELETE']) 
def borrar_acto(idActo):
    exito, mensaje = eliminar_acto(idActo)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500