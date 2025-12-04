from app.bd_sistema import obtener_conexion
from datetime import datetime
# ======================================================
# 🔹 OBTENER DATOS PARA EL MAPA
# ======================================================
def get_obtener_mapa_datos():
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idParroquia, nombParroquia,descripcionBreve, latParroquia, logParroquia,
                       historiaParroquia, direccion, telefonoContacto, color
                FROM PARROQUIA
            """)
            resultados = [
                {
                    'idParroquia': f[0],
                    'nombParroquia': f[1],
                    'descripcionBreve': f[2],
                    'latParroquia': float(f[3]) if f[3] else None,
                    'logParroquia': float(f[4]) if f[4] else None,
                    'historiaParroquia': f[5],
                    'direccion': f[6],
                    'telefonoContacto': f[7],
                    'color': f[8]
                }
                for f in cursor.fetchall()
            ]
        return resultados
    except Exception as e:
        print(f"Error al obtener datos del mapa: {e}")
        return []
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 UBICAR PARROQUIA POR NOMBRE
# ======================================================
def ubicar_parroquia(nombParroquia):
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT nombParroquia, latParroquia, logParroquia, color
                FROM PARROQUIA
                WHERE nombParroquia = %s
            """, (nombParroquia,))
            fila = cursor.fetchone()
            if fila:
                return {
                    'nombParroquia': fila[0],
                    'latParroquia': float(fila[1]),
                    'logParroquia': float(fila[2]),
                    'color': fila[3]
                }
            return None
    except Exception as e:
        print(f"Error al ubicar parroquia: {e}")
        return None
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 OBTENER INFORMACIÓN DETALLADA
# ======================================================
def obtener_informacion_parroquia(idParroquia):
    conexion = None
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT nombParroquia,
                       historiaParroquia,
                       f_creacion,
                       ruc,
                       email,
                       telefonoContacto,
                       direccion,
                       color,
                       latParroquia,
                       logParroquia,
                       estadoParroquia
                FROM PARROQUIA
                WHERE idParroquia = %s
            """, (idParroquia,))
            fila = cursor.fetchone()
            if fila:
                # Obtener sacerdotes de la parroquia
                cursor.execute("""
                    SELECT CONCAT(pe.nombPers, ' ', pe.apePatPers, ' ', pe.apeMatPers) AS nombre
                    FROM parroquia_personal pp
                    INNER JOIN personal pe ON pp.idPersonal = pe.idPersonal
                    INNER JOIN usuario us ON pe.idUsuario = us.idUsuario
                    INNER JOIN rol_usuario ru ON us.idUsuario = ru.idUsuario
                    INNER JOIN rol r ON ru.idRol = r.idRol
                    WHERE pp.idParroquia = %s 
                    AND r.nombRol = 'Sacerdote'
                    AND pp.vigenciaParrPers = TRUE
                    ORDER BY pe.nombPers
                """, (idParroquia,))
                
                sacerdotes = [{'nombre': row[0]} for row in cursor.fetchall()]
                
                return {
                    'nombParroquia': fila[0],
                    'historiaParroquia': fila[1],
                    'f_creacion': fila[2],
                    'ruc': fila[3],
                    'email': fila[4],
                    'telefonoContacto': fila[5],
                    'direccion': fila[6],
                    'color': fila[7],
                    'latParroquia': float(fila[8]) if fila[8] is not None else None,
                    'logParroquia': float(fila[9]) if fila[9] is not None else None,
                    'estadoParroquia': fila[10],
                    'sacerdotes': sacerdotes
                }
            return None
    except Exception as e:
        print(f"Error al obtener información de la parroquia: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ======================================================
# 🔹 OBTENER ID PARROQUIA DE SECRETARIA
# ======================================================
def obtener_parroquia_secretaria(idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT pp.idParroquia
                FROM usuario us
                INNER JOIN rol_usuario rs ON us.idUsuario = rs.idUsuario
                INNER JOIN rol r ON rs.idRol = r.idRol
                INNER JOIN personal pe ON us.idUsuario = pe.idUsuario
                INNER JOIN parroquia_personal pp ON pe.idPersonal = pp.idPersonal
                WHERE us.idUsuario = %s AND r.nombRol = 'SECRETARIA'
                AND pp.vigenciaParrPers = TRUE
                LIMIT 1;
            """, (idUsuario,))
            
            fila = cursor.fetchone()
            if fila:
                return {'success': True, 'idParroquia': fila[0]}
            return {'success': False, 'mensaje': 'No se encontró parroquia para esta secretaria'}
    except Exception as e:
        print(f'Error al obtener parroquia de secretaria: {e}')
        return {'success': False, 'mensaje': str(e)}
    finally:
        if conexion:
            conexion.close()

