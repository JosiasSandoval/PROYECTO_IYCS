from app.bd_sistema import obtener_conexion 

# ================== OBTENER TODOS ==================
def obtener_actos():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Eliminado costoBase del SELECT
            cursor.execute("""
                SELECT idActo, nombActo, descripcion, numParticipantes, 
                       tipoParticipantes, estadoActo, imgActo
                FROM ACTO_LITURGICO
                ORDER BY idActo ASC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idActo": fila[0],
                    "nombActo": fila[1],
                    "descripcion": fila[2],
                    "numParticipantes": fila[3],
                    "tipoParticipantes": fila[4],
                    "estadoActo": bool(fila[5]),
                    "imgActo": fila[6]
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
            # Eliminado costoBase del SELECT
            cursor.execute("""
                SELECT idActo, nombActo, descripcion, numParticipantes, 
                       tipoParticipantes, estadoActo, imgActo
                FROM ACTO_LITURGICO
                WHERE idActo = %s;
            """, (idActo,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idActo": fila[0],
                    "nombActo": fila[1],
                    "descripcion": fila[2],
                    "numParticipantes": fila[3],
                    "tipoParticipantes": fila[4],
                    "estadoActo": bool(fila[5]),
                    "imgActo": fila[6]
                }
            return None
    except Exception as e:
        print(f"Error al obtener acto litúrgico: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== REGISTRAR ==================
def registrar_acto(data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Eliminado costoBase del INSERT
            cursor.execute("""
                INSERT INTO ACTO_LITURGICO (
                    nombActo, descripcion, numParticipantes, tipoParticipantes, 
                    estadoActo, imgActo
                ) VALUES (%s, %s, %s, %s, %s, %s);
            """, (
                data["nombActo"],
                data.get("descripcion"),
                data["numParticipantes"],
                data["tipoParticipantes"],
                data.get("estadoActo", True),
                data["imgActo"]
            ))
            conexion.commit()
            return True, "Acto registrado"
    except Exception as e:
        print(f"Error al registrar acto litúrgico: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ==================
def actualizar_acto(idActo, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Eliminado costoBase del UPDATE
            cursor.execute("""
                UPDATE ACTO_LITURGICO SET
                nombActo = %s,
                descripcion = %s,
                numParticipantes = %s,
                tipoParticipantes = %s,
                imgActo = %s
                WHERE idActo = %s;
            """, (
                data["nombActo"],
                data.get("descripcion"),
                data["numParticipantes"],
                data["tipoParticipantes"],
                data["imgActo"],
                idActo
            ))
            conexion.commit()
            return True, "Acto actualizado"
    except Exception as e:
        print(f"Error al actualizar acto litúrgico: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO ==================
def actualizar_estado_acto(id, estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "UPDATE ACTO_LITURGICO SET estadoActo = %s WHERE idActo = %s",
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
def eliminar_acto(idActo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM ACTO_REQUISITO WHERE idActo = %s;", (idActo,))
            cursor.execute("DELETE FROM ACTO_PARROQUIA WHERE idActo = %s;", (idActo,))
            cursor.execute("DELETE FROM ACTO_LITURGICO WHERE idActo = %s;", (idActo,))
            conexion.commit()
            return True, "Acto eliminado"
    except Exception as e:
        print(f"Error al eliminar acto litúrgico: {e}")
        if "foreign key constraint" in str(e).lower():
            return False, "Error: Este acto está siendo usado en una reserva."
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()