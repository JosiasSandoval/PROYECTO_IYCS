from app.bd_sistema import obtener_conexion

# Función Python (backend/db.py) - CORREGIDA PARA MySQL
def agregar_reserva(fecha, hora,mencion,estado, idUsuario, idSolicitante):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # 1. Ejecutar el INSERT sin RETURNING
            cursor.execute("""
                INSERT INTO reserva (
                    f_reserva, h_reserva, mencion, estadoReserva, numReprogramaciones, 
                    estadoReprogramado, vigenciaReserva, idUsuario, idSolicitante
                )
                VALUES (%s, %s, %s, %s, 0, FALSE, CURRENT_DATE, %s, %s);
            """, (fecha, hora, mencion, estado,idUsuario, idSolicitante))
            
            # 2. Obtener el ID insertado usando lastrowid (propio de MySQL/drivers Python)
            id_reserva = cursor.lastrowid
            conexion.commit()
            
            # Devuelves éxito y el ID de la reserva.
            return True, id_reserva 
            
    except Exception as e:
        # ... (Manejo de errores) ..
        return False, str(e) # Asegúrate de devolver el mensaje de error para diagnóstico
    finally:
        if conexion:
            conexion.close()

def reprogramar_reserva(idReserva,fecha,hora,observaciones):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("select numReprogramacion from reserva where idReserva=%s",(idReserva))
            numReprogramacion = cursor.fetchone()
            numReprogramacion=numReprogramacion[0]+1
            cursor.execute("UPDATE reserva SET fecha=%s, hora=%s, numReprogramacion=%s, estadoReprogramacion='FALSE',observaciones=%s WHERE idReserva=%s",(fecha,hora,numReprogramacion,observaciones,idReserva))
        conexion.commit()
        return {"mensaje": "Reserva reprogramada exitosamente"}   
    except Exception as e:
        print(f"Error al reprogramar la reserva: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        if conexion:
            conexion.close()

def cambiar_estado_reserva(idReserva, accion='continuar'):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT estadoReserva FROM reserva WHERE idReserva = %s", (idReserva,))
            resultado = cursor.fetchone()

            if resultado is None:
                return {'ok': False, 'mensaje': 'Reserva no encontrada'}

            estado_actual = resultado[0]

            # Si se solicita cancelar, no importa el estado actual
            if accion == 'cancelar':
                nuevo_estado = 'CANCELADO'
            elif estado_actual == 'PENDIENTE_DOCUMENTOS':
                nuevo_estado = 'PENDIENTE_PAGOS'
            elif estado_actual == 'PENDIENTE_PAGOS':
                nuevo_estado = 'CONFIRMADO'
            else:
                nuevo_estado = estado_actual  # Mantiene el estado si no aplica cambio

            cursor.execute(
                "UPDATE reserva SET estadoReserva = %s WHERE idReserva = %s",
                (nuevo_estado, idReserva)
            )

        conexion.commit()
        return {'ok': True, 'nuevo_estado': nuevo_estado}

    except Exception as e:
        print(f'Error al cambiar estado de la reserva: {e}')
        return {"ok": False, "error": str(e)}

    finally:
        if conexion:
            conexion.close()

def eliminar_reserva(idReserva):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM reserva WHERE idReserva = %s", (idReserva,))
        conexion.commit()
        return {"mensaje": "Reserva eliminada exitosamente"}
    except Exception as e:
        print(f"Error al eliminar la reserva: {e}")
        return {"ok": False, "error": str(e)}
    finally:
        if conexion:
            conexion.close()

def get_reserva_feligres(idUsuario):
    conexion = obtener_conexion()
    try:
        resultados=[]
        with conexion.cursor() as cursor:
            cursor.execute("""
            SELECT f_reserva, h_reserva, mencion,estadoReserva from reserva where idUsuario=%s;
            """,(idUsuario,))
            resultados = cursor.fetchall()
            for filas in resultados:
                resultados.append({
                    'fecha': filas[0],
                    'hora': filas[1],
                    'mencion': filas[2],
                    'estado': filas[3]
                })
            return resultados
    except Exception as e:
        print(f"Error al listar las reservas: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

def get_reserva():
    conexion = obtener_conexion()
    try:
        resultados=[]
        with conexion.cursor() as cursor:
            cursor.execute("""
            SELECT idReserva, f_reserva, h_reserva, mencion,estadoReserva,numReprogramaciones,estadoReprogramado,vigenciaReserva,idUsuario,idSolicitante from reserva;
            """)
            resultados = cursor.fetchall()
            for filas in resultados:
                resultados.append({
                    'idReserva': filas[0],
                    'fecha': filas[1],
                    'hora': filas[2],
                    'mencion': filas[3],
                    'estado': filas[4],
                    'numReprogramaciones': filas[5],
                    'estadoReprogramado': filas[6],
                    'vigenciaReserva': filas[7],
                    'idUsuario': filas[8],
                    'idSolicitante': filas[9]
                })
            return resultados
    except Exception as e:
        print(f"Error al listar las reservas: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

def get_reserva_sacerdote(nombre):
    conexion = obtener_conexion()
    try:
        with conexion.cursor as cursor:
            cursor.execute("""
            SELECT 
                re.idReserva, 
                re.f_reserva, 
                re.h_reserva, 
                re.mencion, 
                al.idActo, 
                al.nombActo
            FROM participantes_acto pa
            INNER JOIN reserva re ON pa.idReserva = re.idReserva
            INNER JOIN acto_liturgico al ON pa.idActo = al.idActo
            WHERE pa.rolParticipante = 'SACERDOTE'
            AND LOWER(pa.nombParticipante) LIKE LOWER('%raul%');
            """)
    except Exception as e:
        print(f"Error al listar las reservas: {e}")
        return []
    finally:
        if conexion:
            conexion.close()


