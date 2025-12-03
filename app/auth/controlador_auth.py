from app.bd_sistema import obtener_conexion

def registrar_feligres(nombFel, apePaFel, apeMaFel, numDocFel, f_nacimiento, sexoFel, direccionFel, telefonoFel, idTipoDocumento, email, clave):
    """
    Registra un nuevo usuario, crea su perfil de feligrés y le asigna el rol correspondiente.
    Maneja transacciones para asegurar la integridad de los datos.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # 1. Insertar en la tabla USUARIO
            cursor.execute("""
                INSERT INTO usuario (email, clave, estadoCuenta)
                VALUES (%s, %s, TRUE)
            """, (email, clave))
            id_usuario = cursor.lastrowid  # MySQL

            # 2. Insertar en la tabla FELIGRES
            cursor.execute("""
                INSERT INTO feligres (nombFel, apePatFel, apeMatFel, numDocFel, f_nacimiento, sexoFel, direccionFel, telefonoFel, idTipoDocumento, idUsuario)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                nombFel, apePaFel, apeMaFel, numDocFel, f_nacimiento,
                sexoFel, direccionFel, telefonoFel, idTipoDocumento, id_usuario
            ))

            # 3. Obtener ID del Rol 'FELIGRES'
            cursor.execute("SELECT idRol FROM rol WHERE nombRol='FELIGRES'")
            resultado_rol = cursor.fetchone()
            
            if not resultado_rol:
                raise Exception("Error de configuración: El rol 'FELIGRES' no existe en la base de datos.")
            
            id_rol = resultado_rol[0]

            # 4. Asignar Rol al Usuario
            cursor.execute("""
                INSERT INTO rol_usuario (idUsuario, idRol)
                VALUES (%s, %s)
            """, (id_usuario, id_rol))

        conexion.commit()
        return True, None

    except Exception as e:
        if conexion:
            conexion.rollback()
        print(f"Error en registrar_feligres: {e}")
        return False, str(e)

    finally:
        if conexion:
            conexion.close()

def autenticar_usuario(email, clave_ingresada):
    """
    Verifica credenciales y devuelve un diccionario con toda la info de sesión necesaria.
    Devuelve todos los roles asignados al usuario y el primer rol como rol principal.
    """
    conexion = obtener_conexion()
    usuario_data = None

    try:
        with conexion.cursor() as cursor:

            # ================================
            # VALIDAR USUARIO
            # ================================
            sql_validar = """
                SELECT idUsuario, clave, estadoCuenta
                FROM usuario
                WHERE email = %s
            """
            cursor.execute(sql_validar, (email,))
            usuario = cursor.fetchone()

            if not usuario:
                return None

            idUsuario, clave_db, estado_cuenta = usuario

            # Validar clave (texto plano)
            if clave_db != clave_ingresada or not estado_cuenta:
                return None

            # ================================
            # PERFIL COMPLETO (PERSONAL / FELIGRÉS)
            # ================================
            sql_perfil = """
                SELECT 
                    pe.idPersonal,
                    pe.nombPers,
                    pe.apePatPers,
                    pe.apeMatPers,
                    fe.idFeligres,
                    fe.nombFel,
                    fe.apePatFel,
                    fe.apeMatFel,
                    pp.idParroquia,
                    c.nombCargo
                FROM usuario us
                LEFT JOIN personal pe ON us.idUsuario = pe.idUsuario
                LEFT JOIN feligres fe ON us.idUsuario = fe.idUsuario
                LEFT JOIN parroquia_personal pp 
                    ON pe.idPersonal = pp.idPersonal AND pp.vigenciaParrPers = TRUE
                LEFT JOIN cargo c ON pp.idCargo = c.idCargo
                WHERE us.idUsuario = %s
            """
            cursor.execute(sql_perfil, (idUsuario,))
            perfil = cursor.fetchone()

            if perfil:
                (
                    idPersonal,
                    nombPers,
                    apePatPers,
                    apeMatPers,
                    idFeligres,
                    nombFel,
                    apePatFel,
                    apeMatFel,
                    idParroquia,
                    nombCargo
                ) = perfil
            else:
                idPersonal = idFeligres = idParroquia = None
                nombPers = apePatPers = apeMatPers = nombFel = apePatFel = apeMatFel = nombCargo = None

            # ================================
            # OBTENER TODOS LOS ROLES
            # ================================
            sql_roles = """
                SELECT r.nombRol
                FROM rol_usuario ru
                INNER JOIN rol r ON ru.idRol = r.idRol
                WHERE ru.idUsuario = %s
                ORDER BY ru.idRolUsuario ASC
            """
            cursor.execute(sql_roles, (idUsuario,))
            roles = [rol[0] for rol in cursor.fetchall()]

            rol_principal = roles[0] if roles else None

            # ================================
            # DETERMINAR NOMBRE Y CARGO
            # ================================
            if idPersonal:
                nombre_completo = f"{nombPers} {apePatPers}"
                cargo_mostrar = nombCargo if nombCargo else "Personal"
                nombre = nombPers
                apellidoPaterno = apePatPers
                apellidoMaterno = apeMatPers or ""
            elif idFeligres:
                nombre_completo = f"{nombFel} {apePatFel}"
                cargo_mostrar = "Feligrés"
                nombre = nombFel
                apellidoPaterno = apePatFel
                apellidoMaterno = apeMatFel or ""
            else:
                nombre_completo = "Usuario Sistema"
                cargo_mostrar = "Sin Perfil"
                nombre = ""
                apellidoPaterno = ""
                apellidoMaterno = ""

            # ================================
            # DEVOLVER OBJETO DE SESIÓN
            # ================================
            usuario_data = {
                "success": True,
                "idUsuario": idUsuario,
                "email": email,
                "nombre_usuario": nombre_completo,
                "nombre": nombre,
                "apellidoPaterno": apellidoPaterno,
                "apellidoMaterno": apellidoMaterno,
                "cargo_usuario": cargo_mostrar,
                "rol_sistema": rol_principal,   # primer rol
                "roles_disponibles": roles,    # todos los roles
                "idFeligres": idFeligres,
                "idPersonal": idPersonal,
                "idParroquia": idParroquia
            }

    except Exception as e:
        print(f"Error en autenticar_usuario: {e}")
        return None

    finally:
        if conexion:
            conexion.close()

    return usuario_data

def verificar_email_existe(email):
    """
    Verifica si existe un usuario con el email proporcionado.
    Retorna el idUsuario si existe, None si no.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = "SELECT idUsuario, estadoCuenta FROM usuario WHERE email = %s"
            cursor.execute(sql, (email,))
            resultado = cursor.fetchone()
            
            if resultado and resultado[1]:  # Verificar que la cuenta esté activa
                return resultado[0]
            return None
    except Exception as e:
        print(f"Error en verificar_email_existe: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

def cambiar_contrasena(email, nueva_clave):
    """
    Cambia la contraseña de un usuario.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            sql = "UPDATE usuario SET clave = %s WHERE email = %s"
            cursor.execute(sql, (nueva_clave, email))
        conexion.commit()
        return True, None
    except Exception as e:
        if conexion:
            conexion.rollback()
        print(f"Error en cambiar_contrasena: {e}")
        return False, str(e)
    finally:
        if conexion:
            conexion.close()
