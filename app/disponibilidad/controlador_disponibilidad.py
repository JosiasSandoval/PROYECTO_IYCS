from app.bd_sistema import obtener_conexion

# ================== OBTENER TODOS ==================
def obtener_disponibilidades():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idDisponibilidad, diaSemana, horaInicioDis, horaFinDis, 
                       estadoDisponibilidad, idParroquiaPersonal
                FROM DISPONIBILIDAD_HORARIO
                ORDER BY idParroquiaPersonal, diaSemana;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                # --- CORRECCIÓN AQUÍ ---
                # Convertimos a string directamente para evitar error de 'timedelta'
                hora_inicio = str(fila[2]) 
                hora_fin = str(fila[3])
                
                # (Opcional) Si quieres quitar los segundos '09:00:00' -> '09:00'
                if len(hora_inicio) > 5: hora_inicio = hora_inicio[:5]
                if len(hora_fin) > 5: hora_fin = hora_fin[:5]
                # -----------------------

                resultados.append({
                    "idDisponibilidad": fila[0],
                    "diaSemana": fila[1],
                    "horaInicioDis": hora_inicio,  # USAR LA VARIABLE CORREGIDA
                    "horaFinDis": hora_fin,        # USAR LA VARIABLE CORREGIDA
                    "estadoDisponibilidad": bool(fila[4]),
                    "idParroquiaPersonal": fila[5]
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener disponibilidades: {e}") # MIRA TU CONSOLA DE PYTHON
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UNO POR ID ==================
def obtener_disponibilidad_por_id(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idDisponibilidad, diaSemana, horaInicioDis, horaFinDis, 
                       estadoDisponibilidad, idParroquiaPersonal
                FROM DISPONIBILIDAD_HORARIO
                WHERE idDisponibilidad = %s;
            """, (id,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idDisponibilidad": fila[0],
                    "diaSemana": fila[1],
                    "horaInicioDis": fila[2].strftime('%H:%M'),
                    "horaFinDis": fila[3].strftime('%H:%M'),
                    "estadoDisponibilidad": bool(fila[4]),
                    "idParroquiaPersonal": fila[5]
                }
            return None
    except Exception as e:
        print(f"Error al obtener disponibilidad por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== REGISTRAR ==================
def registrar_disponibilidad(data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO DISPONIBILIDAD_HORARIO 
                (diaSemana, horaInicioDis, horaFinDis, estadoDisponibilidad, idParroquiaPersonal)
                VALUES (%s, %s, %s, %s, %s);
            """, (
                data["diaSemana"],
                data["horaInicioDis"],
                data["horaFinDis"],
                data.get("estadoDisponibilidad", True), # Activo por defecto
                data["idParroquiaPersonal"]
            ))
            conexion.commit()
            return True, "Disponibilidad registrada"
    except Exception as e:
        print(f"Error al registrar disponibilidad: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ==================
def actualizar_disponibilidad(id, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE DISPONIBILIDAD_HORARIO SET
                diaSemana = %s,
                horaInicioDis = %s,
                horaFinDis = %s,
                idParroquiaPersonal = %s
                WHERE idDisponibilidad = %s;
            """, (
                data["diaSemana"],
                data["horaInicioDis"],
                data["horaFinDis"],
                data["idParroquiaPersonal"],
                id
            ))
            conexion.commit()
            return True, "Disponibilidad actualizada"
    except Exception as e:
        print(f"Error al actualizar disponibilidad: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO ==================
def actualizar_estado_disponibilidad(id, estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE DISPONIBILIDAD_HORARIO 
                SET estadoDisponibilidad = %s
                WHERE idDisponibilidad = %s;
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
def eliminar_disponibilidad(id):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM DISPONIBILIDAD_HORARIO WHERE idDisponibilidad = %s;", (id,))
            conexion.commit()
            return True, "Disponibilidad eliminada"
    except Exception as e:
        print(f"Error al eliminar disponibilidad: {e}")
        return False, f"Error: {e}"
    finally:
        if conexion:
            conexion.close()


# ================== FUNCIÓN AUXILIAR (Para el Modal) ==================
def obtener_lista_personal_asignado():
    """
    Obtiene una lista del personal, su cargo y parroquia
    para poblar el <select> del modal.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    pp.idParroquiaPersonal, 
                    p.nombPers, p.apePatPers, 
                    c.nombCargo,
                    par.nombParroquia
                FROM PARROQUIA_PERSONAL pp
                JOIN PERSONAL p ON pp.idPersonal = p.idPersonal
                JOIN CARGO c ON pp.idCargo = c.idCargo
                JOIN PARROQUIA par ON pp.idParroquia = par.idParroquia
                WHERE pp.vigenciaParrPers = TRUE
                ORDER BY par.nombParroquia, p.apePatPers;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "id": fila[0],
                    # Ej: "Perez, Juan (Sacerdote @ Santa Rosa)"
                    "nombre": f"{fila[2]}, {fila[1]} ({fila[3]} @ {fila[4]})"
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener lista de personal asignado: {e}")
        return []
    finally:
        if conexion:
            conexion.close()