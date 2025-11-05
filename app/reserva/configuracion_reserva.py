from app.bd_sistema import obtener_conexion

def get_restricciones_misa():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                """)
    except Exception as e:
        print(f"Error al obtener las restricciones de la misa: {e}")
        return{'ok':False,'mensaje':str(e)}
    finally:
        if conexion:
            conexion.close()