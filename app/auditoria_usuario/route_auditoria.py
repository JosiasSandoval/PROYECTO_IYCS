from flask import Blueprint, jsonify
from app.auditoria_usuario.controlador_auditoria import (
    obtener_auditoria_usuarios,
    obtener_auditoria_usuario_por_id
)

# Crear el Blueprint
auditoria_bp = Blueprint('auditoria', __name__)

# NOTA: Registra esto en __init__.py:
# from app.auditoria.route_auditoria import auditoria_bp
# app.register_blueprint(auditoria_bp, url_prefix='/api/auditoria')

# ================== LISTAR AUDITORÍA DE USUARIOS ==================
@auditoria_bp.route('/usuarios', methods=['GET'])
def listar_auditoria_usuarios():
    datos = obtener_auditoria_usuarios()
    return jsonify({
        "success": True,
        "mensaje": "Auditoría de usuarios obtenida correctamente",
        "datos": datos
    }), 200

# ================== OBTENER UN REGISTRO ==================
@auditoria_bp.route('/usuarios/<int:idAuditoria>', methods=['GET'])
def obtener_registro_auditoria(idAuditoria):
    registro = obtener_auditoria_usuario_por_id(idAuditoria)
    if registro:
        return jsonify({
            "success": True,
            "mensaje": "Registro encontrado",
            "datos": registro
        }), 200
    else:
        return jsonify({"success": False, "mensaje": "Registro no encontrado"}), 404