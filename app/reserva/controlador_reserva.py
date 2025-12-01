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

from app.bd_sistema import obtener_conexion
# Importamos la función de notificaciones que creamos antes
from app.notificacion.controlador_notificacion import crear_notificacion 

def cambiar_estado_reserva(idReserva, accion='continuar', motivo_cancelacion=None):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            
            # 1. MODIFICADO: Traemos también idUsuario y f_reserva para la notificación
            cursor.execute("SELECT estadoReserva, idUsuario, f_reserva FROM RESERVA WHERE idReserva = %s", (idReserva,))
            resultado = cursor.fetchone()

            if resultado is None:
                return False, 'Reserva no encontrada'
            
            estado_actual = resultado[0]
            id_usuario = resultado[1]
            fecha_reserva = resultado[2]

            nuevo_estado = estado_actual
            
            # ====================================================
            # TU LÓGICA DE ESTADOS (INTACTA)
            # ====================================================
            if accion == 'cancelar':
                nuevo_estado = 'CANCELADO'
                
            elif estado_actual == 'PENDIENTE_DOCUMENTO':
                # Pasa a revisión (probablemente cuando sube archivos)
                nuevo_estado = 'PENDIENTE_REVISION' 
            elif estado_actual == 'PENDIENTE_REVISION':
                # Secretaria aprueba documentos
                nuevo_estado = 'PENDIENTE_PAGO'
            elif estado_actual == 'PENDIENTE_PAGO':
                # Tesorería confirma pago
                nuevo_estado = 'CONFIRMADO'
            elif estado_actual == 'CONFIRMADO':
                # Sacerdote finaliza el acto
                nuevo_estado = 'ATENDIDO'              

            # ====================================================
            # AQUÍ AGREGAMOS "EL RESTO" (UPDATE + NOTIFICACIÓN)
            # ====================================================
            
            if nuevo_estado != estado_actual:
                # 2. Actualizar el estado en la Base de Datos
                cursor.execute("UPDATE RESERVA SET estadoReserva = %s WHERE idReserva = %s", (nuevo_estado, idReserva))
                
                # 3. Preparar los datos de la notificación
                titulo = ""
                mensaje = ""
                icono = "info"
                enlace = "/cliente/mis_reservas"

                if nuevo_estado == 'PENDIENTE_REVISION':
                    titulo = "Documentos en Revisión 📄"
                    mensaje = "Hemos recibido tus documentos. La secretaría los revisará pronto."
                    icono = "info"
                    enlace = "/cliente/reserva_requisito"

                elif nuevo_estado == 'PENDIENTE_PAGO':
                    titulo = "Documentos Aprobados 💰"
                    mensaje = "Tus documentos están correctos. Por favor realiza el pago para confirmar."
                    icono = "warning"
                    enlace = "/cliente/pago"

                elif nuevo_estado == 'CONFIRMADO':
                    titulo = "Reserva Confirmada ✅"
                    mensaje = f"¡Todo listo! Tu reserva para el {fecha_reserva} ha sido confirmada exitosamente."
                    icono = "check"
                
                elif nuevo_estado == 'ATENDIDO':
                    titulo = "Acto Finalizado ✨"
                    mensaje = "El acto litúrgico ha concluido. Gracias por su participación."
                    icono = "check"

                elif nuevo_estado == 'CANCELADO':
                    titulo = "Reserva Cancelada ❌"
                    mensaje = "Tu reserva ha sido cancelada."
                    if motivo_cancelacion:
                        mensaje += f" Motivo: {motivo_cancelacion}"
                    icono = "error"

                # 4. Insertar la notificación (si corresponde)
                if titulo:
                    crear_notificacion(id_usuario, titulo, mensaje, enlace, icono)

                # 5. Confirmar cambios en BD
                conexion.commit()

            return True, nuevo_estado

    except Exception as e:
        print(f'Error al cambiar estado: {e}')
        if conexion:
            conexion.rollback() # Importante regresar atrás si falla algo
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