# ======================================================
# 🔹 LISTAR PARROQUIAS
# ======================================================
def listar_parroquia(es_admin_global=True, idParroquia=None):
    """
    Lista parroquias según el tipo de administrador.
    - Admin Global: Ve todas las parroquias
    - Admin Local: Solo ve su parroquia
    """
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            if es_admin_global:
                # Admin Global: todas las parroquias
                cursor.execute("""
                    SELECT idParroquia, nombParroquia, historiaParroquia, ruc,
                           telefonoContacto, direccion, color,
                           latParroquia, logParroquia, estadoParroquia
                    FROM PARROQUIA
                """)
            else:
                # Admin Local: solo su parroquia
                if not idParroquia:
                    return []
                cursor.execute("""
                    SELECT idParroquia, nombParroquia, historiaParroquia, ruc,
                           telefonoContacto, direccion, color,
                           latParroquia, logParroquia, estadoParroquia
                    FROM PARROQUIA
                    WHERE idParroquia = %s
                """, (idParroquia,))
            
            resultados = [
                {
                    'idParroquia': f[0],
                    'nombParroquia': f[1],
                    'historiaParroquia': f[2],
                    'ruc': f[3],
                    'telefonoContacto': f[4],
                    'direccion': f[5],
                    'color': f[6],
                    'latParroquia': float(f[7]) if f[7] else None,
                    'logParroquia': float(f[8]) if f[8] else None,
                    'estadoParroquia': f[9]
                }
                for f in cursor.fetchall()
            ]
        return resultados
    except Exception as e:
        print(f'Error al listar parroquias: {e}')
        return []
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 AGREGAR PARROQUIA
# ======================================================
def agregar_parroquia(nombParroquia, historiaParroquia, descripcionBreve, 
                      f_creacion, ruc, telefonoContacto, email, 
                      direccion, color, latParroquia, logParroquia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = """
                INSERT INTO PARROQUIA (
                    nombParroquia, 
                    historiaParroquia, 
                    descripcionBreve, 
                    f_creacion, 
                    ruc,
                    telefonoContacto, 
                    email, 
                    direccion, 
                    color, 
                    latParroquia, 
                    logParroquia, 
                    estadoParroquia
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
            """
            # Si f_creacion viene vacío, usamos la fecha de hoy para evitar error 0000-00-00
            if not f_creacion:
                f_creacion = datetime.now().date()

            cursor.execute(sql, (
                nombParroquia, 
                historiaParroquia, 
                descripcionBreve, 
                f_creacion, 
                ruc,
                telefonoContacto, 
                email, 
                direccion, 
                color,
                latParroquia, 
                logParroquia
            ))
        
        conexion.commit()
        return True
    except Exception as e:
        print(f'Error al registrar parroquia: {e}')
        if conexion:
            conexion.rollback()
        return False
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 CAMBIAR ESTADO
# ======================================================
def cambiar_estado_parroquia(idParroquia):
    conexion = obtener_conexion()
    with conexion.cursor() as cursor:
            
            cursor.execute("SELECT estadoParroquia FROM PARROQUIA WHERE idParroquia=%s", (idParroquia,))
            resultado = cursor.fetchone()

            if  resultado is None:
                conexion.close()
                return {'ok': False, 'mensaje': 'Parroquia no encontrada'}
            
            estado_actual = resultado[0]
            nuevo_estado = not estado_actual

            cursor.execute(
                "UPDATE PARROQUIA SET estadoParroquia=%s WHERE idParroquia=%s",
                (nuevo_estado, idParroquia)
            )

            conexion.commit()
            conexion.close()
            return {'ok': True, 'mensaje': 'Estado cambiado correctamente', 'nuevo_estado': nuevo_estado}
 
            
# ======================================================
# 🔹 ACTUALIZAR PARROQUIA
# ======================================================
def actualizar_parroquia(idParroquia, nombParroquia, historiaParroquia, ruc,
                         telefonoContacto, direccion, color,
                         latParroquia, logParroquia, estadoParroquia):
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                UPDATE PARROQUIA
                SET nombParroquia=%s, historiaParroquia=%s, ruc=%s,
                    telefonoContacto=%s, direccion=%s, color=%s,
                    latParroquia=%s, logParroquia=%s, estadoParroquia=%s
                WHERE idParroquia=%s
            """, (nombParroquia, historiaParroquia, ruc,
                  telefonoContacto, direccion, color,
                  latParroquia, logParroquia, estadoParroquia, idParroquia))
        conexion.commit()
        return True
    except Exception as e:
        print(f'Error al actualizar parroquia: {e}')
        return False
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 ELIMINAR PARROQUIA
# ======================================================
def eliminar_parroquia(idParroquia):
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM PARROQUIA WHERE idParroquia=%s", (idParroquia,))
        conexion.commit()
        return True
    except Exception as e:
        print(f'Error al eliminar parroquia: {e}')
        return False
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 VERIFICAR RELACIONES EXISTENTES
# ======================================================
def verificar_relacion_parroquia(idParroquia):
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT (
                    (SELECT COUNT(*) FROM parroquia_personal WHERE idParroquia=%s) +
                    (SELECT COUNT(*) FROM acto_liturgico WHERE idParroquia=%s) +
                ) AS total_relaciones
            """, (idParroquia, idParroquia, idParroquia))
            resultado = cursor.fetchone()
            return resultado and resultado[0] > 0
    except Exception as e:
        print(f'Error al verificar relación de la parroquia: {e}')
        return False
    finally:
        if conexion:
            conexion.close()

# ======================================================
# BUSCAR PARROQUIA
# ======================================================
def buscar_parroquia(termino):
    conexion = None
    parroquias = []
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idparroquia, nombparroquia, direccion, ruc, historiaparroquia, 
                       telefonocontacto, color, latparroquia, logparroquia, estadoparroquia
                FROM parroquia
                WHERE LOWER(nombparroquia) LIKE LOWER(%s)
                   OR ruc LIKE %s
            """, (f'%{termino}%', f'%{termino}%'))
            
            for fila in cursor.fetchall():
                parroquias.append({
                    'id': fila[0],
                    'nombre': fila[1],
                    'direccion': fila[2],
                    'ruc': fila[3],
                    'historia': fila[4],
                    'contacto': fila[5],
                    'color': fila[6],
                    'latitud': fila[7],
                    'longitud': fila[8],
                    'estado': fila[9]
                })
        return parroquias
    except Exception as e:
        print("Error al buscar parroquia:", e)
        return []
    finally:
        if conexion:
            conexion.close()
