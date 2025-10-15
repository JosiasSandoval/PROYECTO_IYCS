from app.bd_sistema import obtener_conexion

def get_obtener_mapa_datos():
    conexion = None
    resultados = []
    
    try:
        # 1. Obtiene la conexión
        conexion = obtener_conexion()
        
        with conexion.cursor() as cursor:
            # 2. Ejecuta la consulta eficiente (JOINs)
            cursor.execute("SELECT idParroquia,nombParroquia, latParroquia, logParroquia,descripcionBreve,direccion,horaAtencionInicial,horaAtencionFinal,telefonoContacto FROM PARROQUIA")
            
            # 3. Procesa los resultados
            for fila in cursor.fetchall():
                resultados.append({
                    'idParroquia':fila[0],
                    'nombParroquia': fila[1],
                    'latParroquia': float(fila[2]),
                    'logParroquia': float(fila[3]),
                    'descripcionBreve':fila[4],
                    'direccion':fila[5],
                    'horaAtencionInicial':str(fila[6]),
                    'horaAtencionFinal':str(fila[7]),
                    'telefonoContacto':fila[8]
                })
        return resultados
    except Exception as e:
        print(f"Error al obtener datos del mapa: {e}")
        return [] 
    finally:
        # 4. Asegura que la conexión se cierre
        if conexion:
            conexion.close()

def ubicar_parroquia(nombParroquia):
    conexion = None
    resultados = []
    
    try:
        # 1. Obtiene la conexión
        conexion = obtener_conexion()
        
        with conexion.cursor() as cursor:
            # 2. Ejecuta la consulta eficiente (JOINs)
            cursor.execute("SELECT nombParroquia, latParroquia, logParroquia FROM PARROQUIA where nombParroquia=%s",(nombParroquia,))
            
            # 3. Procesa los resultados
            for fila in cursor.fetchall():
                resultados.append({
                    'nombParroquia': fila[0],
                    'latParroquia': float(fila[1]),
                    'logParroquia': float(fila[2]),
                })
        return resultados
    except Exception as e:
        print(f"Error al obtener datos del mapa: {e}")
        return [] 
    finally:
        # 4. Asegura que la conexión se cierre
        if conexion:
            conexion.close()

def obtener_informacion_parroquia(idParroquia):
    resultados = []
    conexion = None
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT nombParroquia, historiaParroquia, f_creacion, ruc, 
                       infoAdicional, telefonoContacto, horaAtencionInicial, 
                       horaAtencionFinal, direccion
                FROM PARROQUIA
                WHERE idParroquia = %s
            """, (idParroquia,))
            
            for fila in cursor.fetchall():
                resultados.append({
                    'nombParroquia': fila[0],
                    'historiaParroquia': fila[1],
                    'f_creacion': str(fila[2]),
                    'ruc': fila[3],
                    'infoAdicional': fila[4],
                    'telefonoContacto': fila[5],
                    'horaAtencionInicial': str(fila[6]),
                    'horaAtencionFinal': str(fila[7]),
                    'direccion': fila[8]
                })
        return resultados

    except Exception as e:
        print(f"Error al obtener información de la parroquia: {e}")
        return []

    finally:
        if conexion:
            conexion.close()
