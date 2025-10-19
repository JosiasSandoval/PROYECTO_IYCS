from app.bd_sistema import obtener_conexion

# ======================================================
# 🔹 OBTENER DATOS PARA EL MAPA
# ======================================================
def get_obtener_mapa_datos():
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idParroquia, nombParroquia, latParroquia, logParroquia,
                       historiaParroquia, direccion, telefonoContacto, color
                FROM PARROQUIA
            """)
            resultados = [
                {
                    'idParroquia': f[0],
                    'nombParroquia': f[1],
                    'latParroquia': float(f[2]) if f[2] else None,
                    'logParroquia': float(f[3]) if f[3] else None,
                    'historiaParroquia': f[4],
                    'direccion': f[5],
                    'telefonoContacto': f[6],
                    'color': f[7]
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
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT nombParroquia, historiaParroquia, ruc,
                       telefonoContacto, direccion, color,
                       latParroquia, logParroquia, estadoParroquia
                FROM PARROQUIA
                WHERE idParroquia = %s
            """, (idParroquia,))
            fila = cursor.fetchone()
            if fila:
                return {
                    'nombParroquia': fila[0],
                    'historiaParroquia': fila[1],
                    'ruc': fila[2],
                    'telefonoContacto': fila[3],
                    'direccion': fila[4],
                    'color': fila[5],
                    'latParroquia': float(fila[6]) if fila[6] else None,
                    'logParroquia': float(fila[7]) if fila[7] else None,
                    'estadoParroquia': fila[8]
                }
            return None
    except Exception as e:
        print(f"Error al obtener información de la parroquia: {e}")
        return None
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 LISTAR PARROQUIAS
# ======================================================
def listar_parroquia():
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idParroquia, nombParroquia, historiaParroquia, ruc,
                       telefonoContacto, direccion, color,
                       latParroquia, logParroquia, estadoParroquia
                FROM PARROQUIA
            """)
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
def agregar_parroquia(nombParroquia, historiaParroquia, ruc,
                      telefonoContacto, direccion, color,
                      latParroquia, logParroquia):
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO PARROQUIA (
                    nombParroquia, historiaParroquia, ruc,
                    telefonoContacto, direccion, color,
                    latParroquia, logParroquia, estadoParroquia
                ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s, TRUE)
            """, (nombParroquia, historiaParroquia, ruc,
                  telefonoContacto, direccion, color,
                  latParroquia, logParroquia))
        conexion.commit()
        return True
    except Exception as e:
        print(f'Error al registrar parroquia: {e}')
        return False
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 CAMBIAR ESTADO
# ======================================================
def cambiar_estado_parroquia(idParroquia):
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("SELECT estadoParroquia FROM PARROQUIA WHERE idParroquia=%s", (idParroquia,))
            resultado = cursor.fetchone()
            if not resultado:
                return {'ok': False, 'mensaje': 'Parroquia no encontrada'}
            nuevo_estado = not resultado[0]
            cursor.execute("UPDATE PARROQUIA SET estadoParroquia=%s WHERE idParroquia=%s",
                           (nuevo_estado, idParroquia))
        conexion.commit()
        return {'ok': True, 'nuevo_estado': nuevo_estado}
    except Exception as e:
        print(f'Error al cambiar estado de la parroquia: {e}')
        return {'ok': False, 'mensaje': str(e)}
    finally:
        if conexion:
            conexion.close()


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
