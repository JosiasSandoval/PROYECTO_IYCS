from app.bd_sistema import obtener_conexion
from datetime import date, datetime, timedelta

def agregar_reserva(fecha, hora, mencion, estado, idUsuario, idSolicitante, idParroquia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Insertar reserva
            cursor.execute("""
                INSERT INTO reserva (
                    f_reserva, h_reserva, mencion, estadoReserva, numReprogramaciones, 
                    estadoReprogramado, vigenciaReserva, idUsuario, idSolicitante, idParroquia
                )
                VALUES (%s, %s, %s, %s, 0, FALSE, CURRENT_DATE, %s, %s, %s);
            """, (fecha, hora, mencion, estado, idUsuario, idSolicitante, idParroquia))
            
            id_reserva = cursor.lastrowid
            conexion.commit()
            
            return True, id_reserva 
            
    except Exception as e:
        return False, str(e)
    finally:
        if conexion:
            conexion.close()

def reprogramar_reserva(idReserva, fecha, hora, observaciones):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # 1. Obtener número actual de reprogramaciones
            cursor.execute("SELECT numReprogramaciones FROM reserva WHERE idReserva=%s", (idReserva,))
            fila = cursor.fetchone()
            
            if not fila:
                return False, "Reserva no encontrada"

            numReprogramacion = fila[0] + 1
            
            # 2. Actualizar (CORREGIDO: f_reserva y h_reserva en lugar de fecha/hora)
            # Nota: 'observaciones' se guarda en 'mencion' según tu esquema, o necesitas un campo nuevo.
            # Asumiremos que va a 'mencion' por ahora.
            cursor.execute("""
                UPDATE reserva 
                SET f_reserva=%s, h_reserva=%s, numReprogramaciones=%s, estadoReprogramado=TRUE, mencion=%s 
                WHERE idReserva=%s
            """, (fecha, hora, numReprogramacion, observaciones, idReserva))
            
        conexion.commit()
        return True, "Reserva reprogramada exitosamente"
    except Exception as e:
        print(f"Error al reprogramar: {e}")
        return False, str(e)
    finally:
        if conexion:
            conexion.close()

def cambiar_estado_reserva(idReserva, accion='continuar'):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT estadoReserva FROM reserva WHERE idReserva = %s", (idReserva,))
            resultado = cursor.fetchone()

            if result is None:
                return False, 'Reserva no encontrada'

            estado_actual = resultado[0]
            nuevo_estado = estado_actual

            # Lógica de estados
            if accion == 'cancelar':
                nuevo_estado = 'CANCELADO'
            elif estado_actual == 'PENDIENTE_DOCUMENTO':
                nuevo_estado = 'PENDIENTE_REVISION'
            elif estado_actual == 'PENDIENTE_REVISION':
                nuevo_estado = 'PENDIENTE_PAGO'
            elif estado_actual == 'PENDIENTE_PAGO':
                nuevo_estado = 'CONFIRMADO'
            elif estado_actual == 'CONFIRMADO':
                nuevo_estado = 'ATENDIDO'               
            
            # Solo actualizamos si hubo cambio
            if nuevo_estado != estado_actual:
                cursor.execute(
                    "UPDATE reserva SET estadoReserva = %s WHERE idReserva = %s",
                    (nuevo_estado, idReserva)
                )
                conexion.commit()

        # CORREGIDO: Retornamos tupla (Exito, Datos) para mantener consistencia con route
        return True, nuevo_estado

    except Exception as e:
        print(f'Error al cambiar estado: {e}')
        return False, str(e)

    finally:
        if conexion:
            conexion.close()

def eliminar_reserva(idReserva):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM reserva WHERE idReserva = %s", (idReserva,))
        conexion.commit()
        return True, "Reserva eliminada exitosamente"
    except Exception as e:
        print(f"Error al eliminar: {e}")
        return False, str(e)
    finally:
        if conexion:
            conexion.close()

def get_reservas_sacerdote(nombre): 
    conexion = obtener_conexion()
    try:
        resultados = []
        with conexion.cursor() as cursor:
            # Query corregida y mantenida
            cursor.execute("""
            SELECT 
                r.idReserva,
                al.nombActo,
                r.f_reserva,
                r.h_reserva,
                r.mencion,
                CONCAT(f.nombFel,' ',f.apePatFel,' ',f.apeMatFel) AS nombreFeligres,
                f.telefonoFel,
                f.direccionFel,
                pr.nombParroquia,
                COALESCE(GROUP_CONCAT(
                    CASE 
                        WHEN pa.rolParticipante NOT LIKE '%sacerdote%' 
                        THEN CONCAT(pa.rolParticipante, ': ', pa.nombParticipante)
                    END SEPARATOR '; '
                ), '') AS participantes
            FROM RESERVA r
            INNER JOIN FELIGRES f ON f.idFeligres = r.idSolicitante
            INNER JOIN PARROQUIA pr ON r.idParroquia = pr.idParroquia
            LEFT JOIN PARTICIPANTES_ACTO pa ON pa.idReserva = r.idReserva
            INNER JOIN ACTO_LITURGICO al ON al.idActo = pa.idActo
            INNER JOIN USUARIO us ON f.idUsuario = us.idUsuario
            INNER JOIN ROL_USUARIO rs ON us.idUsuario = rs.idUsuario
            INNER JOIN ROL ro ON rs.idRol = ro.idRol
            WHERE EXISTS (
                SELECT 1 
                FROM PARTICIPANTES_ACTO pa_s 
                WHERE pa_s.idReserva = r.idReserva
                  AND pa_s.rolParticipante LIKE '%Sacerdote%'
                  AND pa_s.nombParticipante LIKE %s
            )
            GROUP BY r.idReserva, al.nombActo;
            """, (f"%{nombre}%",))

            datos_bd = cursor.fetchall()
            for filas in datos_bd:
                # Conversión segura de fecha/hora a string si es necesario
                fecha_str = filas[2].isoformat() if isinstance(filas[2], (date, datetime)) else filas[2]
                hora_str = str(filas[3]) if isinstance(filas[3], timedelta) else str(filas[3])

                resultados.append({
                    'idReserva': filas[0],
                    'nombreActo': filas[1],
                    'fecha': fecha_str,
                    'hora': hora_str,
                    'mencion': filas[4],
                    'nombreFeligres': filas[5],
                    'telefonoFeligres': filas[6],
                    'direccionFeligres': filas[7],
                    'nombreParroquia': filas[8],
                    'participantes': filas[9]
                })
        return resultados   
    except Exception as e:
        print(f"Error al obtener las reservas: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

def get_reservas_id_usuario(idUsuario, rol, idParroquia=None):
    conexion = obtener_conexion()
    try:
        resultados = []
        with conexion.cursor() as cursor:
            # Query dinámica basada en rol (Mantenemos tu lógica original)
            if "Secretaria" in rol:
                query = """
                    SELECT 
                        r.idReserva, al.nombActo, al.idActo, r.f_reserva, r.h_reserva, 
                        r.estadoReserva, r.mencion, 
                        CONCAT(f.nombFel,' ',f.apePatFel,' ',f.apeMatFel) AS nombreFeligres,
                        pr.nombParroquia,
                        GROUP_CONCAT(CONCAT(pa.rolParticipante, ': ', pa.nombParticipante) SEPARATOR '; ') AS participantes,
                        al.costoBase
                    FROM RESERVA r
                    INNER JOIN FELIGRES f ON f.idFeligres = r.idSolicitante
                    INNER JOIN PARROQUIA pr ON r.idParroquia = pr.idParroquia
                    LEFT JOIN PARTICIPANTES_ACTO pa ON pa.idReserva = r.idReserva
                    INNER JOIN ACTO_LITURGICO al ON al.idActo = pa.idActo
                    INNER JOIN USUARIO us ON f.idUsuario = us.idUsuario
                    INNER JOIN ROL_USUARIO rs ON us.idUsuario = rs.idUsuario
                    INNER JOIN ROL ro ON rs.idRol = ro.idRol
                    WHERE ro.nombRol LIKE %s AND r.idUsuario = %s AND r.idParroquia = %s
                    GROUP BY r.idReserva
                    ORDER BY r.f_reserva ASC, r.h_reserva ASC;
                """
                cursor.execute(query, (f"%{rol}%", idUsuario, idParroquia))
            else:
                # Feligrés
                query = """
                    SELECT 
                        r.idReserva, al.nombActo, al.idActo, r.f_reserva, r.h_reserva, 
                        r.mencion, r.estadoReserva,
                        CONCAT(f.nombFel,' ',f.apePatFel,' ',f.apeMatFel) AS nombreFeligres,
                        pr.nombParroquia,
                        GROUP_CONCAT(CONCAT(pa.rolParticipante, ': ', pa.nombParticipante) SEPARATOR '; ') AS participantes,
                        al.costoBase
                    FROM RESERVA r
                    INNER JOIN FELIGRES f ON f.idFeligres = r.idSolicitante
                    INNER JOIN PARROQUIA pr ON r.idParroquia = pr.idParroquia
                    LEFT JOIN PARTICIPANTES_ACTO pa ON pa.idReserva = r.idReserva
                    INNER JOIN ACTO_LITURGICO al ON al.idActo = pa.idActo
                    INNER JOIN USUARIO us ON f.idUsuario = us.idUsuario
                    INNER JOIN ROL_USUARIO rs ON us.idUsuario = rs.idUsuario
                    INNER JOIN ROL ro ON rs.idRol = ro.idRol
                    WHERE ro.nombRol LIKE %s AND r.idUsuario = %s
                    GROUP BY r.idReserva
                    ORDER BY r.f_reserva ASC, r.h_reserva ASC;
                """
                cursor.execute(query, (f"%{rol}%", idUsuario))

            filas = cursor.fetchall()
            
            for fila in filas:
                # Mapeo de índices según tu lógica
                idActo_val = fila[2]
                fecha = fila[3]
                hora = fila[4]

                if "Secretaria" in rol:
                    estadoReserva_val = fila[5]
                    mencion_val = fila[6]
                    nombreFeligres_val = fila[7]
                    nombreParroquia_val = fila[8]
                    participantes_val = fila[9]
                    costoBase_val = fila[10]
                else:
                    mencion_val = fila[5]
                    estadoReserva_val = fila[6]
                    nombreFeligres_val = fila[7]
                    nombreParroquia_val = fila[8]
                    participantes_val = fila[9]
                    costoBase_val = fila[10]

                if isinstance(fecha, (date, datetime)):
                    fecha = fecha.isoformat()
                if isinstance(hora, timedelta):
                    total_seconds = int(hora.total_seconds())
                    horas = total_seconds // 3600
                    minutos = (total_seconds % 3600) // 60
                    segundos = total_seconds % 60
                    hora = f"{horas:02d}:{minutos:02d}:{segundos:02d}"

                resultados.append({
                    'idReserva': fila[0],
                    'nombreActo': fila[1],
                    'idActo': idActo_val,
                    'fecha': fecha,
                    'hora': hora,
                    'mencion': mencion_val,
                    'estadoReserva': estadoReserva_val,
                    'nombreFeligres': nombreFeligres_val,
                    'nombreParroquia': nombreParroquia_val,
                    'participantes': participantes_val,
                    'costoBase': costoBase_val
                })

        return resultados
    except Exception as e:
        print(f"Error al obtener las reservas: {e}")
        return []
    finally:
        if conexion:
            conexion.close()
def obtener_todas_reservas_admin():
    """
    Obtiene un listado completo de reservas con nombres de feligreses y actos para el panel admin.
    """
    conexion = obtener_conexion()
    try:
        reservas = []
        with conexion.cursor() as cursor:
            sql = """
                SELECT 
                    r.idReserva,
                    r.f_reserva,
                    r.h_reserva,
                    r.mencion,
                    r.estadoReserva,
                    CONCAT(f.nombFel, ' ', f.apePatFel, ' ', f.apeMatFel) AS solicitante,
                    p.nombParroquia,
                    (SELECT al.nombActo 
                     FROM PARTICIPANTES_ACTO pa 
                     JOIN ACTO_LITURGICO al ON pa.idActo = al.idActo 
                     WHERE pa.idReserva = r.idReserva LIMIT 1) as nombreActo
                FROM RESERVA r
                JOIN FELIGRES f ON r.idSolicitante = f.idFeligres
                JOIN PARROQUIA p ON r.idParroquia = p.idParroquia
                ORDER BY r.f_reserva DESC
            """
            cursor.execute(sql)
            filas = cursor.fetchall()
            
            for row in filas:
                # Convertir fecha y hora a string para evitar errores de JSON
                hora = str(row[2]) if isinstance(row[2], timedelta) else str(row[2])
                fecha = row[1].isoformat() if isinstance(row[1], (date, datetime)) else str(row[1])

                reservas.append({
                    "idReserva": row[0],
                    "f_reserva": fecha,
                    "h_reserva": hora,
                    "mencion": row[3],
                    "estadoReserva": row[4],
                    "solicitante": row[5],
                    "nombreParroquia": row[6],
                    "nombreActo": row[7] if row[7] else "Sin Acto"
                })
        return reservas
    except Exception as e:
        print(f"Error admin reservas: {e}")
        return []
    finally:
        if conexion:
            conexion.close()