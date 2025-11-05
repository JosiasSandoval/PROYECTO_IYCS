from app.bd_sistema import obtener_conexion

# ================== OBTENER TODOS ==================
def obtener_documentos():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idTipoDocumento, nombDocumento, abreviatura, estadoDocumento
                FROM TIPO_DOCUMENTO
                ORDER BY idTipoDocumento DESC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idTipoDocumento": fila[0],
                    "nombDocumento": fila[1],
                    "abreviatura": fila[2],
                    "estadoDocumento": bool(fila[3])
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener tipos de documento: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER POR ID ==================
def obtener_documento_por_id(idTipoDocumento):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idTipoDocumento, nombDocumento, abreviatura, estadoDocumento
                FROM TIPO_DOCUMENTO
                WHERE idTipoDocumento = %s;
            """, (idTipoDocumento,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idTipoDocumento": fila[0],
                    "nombDocumento": fila[1],
                    "abreviatura": fila[2],
                    "estadoDocumento": bool(fila[3])
                }
            return None
    except Exception as e:
        print(f"Error al obtener tipo de documento: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== AGREGAR ==================
def registrar_documento(data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO TIPO_DOCUMENTO (nombDocumento, abreviatura, estadoDocumento)
                VALUES (%s, %s, %s);
            """, (
                data["nombDocumento"],
                data["abreviatura"],
                data.get("estadoDocumento", True)  # Default a True (activo)
            ))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al registrar tipo de documento: {e}")
        return False
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR (COMPLETO) ==================
def actualizar_documento(idTipoDocumento, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE TIPO_DOCUMENTO
                SET nombDocumento=%s, abreviatura=%s, estadoDocumento=%s
                WHERE idTipoDocumento=%s;
            """, (
                data["nombDocumento"],
                data["abreviatura"],
                data["estadoDocumento"],
                idTipoDocumento
            ))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar tipo de documento: {e}")
        return False
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
def actualizar_estado_documento(idTipoDocumento, estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE TIPO_DOCUMENTO
                SET estadoDocumento=%s
                WHERE idTipoDocumento=%s;
            """, (estado, idTipoDocumento))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar estado de tipo de documento: {e}")
        return False
    finally:
        if conexion:
            conexion.close()

# ================== ELIMINAR ==================
def eliminar_documento(idTipoDocumento):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM TIPO_DOCUMENTO WHERE idTipoDocumento = %s;", (idTipoDocumento,))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al eliminar tipo de documento: {e}")
        # Puedes querer manejar errores de foreign key aquí
        return False
    finally:
        if conexion:
            conexion.close()