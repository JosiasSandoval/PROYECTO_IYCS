from app.bd_sistema import obtener_conexion

def listar_cargo():
    conexion = obtener_conexion()
    resultados = []
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT idCargo, nombCargo, estadoCargo FROM cargo")
            filas = cursor.fetchall()
            resultados = [
                {
                    'idCargo': fila[0],
                    'nombCargo': fila[1],
                    'estadoCargo': fila[2]
                }
                for fila in filas
            ]
        return resultados
    except Exception as e:
        print(f"Error al listar cargos: {e}")
        return []
    finally:
        if conexion:
            conexion.close()


def agregar_cargo(nombCargo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "INSERT INTO cargo (nombCargo, estadoCargo) VALUES (%s, TRUE)",
                (nombCargo,)
            )
        conexion.commit()
    except Exception as e:
        print(f"Error al agregar cargo: {e}")
    finally:
        if conexion:
            conexion.close()


def actualizar_cargo(idCargo, nombCargo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "UPDATE cargo SET nombCargo = %s WHERE idCargo = %s",
                (nombCargo, idCargo)
            )
        conexion.commit()
    except Exception as e:
        print(f"Error al actualizar cargo: {e}")
    finally:
        if conexion:
            conexion.close()


def cambiar_estado_cargo(idCargo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT estadoCargo FROM cargo WHERE idCargo = %s", (idCargo,))
            fila = cursor.fetchone()
            if not fila:
                return {'ok': False, 'mensaje': 'Cargo no encontrado'}

            estado_actual = fila[0]
            nuevo_estado = not estado_actual

            cursor.execute(
                "UPDATE cargo SET estadoCargo = %s WHERE idCargo = %s",
                (nuevo_estado, idCargo)
            )
        conexion.commit()
        return {'ok': True, 'nuevo_estado': nuevo_estado, 'mensaje': 'Estado actualizado'}
    except Exception as e:
        print(f"Error al cambiar estado del cargo: {e}")
        return {'ok': False, 'mensaje': str(e)}
    finally:
        if conexion:
            conexion.close()


def verificar_relacion_cargo(idCargo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "SELECT COUNT(*) FROM parroquia_personal WHERE idCargo = %s",
                (idCargo,)
            )
            resultado = cursor.fetchone()
        return resultado[0] if resultado else 0
    except Exception as e:
        print(f"Error al verificar relación del cargo: {e}")
        return 0
    finally:
        if conexion:
            conexion.close()


def eliminar_cargo(idCargo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("DELETE FROM cargo WHERE idCargo = %s", (idCargo,))
        conexion.commit()
        return {'ok': True, 'mensaje': 'Cargo eliminado'}
    except Exception as e:
        print(f"Error al eliminar cargo: {e}")
        return {'ok': False, 'mensaje': str(e)}
    finally:
        if conexion:
            conexion.close()
