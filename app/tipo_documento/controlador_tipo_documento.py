from app.bd_sistema import obtener_conexion

def listar_tipo_documento():
    conexion = None
    documentos = []
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("SELECT idTipoDocumento, nombDocumento, abreviatura, estadoDocumento FROM tipo_documento")
            filas = cursor.fetchall()
            for fila in filas:
                documentos.append({
                    'id': fila[0],
                    'nombre': fila[1],
                    'abreviatura': fila[2],
                    'estado': fila[3]
                })
    finally:
        if conexion:
            conexion.close()
    return documentos


def cambiar_estado_tipo_documento(idTipo):
    conexion = obtener_conexion()
    with conexion.cursor() as cursor:
        # Verificar si existe
        cursor.execute('SELECT estadoDocumento FROM tipo_documento WHERE idTipoDocumento = %s', (idTipo,))
        resultado = cursor.fetchone()

        if resultado is None:
            conexion.close()
            return {'ok': False, 'mensaje': 'Tipo de documento no encontrado'}

        estado_actual = resultado[0]
        nuevo_estado = not estado_actual  # invertir el estado

        cursor.execute(
            'UPDATE tipo_documento SET estadoDocumento = %s WHERE idTipoDocumento = %s',
            (nuevo_estado, idTipo)
        )
        conexion.commit()
        conexion.close()
        return {'ok': True, 'mensaje': 'Estado cambiado correctamente', 'nuevo_estado': nuevo_estado}


def agregar_tipo_documento(nombre, abreviatura):
    conexion = obtener_conexion()
    with conexion.cursor() as cursor:
        cursor.execute(
            "INSERT INTO tipo_documento (nombDocumento, abreviatura, estadoDocumento) VALUES (%s, %s, TRUE)",
            (nombre, abreviatura)
        )
        conexion.commit()
        conexion.close()


def actualizar_tipo_documento(idTipo, nombre, abreviatura):
    conexion = obtener_conexion()
    with conexion.cursor() as cursor:
        cursor.execute(
            "UPDATE tipo_documento SET nombDocumento = %s, abreviatura = %s WHERE idTipoDocumento = %s",
            (nombre, abreviatura, idTipo)
        )
        conexion.commit()
        conexion.close()


def obtener_tipo_documento(busqueda):
    conexion = None
    documentos = []
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idTipoDocumento, nombDocumento, abreviatura, estadoDocumento
                FROM tipo_documento
                WHERE nombDocumento = %s OR abreviatura = %s
            """, (busqueda, busqueda))
            filas = cursor.fetchall()
            for fila in filas:
                documentos.append({
                    'id': fila[0],
                    'nombre': fila[1],
                    'abreviatura': fila[2],
                    'estado': fila[3]
                })
        return documentos
    except Exception as e:
        print(f"Error al obtener el tipo de documento: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

def verificar_relacion_tipo_documento(idTipo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute('''
                SELECT COUNT(*) AS total_usos 
                FROM (
                    SELECT idTipoDocumento FROM feligres WHERE idTipoDocumento = %s
                    UNION ALL
                    SELECT idTipoDocumento FROM personal WHERE idTipoDocumento = %s
                ) AS usados;
            ''', (idTipo, idTipo))
            resultado = cursor.fetchone()
            return resultado[0] if resultado else 0
    except Exception as e:
        print(f"Error al verificar relaciones del tipo de documento: {e}")
        return 0
    finally:
        conexion.close()

def eliminar_tipo_documento(idTipo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute('DELETE FROM tipo_documento where idTipoDocumento=%s', (idTipo,))
            conexion.commit()
    except Exception as e:
        print(f"Error al eliminar el tipo de documento: {e}")
        raise
    finally:
        conexion.close()