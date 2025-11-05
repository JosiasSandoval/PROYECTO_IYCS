from flask import Blueprint, jsonify
from app.auditoria_reserva.controlador_auditoria_reserva import (
    obtener_auditoria_usuarios,
    obtener_auditoria_usuario_por_id,
    # === IMPORTAR LAS NUEVAS FUNCIONES ===
    obtener_auditoria_reservas,
    obtener_auditoria_reserva_por_id
)

# ... (Tu auditoria_bp = Blueprint('auditoria', __name__) ya existe) ...

# ... (Tus rutas para /usuarios ya existen) ...


# ================== LISTAR AUDITORÍA DE RESERVAS ==================
@auditoria_bp.route('/reservas', methods=['GET'])
def listar_auditoria_reservas():
    datos = obtener_auditoria_reservas()
    return jsonify({
        "success": True,
        "mensaje": "Auditoría de reservas obtenida correctamente",
        "datos": datos
    }), 200

# ================== OBTENER UN REGISTRO DE RESERVA ==================
@auditoria_bp.route('/reservas/<int:idAuditoria>', methods=['GET'])
def obtener_registro_auditoria_reserva(idAuditoria):
    registro = obtener_auditoria_reserva_por_id(idAuditoria)
    if registro:
        return jsonify({
            "success": True,
            "mensaje": "Registro encontrado",
            "datos": registro
        }), 200
    else:
        return jsonify({"success": False, "mensaje": "Registro no encontrado"}), 404