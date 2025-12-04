from app.bd_sistema import obtener_conexion
from datetime import datetime

# ===========================
# REGISTRAR NUEVO PAGO
# ===========================
def registrar_pago(f_pago, montoTotal, metodoPago, numeroTransaccion, estadoPago):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                """INSERT INTO pago 
                (f_pago, montoTotal, metodoPago, numeroTransaccion, estadoPago)
                VALUES (%s, %s, %s, %s, %s)""",
                (f_pago, montoTotal, metodoPago, numeroTransaccion, estadoPago)
            )

            id_pago = cursor.lastrowid  # ← IMPORTANTE
            conexion.commit()

            return {
                'ok': True,
                'idPago': id_pago,
                'mensaje': 'Pago registrado exitosamente'
            }

    except Exception as e:
        print(f'Error al registrar pago: {e}')
        return {
            'ok': False,
            'mensaje': f'Error al procesar el pago: {str(e)}'
        }
    finally:
        conexion.close()

# ===========================
# REGISTRO DE PAGO RESERVAS
# ===========================
def registrar_pago_reserva(idPago, idReserva, monto):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                """INSERT INTO pago_reserva (idPago, idReserva, montoReserva)
                VALUES (%s, %s, %s)""",
                (idPago, idReserva, monto)
            )
            conexion.commit()
            
            # Después de registrar el pago, cambiar el estado de la reserva
            from app.reserva.controlador_reserva import cambiar_estado_reserva
            exito, nuevo_estado = cambiar_estado_reserva(idReserva, accion='continuar')
            
            if exito:
                return {'ok': True, 'mensaje': f'Pago registrado. Estado: {nuevo_estado}'}
            else:
                return {'ok': True, 'mensaje': 'Pago registrado (estado no actualizado)'}

    except Exception as e:
        print(f'Error al registrar pago reserva: {e}')
        return {'ok': False, 'mensaje': f'Error al procesar el pago reserva: {str(e)}'}

    finally:
        conexion.close()

# ===========================
# OBTENER DETALLES DE UN PAGO
# ===========================
def obtener_pago(idReserva):
    """
    Obtiene los detalles de un pago específico por idReserva
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                """
                SELECT p.idPago, p.montoTotal, p.f_pago, p.metodoPago, p.numeroTransaccion, p.estadoPago
                FROM pago p
                INNER JOIN pago_reserva pr ON p.idPago = pr.idPago
                WHERE pr.idReserva = %s
                ORDER BY p.f_pago DESC
                LIMIT 1
                """,
                (idReserva,)
            )
            fila = cursor.fetchone()
            if fila:
                return {
                    'idPago': fila[0],
                    'montoTotal': float(fila[1]) if fila[1] else 0,
                    'f_pago': fila[2].strftime('%Y-%m-%d %H:%M:%S') if fila[2] else None,
                    'metodoPago': fila[3],
                    'numeroTransaccion': fila[4],
                    'estadoPago': fila[5]
                }
            return None   
    except Exception as e:
        print(f'Error al obtener pago: {e}')
        return None
    finally:
        conexion.close()

#MODIFICAR_ESTO
# ===========================
# LISTAR PAGOS POR RESERVA
# ===========================
def listar_pagos_por_reserva(idReserva):
    """
    Lista todos los pagos asociados a una reserva
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                """SELECT p.idPago, p.montoTotal, p.f_transaccion, p.estadoPago,
                m.nombMetodo, p.vigenciaPago, p.numTarjeta
                FROM pago p
                INNER JOIN metodo_pago m ON p.idMetodo = m.idMetodo
                WHERE p.idReserva = %s
                ORDER BY p.f_transaccion DESC""",
                (idReserva,)
            )
            filas = cursor.fetchall()
            
            resultados = []
            for fila in filas:
                resultados.append({
                    'idPago': fila[0],
                    'montoTotal': float(fila[1]),
                    'f_transaccion': fila[2].strftime('%Y-%m-%d %H:%M:%S') if fila[2] else None,
                    'estadoPago': fila[3],
                    'nombMetodo': fila[4],
                    'vigenciaPago': fila[5],
                    'numTarjeta': fila[6]
                })
            return resultados
            
    except Exception as e:
        print(f'Error al listar pagos: {e}')
        return []
    finally:
        conexion.close()


