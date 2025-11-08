from app.bd_sistema import obtener_conexion

# ================== OBTENER TODOS ==================
def obtener_pagos():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Hacemos JOIN con METODO_PAGO
            cursor.execute("""
                SELECT 
                    p.idPago, p.montoTotal, p.f_transaccion, p.numTarjeta, 
                    p.estadoPago, p.vigenciaPago, p.idReserva,
                    m.idMetodo, m.nombMetodo
                FROM PAGO p
                JOIN METODO_PAGO m ON p.idMetodo = m.idMetodo
                ORDER BY p.f_transaccion DESC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idPago": fila[0],
                    "montoTotal": fila[1],
                    "f_transaccion": fila[2].isoformat(),
                    "numTarjeta": fila[3],
                    "estadoPago": fila[4],
                    "vigenciaPago": bool(fila[5]),
                    "idReserva": fila[6],
                    "idMetodo": fila[7],
                    "nombMetodo": fila[8]
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener pagos: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UNO POR ID ==================
def obtener_pago_por_id(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    p.idPago, p.montoTotal, p.f_transaccion, p.numTarjeta, 
                    p.estadoPago, p.vigenciaPago, p.idReserva, p.idMetodo
                FROM PAGO p
                WHERE p.idPago = %s;
            """, (id,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idPago": fila[0],
                    "montoTotal": fila[1],
                    "f_transaccion": fila[2].isoformat(),
                    "numTarjeta": fila[3],
                    "estadoPago": fila[4],
                    "vigenciaPago": bool(fila[5]),
                    "idReserva": fila[6],
                    "idMetodo": fila[7]
                }
            return None
    except Exception as e:
        print(f"Error al obtener pago por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== REGISTRAR ==================
def registrar_pago(data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO PAGO 
                (montoTotal, f_transaccion, numTarjeta, estadoPago, vigenciaPago, idMetodo, idReserva)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (
                data["montoTotal"],
                data["f_transaccion"],
                data.get("numTarjeta"), # Opcional
                data["estadoPago"],
                data.get("vigenciaPago", True),
                data["idMetodo"],
                data["idReserva"]
            ))
            conexion.commit()
            return True, "Pago registrado"
    except Exception as e:
        print(f"Error al registrar pago: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ==================
def actualizar_pago(id, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE PAGO SET
                montoTotal = %s,
                f_transaccion = %s,
                numTarjeta = %s,
                estadoPago = %s,
                idMetodo = %s,
                idReserva = %s
                WHERE idPago = %s;
            """, (
                data["montoTotal"],
                data["f_transaccion"],
                data.get("numTarjeta"),
                data["estadoPago"],
                data["idMetodo"],
                data["idReserva"],
                id
            ))
            conexion.commit()
            return True, "Pago actualizado"
    except Exception as e:
        print(f"Error al actualizar pago: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO (VIGENCIA) ==================
def actualizar_vigencia_pago(id, vigencia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE PAGO 
                SET vigenciaPago = %s
                WHERE idPago = %s;
            """, (vigencia, id))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar vigencia de pago: {e}")
        return False
    finally:
        if conexion:
            conexion.close()

# ================== ELIMINAR ==================
def eliminar_pago(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM PAGO WHERE idPago = %s;", (id,))
            conexion.commit()
            return True, "Pago eliminado"
    except Exception as e:
        print(f"Error al eliminar pago: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()