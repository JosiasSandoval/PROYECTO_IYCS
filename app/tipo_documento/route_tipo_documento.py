from flask import Blueprint, jsonify, request
from app.tipo_documento.controlador_tipo_documento import (
    obtener_documentos,
    obtener_documento_por_id,
    registrar_documento,
    actualizar_documento,
    eliminar_documento,
    actualizar_estado_documento
)

# Recuerda registrar este blueprint en tu __init__.py
# app.register_blueprint(tipoDocumento_bp, url_prefix='/api/tipoDocumento')
tipoDocumento_bp = Blueprint('tipo_documento', __name__)

# ================== LISTAR TODOS ==================
@tipoDocumento_bp.route('/documentos', methods=['GET'])
def listar_documentos():
    datos = obtener_documentos()
    return jsonify({
        "success": True,
        "mensaje": "Documentos obtenidos correctamente",
        "datos": datos
    }), 200

# ================== OBTENER UNO ==================
@tipoDocumento_bp.route('/documentos/<int:idDoc>', methods=['GET'])
def obtener_documento(idDoc):
    doc = obtener_documento_por_id(idDoc)
    if doc:
        return jsonify({
            "success": True,
            "mensaje": "Documento encontrado",
            "datos": doc
        }), 200
    else:
        return jsonify({"success": False, "mensaje": "Documento no encontrado"}), 404

# ================== REGISTRAR ==================
@tipoDocumento_bp.route('/documentos', methods=['POST'])
def crear_documento():
    data = request.get_json()
    if not data or "nombDocumento" not in data or "abreviatura" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400
    
    exito = registrar_documento(data)
    
    if exito:
        return jsonify({"success": True, "mensaje": "Documento registrado correctamente"}), 201
    else:
        return jsonify({"success": False, "mensaje": "Error al registrar documento"}), 500

# ================== ACTUALIZAR (COMPLETO) ==================
@tipoDocumento_bp.route('/documentos/<int:idDoc>', methods=['PUT'])
def editar_documento(idDoc):
    data = request.get_json()
    if not data or "nombDocumento" not in data or "abreviatura" not in data or "estadoDocumento" not in data:
        return jsonify({"success": False, "mensaje": "Datos incompletos"}), 400

    exito = actualizar_documento(idDoc, data)
    
    if exito:
        return jsonify({"success": True, "mensaje": "Documento actualizado correctamente"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar documento"}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
@tipoDocumento_bp.route('/documentos/<int:idDoc>/estado', methods=['PATCH'])
def cambiar_estado_documento(idDoc):
    data = request.get_json()
    if not data or "estadoDocumento" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_documento(idDoc, data["estadoDocumento"])
    
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado correctamente"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@tipoDocumento_bp.route('/documentos/<int:idDoc>', methods=['DELETE'])
def borrar_documento(idDoc):
    exito = eliminar_documento(idDoc)
    if exito:
        return jsonify({"success": True, "mensaje": "Documento eliminado correctamente"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al eliminar documento"}), 500