# ===========================
# LISTAR TODOS LOS PAGOS
# ===========================
def listar_todos_pagos():
    """
    Lista todos los pagos del sistema con paginación opcional
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                """SELECT p.idPago, p.montoTotal, p.f_transaccion, p.estadoPago,
                m.nombMetodo, p.vigenciaPago, p.idReserva, p.numTarjeta
                FROM pago p
                INNER JOIN metodo_pago m ON p.idMetodo = m.idMetodo
                ORDER BY p.f_transaccion DESC"""
            )
            filas = cursor.fetchall()
            
            resultados = []
            for fila in filas:
                resultados.append({
                    'idPago': fila[0],
                    'montoTotal': float(fila[1]),
                    'f_transaccion': fila[2].strftime('%Y-%m-%d %H:%M:%S') if fila[2] else None,
                    'estadoPago': fila[3],
                    'nombMetodo': fila[4],
                    'vigenciaPago': fila[5],
                    'idReserva': fila[6],
                    'numTarjeta': fila[7]
                })
            return resultados
            
    except Exception as e:
        print(f'Error al listar pagos: {e}')
        return []
    finally:
        conexion.close()


# ===========================
# ACTUALIZAR ESTADO DEL PAGO
# ===========================
def actualizar_estado_pago(idPago, nuevoEstado):
    """
    Actualiza el estado de un pago
    Estados válidos: 'PENDIENTE', 'APROBADO', 'CANCELADO'
    Si se aprueba un pago PENDIENTE, también cambia el estado de las reservas asociadas
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Verificar que el pago existe
            cursor.execute("SELECT idPago, estadoPago FROM pago WHERE idPago = %s", (idPago,))
            pago_existente = cursor.fetchone()
            if not pago_existente:
                return False
            
            estado_actual = pago_existente[1]
            
            # Actualizar estado del pago
            cursor.execute(
                "UPDATE pago SET estadoPago = %s WHERE idPago = %s",
                (nuevoEstado, idPago)
            )
            
            # Si se aprueba un pago PENDIENTE, cambiar estado de las reservas asociadas
            if estado_actual == 'PENDIENTE' and nuevoEstado == 'APROBADO':
                # Obtener todas las reservas asociadas a este pago
                cursor.execute("""
                    SELECT idReserva 
                    FROM pago_reserva 
                    WHERE idPago = %s
                """, (idPago,))
                reservas = cursor.fetchall()
                
                # Cambiar estado de cada reserva a PENDIENTE_DOCUMENTO
                for reserva in reservas:
                    idReserva = reserva[0]
                    cursor.execute("""
                        UPDATE reserva 
                        SET estadoReserva = 'PENDIENTE_DOCUMENTO' 
                        WHERE idReserva = %s
                    """, (idReserva,))
            
            conexion.commit()
            print(f'Estado del pago {idPago} actualizado a: {nuevoEstado}')
            return True
            
    except Exception as e:
        print(f'Error al actualizar estado del pago: {e}')
        conexion.rollback()
        return False
    finally:
        conexion.close()


