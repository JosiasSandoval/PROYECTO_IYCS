from app.bd_sistema import obtener_conexion

def obtener_acto_parroquia(idParroquia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT al.idActo, al.nombActo,al.costoBase
                FROM acto_liturgico al
                INNER JOIN acto_parroquia ap ON al.idActo = ap.idActo
                INNER JOIN parroquia pa ON ap.idParroquia = pa.idParroquia
                WHERE pa.idParroquia = %s;
            """, (idParroquia,))  
            filas = cursor.fetchall()
            
            resultados = []
            for fila in filas:
                resultados.append({
                    'id': fila[0],
                    'acto': fila[1],
                    'costoBase': fila[2]
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener los actos litúrgicos de la parroquia: {e}')
        return []
    finally:
        if conexion:
            conexion.close()

def disponibilidad_acto_parroquia(idParroquia,idActo):
    conexion = obtener_conexion()
    try:    
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT ap.diaSemana, ap.horaInicioActo
                FROM acto_liturgico al
                INNER JOIN acto_parroquia ap ON al.idActo = ap.idActo
                INNER JOIN parroquia pa ON ap.idParroquia = pa.idParroquia
                WHERE pa.idParroquia = %s and al.idActo = %s;
            """, (idParroquia,idActo))  
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    'diaSemana': fila[0],
                    'horaInicioActo': fila[1]
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener disponibilidad de acto liturgicos: {e}')
        return []
    finally:
        if conexion:
            conexion.close()


