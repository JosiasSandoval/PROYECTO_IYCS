from app.bd_sistema import obtener_conexion

def get_obtener_mapa_datos():
    conexion = None
    resultados = []
    
    try:
        # 1. Obtiene la conexión
        conexion = obtener_conexion()
        
        with conexion.cursor() as cursor:
            # 2. Ejecuta la consulta eficiente (JOINs)
            cursor.execute("SELECT nombParroquia, latParroquia, lngParroquia FROM PARROQUIA")
            
            # 3. Procesa los resultados
            for fila in cursor.fetchall():
                resultados.append({
                    'nombParroquia': fila[0],
                    'latParroquia': float(fila[1]),
                    'lngParroquia': float(fila[2]),
                })
        return resultados
    except Exception as e:
        print(f"Error al obtener datos del mapa: {e}")
        return [] 
    finally:
        # 4. Asegura que la conexión se cierre
        if conexion:
            conexion.close()