# ===========================
# CAMBIAR VIGENCIA DEL PAGO
# ===========================
def cambiar_vigencia_pago(idPago):
    """
    Cambia la vigencia del pago (activar/desactivar)
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "SELECT vigenciaPago FROM pago WHERE idPago = %s",
                (idPago,)
            )
            fila = cursor.fetchone()
            
            if fila is None:
                print(f'No existe pago con id {idPago}')
                return {
                    'ok': False,
                    'mensaje': 'Pago no encontrado'
                }
                
            nueva_vigencia = not fila[0]
            cursor.execute(
                "UPDATE pago SET vigenciaPago = %s WHERE idPago = %s",
                (nueva_vigencia, idPago)
            )
            conexion.commit()
            print(f'Vigencia del pago {idPago} cambiada a: {nueva_vigencia}')
            return {
                'ok': True,
                'nueva_vigencia': nueva_vigencia
            }
            
    except Exception as e:
        print(f'Error al cambiar vigencia del pago: {e}')
        return {
            'ok': False,
            'mensaje': str(e)
        }
    finally:
        conexion.close()


# ===========================
# VERIFICAR RELACIÓN DEL PAGO
# ===========================
def verificar_relacion_pago(idPago):
    """
    Verifica si el pago tiene relaciones que impidan su eliminación
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM pago WHERE idPago = %s",
                (idPago,)
            )
            resultado = cursor.fetchone()
            return resultado[0] > 0 if resultado else False
    except Exception as e:
        print(f'Error al verificar relación del pago: {e}')
        return False
    finally:
        conexion.close()


# ===========================
# ELIMINAR PAGO
# ===========================
def eliminar_pago(idPago):
    """
    Elimina un pago del sistema
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "DELETE FROM pago WHERE idPago = %s",
                (idPago,)
            )
            conexion.commit()
            
            if cursor.rowcount > 0:
                print(f'Pago {idPago} eliminado correctamente.')
                return True
            else:
                print(f'No se encontró el pago {idPago}.')
                return False
            
    except Exception as e:
        print(f'Error al eliminar pago: {e}')
        return False
    finally:
        conexion.close()


# ===========================
# OBTENER TOTAL PAGADO POR RESERVA
# ===========================
def obtener_total_pagado_reserva(idReserva):
    """
    Calcula el total pagado para una reserva específica
    Solo cuenta pagos completados y vigentes
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                """SELECT SUM(montoTotal) 
                FROM pago 
                WHERE idReserva = %s 
                AND estadoPago = 'Completado' 
                AND vigenciaPago = TRUE""",
                (idReserva,)
            )
            resultado = cursor.fetchone()
            return float(resultado[0]) if resultado[0] else 0.0
            
    except Exception as e:
        print(f'Error al obtener total pagado: {e}')
        return 0.0
    finally:
        conexion.close()


# ===========================
# VERIFICAR PAGO COMPLETADO
# ===========================
def verificar_pago_completado(idReserva):
    """
    Verifica si existe al menos un pago completado para la reserva
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                """SELECT COUNT(*) FROM pago 
                WHERE idReserva = %s 
                AND estadoPago = 'Completado' 
                AND vigenciaPago = TRUE""",
                (idReserva,)
            )
            resultado = cursor.fetchone()
            return resultado[0] > 0 if resultado else False
            
    except Exception as e:
        print(f'Error al verificar pago: {e}')
        return False
    finally:
        conexion.close()


# ===========================
# OBTENER ESTADÍSTICAS DE PAGOS
# ===========================
def obtener_estadisticas_pagos():
    """
    Obtiene estadísticas generales de pagos
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                """SELECT 
                    COUNT(*) as total_pagos,
                    SUM(CASE WHEN estadoPago = 'Completado' THEN 1 ELSE 0 END) as completados,
                    SUM(CASE WHEN estadoPago = 'Pendiente' THEN 1 ELSE 0 END) as pendientes,
                    SUM(CASE WHEN estadoPago = 'Rechazado' THEN 1 ELSE 0 END) as rechazados,
                    SUM(CASE WHEN estadoPago = 'Completado' THEN montoTotal ELSE 0 END) as total_recaudado
                FROM pago 
                WHERE vigenciaPago = TRUE"""
            )
            fila = cursor.fetchone()
            
            if fila:
                return {
                    'total_pagos': fila[0],
                    'completados': fila[1],
                    'pendientes': fila[2],
                    'rechazados': fila[3],
                    'total_recaudado': float(fila[4]) if fila[4] else 0.0
                }
            return None
            
    except Exception as e:
        print(f'Error al obtener estadísticas: {e}')
        return None
    finally:
        conexion.close()