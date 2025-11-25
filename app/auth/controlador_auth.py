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
    """
    conexion = obtener_conexion()
    usuario_data = None
    
    try:
        with conexion.cursor() as cursor:

            # ================================
            # PRIMERA CONSULTA: validar usuario
            # ================================
            sql_validar = """
                SELECT 
                    us.idUsuario, 
                    us.clave,
                    us.estadoCuenta
                FROM usuario us
                WHERE us.email = %s
            """
            cursor.execute(sql_validar, (email,))
            usuario = cursor.fetchone()

            if not usuario:
                return None

            idUsuario      = usuario[0]
            clave_db       = usuario[1]
            estado_cuenta  = usuario[2]

            # Validar clave (según tu sistema: texto plano)
            if clave_db != clave_ingresada or not estado_cuenta:
                return None

            # ==============================================
            # SEGUNDA CONSULTA: obtener perfil completo
            # ==============================================
            sql_datos = """
                SELECT 
                    us.idUsuario,
                    us.clave,
                    us.estadoCuenta,

                    pe.idPersonal,
                    pe.nombPers,
                    pe.apePatPers,

                    fe.idFeligres,
                    fe.nombFel,
                    fe.apePatFel,

                    pp.idParroquia,
                    c.nombCargo,
                    r.nombRol

                FROM usuario us
                LEFT JOIN personal pe ON us.idUsuario = pe.idUsuario
                LEFT JOIN feligres fe ON us.idUsuario = fe.idUsuario

                LEFT JOIN parroquia_personal pp 
                    ON pe.idPersonal = pp.idPersonal 
                    AND pp.vigenciaParrPers = TRUE

                LEFT JOIN cargo c ON pp.idCargo = c.idCargo

                LEFT JOIN rol_usuario ru ON us.idUsuario = ru.idUsuario
                LEFT JOIN rol r ON ru.idRol = r.idRol

                WHERE us.idUsuario = %s
            """
            cursor.execute(sql_datos, (idUsuario,))
            resultado = cursor.fetchone()

            if not resultado:
                return None

            # === MAPEO SEGÚN TU SELECT ===
            (
                idUsuario,
                _,
                _,
                idPersonal,
                nombPers,
                apePatPers,
                idFeligres,
                nombFel,
                apePatFel,
                idParroquia,
                nombCargo,
                nombRol
            ) = resultado

            # ===========================================================
            # DETERMINAR NOMBRE Y CARGO EXACTAMENTE COMO TÚ LO DEFINISTE
            # ===========================================================
            if idPersonal:  # Es personal
                nombre_completo = f"{nombPers} {apePatPers}"
                cargo_mostrar = nombCargo if nombCargo else "Personal"

            elif idFeligres:  # Es feligrés
                nombre_completo = f"{nombFel} {apePatFel}"
                cargo_mostrar = "Feligrés"

            else:
                nombre_completo = "Usuario Sistema"
                cargo_mostrar = "Sin Perfil"

            # ===========================================================
            # DEVOLVER OBJETO DE SESIÓN
            # ===========================================================
            usuario_data = {
                "success": True,
                "idUsuario": idUsuario,
                "email": email,

                "nombre_usuario": nombre_completo,
                "cargo_usuario": cargo_mostrar,
                "rol_sistema": nombRol,  # rol real del sistema

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
