from app.bd_sistema import obtener_conexion

# ============================================================
# BUSCAR RESERVAS POR FELIGRÉS O NÚMERO DE RESERVA
# ============================================================
def buscar_reservas(termino_busqueda):
    """
    Busca reservas por nombre del solicitante o número de reserva.
    Devuelve todas las reservas que coincidan con el término de búsqueda.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Buscar por número de reserva O por nombre del feligrés
            query = """
                SELECT 
                    r.idReserva,
                    r.idUsuario,
                    r.idSolicitante,
                    r.idParroquia,
                    r.f_reserva,
                    r.h_reserva,
                    r.estadoReserva,
                    r.mencion,
                    f.nombFel,
                    f.apePatFel,
                    f.apeMatFel,
                    MAX(al.nombActo) AS nombActo,
                    MAX(pa.idActo) AS idActo,
                    MAX(p.nombParroquia) AS nombParroquia,
                    COUNT(DISTINCT dr.idDocumento) AS totalDocumentosRegistrados,
                    COUNT(DISTINCT CASE WHEN dr.estadoCumplimiento = 'CUMPLIDO' AND dr.aprobado = 1 THEN dr.idDocumento END) AS documentosAprobados,
                    COUNT(DISTINCT CASE WHEN dr.estadoCumplimiento = 'NO_CUMPLIDO' THEN dr.idDocumento END) AS documentosRechazados
                FROM RESERVA r
                INNER JOIN FELIGRES f ON r.idSolicitante = f.idFeligres
                INNER JOIN PARROQUIA p ON r.idParroquia = p.idParroquia
                LEFT JOIN PARTICIPANTES_ACTO pa ON r.idReserva = pa.idReserva
                LEFT JOIN ACTO_LITURGICO al ON pa.idActo = al.idActo
                LEFT JOIN DOCUMENTO_REQUISITO dr ON r.idReserva = dr.idReserva
                WHERE 
                    r.idReserva LIKE %s 
                    OR CONCAT(f.nombFel, ' ', f.apePatFel, ' ', f.apeMatFel) LIKE %s
                    OR f.nombFel LIKE %s
                    OR f.apePatFel LIKE %s
                    OR f.apeMatFel LIKE %s
                GROUP BY r.idReserva, r.idUsuario, r.idSolicitante, r.idParroquia, 
                         r.f_reserva, r.h_reserva, r.estadoReserva, r.mencion,
                         f.nombFel, f.apePatFel, f.apeMatFel
                ORDER BY r.f_reserva DESC
            """
            
            search_term = f"%{termino_busqueda}%"
            cursor.execute(query, (search_term, search_term, search_term, search_term, search_term))
            filas = cursor.fetchall()
            
            # Convertir tuplas a diccionarios
            resultados = []
            for fila in filas:
                # Convertir fecha y hora a string si no son None
                fecha_str = fila[4].strftime('%Y-%m-%d') if fila[4] else None
                hora_str = str(fila[5]) if fila[5] else None
                
                resultados.append({
                    'idReserva': fila[0],
                    'idUsuario': fila[1],
                    'idSolicitante': fila[2],
                    'idParroquia': fila[3],
                    'fecha': fecha_str,
                    'hora': hora_str,
                    'estadoReserva': fila[6],
                    'mencion': fila[7],
                    'nombreSolicitante': fila[8],
                    'apellidoSolicitante': fila[9],
                    'apellidoMaternoSolicitante': fila[10],
                    'nombreActo': fila[11],
                    'idActo': fila[12],
                    'nombreParroquia': fila[13],
                    'totalDocumentosRegistrados': fila[14] or 0,
                    'documentosAprobados': fila[15] or 0,
                    'documentosRechazados': fila[16] or 0
                })
        
        conexion.close()
        return True, resultados
    except Exception as e:
        print(f"Error al buscar reservas: {str(e)}")
        import traceback
        traceback.print_exc()
        if conexion:
            conexion.close()
        return False, str(e)

# ============================================================
# OBTENER REQUISITOS DEL ACTO LITÚRGICO
# ============================================================
def obtener_requisitos_acto(idActo):
    """
    Obtiene todos los requisitos requeridos para un acto litúrgico específico.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            query = """
                SELECT 
                    ar.idActoRequisito,
                    ar.idActo,
                    ar.idRequisito,
                    r.nombRequisito,
                    r.descripcion,
                    r.estadoRequisito
                FROM ACTO_REQUISITO ar
                INNER JOIN REQUISITO r ON ar.idRequisito = r.idRequisito
                WHERE ar.idActo = %s
                ORDER BY r.nombRequisito ASC
            """
            
            cursor.execute(query, (idActo,))
            filas = cursor.fetchall()
            
            requisitos = []
            for fila in filas:
                requisitos.append({
                    'idActoRequisito': fila[0],
                    'idActo': fila[1],
                    'idRequisito': fila[2],
                    'nombreRequisito': fila[3],
                    'descripcion': fila[4],
                    'estadoRequisito': fila[5]
                })
        
        conexion.close()
        return True, requisitos
    except Exception as e:
        print(f"Error al obtener requisitos: {str(e)}")
        import traceback
        traceback.print_exc()
        if conexion:
            conexion.close()
        return False, str(e)

