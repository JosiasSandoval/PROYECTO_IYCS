from app.bd_sistema import obtener_conexion
from datetime import date


# =========================================================
# OBTENER REQUISITOS DE UN ACTO
# =========================================================
def obtener_requisito_acto(idActo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Selecciona los requisitos activos asociados a un acto
            cursor.execute("""
                SELECT re.idRequisito, ar.idActoRequisito, re.nombRequisito, re.descripcion
                FROM acto_requisito ar
                INNER JOIN requisito re ON ar.idRequisito = re.idRequisito
                WHERE ar.idActo = %s AND re.estadoRequisito = TRUE;
            """, (idActo,))
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    'id': fila[0],
                    'idActoRequisito': fila[1],
                    'nombRequisito': fila[2],
                    'descripcion': fila[3] or ''
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener los requisitos del acto: {e}')
        return []
    finally:
        if conexion:
            conexion.close()


# =========================================================
# REGISTRAR DOCUMENTO EN BASE DE DATOS
# =========================================================
def registrar_documento_db(idActoRequisito, idReserva, rutaArchivo, tipoArchivo, f_subido,
                           estadoCumplimiento, observacion, vigencia, aprobado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO DOCUMENTO_REQUISITO (
                    rutaArchivo, tipoArchivo, f_subido, estadoCumplimiento,
                    aprobado, observacion, vigenciaDocumento, idReserva, idActoRequisito
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                rutaArchivo, tipoArchivo, f_subido, estadoCumplimiento,
                aprobado, observacion, vigencia, idReserva, idActoRequisito
            ))

            conexion.commit()

        return {'ok': True, 'mensaje': 'Documento registrado correctamente'}

    except Exception as e:
        print(f'Error al registrar el documento: {e}')
        return {'ok': False, 'mensaje': f'Error: {e}'}

    finally:
        if conexion:
            conexion.close()

def modificar_documento_requisito(idDocumento, rutaArchivo, tipoArchivo, f_subido):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:

            cursor.execute("""
                UPDATE DOCUMENTO_REQUISITO
                SET rutaArchivo = COALESCE(%s, rutaArchivo),
                    tipoArchivo = COALESCE(%s, tipoArchivo),
                    f_subido = COALESCE(%s, f_subido)
                WHERE idDocumento = %s
            """, (rutaArchivo, tipoArchivo, f_subido, idDocumento))

            conexion.commit()

        return {'ok': True, 'mensaje': 'Documento modificado correctamente'}

    except Exception as e:
        print(f'Error al modificar el documento: {e}')
        return {'ok': False, 'mensaje': f'Error: {e}'}

    finally:
        if conexion:
            conexion.close()

# =========================================================
# CAMBIAR CUMPLIMIENTO DOCUMENTO
# =========================================================
def cambiar_cumplimiento_documento(idDocumento, estadoCumplimiento):
    conexion = obtener_conexion()
    try:
        # Actualizar directamente al estado proporcionado
        nuevo_estado = estadoCumplimiento.upper() if estadoCumplimiento else 'NO_CUMPLIDO'
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE DOCUMENTO_REQUISITO
                SET estadoCumplimiento=%s
                WHERE idDocumento=%s;
            """, (nuevo_estado, idDocumento))
            conexion.commit()
            return {'ok': True, 'mensaje': f'Estado actualizado a {nuevo_estado}'}
    except Exception as e:
        print(f'Error al cambiar el cumplimiento del documento: {e}')
        conexion.rollback()
        return {'ok': False, 'mensaje': f'Error: {e}'}
    finally:
        if conexion:
            conexion.close()


def aprobar_documentos_reserva_parcial(idReserva):
    """
    Aprueba solo los documentos que cumplen y deja los demás pendientes.
    Cambia estado de reserva solo si todos los documentos están aprobados.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Obtener documentos de la reserva
            cursor.execute("""
                SELECT idDocumento, estadoCumplimiento, aprobado
                FROM DOCUMENTO_REQUISITO 
                WHERE idReserva = %s
            """, (idReserva,))
            documentos = cursor.fetchall()

            if not documentos:
                return {"ok": False, "mensaje": "No hay documentos para esta reserva"}

            aprobados = []
            for doc in documentos:
                idDoc, estadoCumplimiento, aprobado = doc
                if estadoCumplimiento == "CUMPLIDO" and not aprobado:
                    # Aprobar solo los que cumplen y no están aprobados
                    cursor.execute("""
                        UPDATE DOCUMENTO_REQUISITO
                        SET aprobado = TRUE
                        WHERE idDocumento = %s
                    """, (idDoc,))
                    aprobados.append(idDoc)

            # Verificar si todos los documentos están aprobados
            cursor.execute("""
                SELECT COUNT(*) 
                FROM DOCUMENTO_REQUISITO 
                WHERE idReserva = %s AND aprobado = FALSE
            """, (idReserva,))
            pendientes = cursor.fetchone()[0]

            if pendientes == 0:
                # Todos aprobados → cambiar estado de la reserva
                cursor.execute("""
                    UPDATE RESERVA 
                    SET estadoReserva = 'PENDIENTE_PAGO' 
                    WHERE idReserva = %s
                """, (idReserva,))
                mensaje = "Todos los documentos aprobados. Reserva actualizada a PENDIENTE_PAGO."
            else:
                mensaje = f"{len(aprobados)} documentos aprobados. Reserva sigue en PENDIENTE_DOCUMENTO."

        conexion.commit()
        return {"ok": True, "mensaje": mensaje, "aprobados": aprobados}

    except Exception as e:
        return {"ok": False, "error": str(e)}

    finally:
        if conexion:
            conexion.close()


def aprobar_documento_individual(idDocumentoRequisito):
    """
    Aprueba un documento individual y verifica si todos los documentos están aprobados.
    Si todos están aprobados, actualiza el estado de la reserva a PENDIENTE_PAGO.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Obtener idReserva del documento
            cursor.execute("""
                SELECT idReserva, estadoCumplimiento, aprobado
                FROM DOCUMENTO_REQUISITO
                WHERE idDocumento = %s
            """, (idDocumentoRequisito,))
            doc = cursor.fetchone()
            
            if not doc:
                return {"ok": False, "mensaje": "Documento no encontrado"}
            
            idReserva = doc[0]
            estadoCumplimiento = doc[1]
            ya_aprobado = doc[2]
            
            # Solo aprobar si no está ya aprobado
            if not ya_aprobado:
                # Actualizar documento a CUMPLIDO y aprobado
                cursor.execute("""
                    UPDATE DOCUMENTO_REQUISITO
                    SET estadoCumplimiento = 'CUMPLIDO',
                        aprobado = TRUE
                    WHERE idDocumento = %s
                """, (idDocumentoRequisito,))
            else:
                return {"ok": True, "mensaje": "Documento ya estaba aprobado", "estadoReserva": None}
            
            # Obtener el idActo de la reserva para verificar todos los requisitos
            cursor.execute("""
                SELECT pa.idActo
                FROM participantes_acto pa
                WHERE pa.idReserva = %s
                LIMIT 1
            """, (idReserva,))
            acto_result = cursor.fetchone()
            
            if not acto_result:
                return {"ok": False, "mensaje": "No se encontró el acto asociado a la reserva"}
            
            idActo = acto_result[0]
            
            # Obtener el total de requisitos del acto
            cursor.execute("""
                SELECT COUNT(*)
                FROM acto_requisito
                WHERE idActo = %s
            """, (idActo,))
            total_requisitos = cursor.fetchone()[0]
            
            # Verificar documentos aprobados para esta reserva (DESPUÉS de actualizar)
            cursor.execute("""
                SELECT COUNT(*) 
                FROM DOCUMENTO_REQUISITO 
                WHERE idReserva = %s AND aprobado = TRUE
            """, (idReserva,))
            documentos_aprobados = cursor.fetchone()[0]
            
            estadoReserva = None
            # Si todos los requisitos tienen documentos aprobados
            # IMPORTANTE: documentos_aprobados ya incluye el que acabamos de aprobar
            if total_requisitos > 0 and documentos_aprobados >= total_requisitos:
                # Todos aprobados → cambiar estado de la reserva a PENDIENTE_PAGO
                cursor.execute("""
                    UPDATE RESERVA
                    SET estadoReserva = 'PENDIENTE_PAGO'
                    WHERE idReserva = %s
                """, (idReserva,))
                estadoReserva = 'PENDIENTE_PAGO'
                mensaje = "Documento aprobado. ¡Todos los documentos han sido aprobados! La reserva ha sido actualizada a PENDIENTE_PAGO."
            else:
                pendientes = max(0, total_requisitos - documentos_aprobados)
                mensaje = f"Documento aprobado. Quedan {pendientes} documento(s) pendiente(s)."
            
            print(f"📊 Debug aprobación: total_requisitos={total_requisitos}, documentos_aprobados={documentos_aprobados}, pendientes={max(0, total_requisitos - documentos_aprobados) if total_requisitos > 0 else 0}")
            
            conexion.commit()
            return {
                "ok": True, 
                "mensaje": mensaje,
                "estadoReserva": estadoReserva
            }

    except Exception as e:
        conexion.rollback()
        return {"ok": False, "error": str(e)}
    finally:
        if conexion:
            conexion.close()


def rechazar_documento(idDocumento, idReserva, observacion=""):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Rechazar el documento individual
            cursor.execute("""
                UPDATE DOCUMENTO_REQUISITO
                SET aprobado = FALSE,
                    estadoCumplimiento = 'NO_CUMPLIDO',
                    observacion = %s
                WHERE idDocumento = %s
            """, (observacion, idDocumento))

            # Verificar documentos restantes
            cursor.execute("""
                SELECT COUNT(*) 
                FROM DOCUMENTO_REQUISITO 
                WHERE idReserva = %s AND aprobado = FALSE
            """, (idReserva,))
            pendientes = cursor.fetchone()[0]

            if pendientes == 0:
                # Todos aprobados → actualizar reserva
                cursor.execute("""
                    UPDATE RESERVA
                    SET estadoReserva = 'PENDIENTE_PAGO'
                    WHERE idReserva = %s
                """, (idReserva,))
                mensaje = f"Documento {idDocumento} rechazado. Todos los documentos aprobados. Reserva actualizada a PENDIENTE_PAGO."
            else:
                # Aún hay documentos pendientes
                cursor.execute("""
                    UPDATE RESERVA
                    SET estadoReserva = 'PENDIENTE_DOCUMENTO'
                    WHERE idReserva = %s
                """, (idReserva,))
                mensaje = f"Documento {idDocumento} rechazado. Reserva sigue en PENDIENTE_DOCUMENTO."

        conexion.commit()
        return {"ok": True, "mensaje": mensaje}

    except Exception as e:
        return {"ok": False, "error": str(e)}
    finally:
        if conexion:
            conexion.close()


# =========================================================
# OBTENER DOCUMENTOS FALTANTES
# (Requisitos no cumplidos para una reserva en PENDIENTE_DOCUMENTO)
# =========================================================
def obtener_documento_faltante(idReserva):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT re.idReserva, re.estadoReserva, rq.nombRequisito, ar.idActoRequisito, dr.idDocumento
                FROM reserva re 
                INNER JOIN DOCUMENTO_REQUISITO dr ON re.idReserva = dr.idReserva
                INNER JOIN acto_requisito ar ON dr.idActoRequisito = ar.idActoRequisito
                INNER JOIN requisito rq ON ar.idRequisito = rq.idRequisito
                WHERE re.estadoReserva='PENDIENTE_DOCUMENTO' AND re.idReserva=%s AND dr.estadoCumplimiento='NO_CUMPLIDO'
            """, (idReserva,))
            filas = cursor.fetchall()

            resultados = []
            for fila in filas:
                resultados.append({
                    'idReserva': fila[0],
                    'estadoReserva': fila[1],
                    'nombRequisito': fila[2],
                    'idActoRequisito': fila[3],
                    'idDocumento': fila[4]
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener los documentos faltantes: {e}')
        return []
    finally:
        if conexion:
            conexion.close()


# =========================================================
# OBTENER DOCUMENTO (Metadata + contenido binario)
# La clave 'archivo_binario' se utiliza en la ruta para la descarga.
# =========================================================
def archivo_documento(idDocumento):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT rutaArchivo, tipoArchivo
                FROM DOCUMENTO_REQUISITO
                WHERE idDocumento=%s
            """, (idDocumento,))
            fila = cursor.fetchone()

            if fila:
                return {
                    'rutaArchivo': fila[0],
                    'tipoArchivo': fila[1]
                }

            return None

    except Exception as e:
        print(f'Error al obtener archivo: {e}')
        return None
    finally:
        if conexion:
            conexion.close()


# =========================================================
# OBTENER DOCUMENTOS DE UNA RESERVA (pendientes de revisión)
# =========================================================
def obtener_documentos_reserva(idReserva):
    conexion = obtener_conexion()
    try:
        documentos = []
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT dr.idDocumento, rq.nombRequisito, dr.rutaArchivo, dr.tipoArchivo, dr.f_subido, dr.observacion,
                       dr.estadoCumplimiento, dr.aprobado, dr.idActoRequisito
                FROM DOCUMENTO_REQUISITO dr
                INNER JOIN reserva re ON dr.idReserva=re.idReserva
                INNER JOIN acto_requisito ar ON dr.idActoRequisito=ar.idActoRequisito
                INNER JOIN requisito rq ON ar.idRequisito=rq.idRequisito
                WHERE re.idReserva=%s 
                  AND (re.estadoReserva='PENDIENTE_REVISION' OR re.estadoReserva='PENDIENTE_DOCUMENTO')
            """, (idReserva,))
            filas = cursor.fetchall()
            for fila in filas:
                documentos.append({
                    'idDocumento': fila[0],
                    'idDocumentoRequisito': fila[0],  # Alias para compatibilidad con frontend
                    'nombRequisito': fila[1],
                    'rutaArchivo': fila[2],
                    'tipoArchivo': fila[3],
                    'f_subido': fila[4],
                    'observacion': fila[5],
                    'estadoCumplimiento': fila[6] if len(fila) > 6 else None,
                    'aprobado': fila[7] if len(fila) > 7 else False,
                    'idActoRequisito': fila[8] if len(fila) > 8 else None
                })
        return documentos
    except Exception as e:
        print(f'Error al obtener los documentos de la reserva: {e}')
        return []
    finally:
        if conexion:
            conexion.close()

# OBTENER TODOS LOS DOCUMENTOS DE UNA RESERVA (sin filtrar por estado)
# =========================================================
def listar_todos_documentos_reserva(idReserva):
    conexion = obtener_conexion()
    try:
        documentos = []
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT dr.idDocumento, rq.nombRequisito, dr.rutaArchivo, dr.tipoArchivo, dr.f_subido, dr.observacion,
                       dr.estadoCumplimiento, dr.aprobado, dr.idActoRequisito
                FROM DOCUMENTO_REQUISITO dr
                INNER JOIN reserva re ON dr.idReserva=re.idReserva
                INNER JOIN acto_requisito ar ON dr.idActoRequisito=ar.idActoRequisito
                INNER JOIN requisito rq ON ar.idRequisito=rq.idRequisito
                WHERE re.idReserva=%s
                ORDER BY dr.f_subido DESC
            """, (idReserva,))
            filas = cursor.fetchall()
            for fila in filas:
                documentos.append({
                    'idDocumento': fila[0],
                    'idDocumentoRequisito': fila[0],  # Alias para compatibilidad con frontend
                    'nombRequisito': fila[1],
                    'rutaArchivo': fila[2],
                    'tipoArchivo': fila[3],
                    'f_subido': fila[4],
                    'observacion': fila[5],
                    'estadoCumplimiento': fila[6] if len(fila) > 6 else None,
                    'aprobado': fila[7] if len(fila) > 7 else False,
                    'idActoRequisito': fila[8] if len(fila) > 8 else None
                })
        return documentos
    except Exception as e:
        print(f'Error al listar los documentos de la reserva: {e}')
        return []
    finally:
        if conexion:
            conexion.close()

# =========================================================
# OBTENER TODOS LOS REQUISITOS
# =========================================================
def get_requisitos():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # AGREGADO: f_requisito al SELECT para mostrarlo en la tabla
            cursor.execute("""
                SELECT idRequisito, nombRequisito, descripcion, estadoRequisito, DATE_FORMAT(f_requisito, '%Y-%m-%d')
                FROM requisito
                ORDER BY nombRequisito ASC
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    'idRequisito': fila[0],
                    'nombRequisito': fila[1],
                    'descripcion': fila[2] if fila[2] else "",
                    'estadoRequisito': bool(fila[3]),
                    'f_requisito': fila[4] # Campo agregado
                })
            return resultados
    except Exception as e:
        print(f'Error al cargar los requisitos: {e}')
        return []
    finally:
        if conexion: conexion.close()

