from app.bd_sistema import obtener_conexion

def listar_documentos(idUsuario, rol):
    conexion = obtener_conexion()
    resultados = []
    rol_seguro = str(rol).strip().lower()

    try:
        with conexion.cursor() as cursor:
            # Consulta base: Documento -> Reserva -> Feligres, Reserva -> Parroquia, Doc -> ActoReq -> Requisito
            sql = """
                SELECT 
                    d.idDocumento,
                    CONCAT(f.nombFel, ' ', f.apePatFel) AS solicitante,
                    r.nombRequisito,
                    d.estadoCumplimiento,
                    d.aprobado,
                    d.observacion,
                    DATE_FORMAT(d.vigenciaDocumento, '%%Y-%%m-%%d'),
                    d.idReserva,
                    d.idActoRequisito,
                    p.nombParroquia
                FROM DOCUMENTO_REQUISITO d
                INNER JOIN RESERVA res ON d.idReserva = res.idReserva
                INNER JOIN FELIGRES f ON res.idSolicitante = f.idFeligres
                INNER JOIN PARROQUIA p ON res.idParroquia = p.idParroquia
                INNER JOIN ACTO_REQUISITO ar ON d.idActoRequisito = ar.idActoRequisito
                INNER JOIN REQUISITO r ON ar.idRequisito = r.idRequisito
            """

            if rol_seguro == 'administrador':
                cursor.execute(sql + " ORDER BY res.f_reserva DESC")
            
            elif rol_seguro in ['sacerdote', 'secretaria']:
                # Filtro: Solo documentos de reservas asociadas a la parroquia del usuario
                sql += """
                    INNER JOIN PARROQUIA_PERSONAL pp ON res.idParroquia = pp.idParroquia
                    INNER JOIN PERSONAL per ON pp.idPersonal = per.idPersonal
                    WHERE per.idUsuario = %s 
                    AND pp.vigenciaParrPers = 1
                    ORDER BY res.f_reserva DESC
                """
                cursor.execute(sql, (idUsuario,))
            else:
                return []

            filas = cursor.fetchall()
            for fila in filas:
                resultados.append({
                    'id': fila[0],
                    'solicitante': fila[1],
                    'requisito': fila[2],
                    'estadoCumplimiento': fila[3],
                    'aprobado': bool(fila[4]),
                    'observacion': fila[5] if fila[5] else "---",
                    'vigencia': fila[6] if fila[6] else "",
                    'idReserva': fila[7],
                    'idActoRequisito': fila[8],
                    'parroquia': fila[9]
                })
        return resultados
    except Exception as e:
        print(f"Error listar documentos: {e}")
        return []
    finally:
        if conexion: conexion.close()

def agregar_documento(idReserva, idActoReq, estado, observacion, vigencia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Por defecto aprobado=FALSE al crear
            cursor.execute("""
                INSERT INTO DOCUMENTO_REQUISITO (idReserva, idActoRequisito, estadoCumplimiento, observacion, vigenciaDocumento, aprobado, f_subido)
                VALUES (%s, %s, %s, %s, %s, FALSE, CURDATE())
            """, (idReserva, idActoReq, estado, observacion, vigencia if vigencia else None))
        conexion.commit()
        return True, "Documento registrado"
    except Exception as e:
        return False, str(e)
    finally:
        if conexion: conexion.close()

def actualizar_documento(idDoc, idReserva, idActoReq, estado, observacion, vigencia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE DOCUMENTO_REQUISITO 
                SET idReserva=%s, idActoRequisito=%s, estadoCumplimiento=%s, observacion=%s, vigenciaDocumento=%s
                WHERE idDocumento=%s
            """, (idReserva, idActoReq, estado, observacion, vigencia if vigencia else None, idDoc))
        conexion.commit()
        return True, "Documento actualizado"
    except Exception as e:
        return False, str(e)
    finally:
        if conexion: conexion.close()

def cambiar_aprobacion_documento(idDoc, nuevo_estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Si se aprueba, sugerimos cambiar estado a "Aprobado" también, pero aquí solo tocamos el boolean
            cursor.execute("UPDATE DOCUMENTO_REQUISITO SET aprobado=%s WHERE idDocumento=%s", (nuevo_estado, idDoc))
        conexion.commit()
        return True, "Estado de aprobación actualizado"
    except Exception as e:
        return False, str(e)
    finally:
        if conexion: conexion.close()

def eliminar_documento(idDoc):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM DOCUMENTO_REQUISITO WHERE idDocumento=%s", (idDoc,))
        conexion.commit()
        return True, "Documento eliminado"
    except Exception as e:
        return False, str(e)
    finally:
        if conexion: conexion.close()

def obtener_combos_doc(idUsuario, rol):
    conexion = obtener_conexion()
    data = {'reservas': [], 'requisitos': []}
    rol_seguro = str(rol).strip().lower()
    try:
        with conexion.cursor() as cursor:
            # 1. Cargar Reservas (ID - Solicitante - Fecha)
            sql_res = """
                SELECT res.idReserva, CONCAT(f.nombFel, ' ', f.apePatFel, ' (', res.f_reserva, ')') 
                FROM RESERVA res
                INNER JOIN FELIGRES f ON res.idSolicitante = f.idFeligres
            """
            
            if rol_seguro != 'administrador':
                sql_res += """
                    INNER JOIN PARROQUIA_PERSONAL pp ON res.idParroquia = pp.idParroquia
                    INNER JOIN PERSONAL per ON pp.idPersonal = per.idPersonal
                    WHERE per.idUsuario = %s AND pp.vigenciaParrPers = 1 AND res.estadoReserva != 'CANCELADA'
                """
                cursor.execute(sql_res, (idUsuario,))
            else:
                sql_res += " WHERE res.estadoReserva != 'CANCELADA'"
                cursor.execute(sql_res)
            
            data['reservas'] = [{'id': f[0], 'texto': f[1]} for f in cursor.fetchall()]

            # 2. Cargar Requisitos (ID ActoReq - Nombre Requisito - Nombre Acto)
            # Esto lista TODOS los requisitos posibles de los actos activos
            cursor.execute("""
                SELECT ar.idActoRequisito, CONCAT(al.nombActo, ' - ', r.nombRequisito)
                FROM ACTO_REQUISITO ar
                INNER JOIN REQUISITO r ON ar.idRequisito = r.idRequisito
                INNER JOIN ACTO_LITURGICO al ON ar.idActo = al.idActo
                WHERE al.estadoActo = 1 AND r.estadoRequisito = 1
                ORDER BY al.nombActo
            """)
            data['requisitos'] = [{'id': f[0], 'texto': f[1]} for f in cursor.fetchall()]

        return data
    except Exception as e:
        print(e)
        return data
    finally:
        if conexion: conexion.close()