from flask import redirect,render_template,Blueprint,jsonify,request
from app.acto_liturgico_requisito.controlador_acto import(
    obtener_acto_parroquia
)

acto_bp=Blueprint('acto',__name__)

@acto_bp.route('/reserva/<int:id>',methods=['GET'])
def acto_parroquia(id):
    datos=obtener_acto_parroquia(id)
    return jsonify({
        "success": True,
        "mensaje": "Actos encontrados correctamente",
        "datos": datos
    }), 200