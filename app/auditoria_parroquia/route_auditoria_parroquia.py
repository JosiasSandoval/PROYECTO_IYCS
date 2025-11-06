from flask import Blueprint, jsonify
# Importa desde el controlador específico de parroquia (en la misma carpeta)
from app.auditoria_parroquia.controlador_auditoria_parroquia import (
    obtener_auditoria_parroquias,
    obtener_auditoria_parroquia_por_id
)

auditoria_parroquia_bp = Blueprint('auditoria_parroquia', __name__)

# ================== AUDITORÍA DE PARROQUIAS ==================
@auditoria_parroquia_bp.route('/', methods=['GET'])
def listar_auditoria_parroquias():
    datos = obtener_auditoria_parroquias()
    return jsonify({
        "success": True,
        "mensaje": "Auditoría de parroquias obtenida correctamente",
        "datos": datos
    }), 200

@auditoria_parroquia_bp.route('/<int:idAuditoria>', methods=['GET'])
def obtener_registro_auditoria_parroquia(idAuditoria):
    registro = obtener_auditoria_parroquia_por_id(idAuditoria)
    if registro:
        return jsonify({"success": True, "mensaje": "Registro encontrado", "datos": registro}), 200
    else:
        return jsonify({"success": False, "mensaje": "Registro no encontrado"}), 404