# AGREGADO: Parámetro f_requisito opcional
def registrar_requisito(nombRequisito, descripcion, f_requisito=None):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Si viene fecha la usamos, si no, CURRENT_DATE
            sql = "INSERT INTO requisito (nombRequisito, f_requisito, descripcion, estadoRequisito) VALUES (%s, %s, %s, TRUE)"
            val = (nombRequisito, f_requisito if f_requisito else 'CURDATE()', descripcion)
            
            if not f_requisito: # Si no hay fecha, insertamos directo con la función SQL
                 cursor.execute("INSERT INTO requisito (nombRequisito, f_requisito, descripcion, estadoRequisito) VALUES (%s, CURDATE(), %s, TRUE)", (nombRequisito, descripcion))
            else:
                 cursor.execute(sql, val)
            
            conexion.commit()
            return {'ok': True, 'mensaje': 'Requisito registrado'}
    except Exception as e:
        print(f'Error al registrar: {e}')
        return {'ok': False, 'mensaje': f'Error: {e}'}
    finally:
        if conexion: conexion.close()

# AGREGADO: Parámetro f_requisito
def modificar_requisito(idRequisito, nombRequisito, descripcion, f_requisito):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE requisito 
                SET nombRequisito=%s, descripcion=%s, f_requisito=%s
                WHERE idRequisito=%s
            """, (nombRequisito, descripcion, f_requisito, idRequisito))
            conexion.commit()
            return {'ok': True, 'mensaje': 'Requisito actualizado'}
    except Exception as e:
        print(f'Error al modificar: {e}')
        return {'ok': False, 'mensaje': f'Error: {e}'}
    finally:
        if conexion: conexion.close()

# =========================================================
# MODIFICAR REQUISITO
# =========================================================
def modificar_requisito(idRequisito, nombRequisito, descripcion):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE requisito 
                SET nombRequisito=%s, descripcion=%s
                WHERE idRequisito=%s
            """, (nombRequisito, descripcion, idRequisito))
            conexion.commit()
            return {'ok': True}
    except Exception as e:
        print(f'Error al modificar el requisito: {e}')
        return {'ok': False, 'mensaje': f'Error: {e}'}
    finally:
        if conexion:
            conexion.close()


