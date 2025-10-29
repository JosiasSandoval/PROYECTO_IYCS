from app.bd_sistema import obtener_conexion
def registrar_usuario_y_feligres(nombFel, apePaFel, apeMaFel, numDocFel, f_nacimiento, sexoFel, direccionFel, telefonoFel, idTipoDocumento, email, clave):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Crear usuario
            cursor.execute("""
                INSERT INTO usuario (email, clave, estadoCuenta)
                VALUES (%s, %s, TRUE)
            """, (email, clave))
            id_usuario = cursor.lastrowid

            # Crear feligrés
            cursor.execute("""
                INSERT INTO feligres (nombFel, apePatFel, apeMatFel, numDocFel, f_nacimiento, sexoFel, direccionFel, telefonoFel, idTipoDocumento, idUsuario)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                nombFel,
                apePaFel,
                apeMaFel,
                numDocFel,
                f_nacimiento,
                sexoFel,
                direccionFel,
                telefonoFel,
                idTipoDocumento,
                id_usuario
            ))
        conexion.commit()
        return True, None
    except Exception as e:
        if conexion:
            conexion.rollback()
        return False, str(e)
    finally:
        if conexion:
            conexion.close()

