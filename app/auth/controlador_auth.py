from app.bd_sistema import obtener_conexion

def registrar_usuario_feligres(nombFel, apePaFel, apeMaFel, numDocFel, f_nacimiento, sexoFel, direccionFel, telefonoFel, idTipoDocumento, email, clave):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Insertar usuario
            cursor.execute("""
                INSERT INTO usuario (email, clave, estadoCuenta)
                VALUES (%s, %s, TRUE)
            """, (email, clave))
            id_usuario = cursor.lastrowid

            # Insertar feligrés
            cursor.execute("""
                INSERT INTO feligres (nombFel, apePatFel, apeMatFel, numDocFel, f_nacimiento, sexoFel, direccionFel, telefonoFel, idTipoDocumento, idUsuario)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                nombFel, apePaFel, apeMaFel, numDocFel, f_nacimiento,
                sexoFel, direccionFel, telefonoFel, idTipoDocumento, id_usuario
            ))

            # Obtener idRol de FELIGRES
            cursor.execute("SELECT idRol FROM rol WHERE nombRol='FELIGRES'")
            idRol = cursor.fetchone()
            if not idRol:
                raise Exception("Rol FELIGRES no encontrado.")
            idRol = idRol[0]

            # Asignar rol al usuario
            cursor.execute("""
                INSERT INTO rol_usuario (idUsuario, idRol)
                VALUES (%s, %s)
            """, (id_usuario, idRol))

        conexion.commit()
        return True, None
    except Exception as e:
        if conexion:
            conexion.rollback()
        return False, str(e)
    finally:
        if conexion:
            conexion.close()

def verificar_usuario(email, clave):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT us.idUsuario, r.nombRol
                FROM usuario us
                INNER JOIN rol_usuario ru ON us.idUsuario = ru.idUsuario
                INNER JOIN rol r ON r.idRol = ru.idRol
                WHERE us.email = %s AND us.clave = %s
            """, (email, clave))
            usuario = cursor.fetchone()  # retorna (idUsuario, nombRol) o None

        return usuario
    finally:
        conexion.close()

