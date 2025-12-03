from flask import Blueprint, request, jsonify
from app.documento_requisito.controlador_documento_requisito import (
    buscar_reservas,
    obtener_requisitos_acto,
    obtener_documentos_reserva,
    registrar_documento_fisico,
    aprobar_documento,
    rechazar_documento,
    verificar_y_actualizar_estado_reserva,
    aprobar_todos_documentos
)

documento_requisito_bp = Blueprint('documento_requisito_bp', __name__)

# ============================================================
# BUSCAR RESERVAS POR FELIGRÉS O NÚMERO
# ============================================================
@documento_requisito_bp.route('/buscar', methods=['GET'])
def buscar_reservas_route():
    """
    GET /api/documento_requisito/buscar?termino=<texto>
    Busca reservas por nombre del feligrés o número de reserva.
    """
    try:
        termino = request.args.get('termino', '')
        
        if not termino:
            return jsonify({
                'success': False,
                'mensaje': 'Debe proporcionar un término de búsqueda'
            }), 400
        
        success, resultado = buscar_reservas(termino)
        
        if success:
            return jsonify({
                'success': True,
                'datos': resultado,
                'total': len(resultado)
            }), 200
        else:
            return jsonify({
                'success': False,
                'mensaje': resultado
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500

# ============================================================
# OBTENER REQUISITOS DE UN ACTO LITÚRGICO
# ============================================================
@documento_requisito_bp.route('/requisitos/<int:idActo>', methods=['GET'])
def obtener_requisitos_route(idActo):
    """
    GET /api/documento_requisito/requisitos/<idActo>
    Obtiene todos los requisitos de un acto litúrgico.
    """
    try:
        success, resultado = obtener_requisitos_acto(idActo)
        
        if success:
            return jsonify({
                'success': True,
                'datos': resultado
            }), 200
        else:
            return jsonify({
                'success': False,
                'mensaje': resultado
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500

# ============================================================
# OBTENER DOCUMENTOS DE UNA RESERVA
# ============================================================
@documento_requisito_bp.route('/listar/<int:idReserva>', methods=['GET'])
def obtener_documentos_route(idReserva):
    """
    GET /api/documento_requisito/listar/<idReserva>
    Obtiene todos los documentos registrados para una reserva.
    """
    try:
        success, resultado = obtener_documentos_reserva(idReserva)
        
        if success:
            return jsonify({
                'success': True,
                'datos': resultado
            }), 200
        else:
            return jsonify({
                'success': False,
                'mensaje': resultado
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500

# ============================================================
# REGISTRAR DOCUMENTO FÍSICO
# ============================================================
@documento_requisito_bp.route('/registrar', methods=['POST'])
def registrar_documento_route():
    """
    POST /api/documento_requisito/registrar
    Body: {
        "idReserva": 1,
        "idActoRequisito": 1,
        "observacion": "Documento original recibido"
    }
    Registra que un documento físico ha sido recibido.
    """
    try:
        datos = request.get_json()
        
        if not datos.get('idReserva') or not datos.get('idActoRequisito'):
            return jsonify({
                'success': False,
                'mensaje': 'Faltan datos requeridos'
            }), 400
        
        success, resultado = registrar_documento_fisico(datos)
        
        if success:
            # Verificar y actualizar estado de reserva
            verificar_y_actualizar_estado_reserva(datos['idReserva'])
            
            return jsonify({
                'success': True,
                'mensaje': resultado
            }), 200
        else:
            return jsonify({
                'success': False,
                'mensaje': resultado
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500

# ============================================================
# APROBAR DOCUMENTO
# ============================================================
@documento_requisito_bp.route('/aprobar', methods=['POST'])
def aprobar_documento_route():
    """
    POST /api/documento_requisito/aprobar
    Body: {
        "idDocumentoRequisito": 1,
        "observacion": "Documento correcto"
    }
    Aprueba un documento específico.
    """
    try:
        datos = request.get_json()
        
        if not datos.get('idDocumentoRequisito'):
            return jsonify({
                'success': False,
                'mensaje': 'Debe proporcionar el ID del documento'
            }), 400
        
        success, resultado = aprobar_documento(datos)
        
        if success:
            # Obtener idReserva del documento para verificar estado
            from app.bd_sistema import obtener_conexion
            conexion = obtener_conexion()
            with conexion.cursor() as cursor:
                cursor.execute(
                    "SELECT idReserva FROM documento_requisito WHERE idDocumento = %s",
                    (datos['idDocumentoRequisito'],)
                )
                doc = cursor.fetchone()
            conexion.close()
            
            if doc:
                verificar_y_actualizar_estado_reserva(doc[0])
            
            return jsonify({
                'success': True,
                'mensaje': resultado
            }), 200
        else:
            return jsonify({
                'success': False,
                'mensaje': resultado
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500

# ============================================================
# RECHAZAR DOCUMENTO
# ============================================================
@documento_requisito_bp.route('/rechazar', methods=['POST'])
def rechazar_documento_route():
    """
    POST /api/documento_requisito/rechazar
    Body: {
        "idDocumentoRequisito": 1,
        "observacion": "Documento incompleto"
    }
    Rechaza un documento específico.
    """
    try:
        datos = request.get_json()
        
        if not datos.get('idDocumentoRequisito'):
            return jsonify({
                'success': False,
                'mensaje': 'Debe proporcionar el ID del documento'
            }), 400
        
        if not datos.get('observacion'):
            return jsonify({
                'success': False,
                'mensaje': 'Debe proporcionar una observación para el rechazo'
            }), 400
        
        success, resultado = rechazar_documento(datos)
        
        if success:
            # Obtener idReserva del documento para verificar estado
            from app.bd_sistema import obtener_conexion
            conexion = obtener_conexion()
            with conexion.cursor() as cursor:
                cursor.execute(
                    "SELECT idReserva FROM documento_requisito WHERE idDocumento = %s",
                    (datos['idDocumentoRequisito'],)
                )
                doc = cursor.fetchone()
            conexion.close()
            
            if doc:
                verificar_y_actualizar_estado_reserva(doc[0])
            
            return jsonify({
                'success': True,
                'mensaje': resultado
            }), 200
        else:
            return jsonify({
                'success': False,
                'mensaje': resultado
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500

# ============================================================
# APROBAR TODOS LOS DOCUMENTOS DE UNA RESERVA
# ============================================================
@documento_requisito_bp.route('/aprobar_todos', methods=['POST'])
def aprobar_todos_route():
    """
    POST /api/documento_requisito/aprobar_todos
    Body: {
        "idReserva": 1,
        "observacion": "Todos los documentos correctos"
    }
    Aprueba todos los documentos pendientes de una reserva.
    """
    try:
        datos = request.get_json()
        
        if not datos.get('idReserva'):
            return jsonify({
                'success': False,
                'mensaje': 'Debe proporcionar el ID de la reserva'
            }), 400
        
        observacion = datos.get('observacion', '')
        success, resultado = aprobar_todos_documentos(datos['idReserva'], observacion)
        
        if success:
            return jsonify({
                'success': True,
                'mensaje': 'Documentos aprobados correctamente',
                'datos': resultado
            }), 200
        else:
            return jsonify({
                'success': False,
                'mensaje': resultado
            }), 500
            
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500
