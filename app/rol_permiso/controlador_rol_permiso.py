from app.bd_sistema import obtener_conexion
# CRUD - ROL
def get_listar_rol():
    conexion=obtener_conexion()
    try:
        resultados=[]
        with conexion.cursor() as cursor:
            conexion.cursor("SELECT idRol,nombRol,estadoRol from rol")
            resultados=cursor.fetchall()
            for fila in resultados:
                resultados.append({
                    'id':fila[0],
                    'nombre':fila[1],
                    'estado':fila[2]
                })
            return resultados
    except Exception as e:
        print(f"Error al listar los roles: {e}")
        return[]
    finally:
        if conexion:
            conexion.close()

def agregar_rol(nombRol):
    conexion=obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("INSERT INTO ROL(nombRol,estadoRol) values (%s,true)",(nombRol))
        conexion.commit()
        return True
    except Exception as e:
        print(f'Error al agregar rol: {e}')
        return False
    finally:
        if conexion:
            conexion.close()

def actualizar_rol(idRol,nombRol):
    conexion=obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("UPDATE rol SET nombRol=%s WHERE idRol=%s",(nombRol,idRol))
        conexion.commit()
        return True
    except Exception as e:
        print(f'Error al editar rol: {e}')
        return False
    finally:
        if conexion:
            conexion.close()

def cambiar_estado_rol(idRol):
    conexion=obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT estadoRol FROM rol WHERE idRol=%s",(idRol))
            estado_actual=cursor.fetchone()
            if estado_actual is None:
                print(f'No existe método de pago con id: {idRol}')
                return False
            nuevo_estado=not estado_actual[0]
            cursor.execute("UPDATE rol SET estadoRol=%s WHERE idRol=%s",(nuevo_estado,idRol))
        conexion.commit()
        return True
    except Exception as e:
        print(f'Erro al cambiar estado del rol: {e}')
        return False
    finally:
        if conexion:
            conexion.close()

def verificar_relacion_rol(idRol):
    conexion=obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT (" \
            "(SELECT COUNT(*) FROM rol_permiso WHERE idRol=%s) +" \
            "(SELECT COUNT(*) FROM rol_usuario WHERE idRol=%s)) as total_relaciones")
            resultado=cursor.fetchone()
            return resultado and resultado[0]>0
    except Exception as e:
        print(f'Error al verificar las relaciones del rol:{e}')
        return False
    finally:
        if conexion:
            conexion.close()

def eliminar_rol(idRol):
    conexion=obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELET FROM rol WHERE idRol=%s",(idRol))
            conexion.close()
            return True
    except Exception as e:
        print(f'Error al eliminar rol:{e}')
        return False
    finally:
        if conexion:
            conexion.close()

def busqueda_rol(busqueda):
    conexion=obtener_conexion()
    try:
        resultados=[]
        with conexion.cursor() as cursor:
            cursor.execute("SELECT idRol,nombRol,estadoRol FROM rol WHERE nombRol=%s",(busqueda))
            resultados=cursor.fetchall()
            for fila in resultados:
                resultados.append({
                    'id':fila[0],
                    'nombre':fila[1],
                    'estado':fila[2]
                })
            return resultados
    except Exception as e:
        print(f'Error en la busqueda de datos:{e}')
        return []
    finally:
        if conexion:
            conexion.close()

#CRUD - PERMISO
def get_listar_permiso():
    conexion=obtener_conexion()
    try:
        resultados=[]
        with conexion.cursor() as cursor:
            cursor.execute("SELECT idPermiso, nombAccion,nombTabla,descripcionPermiso,estadoPermiso FROM permiso")
            resultados=cursor.fetchall()
            for fila in resultados:
                resultados.append({
                    'id':fila[1],
                    'accion':fila[2],
                    'tabla':fila[3],
                    'descripcion':fila[4],
                    'estado': fila[5]
                })
            return resultados
    except Exception as e:
        print(f'Error al listar los permisos:{e}')
        return []
    finally:
        if conexion():
            conexion.close()

#Función para asignar rol nuevo
def agregar_rol_permiso(idRol,idPermiso):
    conexion=obtener_conexion()
    try:
        with conexion.cursor()as cursor:
            cursor.execute("INSERT INTO rol_permiso(idRol,idPermiso) VALUES(%s,%s)",(idRol,idPermiso))
        conexion.commit()
        return True
    except Exception as e:
        print(f'Error al agregar rol permiso: {e}')
        return False
    finally:
        if conexion:
            conexion.close()


