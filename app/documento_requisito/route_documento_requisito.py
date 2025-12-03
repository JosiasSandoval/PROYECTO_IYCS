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
            idReserva = None
            with conexion.cursor() as cursor:
                cursor.execute(
                    "SELECT idReserva FROM documento_requisito WHERE idDocumento = %s",
                    (datos['idDocumentoRequisito'],)
                )
                doc = cursor.fetchone()
                if doc:
                    idReserva = doc[0]
            conexion.close()
            
            # Verificar y actualizar estado de reserva
            estado_actualizado = None
            if idReserva:
                verif_success, verif_resultado = verificar_y_actualizar_estado_reserva(idReserva)
                if verif_success and isinstance(verif_resultado, dict):
                    estado_actualizado = verif_resultado.get('estadoActualizado')
            
            mensaje_respuesta = resultado
            if estado_actualizado == 'CONFIRMADO':
                mensaje_respuesta = "✅ Documento aprobado. ¡Todos los documentos han sido aprobados! La reserva ha sido CONFIRMADA."
            
            return jsonify({
                'success': True,
                'mensaje': mensaje_respuesta,
                'estadoReserva': estado_actualizado,
                'idReserva': idReserva
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
# OBTENER COMBOS (RESERVAS Y REQUISITOS)
# ============================================================
@documento_requisito_bp.route('/combos', methods=['GET'])
def obtener_combos_route():
    """
    GET /api/documento_requisito/combos
    Obtiene las listas de reservas y requisitos para los combos del formulario.
    """
    try:
        from app.bd_sistema import obtener_conexion
        conexion = obtener_conexion()
        reservas = []
        requisitos = []
        
        with conexion.cursor() as cursor:
            # Obtener reservas
            cursor.execute("""
                SELECT r.idReserva, CONCAT(f.nombFel, ' ', f.apePatFel, ' ', f.apeMatFel) as nombreSolicitante,
                       al.nombActo, r.f_reserva, r.h_reserva
                FROM reserva r
                INNER JOIN feligres f ON r.idSolicitante = f.idFeligres
                LEFT JOIN participantes_acto pa ON r.idReserva = pa.idReserva
                LEFT JOIN acto_liturgico al ON pa.idActo = al.idActo
                ORDER BY r.f_reserva DESC
                LIMIT 100
            """)
            reservas = [{'id': f[0], 'texto': f'{f[1]} - {f[2] or "N/A"} ({f[3]} {f[4]})'} 
                       for f in cursor.fetchall()]
            
            # Obtener requisitos (acto_requisito)
            cursor.execute("""
                SELECT ar.idActoRequisito, r.nombRequisito, al.nombActo
                FROM acto_requisito ar
                INNER JOIN requisito r ON ar.idRequisito = r.idRequisito
                INNER JOIN acto_liturgico al ON ar.idActo = al.idActo
                WHERE r.estadoRequisito = 'ACTIVO'
                ORDER BY al.nombActo, r.nombRequisito
            """)
            requisitos = [{'id': f[0], 'texto': f'{f[2]} - {f[1]}'} 
                         for f in cursor.fetchall()]
        
        conexion.close()
        return jsonify({
            'success': True,
            'reservas': reservas,
            'requisitos': requisitos
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500

# ============================================================
# LISTAR TODOS LOS DOCUMENTOS (PARA ADMIN)
# ============================================================
@documento_requisito_bp.route('/listar_todos', methods=['GET'])
def listar_todos_documentos_route():
    """
    GET /api/documento_requisito/listar_todos
    Obtiene todos los documentos registrados en el sistema.
    """
    try:
        from app.bd_sistema import obtener_conexion
        conexion = obtener_conexion()
        documentos = []
        
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    dr.idDocumento,
                    dr.idReserva,
                    dr.idActoRequisito,
                    dr.estadoCumplimiento,
                    dr.f_subido,
                    dr.aprobado,
                    dr.observacion,
                    dr.vigenciaDocumento,
                    CONCAT(f.nombFel, ' ', f.apePatFel, ' ', f.apeMatFel) as nombreSolicitante,
                    r.nombRequisito,
                    al.nombActo
                FROM documento_requisito dr
                INNER JOIN reserva re ON dr.idReserva = re.idReserva
                INNER JOIN feligres f ON re.idSolicitante = f.idFeligres
                INNER JOIN acto_requisito ar ON dr.idActoRequisito = ar.idActoRequisito
                INNER JOIN requisito r ON ar.idRequisito = r.idRequisito
                LEFT JOIN participantes_acto pa ON re.idReserva = pa.idReserva
                LEFT JOIN acto_liturgico al ON pa.idActo = al.idActo
                ORDER BY dr.f_subido DESC, re.f_reserva DESC
            """)
            
            for fila in cursor.fetchall():
                documentos.append({
                    'id': fila[0],
                    'idReserva': fila[1],
                    'idActoRequisito': fila[2],
                    'estadoCumplimiento': fila[3],
                    'f_subido': fila[4].strftime('%Y-%m-%d') if fila[4] else None,
                    'aprobado': bool(fila[5]),
                    'observacion': fila[6] or '---',
                    'vigencia': fila[7].strftime('%Y-%m-%d') if fila[7] else None,
                    'solicitante': fila[8],  # nombreSolicitante -> solicitante para el JS
                    'requisito': fila[9],    # nombRequisito -> requisito para el JS
                    'nombActo': fila[10] or 'N/A'
                })
        
        conexion.close()
        return jsonify({
            'success': True,
            'datos': documentos
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500

# ============================================================
# ACTUALIZAR DOCUMENTO
# ============================================================
@documento_requisito_bp.route('/actualizar/<int:idDocumento>', methods=['PUT'])
def actualizar_documento_route(idDocumento):
    """
    PUT /api/documento_requisito/actualizar/<idDocumento>
    Actualiza un documento existente.
    """
    try:
        datos = request.get_json()
        
        from app.bd_sistema import obtener_conexion
        conexion = obtener_conexion()
        
        # Mapear estado del frontend al backend
        estado_mapping = {
            'Pendiente': 'PENDIENTE',
            'Entregado': 'PENDIENTE',
            'Aprobado': 'CUMPLIDO',
            'Rechazado': 'NO_CUMPLIDO'
        }
        estadoCumplimiento = estado_mapping.get(datos.get('estado', 'Pendiente'), 'PENDIENTE')
        
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE documento_requisito
                SET idReserva = %s,
                    idActoRequisito = %s,
                    estadoCumplimiento = %s,
                    observacion = %s,
                    vigenciaDocumento = %s,
                    aprobado = %s
                WHERE idDocumento = %s
            """, (
                datos.get('idReserva'),
                datos.get('idActoRequisito'),
                estadoCumplimiento,
                datos.get('observacion', ''),
                datos.get('vigencia') if datos.get('vigencia') else None,
                1 if estadoCumplimiento == 'CUMPLIDO' else 0,
                idDocumento
            ))
        
        conexion.commit()
        conexion.close()
        
        return jsonify({
            'success': True,
            'mensaje': 'Documento actualizado correctamente'
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'mensaje': str(e)
        }), 500

# ============================================================
# ELIMINAR DOCUMENTO
# ============================================================
@documento_requisito_bp.route('/eliminar/<int:idDocumento>', methods=['DELETE'])
def eliminar_documento_route(idDocumento):
    """
    DELETE /api/documento_requisito/eliminar/<idDocumento>
    Elimina un documento.
    """
    try:
        from app.bd_sistema import obtener_conexion
        conexion = obtener_conexion()
        
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM documento_requisito WHERE idDocumento = %s", (idDocumento,))
        
        conexion.commit()
        conexion.close()
        
        return jsonify({
            'success': True,
            'mensaje': 'Documento eliminado correctamente'
        }), 200
        
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
