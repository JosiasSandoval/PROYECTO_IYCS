from app.bd_sistema import obtener_conexion

# ================== OBTENER TODOS (CON JOIN) ==================
def obtener_excepciones():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Unimos con Personal para obtener el nombre
            cursor.execute("""
                SELECT 
                    e.idExcepcion, e.nombreExcepcion, e.fechaInicioExcepcion, 
                    e.fechaFinExcepcion, e.motivoExcepcion, e.tipoExcepcion, 
                    e.estadoExcepcion, e.idPersonal,
                    p.nombPers, p.apePatPers, p.apeMatPers
                FROM EXCEPCION_PERSONAL e
                JOIN PERSONAL p ON e.idPersonal = p.idPersonal
                ORDER BY e.fechaInicioExcepcion DESC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idExcepcion": fila[0],
                    "nombreExcepcion": fila[1],
                    "fechaInicioExcepcion": fila[2].isoformat() if fila[2] else None,
                    "fechaFinExcepcion": fila[3].isoformat() if fila[3] else None,
                    "motivoExcepcion": fila[4],
                    "tipoExcepcion": fila[5],
                    "estadoExcepcion": bool(fila[6]),
                    "idPersonal": fila[7],
                    "nombPers": fila[8],
                    "apePatPers": fila[9],
                    "apeMatPers": fila[10]
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener excepciones: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UNO POR ID ==================
def obtener_excepcion_por_id(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT * FROM EXCEPCION_PERSONAL WHERE idExcepcion = %s;", (id,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idExcepcion": fila[0],
                    "nombreExcepcion": fila[1],
                    "fechaInicioExcepcion": fila[2].isoformat() if fila[2] else None,
                    "fechaFinExcepcion": fila[3].isoformat() if fila[3] else None,
                    "motivoExcepcion": fila[4],
                    "tipoExcepcion": fila[5],
                    "estadoExcepcion": bool(fila[6]),
                    "idPersonal": fila[7]
                }
            return None
    except Exception as e:
        print(f"Error al obtener excepcion por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== REGISTRAR ==================
def registrar_excepcion(data):
    conexion = obtener_conexion()
    try:
        # Convertir fechas vacías a None (NULL)
        f_inicio = data.get("fechaInicioExcepcion")
        f_fin = data.get("fechaFinExcepcion") if data.get("fechaFinExcepcion") else None
        
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO EXCEPCION_PERSONAL 
                (nombreExcepcion, fechaInicioExcepcion, fechaFinExcepcion, 
                 motivoExcepcion, tipoExcepcion, estadoExcepcion, idPersonal)
                VALUES (%s, %s, %s, %s, %s, %s, %s);
            """, (
                data["nombreExcepcion"],
                f_inicio,
                f_fin,
                data["motivoExcepcion"],
                data["tipoExcepcion"],
                data.get("estadoExcepcion", True), # Activo por defecto
                data["idPersonal"]
            ))
            conexion.commit()
            return True, "Excepción registrada"
    except Exception as e:
        print(f"Error al registrar excepción: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ==================
def actualizar_excepcion(id, data):
    conexion = obtener_conexion()
    try:
        f_inicio = data.get("fechaInicioExcepcion")
        f_fin = data.get("fechaFinExcepcion") if data.get("fechaFinExcepcion") else None

        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE EXCEPCION_PERSONAL SET
                nombreExcepcion = %s,
                fechaInicioExcepcion = %s,
                fechaFinExcepcion = %s,
                motivoExcepcion = %s,
                tipoExcepcion = %s,
                idPersonal = %s
                WHERE idExcepcion = %s;
            """, (
                data["nombreExcepcion"],
                f_inicio,
                f_fin,
                data["motivoExcepcion"],
                data["tipoExcepcion"],
                data["idPersonal"],
                id
            ))
            conexion.commit()
            return True, "Excepción actualizada"
    except Exception as e:
        print(f"Error al actualizar excepción: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO ==================
def actualizar_estado_excepcion(id, estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE EXCEPCION_PERSONAL 
                SET estadoExcepcion = %s
                WHERE idExcepcion = %s;
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
def eliminar_excepcion(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM EXCEPCION_PERSONAL WHERE idExcepcion = %s;", (id,))
            conexion.commit()
            return True, "Excepción eliminada"
    except Exception as e:
        print(f"Error al eliminar excepción: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== FUNCIÓN AUXILIAR (Para el Modal) ==================
def obtener_lista_simple_personal():
    """
    Obtiene una lista simple de todo el personal para un dropdown.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idPersonal, nombPers, apePatPers, apeMatPers 
                FROM PERSONAL
                ORDER BY apePatPers ASC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "id": fila[0],
                    # Ej: "Perez, Juan"
                    "nombre": f"{fila[2]}, {fila[3]}, {fila[1]}"
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener lista simple de personal: {e}")
        return []
    finally:
        if conexion:
            conexion.close()