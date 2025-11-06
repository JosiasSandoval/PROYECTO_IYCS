from datetime import datetime, timedelta, time
from flask import jsonify,Blueprint
from app.acto_liturgico_requisito.controlador_acto import (obtener_acto_parroquia,disponibilidad_acto_parroquia)

acto_bp=Blueprint('acto',__name__)

@acto_bp.route('/<int:id>', methods=['GET'])
def acto_parroquia(id):
    datos = obtener_acto_parroquia(id)
    
    return jsonify({
        "success": True,
        "mensaje": "Actos encontrados correctamente",
        "datos": datos
    }), 200

@acto_bp.route('/disponibilidad/<int:idParroquia>/<int:idActo>', methods=['GET'])
def disponibilidad_acto(idParroquia,idActo):
    datos = disponibilidad_acto_parroquia(idParroquia,idActo)
    
    return jsonify({
        "success": True,
        "mensaje": "Actos encontrados correctamente",
        "datos": datos
    }), 200

