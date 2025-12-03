from app.bd_sistema import obtener_conexion
from datetime import date, datetime, timedelta

# --------------------------
# Helper: formatea fecha/hora
# --------------------------
def _fecha_a_str(valor):
    if isinstance(valor, (date, datetime)):
        return valor.isoformat()
    return str(valor) if valor is not None else None

# --------------------------
# Validar horario disponible
# --------------------------
def validar_horario_disponible(fecha, hora, idParroquia):
    """
    Valida que el horario seleccionado esté disponible.
    Retorna (True, "") si está disponible, (False, mensaje) si no.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Verificar si ya existe una reserva en esa fecha y hora para la parroquia
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM reserva
                WHERE f_reserva = %s 
                AND h_reserva = %s 
                AND idParroquia = %s
                AND estadoReserva NOT IN ('CANCELADA', 'RECHAZADA')
            """, (fecha, hora, idParroquia))
            
            resultado = cursor.fetchone()
            total = resultado[0] if resultado else 0
            
            if total > 0:
                return False, f"El horario {hora} del día {fecha} ya está ocupado."
            
            return True, ""
    except Exception as e:
        print(f'Error validando horario disponible: {e}')
        return False, f"Error al validar disponibilidad: {str(e)}"
    finally:
        if conexion:
            conexion.close()

def obtener_reservas_por_fecha(idParroquia, fecha):
    """
    Obtiene todas las reservas de una parroquia en una fecha específica.
    Retorna lista de reservas con hora y estado.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT r.idReserva, r.h_reserva, r.estadoReserva, r.mencion,
                       CASE 
                           WHEN r.estadoReserva = 'RESERVA_PARROQUIA' THEN p.nombParroquia
                           ELSE CONCAT(f.nombFel, ' ', f.apePatFel)
                       END as solicitante
                FROM reserva r
                LEFT JOIN feligres f ON r.idSolicitante = f.idFeligres
                INNER JOIN parroquia p ON r.idParroquia = p.idParroquia
                WHERE r.idParroquia = %s 
                AND r.f_reserva = %s
                AND r.estadoReserva NOT IN ('CANCELADA', 'RECHAZADA')
                ORDER BY r.h_reserva
            """, (idParroquia, fecha))
            
            reservas = []
            for row in cursor.fetchall():
                reservas.append({
                    'idReserva': row[0],
                    'hora': str(row[1]),
                    'estado': row[2],
                    'mencion': row[3],
                    'solicitante': row[4]
                })
            
            return reservas
    except Exception as e:
        print(f'Error obteniendo reservas por fecha: {e}')
        return []
    finally:
        if conexion:
            conexion.close()

def _hora_a_str(valor):
    if isinstance(valor, timedelta):
        return str(valor)
    return str(valor) if valor is not None else None