# ============================================================
# OBTENER DOCUMENTOS YA REGISTRADOS DE UNA RESERVA
# ============================================================
def obtener_documentos_reserva(idReserva):
    """
    Obtiene los documentos que ya han sido registrados para una reserva específica.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            query = """
                SELECT 
                    dr.idDocumento,
                    dr.idReserva,
                    dr.idActoRequisito,
                    dr.estadoCumplimiento,
                    dr.f_subido,
                    dr.aprobado,
                    dr.observacion,
                    r.nombRequisito,
                    r.descripcion,
                    r.estadoRequisito
                FROM DOCUMENTO_REQUISITO dr
                INNER JOIN ACTO_REQUISITO ar ON dr.idActoRequisito = ar.idActoRequisito
                INNER JOIN REQUISITO r ON ar.idRequisito = r.idRequisito
                WHERE dr.idReserva = %s
                ORDER BY r.nombRequisito ASC
            """
            
            cursor.execute(query, (idReserva,))
            filas = cursor.fetchall()
            
            documentos = []
            for fila in filas:
                # Convertir fecha a string si no es None
                fecha_subido = fila[4].strftime('%Y-%m-%d') if fila[4] else None
                
                documentos.append({
                    'idDocumentoRequisito': fila[0],
                    'idReserva': fila[1],
                    'idActoRequisito': fila[2],
                    'estadoCumplimiento': fila[3],
                    'f_subido': fecha_subido,
                    'aprobado': fila[5],
                    'observacion': fila[6],
                    'nombreRequisito': fila[7],
                    'descripcion': fila[8],
                    'estadoRequisito': fila[9]
                })
            
        conexion.close()
        return True, documentos
    except Exception as e:
        print(f"Error al obtener documentos de reserva: {str(e)}")
        import traceback
        traceback.print_exc()
        if conexion:
            conexion.close()
        return False, str(e)

# ============================================================
# REGISTRAR DOCUMENTO FÍSICO RECIBIDO
# ============================================================
def registrar_documento_fisico(datos):
    """
    Registra que un documento físico ha sido recibido por la secretaria.
    Si ya existe, actualiza la fecha de recepción.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            idReserva = datos.get('idReserva')
            idActoRequisito = datos.get('idActoRequisito')
            observacion = datos.get('observacion', '')
            
            # Verificar si ya existe el registro
            query_check = """
                SELECT idDocumento 
                FROM DOCUMENTO_REQUISITO 
                WHERE idReserva = %s AND idActoRequisito = %s
            """
            cursor.execute(query_check, (idReserva, idActoRequisito))
            existe = cursor.fetchone()
            
            if existe:
                # Actualizar fecha de recepción y observación
                query_update = """
                    UPDATE DOCUMENTO_REQUISITO 
                    SET f_subido = NOW(), 
                        observacion = %s,
                        estadoCumplimiento = 'PENDIENTE',
                        aprobado = 0
                    WHERE idReserva = %s AND idActoRequisito = %s
                """
                cursor.execute(query_update, (observacion, idReserva, idActoRequisito))
            else:
                # Insertar nuevo registro
                query_insert = """
                    INSERT INTO DOCUMENTO_REQUISITO 
                    (idReserva, idActoRequisito, estadoCumplimiento, f_subido, observacion, aprobado)
                    VALUES (%s, %s, 'PENDIENTE', NOW(), %s, 0)
                """
                cursor.execute(query_insert, (idReserva, idActoRequisito, observacion))
        
        conexion.commit()
        conexion.close()
        return True, "Documento registrado exitosamente"
    except Exception as e:
        print(f"Error al registrar documento físico: {str(e)}")
        import traceback
        traceback.print_exc()
        if conexion:
            conexion.rollback()
            conexion.close()
        return False, str(e)

# ============================================================
# APROBAR DOCUMENTO
# ============================================================
def aprobar_documento(datos):
    """
    Aprueba un documento registrado, actualiza la fecha de aprobación.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            idDocumentoRequisito = datos.get('idDocumentoRequisito')
            observacion = datos.get('observacion', '')
            
            query = """
                UPDATE DOCUMENTO_REQUISITO 
                SET estadoCumplimiento = 'CUMPLIDO',
                    aprobado = 1,
                    observacion = %s
                WHERE idDocumento = %s
            """
            
            cursor.execute(query, (observacion, idDocumentoRequisito))
        
        conexion.commit()
        conexion.close()
        return True, "Documento aprobado exitosamente"
    except Exception as e:
        print(f"Error al aprobar documento: {str(e)}")
        import traceback
        traceback.print_exc()
        if conexion:
            conexion.rollback()
            conexion.close()
        return False, str(e)

# ============================================================
# RECHAZAR DOCUMENTO
# ============================================================
def rechazar_documento(datos):
    """
    Rechaza un documento registrado con observaciones.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            idDocumentoRequisito = datos.get('idDocumentoRequisito')
            observacion = datos.get('observacion', 'Documento rechazado')
            
            query = """
                UPDATE DOCUMENTO_REQUISITO 
                SET estadoCumplimiento = 'NO_CUMPLIDO',
                    aprobado = 0,
                    observacion = %s
                WHERE idDocumento = %s
            """
            
            cursor.execute(query, (observacion, idDocumentoRequisito))
        
        conexion.commit()
        conexion.close()
        return True, "Documento rechazado"
    except Exception as e:
        print(f"Error al rechazar documento: {str(e)}")
        import traceback
        traceback.print_exc()
        if conexion:
            conexion.rollback()
            conexion.close()
        return False, str(e)