def get_reservas_sacerdote(idUsuario): 
    conexion = obtener_conexion()
    try:
        resultados = []
        with conexion.cursor() as cursor:
            # Query corregida y mantenida
            cursor.execue("""SELECT f.nombFel, f.apePatFel, f.apeMatFel 
                          FROM USUARIO us INNER JOIN ROL_USUARIO rs ON us.idUsuario = rs.idUsuario 
                          INNER JOIN ROL r ON rs.idRol = r.idRol INNER JOIN FELIGRES f ON us.idUsuario = f.idUsuario 
                          WHERE us.idUsuario = %s AND r.nombRol = 'SACERDOTE';""",(idUsuario))
            fila = cursor.fetchone()
            if not fila:
                return []  # No es sacerdote
            nombre = f"{fila[0]} {fila[1]} {fila[2]}"
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

            resultados = cursor.fetchall()
            for filas in resultados:
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

def get_reservas_parroquia(idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # 1️⃣ Obtener idParroquia
            cursor.execute("""
                SELECT pp.idParroquia
                FROM usuario us
                INNER JOIN rol_usuario rs ON us.idUsuario = rs.idUsuario
                INNER JOIN rol r ON rs.idRol = r.idRol
                INNER JOIN personal pe ON us.idUsuario = pe.idUsuario
                INNER JOIN parroquia_personal pp ON pe.idPersonal = pp.idPersonal
                WHERE us.idUsuario = %s AND r.nombRol = 'SECRETARIA'
                AND pp.vigenciaParrPers = TRUE;
            """, (idUsuario,))  # <-- tupla con coma
            
            fila = cursor.fetchone()
            if not fila:
                print("No se encontró parroquia para este usuario")
                return []  # no tiene parroquia válida
            
            idParroquia = fila[0]

            # 2️⃣ Obtener reservas
            cursor.execute("""
                SELECT 
                    re.idReserva,
                    al.nombActo,
                    al.costoBase,
                    re.f_reserva,
                    re.h_reserva,
                    re.mencion,
                    CONCAT(f.nombFel,' ',f.apePatFel,' ',f.apeMatFel) AS nombreFeligres,
                    pa.nombParroquia,
                    re.estadoReserva,
                    COALESCE(
                        GROUP_CONCAT(CONCAT(pc.rolParticipante, ': ', pc.nombParticipante) SEPARATOR '; '),
                        ''
                    ) AS participantes
                FROM reserva re
                INNER JOIN FELIGRES f ON f.idFeligres = re.idSolicitante
                INNER JOIN parroquia pa ON re.idParroquia = pa.idParroquia
                INNER JOIN participantes_acto pc ON re.idReserva = pc.idReserva
                INNER JOIN acto_liturgico al ON pc.idActo = al.idActo
                WHERE re.idParroquia = %s
                GROUP BY 
                    re.idReserva,
                    al.nombActo,
                    re.f_reserva,
                    re.h_reserva,
                    re.mencion,
                    al.nombActo,
                    al.costoBase,
                    nombreFeligres,
                    pa.nombParroquia;
            """, (idParroquia,))  # <-- tupla con coma
            filas = cursor.fetchall()
            resultados = []

            for fila in filas:
                # Convertir fecha y hora a string para JSON
                fecha_str = fila[3].isoformat() if isinstance(fila[3], date) else str(fila[3])
                hora_str = str(fila[4]) if isinstance(fila[4], timedelta) else str(fila[4])

                resultados.append({
                    'idReserva': fila[0],
                    'nombreActo': fila[1],
                    'costoBase': fila[2],
                    'fecha': fecha_str,
                    'hora': hora_str,
                    'mencion': fila[5],
                    'nombreFeligres': fila[6],
                    'nombreParroquia': fila[7],
                    'estadoReserva':fila[8],
                    'participantes': fila[9]
                })

        return resultados

    except Exception as e:
        print(f"Error al obtener las reservas: {e}")
        return []
    finally:
        if conexion:
            conexion.close()


def get_reservas_feligres(idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:

            cursor.execute("""
                SELECT fe.idFeligres
                FROM usuario us
                INNER JOIN rol_usuario rs ON us.idUsuario = rs.idUsuario
                INNER JOIN rol r ON rs.idRol = r.idRol
                INNER JOIN feligres fe ON us.idUsuario = fe.idUsuario
                WHERE us.idUsuario = %s AND r.nombRol = 'FELIGRES';
            """, (idUsuario,))

            fila = cursor.fetchone()
            if not fila:
                return []

            idFeligres = fila[0]

            cursor.execute("""
                SELECT 
                    re.idReserva,
                    al.nombActo,
                    al.costoBase,
                    re.f_reserva,
                    re.h_reserva,
                    re.mencion,
                    pa.nombParroquia,
                    re.estadoReserva,
                    COALESCE(
                        GROUP_CONCAT(CONCAT(pc.rolParticipante, ': ', pc.nombParticipante) SEPARATOR '; '),
                        ''
                    ) AS participantes
                FROM reserva re
                INNER JOIN FELIGRES f ON f.idFeligres = re.idSolicitante
                INNER JOIN parroquia pa ON re.idParroquia = pa.idParroquia
                LEFT JOIN participantes_acto pc ON re.idReserva = pc.idReserva
                INNER JOIN acto_liturgico al ON pc.idActo = al.idActo
                WHERE re.idSolicitante = %s
                GROUP BY 
                    re.idReserva,
                    al.nombActo,
                    re.f_reserva,
                    re.h_reserva,
                    re.mencion,
                           al.costoBase,
                    pa.nombParroquia;
            """, (idFeligres,))

            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                # Convertir fecha y hora a string para JSON
                fecha_str = fila[3].isoformat() if isinstance(fila[3], date) else str(fila[3])
                hora_str = str(fila[4]) if isinstance(fila[4], timedelta) else str(fila[4])
                
                resultados.append({
                    'idReserva': fila[0],
                    'acto': fila[1],
                    'costoBase': fila[2],
                    'fecha': fecha_str,
                    'hora': hora_str,
                    'mencion': fila[5],
                    'nombreParroquia': fila[6],
                    'estadoReserva':fila[7],
                    'participantes': fila[8]
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

def listar_reservas_por_rol(rol_usuario, idUsuario=None):
    """
    Lista reservas según el rol:
    - Feligrés: solo reservas sin ningún pago registrado
    - Secretaria/Administrador: todas las reservas, incluso con pagos pendientes o completados
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            if rol_usuario.lower() == 'feligres':
                # Solo reservas sin pagos
                cursor.execute(
                    """
                    SELECT r.idReserva, r.nombreFeligres, r.f_fecha, r.estadoReserva
                    FROM reserva r
                    LEFT JOIN pago_reserva pr ON pr.idReserva = r.idReserva
                    WHERE pr.idPago IS NULL
                    ORDER BY r.f_fecha ASC
                    """
                )
            else:
                # Secretarias y administradores: todas las reservas, incluyendo pagos pendientes o completados
                cursor.execute(
                    """
                    SELECT r.idReserva, r.nombreFeligres, r.f_fecha, r.estadoReserva,
                           COALESCE(p.idPago, 0) AS idPago,
                           COALESCE(p.estadoPago, 'PENDIENTE') AS estadoPago,
                           COALESCE(p.montoTotal, 0) AS montoPago
                    FROM reserva r
                    LEFT JOIN pago_reserva pr ON pr.idReserva = r.idReserva
                    LEFT JOIN pago p ON p.idPago = pr.idPago
                    ORDER BY r.f_fecha ASC
                    """
                )

            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    'idReserva': fila[0],
                    'feligres': fila[1],
                    'fecha': fila[2].strftime('%Y-%m-%d %H:%M:%S') if fila[2] else None,
                    'estadoReserva': fila[3],
                    'idPago': fila[4] if len(fila) > 4 else None,
                    'estadoPago': fila[5] if len(fila) > 5 else None,
                    'montoPago': float(fila[6]) if len(fila) > 6 else None
                })
            return resultados
            
    except Exception as e:
        print(f'Error al listar reservas por rol: {e}')
        return []
    finally:
        conexion.close()