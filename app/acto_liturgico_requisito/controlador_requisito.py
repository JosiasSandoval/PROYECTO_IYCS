from app.bd_sistema import obtener_conexion
def obtener_requisito_acto(idActo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # 💡 CAMBIO AQUÍ: Añadimos re.idRequisito (que es el ID único del requisito)
            cursor.execute("""
                SELECT re.idRequisito, ar.idActoRequisito, re.nombRequisito, re.descripcion
                FROM acto_requisito ar
                INNER JOIN requisito re ON ar.idRequisito = re.idRequisito
                WHERE ar.idActo = %s;
            """, (idActo,))
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    'id': fila[0],             # 🔑 CLAVE: El ID del requisito (usado como idRequisito en JS)
                    'idActoRequisito': fila[1],
                    'nombRequisito': fila[2],
                    'descripcion': fila[3] or '' 
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener los requisitos del acto: {e}')
        return []
    finally:
        if conexion:
            conexion.close()


def registrar_documento(idActoRequisito, idReserva, ruta, tipoArchivo, fecha, estadoCumplimiento, observacion, vigencia, aprobado=False):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO DOCUMENTO_REQUISITO (
                    rutaArchivo, tipoArchivo, f_subido, estadoCumplimiento,
                    aprobado, observacion, vigenciaDocumento, 
                    idReserva, idActoRequisito
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                # 2. Ajuste del orden de los valores para que coincida con las columnas
                ruta, 
                tipoArchivo, 
                fecha, 
                estadoCumplimiento, 
                aprobado, # Nuevo parámetro insertado en el orden correcto
                observacion, 
                vigencia, # El parámetro ahora es 'vigencia' (para vigenciaDocumento)
                idReserva, 
                idActoRequisito
            ))
            conexion.commit()
            return {'ok': True, 'mensaje': 'Documento registrado correctamente'}
    except Exception as e:
        # Es mejor usar un log o print(repr(e)) para ver el error exacto
        print(f'Error al registrar el documento: {e}') 
        return {'ok': False, 'mensaje': f'Error: {e}'}
    finally:
        if conexion:
            conexion.close()

def cambiar_cumplimiento_documento(idDocumento,estadoCumplimiento):
    conexion = obtener_conexion()
    try:
        if estadoCumplimiento=='No cumplido':
            nuevo_estado='Cumplido'
        
        with conexion.cursor() as cursor:
            cursor.execute("""
            UPDATE documento_requisito
            SET estadoCumplimiento=%s
            WHERE idDocumento=%s;
            """,(nuevo_estado,idDocumento))
            conexion.commit()
    except Exception as e:
        print(f'Error al cambiar el cumplimiento del documento: {e}')
        return {'ok':False,'mensaje':'Error:{e}'}
    finally:
        if conexion:
            conexion.close()

def agregar_observacion_documento(idDocumento,observacion):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
            UPDATE documento_requisito
            SET observacion=%s
            WHERE idDocumento=%s;
            """,(observacion,idDocumento))
            conexion.commit()
    except Exception as e:
        print(f'Error al agregar la observacion del documento: {e}')
        return {'ok':False,'mensaje':'Error:{e}'}
    finally:
        if conexion:
            conexion.close()
    



