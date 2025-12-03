from app.bd_sistema import obtener_conexion

def listar_disponibilidad(idUsuario, rol):
    conexion = obtener_conexion()
    resultados = []
    
    # Normalizamos rol
    rol_seguro = str(rol).strip().lower()

    try:
        with conexion.cursor() as cursor:
            # Consulta Base: Unimos Disponibilidad -> ParroquiaPersonal -> Personal, Cargo y Parroquia
            sql = """
                SELECT 
                    d.idDisponibilidad,
                    pe.nombPers, pe.apePatPers, pe.apeMatPers,
                    c.nombCargo,
                    pa.nombParroquia,
                    d.diaSemana,
                    TIME_FORMAT(d.horaInicioDis, '%%H:%%i'),
                    TIME_FORMAT(d.horaFinDis, '%%H:%%i'),
                    d.estadoDisponibilidad,
                    d.idParroquiaPersonal
                FROM DISPONIBILIDAD_HORARIO d
                INNER JOIN PARROQUIA_PERSONAL pp ON d.idParroquiaPersonal = pp.idParroquiaPersonal
                INNER JOIN PERSONAL pe ON pp.idPersonal = pe.idPersonal
                INNER JOIN CARGO c ON pp.idCargo = c.idCargo
                INNER JOIN PARROQUIA pa ON pp.idParroquia = pa.idParroquia
            """

            if rol_seguro == 'administrador':
                # Admin ve todo ordenado por Parroquia y luego Nombre
                cursor.execute(sql + " ORDER BY pa.nombParroquia, pe.nombPers")
            
            elif rol_seguro in ['sacerdote', 'secretaria']:
                # Filtras por la parroquia del usuario conectado
                sql += """
                    INNER JOIN PARROQUIA_PERSONAL pp_user ON pa.idParroquia = pp_user.idParroquia
                    INNER JOIN PERSONAL pe_user ON pp_user.idPersonal = pe_user.idPersonal
                    WHERE pe_user.idUsuario = %s 
                    AND pp_user.vigenciaParrPers = 1
                    ORDER BY pe.nombPers
                """
                cursor.execute(sql, (idUsuario,))
            else:
                return []

            filas = cursor.fetchall()
            for fila in filas:
                nombre_completo = f"{fila[1]} {fila[2]} {fila[3]}"
                resultados.append({
                    'id': fila[0],
                    'nombrePersonal': nombre_completo,
                    'cargo': fila[4],
                    'parroquia': fila[5],
                    'dia': fila[6],
                    'inicio': fila[7],
                    'fin': fila[8],
                    'estado': bool(fila[9]),
                    'idPP': fila[10] # ID ParroquiaPersonal para editar
                })
        return resultados
    except Exception as e:
        print(f"Error listar disponibilidad: {e}")
        return []
    finally:
        if conexion: conexion.close()

def validar_cruce_horario(idPP, dia, inicio, fin, idExcluir=None):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Lógica de cruce: (InicioA < FinB) Y (FinA > InicioB)
            # Solo verificamos horarios ACTIVOS (estadoDisponibilidad = 1)
            sql = """
                SELECT COUNT(*) FROM DISPONIBILIDAD_HORARIO 
                WHERE idParroquiaPersonal = %s 
                AND diaSemana = %s 
                AND estadoDisponibilidad = 1
                AND (horaInicioDis < %s AND horaFinDis > %s)
            """
            params = [idPP, dia, fin, inicio]

            # Si es edición, excluimos el propio registro para que no choque consigo mismo
            if idExcluir:
                sql += " AND idDisponibilidad != %s"
                params.append(idExcluir)

            cursor.execute(sql, tuple(params))
            count = cursor.fetchone()[0]
            
            return count > 0 # Devuelve True si hay cruce
    except Exception as e:
        print(f"Error validando cruce: {e}")
        return True # Ante la duda, bloqueamos
    finally:
        if conexion: conexion.close()

