from app.bd_sistema import obtener_conexion

def verificar_usuario(email, clave):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute(
                "SELECT idUsuario FROM usuario WHERE email=%s AND clave=%s",
                (email, clave)
            )
            usuario_encontrado = cursor.fetchone()
        return usuario_encontrado is not None
    finally:
        conexion.close()

