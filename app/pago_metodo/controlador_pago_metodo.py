from app.bd_sistema import obtener_conexion

# ================== OBTENER TODOS ==================
def obtener_metodos():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT idMetodo, nombMetodo, estadoMetodo FROM METODO_PAGO ORDER BY nombMetodo ASC")
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idMetodo": fila[0],
                    "nombMetodo": fila[1],
                    "estadoMetodo": bool(fila[2])
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener métodos de pago: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UNO POR ID ==================
def obtener_metodo_por_id(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT * FROM METODO_PAGO WHERE idMetodo = %s", (id,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idMetodo": fila[0],
                    "nombMetodo": fila[1],
                    "estadoMetodo": bool(fila[2])
                }
            return None
    except Exception as e:
        print(f"Error al obtener método por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== REGISTRAR ==================
def registrar_metodo(data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "INSERT INTO METODO_PAGO (nombMetodo, estadoMetodo) VALUES (%s, %s)",
                (data["nombMetodo"], data.get("estadoMetodo", True))
            )
            conexion.commit()
            return True, "Método de pago registrado"
    except Exception as e:
        print(f"Error al registrar método: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ==================
def actualizar_metodo(id, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "UPDATE METODO_PAGO SET nombMetodo = %s WHERE idMetodo = %s",
                (data["nombMetodo"], id)
            )
            conexion.commit()
            return True, "Método de pago actualizado"
    except Exception as e:
        print(f"Error al actualizar método: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO ==================
def actualizar_estado_metodo(id, estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "UPDATE METODO_PAGO SET estadoMetodo = %s WHERE idMetodo = %s",
                (estado, id)
            )
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar estado: {e}")
        return False
    finally:
        if conexion:
            conexion.close()

# ================== ELIMINAR ==================
def eliminar_metodo(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM METODO_PAGO WHERE idMetodo = %s", (id,))
            conexion.commit()
            return True, "Método de pago eliminado"
    except Exception as e:
        print(f"Error al eliminar método: {e}")
        if "foreign key constraint" in str(e).lower():
            return False, "Error: Este método está siendo usado en uno o más pagos."
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()