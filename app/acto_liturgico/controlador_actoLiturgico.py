from app.bd_sistema import obtener_conexion

# ================== OBTENER TODOS ==================
def obtener_actos():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idActo, nombActo, descripcion, costoBase, estadoActo, imgActo
                FROM acto_liturgico
                ORDER BY idActo DESC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idActo": fila[0],
                    "nombActo": fila[1],
                    "descripcion": fila[2],
                    "costoBase": float(fila[3]),
                    "estadoActo": bool(fila[4]),
                    "imgActo": fila[5]
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener actos litúrgicos: {e}")
        return []
    finally:
        if conexion:
            conexion.close()


# ================== OBTENER POR ID ==================
def obtener_acto_por_id(idActo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idActo, nombActo, descripcion, costoBase, estadoActo, imgActo
                FROM acto_liturgico
                WHERE idActo = %s;
            """, (idActo,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idActo": fila[0],
                    "nombActo": fila[1],
                    "descripcion": fila[2],
                    "costoBase": float(fila[3]),
                    "estadoActo": bool(fila[4]),
                    "imgActo": fila[5]
                }
            return None
    except Exception as e:
        print(f"Error al obtener acto litúrgico: {e}")
        return None
    finally:
        if conexion:
            conexion.close()


# ================== AGREGAR ==================
def registrar_acto(data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO acto_liturgico (nombActo, descripcion, costoBase, estadoActo, imgActo)
                VALUES (%s, %s, %s, %s, %s);
            """, (
                data["nombActo"],
                data.get("descripcion"),
                data["costoBase"],
                data["estadoActo"],
                data["imgActo"]
            ))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al registrar acto litúrgico: {e}")
        return False
    finally:
        if conexion:
            conexion.close()


# ================== ACTUALIZAR ==================
def actualizar_acto(idActo, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE acto_liturgico
                SET nombActo=%s, descripcion=%s, costoBase=%s, estadoActo=%s, imgActo=%s
                WHERE idActo=%s;
            """, (
                data["nombActo"],
                data.get("descripcion"),
                data["costoBase"],
                data["estadoActo"],
                data["imgActo"],
                idActo
            ))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar acto litúrgico: {e}")
        return False
    finally:
        if conexion:
            conexion.close()


# ================== ELIMINAR ==================
def eliminar_acto(idActo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM acto_liturgico WHERE idActo = %s;", (idActo,))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al eliminar acto litúrgico: {e}")
        return False
    finally:
        if conexion:
            conexion.close()
