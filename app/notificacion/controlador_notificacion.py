import pymysql
from app.bd_sistema import obtener_conexion

def obtener_conteo_no_leidas(id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    count = 0
    try:
        sql = "SELECT COUNT(*) FROM NOTIFICACION WHERE idUsuario = %s AND leido = 0"
        cursor.execute(sql, (id_usuario,))
        count = cursor.fetchone()[0]
    except Exception as e:
        print(f"Error obteniendo conteo: {e}")
    finally:
        cursor.close()
        conexion.close()
    return count

def listar_notificaciones_usuario(id_usuario):
    conexion = obtener_conexion()
    # Usamos DictCursor para que devuelva diccionario y sea fácil convertir a JSON luego
    cursor = conexion.cursor(pymysql.cursors.DictCursor)
    lista = []
    try:
        sql = """
            SELECT idNotificacion, titulo, mensaje, leido, enlace, 
                   DATE_FORMAT(fecha_creacion, '%%d/%%m %%H:%%i') as fecha 
            FROM NOTIFICACION 
            WHERE idUsuario = %s 
            ORDER BY fecha_creacion DESC LIMIT 10
        """
        cursor.execute(sql, (id_usuario,))
        lista = cursor.fetchall()
    except Exception as e:
        print(f"Error listando notificaciones: {e}")
    finally:
        cursor.close()
        conexion.close()
    return lista

def marcar_todas_leidas(id_usuario):
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    exito = False
    try:
        sql = "UPDATE NOTIFICACION SET leido = 1 WHERE idUsuario = %s AND leido = 0"
        cursor.execute(sql, (id_usuario,))
        conexion.commit()
        exito = True
    except Exception as e:
        print(f"Error marcando leídas: {e}")
        conexion.rollback()
    finally:
        cursor.close()
        conexion.close()
    return exito
# Agregar al final de app/notificacion/controlador_notificacion.py

def crear_notificacion(id_usuario, titulo, mensaje, enlace=None, icono='info'):
    """
    Función genérica para insertar notificaciones desde otros controladores.
    """
    conexion = obtener_conexion()
    cursor = conexion.cursor()
    try:
        sql = """
            INSERT INTO NOTIFICACION (idUsuario, titulo, mensaje, enlace, icono, fecha_creacion)
            VALUES (%s, %s, %s, %s, %s, NOW())
        """
        cursor.execute(sql, (id_usuario, titulo, mensaje, enlace, icono))
        conexion.commit()
    except Exception as e:
        print(f"Error creando notificacion: {e}")
    finally:
        cursor.close()
        conexion.close()