from flask import Blueprint, jsonify, request
from app.acto_liturgico.controlador_actoLiturgico import (
    obtener_actos,
    obtener_acto_por_id,
    registrar_acto,
    actualizar_acto,
    eliminar_acto
)

acto_liturgico_bp = Blueprint('acto_liturgico', __name__)

# ================== LISTAR TODOS ==================
@acto_liturgico_bp.route('/actos', methods=['GET'])
def listar_actos():
    datos = obtener_actos()
    return jsonify({
        "success": True,
        "mensaje": "Actos litúrgicos obtenidos correctamente",
        "datos": datos
    }), 200


# ================== OBTENER UNO ==================
@acto_liturgico_bp.route('/actos/<int:idActo>', methods=['GET'])
def obtener_acto(idActo):
    acto = obtener_acto_por_id(idActo)
    if acto:
        return jsonify({
            "success": True,
            "mensaje": "Acto encontrado correctamente",
            "datos": acto
        }), 200
    else:
        return jsonify({
            "success": False,
            "mensaje": "Acto no encontrado"
        }), 404


# ================== REGISTRAR ==================
@acto_liturgico_bp.route('/actos', methods=['POST'])
def crear_acto():
    data = request.get_json()
    exito = registrar_acto(data)
    if exito:
        return jsonify({"success": True, "mensaje": "Acto litúrgico registrado correctamente"}), 201
    else:
        return jsonify({"success": False, "mensaje": "Error al registrar acto litúrgico"}), 500


# ================== ACTUALIZAR ==================
@acto_liturgico_bp.route('/actos/<int:idActo>', methods=['PUT'])
def editar_acto(idActo):
    data = request.get_json()
    exito = actualizar_acto(idActo, data)
    if exito:
        return jsonify({"success": True, "mensaje": "Acto litúrgico actualizado correctamente"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar acto litúrgico"}), 500


# ================== ELIMINAR ==================
@acto_liturgico_bp.route('/actos/<int:idActo>', methods=['DELETE'])
def borrar_acto(idActo):
    exito = eliminar_acto(idActo)
    if exito:
        return jsonify({"success": True, "mensaje": "Acto litúrgico eliminado correctamente"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al eliminar acto litúrgico"}), 500
