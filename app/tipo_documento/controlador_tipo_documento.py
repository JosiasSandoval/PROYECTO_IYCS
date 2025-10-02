from app.bd_sistema import obtener_conexion

def listar_tipo_documento():
    # 1. Inicializamos la conexión a None por si falla
    conexion = None
    documento = []  
    try:

        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("select idTipoDocumento,nombDocumento from tipo_documento")
            resultados = cursor.fetchall()
            for fila in resultados:
                documento.append({
                    'id': fila[0],
                    'nombre': fila[1]
                })
    
    finally:
        if conexion:
            conexion.close()
            
    return documento