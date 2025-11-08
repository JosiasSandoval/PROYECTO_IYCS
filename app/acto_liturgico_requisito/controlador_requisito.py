from app.bd_sistema import obtener_conexion
def obtener_requisito_acto(idActo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
            SELECT ar.idActoRequisito,re.nombRequisito, re.descripcion
            FROM acto_requisito ar INNER JOIN requisito re ON ar.idRequisito=re.idRequisito
            INNER JOIN acto_liturgico al ON al.idActo=ar.idActo
            WHERE al.idActo=%s;
            """,(idActo,))
            filas=cursor.fetchall()
            resultados=[]
            for fila in filas:
                resultados.append({
                    'id':fila[0],
                    'nombRequisito':fila[1],
                    'descripcion':fila[2]
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener los requisitos del acto: {e}')
        return []
    finally:
        if conexion:
            conexion.close()

def registrar_documento(idActoRequisito,idReserva, ruta, tipoArchivo,fecha,estadoCumplimiento,observacion,vigencia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
            INSERT INTO documento_requisito(rutaArchivo,tipoArchivo,f_subido,estadoCumplimiento,observacion,vigenciaDocumento,idReserva,idActoRequisito)
            """,(ruta,tipoArchivo,fecha,estadoCumplimiento,observacion,vigencia,idReserva,idActoRequisito))
            conexion.commit()
            return {'ok':True,'mensaje':'Documento registrado correctamente'}
    except Exception as e:
        print(f'Error al registrar el documento: {e}')
        return {'ok':False,'mensaje':'Error:{e}'}
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
    



