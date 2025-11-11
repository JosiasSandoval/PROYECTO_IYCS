from flask import jsonify,Blueprint,request
from datetime import datetime, timedelta, time
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

from flask import request, jsonify, Blueprint
from datetime import datetime

# Asumo que tu Blueprint se llama 'requisito_bp' y que 'registrar_documento' 
# está importada correctamente desde tu módulo de modelo/base de datos
# from . import requisito_bp # Descomentar y ajustar si fuera necesario

# NOTA: La función 'registrar_documento' debe ser la versión corregida de 9 parámetros
# from tu_modulo_modelo import registrar_documento 

@requisito_bp.route('/registrar_documento', methods=['POST'])
def registrar_documento_route():
    try:
        data = request.get_json()
        campos_requeridos = [
            'idActoRequisito', 'idReserva', 'ruta', 'tipoArchivo',
            'estadoCumplimiento' # 'fecha' también podría ser opcional si la provees con datetime.now()
        ]
        faltantes = [campo for campo in campos_requeridos if campo not in data]
        if faltantes:
            return jsonify({
                'ok': False,
                'mensaje': f'Faltan campos obligatorios: {", ".join(faltantes)}'
            }), 400
        idActoRequisito = data['idActoRequisito']
        idReserva = data['idReserva']
        ruta = data['ruta']
        tipoArchivo = data['tipoArchivo']
        
        # Si 'fecha' no viene, usa la fecha/hora actual (la BD espera un DATE)
        fecha = data.get('fecha', datetime.now().strftime('%Y-%m-%d')) 
        
        estadoCumplimiento = data['estadoCumplimiento']
        observacion = data.get('observacion', '') # Valor por defecto: cadena vacía
        vigencia = data.get('vigencia', None)     # Valor por defecto: None (para NULL en BD)
        aprobado = False 
        resultado = registrar_documento(
            idActoRequisito, idReserva, ruta, tipoArchivo,
            fecha, estadoCumplimiento, observacion, vigencia,
            aprobado # <--- ¡CORRECCIÓN CLAVE!
        )
        if resultado['ok']:
            return jsonify({
                'ok': True,
                'mensaje': resultado['mensaje'],
                # Opcional: retornar el ID insertado si la función registrar_documento lo devuelve
            }), 201 # 201 Created es más apropiado para un registro exitoso
        else:
            # Respuesta 500 para errores de base de datos
            return jsonify({
                'ok': False,
                'mensaje': resultado['mensaje']
            }), 500

    except Exception as e:
        # Se registra el error detallado y se devuelve una respuesta genérica al cliente
        print(f'Error en registrar_documento_route: {e}')
        return jsonify({
            'ok': False,
            'mensaje': 'Error interno del servidor al procesar la solicitud.'
        }), 500