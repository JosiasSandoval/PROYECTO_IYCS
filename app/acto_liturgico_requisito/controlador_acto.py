from app.bd_sistema import obtener_conexion

def obtener_acto_parroquia(idParroquia):
    conexion=obtener_conexion()
    try:
        resultados=[]
        with conexion.cursor()as cursor:
            cursor.execute("""
                SELECT al.idActo,al.nombActo, al.costoBase
                FROM acto_liturgico al INNER JOIN acto_parroquia ap ON al.idActo=ap.idActo
                INNER JOIN parroquia pa ON ap.idParroquia=pa.idParroquia
                WHERE pa.idParroquia=%s;
            """,(idParroquia))
            resultados=cursor.fetchall()
            for fila in resultados:
                resultados.append({
                    'id':fila[0],
                    'acto':fila[1],
                    'costoBase':fila[2]
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener los actos litúrgicos de la parroquia')
        return []
    finally:
        if conexion:
            conexion.close()