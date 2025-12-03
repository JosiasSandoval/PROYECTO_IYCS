from app.bd_sistema import obtener_conexion

# ================== LISTAR (CON FILTRO DE ROL) ==================
def listar_acto_parroquia(idUsuario, rol, es_admin_global=False, idParroquia=None):
    conexion = obtener_conexion()
    resultados = []
    try:
        with conexion.cursor() as cursor:
            # SQL SIN CAMPO ESTADO
            sql = """
                SELECT 
                    ap.idActoParroquia,
                    al.nombActo,
                    p.nombParroquia,
                    ap.diaSemana,
                    TIME_FORMAT(ap.horaInicioActo, '%%H:%%i') as horaFmt,
                    ap.costoBase,
                    ap.idActo,
                    ap.idParroquia
                FROM ACTO_PARROQUIA ap
                INNER JOIN ACTO_LITURGICO al ON ap.idActo = al.idActo
                INNER JOIN PARROQUIA p ON ap.idParroquia = p.idParroquia
            """

            rol_seguro = str(rol).strip().lower()

            if rol_seguro == 'administrador':
                # Si es administrador global, mostrar todos
                if es_admin_global:
                    cursor.execute(sql + " ORDER BY p.nombParroquia, al.nombActo")
                else:
                    # Si no es global, filtrar por su parroquia
                    if idParroquia:
                        sql += " WHERE ap.idParroquia = %s ORDER BY al.nombActo"
                        cursor.execute(sql, (idParroquia,))
                    else:
                        return []  # Si no tiene parroquia asignada, no mostrar nada
            
            elif rol_seguro in ['sacerdote', 'secretaria']:
                sql += """
                    INNER JOIN PARROQUIA_PERSONAL pp ON p.idParroquia = pp.idParroquia
                    INNER JOIN PERSONAL per ON pp.idPersonal = per.idPersonal
                    WHERE per.idUsuario = %s 
                    AND pp.vigenciaParrPers = 1
                    ORDER BY al.nombActo
                """
                cursor.execute(sql, (idUsuario,))
            else:
                return []

            filas = cursor.fetchall()
            for fila in filas:
                resultados.append({
                    'id': fila[0],
                    'nombActo': fila[1],
                    'nombParroquia': fila[2],
                    'diaSemana': fila[3],
                    'horaInicio': fila[4],
                    'costoBase': float(fila[5]),
                    'idActo': fila[6],
                    'idParroquia': fila[7]
                })
        return resultados
    except Exception as e:
        print(f"Error al listar: {e}")
        return []
    finally:
        if conexion: conexion.close()
        
# ================== CRUD BÁSICO ==================
def agregar_acto_parroquia(idActo, idParroquia, diaSemana, horaInicio, costoBase):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO ACTO_PARROQUIA (idActo, idParroquia, diaSemana, horaInicioActo, costoBase)
                VALUES (%s, %s, %s, %s, %s)
            """, (idActo, idParroquia, diaSemana, horaInicio, costoBase))
        conexion.commit()
        return True, "Programación registrada correctamente"
    except Exception as e:
        print(f"Error agregar: {e}")
        return False, str(e)
    finally:
        if conexion: conexion.close()

def actualizar_acto_parroquia(idAP, idActo, idParroquia, diaSemana, horaInicio, costoBase):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE ACTO_PARROQUIA 
                SET idActo=%s, idParroquia=%s, diaSemana=%s, horaInicioActo=%s, costoBase=%s
                WHERE idActoParroquia=%s
            """, (idActo, idParroquia, diaSemana, horaInicio, costoBase, idAP))
        conexion.commit()
        return True, "Programación actualizada correctamente"
    except Exception as e:
        print(f"Error actualizar: {e}")
        return False, str(e)
    finally:
        if conexion: conexion.close()

def eliminar_acto_parroquia(idAP):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM ACTO_PARROQUIA WHERE idActoParroquia=%s", (idAP,))
        conexion.commit()
        return True, "Eliminado correctamente"
    except Exception as e:
        return False, "No se puede eliminar (posiblemente ya tiene reservas asociadas)"
    finally:
        if conexion: conexion.close()

# ================== COMBOS (Helpers para el Modal) ==================
# Necesitamos cargar Actos y Parroquias en los <select>
def obtener_combos_ap(idUsuario, rol, es_admin_global=False, idParroquia=None):
    conexion = obtener_conexion()
    # Agregamos 'rol_usuario' a la respuesta
    data = {'actos': [], 'parroquias': [], 'rol_usuario': rol} 
    try:
        with conexion.cursor() as cursor:
            # 1. Cargar Actos
            cursor.execute("SELECT idActo, nombActo FROM ACTO_LITURGICO WHERE estadoActo=1")
            data['actos'] = [{'id': f[0], 'nombre': f[1]} for f in cursor.fetchall()]

            # 2. Cargar Parroquias
            if rol == 'Administrador':
                if es_admin_global:
                    # Admin global: todas las parroquias
                    cursor.execute("SELECT idParroquia, nombParroquia FROM PARROQUIA WHERE estadoParroquia=1")
                else:
                    # Admin local: solo su parroquia
                    if idParroquia:
                        cursor.execute("SELECT idParroquia, nombParroquia FROM PARROQUIA WHERE idParroquia = %s AND estadoParroquia=1", (idParroquia,))
                    else:
                        data['parroquias'] = []
            else:
                # Si es Sacerdote/Secretaria, SOLO trae su parroquia asignada
                cursor.execute("""
                    SELECT p.idParroquia, p.nombParroquia 
                    FROM PARROQUIA p
                    JOIN PARROQUIA_PERSONAL pp ON p.idParroquia = pp.idParroquia
                    JOIN PERSONAL per ON pp.idPersonal = per.idPersonal
                    WHERE per.idUsuario = %s AND pp.vigenciaParrPers = 1
                """, (idUsuario,))
            
            if 'parroquias' not in data or data['parroquias'] == []:
                data['parroquias'] = [{'id': f[0], 'nombre': f[1]} for f in cursor.fetchall()]
            
        return data
    except Exception as e:
        print(e)
        return data
    finally:
        if conexion: conexion.close()