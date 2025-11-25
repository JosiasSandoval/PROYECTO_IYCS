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
    Verifica credenciales y devuelve un diccionario con toda la info de sesión necesaria
    (IDs técnicos y nombres para mostrar).
    """
    conexion = obtener_conexion()
    usuario_data = None
    
    try:
        with conexion.cursor() as cursor:
            # Consulta unificada para obtener datos de Usuario, Personal, Feligrés y Cargos
            # Se prioriza la información de PERSONAL si existe, sino se usa la de FELIGRES
            sql = """
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
                LEFT JOIN parroquia_personal pp ON pe.idPersonal = pp.idPersonal AND pp.vigenciaParrPers = TRUE
                LEFT JOIN cargo c ON pp.idCargo = c.idCargo
                LEFT JOIN rol_usuario ru ON us.idUsuario = ru.idUsuario
                LEFT JOIN rol r ON ru.idRol = r.idRol
                WHERE us.email = %s
            """
            cursor.execute(sql, (email,))
            resultado = cursor.fetchone()

            # Estructura de 'resultado' basada en el SELECT:
            # 0: idUsuario, 1: clave, 2: estadoCuenta
            # 3: idPersonal, 4: nombPers, 5: apePatPers
            # 6: idFeligres, 7: nombFel, 8: apePatFel
            # 9: idParroquia, 10: nombCargo, 11: nombRol

            if resultado:
                db_clave = resultado[1]
                estado_cuenta = resultado[2]

                # Verificar contraseña (texto plano según tu código anterior)
                if db_clave == clave_ingresada and estado_cuenta:
                    
                    # Lógica para determinar Nombre y Cargo a mostrar
                    if resultado[3]: # Es PERSONAL
                        nombre_completo = f"{resultado[4]} {resultado[5]}"
                        cargo_mostrar = resultado[10] if resultado[10] else "Personal"
                    elif resultado[6]: # Es FELIGRES
                        nombre_completo = f"{resultado[7]} {resultado[8]}"
                        cargo_mostrar = "Feligrés"
                    else:
                        nombre_completo = "Usuario Sistema"
                        cargo_mostrar = "Sin Perfil"

                    # Construir diccionario de sesión robusto
                    usuario_data = {
                        "success": True,
                        "idUsuario": resultado[0],
                        "email": email,
                        "nombre_usuario": nombre_completo,
                        "cargo_usuario": cargo_mostrar,
                        "rol_sistema": resultado[11], # Rol técnico (ej: ADMIN, SECRETARIA)
                        
                        # IDs específicos útiles para operaciones posteriores
                        "idFeligres": resultado[6], 
                        "idPersonal": resultado[3],
                        "idParroquia": resultado[9] 
                    }

    except Exception as e:
        print(f"Error en autenticar_usuario: {e}")
        return None

    finally:
        conexion.close()
        if conexion:
            conexion.close()

    return usuario_data
