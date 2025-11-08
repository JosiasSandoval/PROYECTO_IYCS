from flask import jsonify,Blueprint,request
from app.acto_liturgico_requisito.controlador_requisito import(
    obtener_requisito_acto,
    registrar_documento,
    cambiar_cumplimiento_documento,
    agregar_observacion_documento
)

requisito_bp=Blueprint('requisito',__name__)

@requisito_bp.route('/<int:id>', methods=['GET'])
def obtener_requisito(id):
    datos = obtener_requisito_acto(id)
    return jsonify({
        "success": True,
        "mensaje": "Requisitos encontrados correctamente",
        "datos": datos
        }), 200

@requisito_bp.route('/registrar_documento', methods=['POST'])
def registrar_documento_route():
    data = request.get_json()
    idActoRequisito = data.get('idActoRequisito')
    idReserva = data.get('idReserva')
    ruta = data.get('ruta')
    tipoArchivo = data.get('tipoArchivo')
    fecha = data.get('fecha')
    estadoCumplimiento = data.get('estadoCumplimiento')
    observacion = data.get('observacion')
    vigencia = data.get('vigencia')
    
    resultado = registrar_documento(idActoRequisito,idReserva, ruta, tipoArchivo,fecha,estadoCumplimiento,observacion,vigencia)
    return jsonify(resultado), 200  


@requisito_bp.route('/cambiar_estado_documento/<int:idDocumento>', methods=['POST'])
def cambiar_estado_documento():
    data = request.get_json()
    idDocumento = data.get('idDocumento')
    estadoCumplimiento = data.get('estadoCumplimiento')
    
    resultado = cambiar_cumplimiento_documento(idDocumento,estadoCumplimiento)
    return jsonify(resultado), 200  

@requisito_bp.route('/agregar_observacion_documento/<int:idDocumento>', methods=['POST'])
def agregar_observacion_documento_route():
    data = request.get_json()
    idDocumento = data.get('idDocumento')
    observacion = data.get('observacion')
    
    resultado = agregar_observacion_documento(idDocumento,observacion)
    return jsonify(resultado), 200 