# ============================================================
# VERIFICAR COMPLETITUD Y ACTUALIZAR ESTADO DE RESERVA
# ============================================================
def verificar_y_actualizar_estado_reserva(idReserva):
    """
    Verifica si todos los documentos obligatorios están aprobados.
    Si es así, cambia el estado de la reserva a CONFIRMADO.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Obtener información de la reserva y el acto
            query_reserva = """
                SELECT r.estadoReserva, pa.idActo
                FROM RESERVA r
                LEFT JOIN PARTICIPANTES_ACTO pa ON r.idReserva = pa.idReserva
                WHERE r.idReserva = %s
                LIMIT 1
            """
            cursor.execute(query_reserva, (idReserva,))
            reserva_fila = cursor.fetchone()
            
            if not reserva_fila:
                return False, "Reserva no encontrada"
            
            estado_actual = reserva_fila[0]
            idActo = reserva_fila[1]
            
            if not idActo:
                return False, "No se encontró el acto asociado a la reserva"
            
            # Obtener total de requisitos del acto
            query_requisitos = """
                SELECT COUNT(*) as totalRequisitos
                FROM ACTO_REQUISITO ar
                WHERE ar.idActo = %s
            """
            cursor.execute(query_requisitos, (idActo,))
            total_requisitos = cursor.fetchone()[0]
            
            # Obtener documentos aprobados
            query_aprobados = """
                SELECT COUNT(*) as totalAprobados
                FROM DOCUMENTO_REQUISITO dr
                WHERE dr.idReserva = %s 
                    AND dr.estadoCumplimiento = 'CUMPLIDO'
                    AND dr.aprobado = 1
            """
            cursor.execute(query_aprobados, (idReserva,))
            total_aprobados = cursor.fetchone()[0]
            
            # Verificar si hay documentos rechazados
            query_rechazados = """
                SELECT COUNT(*) as totalRechazados
                FROM DOCUMENTO_REQUISITO dr
                WHERE dr.idReserva = %s 
                    AND dr.estadoCumplimiento = 'NO_CUMPLIDO'
            """
            cursor.execute(query_rechazados, (idReserva,))
            total_rechazados = cursor.fetchone()[0]
            
            nuevo_estado = None
            
            # Si hay documentos rechazados, marcar reserva como RECHAZADO
            if total_rechazados > 0:
                nuevo_estado = 'RECHAZADO'
            # Si todos los documentos están aprobados
            elif total_aprobados == total_requisitos and total_requisitos > 0:
                nuevo_estado = 'CONFIRMADO'
            # Si aún faltan documentos por aprobar
            elif total_aprobados < total_requisitos:
                nuevo_estado = 'PENDIENTE_DOCUMENTO'
            
            # Actualizar estado de reserva si hay cambio
            if nuevo_estado and nuevo_estado != estado_actual:
                query_update = """
                    UPDATE RESERVA 
                    SET estadoReserva = %s
                    WHERE idReserva = %s
                """
                cursor.execute(query_update, (nuevo_estado, idReserva))
                conexion.commit()
        
        conexion.close()
        return True, {
            'estadoActualizado': nuevo_estado,
            'totalRequisitos': total_requisitos,
            'totalAprobados': total_aprobados,
            'totalRechazados': total_rechazados
        }
    except Exception as e:
        print(f"Error al verificar estado de reserva: {str(e)}")
        import traceback
        traceback.print_exc()
        if conexion:
            conexion.rollback()
            conexion.close()
        return False, str(e)

# ============================================================
# APROBAR TODOS LOS DOCUMENTOS DE UNA RESERVA
# ============================================================
def aprobar_todos_documentos(idReserva, observacion_general=''):
    """
    Aprueba todos los documentos pendientes de una reserva.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            query = """
                UPDATE DOCUMENTO_REQUISITO 
                SET estadoCumplimiento = 'CUMPLIDO',
                    aprobado = 1,
                    observacion = CONCAT(COALESCE(observacion, ''), ' ', %s)
                WHERE idReserva = %s 
                    AND estadoCumplimiento = 'PENDIENTE'
            """
            
            cursor.execute(query, (observacion_general, idReserva))
        
        conexion.commit()
        conexion.close()
        
        # Verificar y actualizar estado de reserva
        return verificar_y_actualizar_estado_reserva(idReserva)
    except Exception as e:
        print(f"Error al aprobar todos los documentos: {str(e)}")
        import traceback
        traceback.print_exc()
        if conexion:
            conexion.rollback()
            conexion.close()
        return False, str(e)
