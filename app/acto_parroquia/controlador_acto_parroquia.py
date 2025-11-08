from app.bd_sistema import obtener_conexion

# ================== OBTENER TODOS (CON JOINS) ==================
def obtener_asignaciones():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Hacemos JOIN con ACTO_LITURGICO y PARROQUIA
            cursor.execute("""
                SELECT 
                    ap.idActoParroquia, 
                    ap.diaSemana, 
                    ap.horaInicioActo,
                    ap.idActo,
                    al.nombActo,
                    ap.idParroquia,
                    p.nombParroquia
                FROM ACTO_PARROQUIA ap
                JOIN ACTO_LITURGICO al ON ap.idActo = al.idActo
                JOIN PARROQUIA p ON ap.idParroquia = p.idParroquia
                ORDER BY p.nombParroquia, al.nombActo, ap.diaSemana;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idActoParroquia": fila[0],
                    "diaSemana": fila[1],
                    "horaInicioActo": fila[2].strftime('%H:%M'), # Formato HH:MM
                    "idActo": fila[3],
                    "nombActo": fila[4],
                    "idParroquia": fila[5],
                    "nombParroquia": fila[6]
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener asignaciones de actos: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UNO POR ID ==================
def obtener_asignacion_por_id(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Este no necesita JOIN, el JS ya tiene los nombres
            cursor.execute("""
                SELECT idActoParroquia, idActo, idParroquia, diaSemana, horaInicioActo
                FROM ACTO_PARROQUIA
                WHERE idActoParroquia = %s;
            """, (id,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idActoParroquia": fila[0],
                    "idActo": fila[1],
                    "idParroquia": fila[2],
                    "diaSemana": fila[3],
                    "horaInicioActo": fila[4].strftime('%H:%M'),
                }
            return None
    except Exception as e:
        print(f"Error al obtener asignación por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== REGISTRAR ==================
def registrar_asignacion(data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO ACTO_PARROQUIA 
                (idActo, idParroquia, diaSemana, horaInicioActo)
                VALUES (%s, %s, %s, %s);
            """, (
                data["idActo"],
                data["idParroquia"],
                data["diaSemana"],
                data["horaInicioActo"]
            ))
            conexion.commit()
            return True, "Asignación registrada"
    except Exception as e:
        print(f"Error al registrar asignación: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ==================
def actualizar_asignacion(id, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE ACTO_PARROQUIA SET
                idActo = %s,
                idParroquia = %s,
                diaSemana = %s,
                horaInicioActo = %s
                WHERE idActoParroquia = %s;
            """, (
                data["idActo"],
                data["idParroquia"],
                data["diaSemana"],
                data["horaInicioActo"],
                id
            ))
            conexion.commit()
            return True, "Asignación actualizada"
    except Exception as e:
        print(f"Error al actualizar asignación: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ELIMINAR ==================
def eliminar_asignacion(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM ACTO_PARROQUIA WHERE idActoParroquia = %s;", (id,))
            conexion.commit()
            return True, "Asignación eliminada"
    except Exception as e:
        print(f"Error al eliminar asignación: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()