# --------------------------
# Insertar reserva
# --------------------------
def agregar_reserva(fecha, hora, mencion, estado, idUsuario, idSolicitante, idParroquia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO reserva (
                    f_reserva, h_reserva, mencion, estadoReserva, numReprogramaciones, 
                    estadoReprogramado, vigenciaReserva, idUsuario, idSolicitante, idParroquia
                )
                VALUES (%s, %s, %s, %s, 0, FALSE, CURRENT_DATE, %s, %s, %s);
            """, (fecha, hora, mencion, estado, idUsuario, idSolicitante, idParroquia))
            
            # Para connectors MySQL como pymysql, lastrowid funciona
            id_reserva = cursor.lastrowid
        conexion.commit()
        return True, id_reserva 
    except Exception as e:
        # devolver el error para debug (route puede mostrarlo)
        return False, str(e)
    finally:
        if conexion:
            conexion.close()

# --------------------------
# Reprogramar reserva
# --------------------------
def reprogramar_reserva(idReserva, fecha, hora, observaciones):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT numReprogramaciones FROM reserva WHERE idReserva=%s", (idReserva,))
            fila = cursor.fetchone()
            if not fila:
                return False, "Reserva no encontrada"

            numReprogramacion = (fila[0] or 0) + 1

            # Nota: si 'mencion' NO es el campo adecuado para observaciones,
            # deberías crear un campo separado (ej. observacionReprogramacion).
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
                # Después de pagar, pasa a PENDIENTE_DOCUMENTO (documentos se entregan físicamente)
                nuevo_estado = 'PENDIENTE_DOCUMENTO'
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

# --------------------------
# Eliminar reserva
# --------------------------
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

            # 1️⃣ Obtener el nombre del sacerdote basado en su usuario
            cursor.execute("""
                SELECT p.nombPers, p.apePatPers, p.apeMatPers
                FROM usuario us
                INNER JOIN rol_usuario rs ON us.idUsuario = rs.idUsuario
                INNER JOIN rol r ON rs.idRol = r.idRol
                INNER JOIN personal p ON us.idUsuario = p.idUsuario
                WHERE us.idUsuario = %s
                AND r.nombRol = 'SACERDOTE';
            """, (idUsuario,))

            fila = cursor.fetchone()
            if not fila:
                return []

            # Nombre LIKE con %% para evitar error
            nombre_sacerdote = f"%{fila[0]} {fila[1]} {fila[2]}%"

            # 2️⃣ Consulta principal (corregidos todos los % → %%)
            cursor.execute("""
                SELECT 
                    r.idReserva,
                    al.nombActo,
                    r.f_reserva,
                    r.h_reserva,
                    r.mencion,
                    CONCAT(f.nombFel, ' ', f.apePatFel, ' ', f.apeMatFel) AS nombreFeligres,
                    f.telefonoFel,
                    f.direccionFel,
                    pr.nombParroquia,
                    r.estadoReserva,
                    COALESCE(
                        GROUP_CONCAT(
                            CASE 
                                WHEN pa.rolParticipante NOT LIKE '%%Sacerdote%%'
                                THEN CONCAT(pa.rolParticipante, ': ', pa.nombParticipante)
                            END SEPARATOR '; '
                        ), ''
                    ) AS participantes
                FROM reserva r
                INNER JOIN feligres f ON f.idFeligres = r.idSolicitante
                INNER JOIN parroquia pr ON pr.idParroquia = r.idParroquia
                LEFT JOIN participantes_acto pa ON pa.idReserva = r.idReserva
                LEFT JOIN acto_liturgico al ON al.idActo = pa.idActo
                WHERE EXISTS (
                    SELECT 1
                    FROM participantes_acto pa_s
                    WHERE pa_s.idReserva = r.idReserva
                    AND pa_s.rolParticipante LIKE '%%Sacerdote%%'
                    AND pa_s.nombParticipante LIKE %s
                )
                GROUP BY 
                    r.idReserva,
                    al.nombActo,
                    r.f_reserva,
                    r.h_reserva,
                    r.mencion,
                    nombreFeligres,
                    f.telefonoFel,
                    f.direccionFel,
                    pr.nombParroquia,
                    r.estadoReserva;
            """, (nombre_sacerdote,))

            reservas = cursor.fetchall()

            # 3️⃣ JSON
            for row in reservas:
                fecha_str = row[2].isoformat() if hasattr(row[2], "isoformat") else str(row[2])
                hora_str = str(row[3])
                
                resultados.append({
                    'idReserva': row[0],
                    'nombreActo': row[1],
                    'fecha': fecha_str,
                    'hora': hora_str,
                    'mencion': row[4],
                    'nombreFeligres': row[5],
                    'telefonoFeligres': row[6],
                    'direccionFeligres': row[7],
                    'nombreParroquia': row[8],
                    'estadoReserva': row[9],
                    'participantes': row[10]
                })

        return resultados

    except Exception as e:
        print(f"Error al obtener reservas sacerdote: {e}")
        return []

    finally:
        if conexion:
            conexion.close()


# --------------------------
# Reservas por parroquia (SECRETARIA)
# --------------------------
def get_reservas_parroquia(idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # 1) Obtener idParroquia del usuario secretaria
            cursor.execute("""
                SELECT pp.idParroquia
                FROM usuario us
                INNER JOIN rol_usuario rs ON us.idUsuario = rs.idUsuario
                INNER JOIN rol r ON rs.idRol = r.idRol
                INNER JOIN personal pe ON us.idUsuario = pe.idUsuario
                INNER JOIN parroquia_personal pp ON pe.idPersonal = pp.idPersonal
                WHERE us.idUsuario = %s AND r.nombRol = 'SECRETARIA'
                AND pp.vigenciaParrPers = TRUE;
            """, (idUsuario,))
            
            fila = cursor.fetchone()
            if not fila:
                # no hay parroquia válida
                # --> devolvemos lista vacía para el front
                return []
            
            idParroquia = fila[0]

            # 2) Obtener reservas para esa parroquia
            # IMPORTANTE: 
            # - Reservas normales: idSolicitante = idFeligres
            # - Reservas de sacerdote para la parroquia: idSolicitante = idParroquia
            cursor.execute("""
                SELECT 
                    re.idReserva,
                    al.nombActo,
                    al.idActo,
                    ap.costoBase,
                    re.f_reserva,
                    re.h_reserva,
                    re.mencion,
                    CASE 
                        WHEN re.idSolicitante = re.idParroquia THEN pa.nombParroquia
                        ELSE CONCAT(f.nombFel,' ',f.apePatFel,' ',f.apeMatFel)
                    END AS nombreSolicitante,
                    pa.nombParroquia,
                    re.estadoReserva,
                    COALESCE(
                        GROUP_CONCAT(CONCAT(pc.rolParticipante, ': ', pc.nombParticipante) SEPARATOR '; '),
                        ''
                    ) AS participantes
                FROM reserva re
                INNER JOIN parroquia pa ON re.idParroquia = pa.idParroquia
                LEFT JOIN feligres f ON f.idFeligres = re.idSolicitante
                LEFT JOIN participantes_acto pc ON re.idReserva = pc.idReserva
                LEFT JOIN acto_liturgico al ON pc.idActo = al.idActo
                LEFT JOIN acto_parroquia ap 
                    ON al.idActo = ap.idActo
                   AND ap.idParroquia = re.idParroquia
                WHERE re.idParroquia = %s
                GROUP BY 
                    re.idReserva,
                    al.nombActo,
                    al.idActo,
                    ap.costoBase,
                    re.f_reserva,
                    re.h_reserva,
                    re.mencion,
                    nombreSolicitante,
                    pa.nombParroquia,
                    re.estadoReserva;
            """, (idParroquia,))

            filas = cursor.fetchall()
            resultados = []

            for fila in filas:
                fecha_str = _fecha_a_str(fila[3])
                hora_str = _hora_a_str(fila[4])

                resultados.append({
                    'idReserva': fila[0],
                    'nombreActo': fila[1],
                    'idActo': fila[2],  # idActo ahora está en la posición 2
                    'costoBase': fila[3],  # costoBase ahora está en la posición 3
                    'fecha': fecha_str,
                    'hora': hora_str,
                    'mencion': fila[6],  # mencion ahora está en la posición 6
                    'nombreFeligres': fila[7],  # nombreFeligres ahora está en la posición 7
                    'nombreParroquia': fila[8],  # nombreParroquia ahora está en la posición 8
                    'estadoReserva': fila[9],  # estadoReserva ahora está en la posición 9
                    'participantes': fila[10]  # participantes ahora está en la posición 10
                })

        return resultados

    except Exception as e:
        print(f"Error al obtener las reservas: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# --------------------------
# Reservas por feligres (usuario)
# --------------------------
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
                    ap.costoBase,
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
                INNER JOIN feligres f ON f.idFeligres = re.idSolicitante
                INNER JOIN parroquia pa ON re.idParroquia = pa.idParroquia
                LEFT JOIN participantes_acto pc ON re.idReserva = pc.idReserva
                LEFT JOIN acto_liturgico al ON pc.idActo = al.idActo
                LEFT JOIN acto_parroquia ap 
                    ON al.idActo = ap.idActo
                   AND ap.idParroquia = re.idParroquia
                WHERE re.idSolicitante = %s
                GROUP BY 
                    re.idReserva,
                    al.nombActo,
                    ap.costoBase,
                    re.f_reserva,
                    re.h_reserva,
                    re.mencion,
                    pa.nombParroquia,
                    re.estadoReserva;
            """, (idFeligres,))

            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                fecha_str = _fecha_a_str(fila[3])
                hora_str = _hora_a_str(fila[4])
                
                resultados.append({
                    'idReserva': fila[0],
                    'acto': fila[1],
                    'costoBase': fila[2],
                    'fecha': fecha_str,
                    'hora': hora_str,
                    'mencion': fila[5],
                    'nombreParroquia': fila[6],
                    'estadoReserva': fila[7],
                    'participantes': fila[8]
                })

        return resultados
    except Exception as e:
        print(f"Error al obtener las reservas: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# --------------------------
# Obtener todas las reservas (admin)
# --------------------------
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
                     FROM participantes_acto pa 
                     JOIN acto_liturgico al ON pa.idActo = al.idActo 
                     WHERE pa.idReserva = r.idReserva LIMIT 1) as nombreActo
                FROM reserva r
                JOIN feligres f ON r.idSolicitante = f.idFeligres
                JOIN parroquia p ON r.idParroquia = p.idParroquia
                ORDER BY r.f_reserva DESC
            """
            cursor.execute(sql)
            filas = cursor.fetchall()
            
            for row in filas:
                hora = _hora_a_str(row[2])
                fecha = _fecha_a_str(row[1])

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

# --------------------------
# Listar reservas por rol (corrección de columnas y pagos)
# --------------------------
def listar_reservas_por_rol(rol_usuario, idUsuario=None):
    """
    Lista reservas según el rol:
    - feligres: solo reservas sin pagos registrados
    - secretaria/administrador: todas las reservas, con info de pago si existe
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            if rol_usuario.lower() == 'feligres':
                # Solo reservas sin pagos registrados (LEFT JOIN a pago_reserva)
                cursor.execute(
                    """
                    SELECT r.idReserva, CONCAT(f.nombFel,' ',f.apePatFel,' ',f.apeMatFel) AS nombreFeligres,
                           r.f_reserva, r.estadoReserva
                    FROM reserva r
                    JOIN feligres f ON r.idSolicitante = f.idFeligres
                    LEFT JOIN pago_reserva pr ON pr.idReserva = r.idReserva
                    WHERE pr.idPago IS NULL
                    ORDER BY r.f_reserva ASC
                    """
                )
            else:
                # Secretarias y administradores: todas las reservas, incluyendo pagos pendientes o completados
                cursor.execute(
                    """
                    SELECT r.idReserva, CONCAT(f.nombFel,' ',f.apePatFel,' ',f.apeMatFel) AS nombreFeligres,
                           r.f_reserva, r.estadoReserva,
                           COALESCE(p.idPago, 0) AS idPago,
                           COALESCE(p.estadoPago, 'PENDIENTE') AS estadoPago,
                           COALESCE(p.montoTotal, 0) AS montoPago
                    FROM reserva r
                    JOIN feligres f ON r.idSolicitante = f.idFeligres
                    LEFT JOIN pago_reserva pr ON pr.idReserva = r.idReserva
                    LEFT JOIN pago p ON p.idPago = pr.idPago
                    ORDER BY r.f_reserva ASC
                    """
                )

            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                # fila[2] es f_reserva (datetime/date), lo convertimos
                fecha_val = fila[2]
                fecha_str = _fecha_a_str(fecha_val) if fecha_val else None

                resultados.append({
                    'idReserva': fila[0],
                    'feligres': fila[1],
                    'fecha': fecha_str,
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
        if conexion:
            conexion.close()
