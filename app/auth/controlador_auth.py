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
            id_usuario = cursor.lastrowid  # MySQL

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
                SELECT 
                    us.idUsuario, 
                    r.nombRol, 
                    pp.idParroquia, 
                    fe.idFeligres
                FROM usuario us
                INNER JOIN rol_usuario ru ON us.idUsuario = ru.idUsuario
                INNER JOIN rol r ON r.idRol = ru.idRol
                LEFT JOIN personal pe ON us.idUsuario = pe.idUsuario
                LEFT JOIN feligres fe ON us.idUsuario = fe.idUsuario
                LEFT JOIN parroquia_personal pp ON pe.idPersonal = pp.idPersonal
                WHERE us.email = %s AND us.clave = %s
            """, (email, clave))
            # Devuelve (idUsuario, nombRol, idParroquia, idFeligres) o None
            usuario = cursor.fetchone()

        return usuario
    finally:
        conexion.close()
