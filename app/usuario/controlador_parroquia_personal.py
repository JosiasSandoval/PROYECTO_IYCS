from app.bd_sistema import obtener_conexion

# ================== OBTENER LISTADO (JOIN) ==================
def obtener_asignaciones_pp(id_usuario_logueado, rol_usuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Consulta base
            sql = """
                SELECT 
                    pp.idParroquiaPersonal, 
                    CONCAT(p.nombPers, ' ', p.apePatPers, ' ', p.apeMatPers) as nombrePersonal,
                    pp.f_inicio, 
                    pp.f_fin, 
                    pp.vigenciaParrPers,
                    c.nombCargo,
                    pa.nombParroquia,
                    pp.idPersonal, pp.idCargo, pp.idParroquia
                FROM PARROQUIA_PERSONAL pp
                INNER JOIN PERSONAL p ON pp.idPersonal = p.idPersonal
                INNER JOIN CARGO c ON pp.idCargo = c.idCargo
                INNER JOIN PARROQUIA pa ON pp.idParroquia = pa.idParroquia
            """
            
            # Lógica de Filtro
            params = ()
            if rol_usuario != 'Administrador':
                # Si es Secretaria o Sacerdote, filtramos por SUS parroquias
                ids_parroquias = obtener_ids_parroquias_usuario(id_usuario_logueado)
                
                if not ids_parroquias:
                    return [] # No tiene parroquia asignada, no ve nada
                
                # Crear string para el IN sql (ej: "%s, %s")
                placeholders = ', '.join(['%s'] * len(ids_parroquias))
                sql += f" WHERE pp.idParroquia IN ({placeholders})"
                params = tuple(ids_parroquias)

            sql += " ORDER BY pp.f_inicio DESC"
            
            cursor.execute(sql, params)
            filas = cursor.fetchall()
            
            resultados = []
            for f in filas:
                resultados.append({
                    "idParroquiaPersonal": f[0],
                    "nombrePersonal": f[1],
                    "f_inicio": str(f[2]) if f[2] else None,
                    "f_fin": str(f[3]) if f[3] else None,
                    "vigencia": bool(f[4]),
                    "nombreCargo": f[5],
                    "nombreParroquia": f[6],
                    "idPersonal": f[7],
                    "idCargo": f[8],
                    "idParroquia": f[9]
                })
            return resultados
    except Exception as e:
        print(f"Error obtener_asignaciones_pp: {e}")
        return []
    finally:
        if conexion: conexion.close()

# ================== GUARDAR (INSERT) ==================
def registrar_asignacion_pp(data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = """
                INSERT INTO PARROQUIA_PERSONAL 
                (idPersonal, idCargo, idParroquia, f_inicio, f_fin, vigenciaParrPers)
                VALUES (%s, %s, %s, %s, %s, %s)
            """
            # Por defecto al crear es vigente (True = 1)
            cursor.execute(sql, (
                data['idPersonal'], data['idCargo'], data['idParroquia'],
                data['f_inicio'], data.get('f_fin'), True
            ))
            conexion.commit()
            return True, "Asignación registrada correctamente"
    except Exception as e:
        return False, f"Error al registrar: {e}"
    finally:
        if conexion: conexion.close()

# ================== ACTUALIZAR (UPDATE) ==================
def actualizar_asignacion_pp(id_pp, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = """
                UPDATE PARROQUIA_PERSONAL
                SET idPersonal=%s, idCargo=%s, idParroquia=%s, f_inicio=%s, f_fin=%s
                WHERE idParroquiaPersonal=%s
            """
            cursor.execute(sql, (
                data['idPersonal'], data['idCargo'], data['idParroquia'],
                data['f_inicio'], data.get('f_fin'), id_pp
            ))
            conexion.commit()
            return True, "Asignación actualizada correctamente"
    except Exception as e:
        return False, f"Error al actualizar: {e}"
    finally:
        if conexion: conexion.close()

# ================== CAMBIAR ESTADO (VIGENCIA) ==================
def cambiar_vigencia_pp(id_pp, nuevo_estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = "UPDATE PARROQUIA_PERSONAL SET vigenciaParrPers=%s WHERE idParroquiaPersonal=%s"
            cursor.execute(sql, (nuevo_estado, id_pp))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error cambiar_vigencia_pp: {e}")
        return False
    finally:
        if conexion: conexion.close()

# ================== ELIMINAR (DELETE) ==================
def eliminar_asignacion_pp(id_pp):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Eliminamos posibles dependencias en disponibilidad horaria
            cursor.execute("DELETE FROM DISPONIBILIDAD_HORARIO WHERE idParroquiaPersonal = %s", (id_pp,))
            
            # Eliminamos la asignación
            cursor.execute("DELETE FROM PARROQUIA_PERSONAL WHERE idParroquiaPersonal=%s", (id_pp,))
            conexion.commit()
            return True, "Registro eliminado correctamente"
    except Exception as e:
        return False, f"Error al eliminar: {e}"
    finally:
        if conexion: conexion.close()

# ================== COMBOS (SELECTS) ==================
def obtener_combos_pp(id_usuario_logueado, rol_usuario):
    conn = obtener_conexion()
    data = {"personal": [], "cargos": [], "parroquias": []}
    try:
        with conn.cursor() as cursor:
            # 1. PERSONAL: SIEMPRE GLOBAL (Tu requerimiento específico)
            # Queremos ver a TODOS para poder contratar a alguien nuevo
            cursor.execute("""
                SELECT idPersonal, CONCAT(nombPers,' ',apePatPers,' (',numDocPers,')') 
                FROM PERSONAL 
                ORDER BY nombPers
            """)
            data["personal"] = [{"id": x[0], "nombre": x[1]} for x in cursor.fetchall()]

            # 2. CARGOS: GLOBAL
            cursor.execute("SELECT idCargo, nombCargo FROM CARGO WHERE estadoCargo=1 ORDER BY nombCargo")
            data["cargos"] = [{"id": x[0], "nombre": x[1]} for x in cursor.fetchall()]

            # 3. PARROQUIAS: FILTRADO
            # La secretaria solo puede asignar gente a SU parroquia, no a la del vecino.
            sql_parr = "SELECT idParroquia, nombParroquia FROM PARROQUIA WHERE estadoParroquia=1"
            params_parr = ()

            if rol_usuario != 'Administrador':
                ids = obtener_ids_parroquias_usuario(id_usuario_logueado)
                if ids:
                    placeholders = ', '.join(['%s'] * len(ids))
                    sql_parr += f" AND idParroquia IN ({placeholders})"
                    params_parr = tuple(ids)
                else:
                    # Caso borde: usuario sin parroquia asignada
                    sql_parr += " AND 1=0" 

            sql_parr += " ORDER BY nombParroquia"
            cursor.execute(sql_parr, params_parr)
            data["parroquias"] = [{"id": x[0], "nombre": x[1]} for x in cursor.fetchall()]
            
        return data
    except Exception as e:
        print(f"Error combos: {e}")
        return data
    finally:
        if conn: conn.close()


def obtener_ids_parroquias_usuario(id_usuario):
    """Devuelve una lista de IDs de parroquias donde el usuario es personal vigente"""
    conexion = obtener_conexion()
    ids = []
    try:
        with conexion.cursor() as cursor:
            sql = """
                SELECT DISTINCT pp.idParroquia 
                FROM PARROQUIA_PERSONAL pp
                INNER JOIN PERSONAL p ON pp.idPersonal = p.idPersonal
                WHERE p.idUsuario = %s AND pp.vigenciaParrPers = 1
            """
            cursor.execute(sql, (id_usuario,))
            resultados = cursor.fetchall()
            ids = [row[0] for row in resultados]
    except Exception as e:
        print(f"Error obteniendo parroquias usuario: {e}")
    finally:
        conexion.close()
    return ids