# === AGREGAR (MODIFICADO) ===
def agregar_disponibilidad(dia, inicio, fin, idPP):
    # 1. Validar horas lógicas
    if inicio >= fin:
        return False, "La hora de inicio debe ser menor a la hora de fin."

    # 2. Validar cruce
    if validar_cruce_horario(idPP, dia, inicio, fin):
        return False, f"Ya existe un horario asignado que se cruza con {inicio} - {fin} el {dia}."

    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO DISPONIBILIDAD_HORARIO (diaSemana, horaInicioDis, horaFinDis, estadoDisponibilidad, idParroquiaPersonal)
                VALUES (%s, %s, %s, TRUE, %s)
            """, (dia, inicio, fin, idPP))
        conexion.commit()
        return True, "Horario registrado correctamente"
    except Exception as e:
        return False, str(e)
    finally:
        if conexion: conexion.close()

# === ACTUALIZAR (MODIFICADO) ===
def actualizar_disponibilidad(idDisp, dia, inicio, fin, idPP):
    # 1. Validar horas lógicas
    if inicio >= fin:
        return False, "La hora de inicio debe ser menor a la hora de fin."

    # 2. Validar cruce (pasando el ID actual para excluirlo)
    if validar_cruce_horario(idPP, dia, inicio, fin, idExcluir=idDisp):
        return False, f"El nuevo horario se cruza con otro existente para este personal el {dia}."

    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE DISPONIBILIDAD_HORARIO 
                SET diaSemana=%s, horaInicioDis=%s, horaFinDis=%s, idParroquiaPersonal=%s
                WHERE idDisponibilidad=%s
            """, (dia, inicio, fin, idPP, idDisp))
        conexion.commit()
        return True, "Horario actualizado correctamente"
    except Exception as e:
        return False, str(e)
    finally:
        if conexion: conexion.close()

def actualizar_disponibilidad(idDisp, dia, inicio, fin, idPP):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE DISPONIBILIDAD_HORARIO 
                SET diaSemana=%s, horaInicioDis=%s, horaFinDis=%s, idParroquiaPersonal=%s
                WHERE idDisponibilidad=%s
            """, (dia, inicio, fin, idPP, idDisp))
        conexion.commit()
        return True, "Horario actualizado"
    except Exception as e:
        return False, str(e)
    finally:
        if conexion: conexion.close()

def cambiar_estado_disponibilidad(idDisp, nuevo_estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("UPDATE DISPONIBILIDAD_HORARIO SET estadoDisponibilidad=%s WHERE idDisponibilidad=%s", (nuevo_estado, idDisp))
        conexion.commit()
        return True, "Estado actualizado"
    except Exception as e:
        return False, str(e)
    finally:
        if conexion: conexion.close()

def eliminar_disponibilidad(idDisp):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM DISPONIBILIDAD_HORARIO WHERE idDisponibilidad=%s", (idDisp,))
        conexion.commit()
        return True, "Horario eliminado"
    except Exception as e:
        return False, str(e)
    finally:
        if conexion: conexion.close()

# Obtiene la lista de personal activo para el select del modal
def obtener_combos_disp(idUsuario, rol):
    conexion = obtener_conexion()
    data = []
    rol_seguro = str(rol).strip().lower()
    
    try:
        with conexion.cursor() as cursor:
            sql = """
                SELECT pp.idParroquiaPersonal, pe.nombPers, pe.apePatPers, c.nombCargo, pa.nombParroquia
                FROM PARROQUIA_PERSONAL pp
                INNER JOIN PERSONAL pe ON pp.idPersonal = pe.idPersonal
                INNER JOIN CARGO c ON pp.idCargo = c.idCargo
                INNER JOIN PARROQUIA pa ON pp.idParroquia = pa.idParroquia
                WHERE pp.vigenciaParrPers = 1
            """
            
            if rol_seguro == 'administrador':
                cursor.execute(sql + " ORDER BY pa.nombParroquia, pe.nombPers")
            else:
                # Solo personal de SU parroquia
                sql += """
                    AND pa.idParroquia IN (
                        SELECT pp_u.idParroquia 
                        FROM PARROQUIA_PERSONAL pp_u 
                        JOIN PERSONAL pe_u ON pp_u.idPersonal = pe_u.idPersonal 
                        WHERE pe_u.idUsuario = %s AND pp_u.vigenciaParrPers = 1
                    )
                    ORDER BY pe.nombPers
                """
                cursor.execute(sql, (idUsuario,))

            for f in cursor.fetchall():
                # Formato: "Juan Perez - Párroco (Catedral)"
                texto = f"{f[1]} {f[2]} - {f[3]} ({f[4]})"
                data.append({'id': f[0], 'texto': texto})
                
        return data
    except Exception as e:
        print(e)
        return []
    finally:
        if conexion: conexion.close()