# =========================================================
# CAMBIAR ESTADO
# =========================================================
def cambiar_estado_requisito(idRequisito):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT estadoRequisito FROM requisito WHERE idRequisito=%s", (idRequisito,))
            estadoActual = cursor.fetchone()[0]
            nuevo_estado = not estadoActual

            cursor.execute("""
                UPDATE requisito 
                SET estadoRequisito=%s
                WHERE idRequisito=%s
            """, (nuevo_estado, idRequisito))

            conexion.commit()
            return {'ok': True}
    except Exception as e:
        print(f'Error al cambiar el estado del requisito: {e}')
        return {'ok': False, 'mensaje': f'Error: {e}'}
    finally:
        if conexion:
            conexion.close()


# =========================================================
# ELIMINAR REQUISITO
# =========================================================
def eliminar_requisito(idRequisito):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                DELETE FROM requisito
                WHERE idRequisito=%s
            """, (idRequisito,))
            conexion.commit()
            return {'ok': True}
    except Exception as e:
        # Se asume que un error en DELETE por FK es capturado en la ruta con verificar_relacion_requisito
        print(f'Error al eliminar el requisito: {e}')
        return {'ok': False, 'mensaje': f'Error: {e}'}
    finally:
        if conexion:
            conexion.close()


# =========================================================
# VERIFICAR RELACIÓN (Antes de eliminar)
# =========================================================
def verificar_relacion_requisito(idRequisito):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM acto_requisito 
                WHERE idRequisito = %s
            """, (idRequisito,))
            result = cursor.fetchone()
            # Retorna True si hay al menos una relación
            return result and result[0] > 0
    except Exception as e:
        print(f'Error al verificar la relación del requisito: {e}')
        return False
    finally:
        if conexion:
            conexion.close()