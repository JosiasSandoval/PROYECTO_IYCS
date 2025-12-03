from app.bd_sistema import obtener_conexion

# ===========================
# LISTAR MÉTODOS DE PAGO
# ===========================
def listar_metodo_pago():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT idMetodo, nombMetodo, estadoMetodo FROM metodo_pago")
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    'idMetodo': fila[0],
                    'nombMetodo': fila[1],
                    'estadoMetodo': fila[2]
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener los métodos de pago: {e}')
        return []
    finally:
        conexion.close()


# ===========================
# AGREGAR NUEVO MÉTODO DE PAGO
# ===========================
def agregar_metodo_pago(nombMetodo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "INSERT INTO metodo_pago (nombMetodo, estadoMetodo) VALUES (%s, TRUE)", 
                (nombMetodo,)
            )
            conexion.commit()
            print(f'Método de pago "{nombMetodo}" agregado correctamente.')
            return True
    except Exception as e:
        print(f'Error al agregar método de pago: {e}')
        return False
    finally:
        conexion.close()


# ===========================
# CAMBIAR ESTADO DEL MÉTODO DE PAGO
# ===========================
def cambiar_estado_metodo_pago(idMetodo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "SELECT estadoMetodo FROM metodo_pago WHERE idMetodo = %s", 
                (idMetodo,)
            )
            fila = cursor.fetchone()
            if fila is None:
                print(f'No existe método de pago con id {idMetodo}')
                return {'ok': False, 'mensaje': 'Método de pago no encontrado'}
            nuevo_estado = not fila[0]
            cursor.execute(
                "UPDATE metodo_pago SET estadoMetodo = %s WHERE idMetodo = %s",
                (nuevo_estado, idMetodo)
            )
            conexion.commit()
            print(f'Estado del método de pago id {idMetodo} cambiado a {nuevo_estado}.')
            return {'ok': True, 'nuevo_estado': nuevo_estado}
    except Exception as e:
        print(f'Error al cambiar estado del método de pago: {e}')
        return {'ok': False, 'mensaje': str(e)}
    finally:
        conexion.close()


# ===========================
# VERIFICAR EXISTENCIA/RELACIÓN DEL MÉTODO DE PAGO
# ===========================
def verificar_relacion_metodo_pago(idMetodo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM metodo_pago WHERE idMetodo = %s",
                (idMetodo,)
            )
            resultado = cursor.fetchone()
            return resultado[0] > 0 if resultado else False
    except Exception as e:
        print(f'Error al verificar relación del método de pago: {e}')
        return False
    finally:
        conexion.close()


# ===========================
# ELIMINAR MÉTODO DE PAGO
# ===========================
def eliminar_metodo_pago(idMetodo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "DELETE FROM metodo_pago WHERE idMetodo = %s", 
                (idMetodo,)
            )
            conexion.commit()
            print(f'Método de pago id {idMetodo} eliminado correctamente.')
            return True
    except Exception as e:
        print(f'Error al eliminar método de pago: {e}')
        return False
    finally:
        conexion.close()

def actualizar_metodo_pago(idMetodo, nombMetodo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "UPDATE metodo_pago SET nombMetodo = %s WHERE idMetodo = %s",
                (nombMetodo, idMetodo)
            )
            conexion.commit()
            print(f'Método de pago id {idMetodo} actualizado correctamente.')
            return True
    except Exception as e:
        print(f'Error al actualizar método de pago: {e}')
        return False
    finally:
        conexion.close()