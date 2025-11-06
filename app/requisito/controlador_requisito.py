from app.bd_sistema import obtener_conexion

# ================== OBTENER TODOS ==================
def obtener_requisitos():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idRequisito, nombRequisito, f_requisito, descripcion, estadoRequisito
                FROM REQUISITO
                ORDER BY nombRequisito ASC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idRequisito": fila[0],
                    "nombRequisito": fila[1],
                    "f_requisito": fila[2].isoformat() if fila[2] else None, # Convertir fecha a string
                    "descripcion": fila[3],
                    "estadoRequisito": bool(fila[4])
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener requisitos: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UNO POR ID ==================
def obtener_requisito_por_id(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idRequisito, nombRequisito, f_requisito, descripcion, estadoRequisito
                FROM REQUISITO
                WHERE idRequisito = %s;
            """, (id,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idRequisito": fila[0],
                    "nombRequisito": fila[1],
                    "f_requisito": fila[2].isoformat() if fila[2] else None,
                    "descripcion": fila[3],
                    "estadoRequisito": bool(fila[4])
                }
            return None
    except Exception as e:
        print(f"Error al obtener requisito por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== REGISTRAR ==================
def registrar_requisito(data):
    conexion = obtener_conexion()
    try:
        # Convertir fecha vacía a None (NULL)
        f_requisito = data.get("f_requisito") if data.get("f_requisito") else None
        
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO REQUISITO 
                (nombRequisito, f_requisito, descripcion, estadoRequisito)
                VALUES (%s, %s, %s, %s);
            """, (
                data["nombRequisito"],
                f_requisito,
                data.get("descripcion"),
                data.get("estadoRequisito", True) # Activo por defecto
            ))
            conexion.commit()
            return True, "Requisito registrado"
    except Exception as e:
        print(f"Error al registrar requisito: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ==================
def actualizar_requisito(id, data):
    conexion = obtener_conexion()
    try:
        f_requisito = data.get("f_requisito") if data.get("f_requisito") else None

        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE REQUISITO SET
                nombRequisito = %s,
                f_requisito = %s,
                descripcion = %s
                WHERE idRequisito = %s;
            """, (
                data["nombRequisito"],
                f_requisito,
                data.get("descripcion"),
                id
            ))
            conexion.commit()
            return True, "Requisito actualizado"
    except Exception as e:
        print(f"Error al actualizar requisito: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO ==================
def actualizar_estado_requisito(id, estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE REQUISITO 
                SET estadoRequisito = %s
                WHERE idRequisito = %s;
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
def eliminar_requisito(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM REQUISITO WHERE idRequisito = %s;", (id,))
            conexion.commit()
            return True, "Requisito eliminado"
    except Exception as e:
        print(f"Error al eliminar requisito: {e}")
        # Manejo de error si está en uso
        if "foreign key constraint" in str(e).lower():
            return False, "Error: El requisito está siendo usado por un Acto Litúrgico."
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()