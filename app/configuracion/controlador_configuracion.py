from app.bd_sistema import obtener_conexion

# ================== OBTENER TODOS ==================
def obtener_configs():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idConfiguracion, nombClave, unidad, valor, descripcion, estadoConfiguracion
                FROM CONFIGURACION
                ORDER BY nombClave ASC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idConfiguracion": fila[0],
                    "nombClave": fila[1],
                    "unidad": fila[2],
                    "valor": fila[3],
                    "descripcion": fila[4],
                    "estadoConfiguracion": bool(fila[5])
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener configuraciones: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UNO POR ID ==================
def obtener_config_por_id(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idConfiguracion, nombClave, unidad, valor, descripcion, estadoConfiguracion
                FROM CONFIGURACION
                WHERE idConfiguracion = %s;
            """, (id,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idConfiguracion": fila[0],
                    "nombClave": fila[1],
                    "unidad": fila[2],
                    "valor": fila[3],
                    "descripcion": fila[4],
                    "estadoConfiguracion": bool(fila[5])
                }
            return None
    except Exception as e:
        print(f"Error al obtener config por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== REGISTRAR ==================
def registrar_config(data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO CONFIGURACION 
                (nombClave, unidad, valor, descripcion, estadoConfiguracion)
                VALUES (%s, %s, %s, %s, %s);
            """, (
                data["nombClave"],
                data["unidad"],
                data["valor"],
                data.get("descripcion"),
                data.get("estadoConfiguracion", True)
            ))
            conexion.commit()
            return True, "Configuración registrada"
    except Exception as e:
        print(f"Error al registrar config: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ==================
def actualizar_config(id, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # NO PERMITIMOS ACTUALIZAR nombClave PARA PROTEGER EL SISTEMA
            cursor.execute("""
                UPDATE CONFIGURACION SET
                unidad = %s,
                valor = %s,
                descripcion = %s
                WHERE idConfiguracion = %s;
            """, (
                data["unidad"],
                data["valor"],
                data.get("descripcion"),
                id
            ))
            conexion.commit()
            return True, "Configuración actualizada"
    except Exception as e:
        print(f"Error al actualizar config: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO ==================
def actualizar_estado_config(id, estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE CONFIGURACION 
                SET estadoConfiguracion = %s
                WHERE idConfiguracion = %s;
            """, (estado, id))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar estado: {e}")
        return False
    finally:
        if conexion:
            conexion.close()

# ================== ELIMINAR ==================
def eliminar_config(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM CONFIGURACION WHERE idConfiguracion = %s;", (id,))
            conexion.commit()
            return True, "Configuración eliminada"
    except Exception as e:
        print(f"Error al eliminar config: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()