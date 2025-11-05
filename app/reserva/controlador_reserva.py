from app.bd_sistema import obtener_conexion

def agregar_reserva(fecha,hora,observaciones,idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO reserva (fecha, hora, observaciones, estadoReserva, numero, estadoReprogramacion, vigenciaReserva,idUsuario)
                VALUES (%s, %s, 'SOLICITUD', %s, 0, FALSE, TRUE,%s);""",(fecha,hora,observaciones,idUsuario))
            conexion.commit()
            return {"mensaje": "Reserva agregada exitosamente"}
    except Exception as e:
        print(f"Error al agregar la reserva: {e}")
        return {"ok": False, "error": str(e)}
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
            
            # Flujo normal de avance
            elif estado_actual == 'SOLICITUD':
                nuevo_estado = 'PENDIENTE_DOCUMENTOS'
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

