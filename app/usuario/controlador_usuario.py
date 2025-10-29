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

def cambiar_estado_cuenta(idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("SELECT estadoCuenta FROM usuario WHERE idUsuario=%s", (idUsuario,))
            estado_actual = cursor.fetchone()
            if estado_actual is None:
                return {"ok": False, "mensaje": f"No existe usuario con id {idUsuario}"}

            # Asegurarse de convertir a boolean
            nuevo_estado = 0 if estado_actual[0] else 1
            cursor.execute("UPDATE usuario SET estadoCuenta=%s WHERE idUsuario=%s", (nuevo_estado, idUsuario))
        conexion.commit()
        return {"ok": True, "mensaje": "Estado de la cuenta actualizado correctamente"}
    except Exception as e:
        print(f"Error al cambiar el estado de la cuenta: {e}")
        return {"ok": False, "mensaje": str(e)}
    finally:
        conexion.close()


#Administrador:
def get_usuario_feligres():
    conexion = obtener_conexion()
    try:
        usuarios = []  # Lista final de diccionarios
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    us.idUsuario,
                    us.email,
                    us.clave,
                    us.estadoCuenta,
                    fe.numDocFel,
                    ti.nombDocumento,
                    fe.nombFel,
                    fe.apePatFel,
                    fe.apeMatFel,
                    fe.f_nacimiento,
                    fe.sexoFel,
                    fe.direccionFel,
                    fe.telefonoFel
                FROM usuario us
                INNER JOIN rol_usuario rs ON us.idUsuario = rs.idRolUsuario
                INNER JOIN rol r ON rs.idRol = r.idRol
                INNER JOIN feligres fe ON us.idUsuario = fe.idUsuario
                INNER JOIN tipo_documento ti ON fe.idTipoDocumento = ti.idTipoDocumento
            """)
            filas = cursor.fetchall()
            for fila in filas:
                usuarios.append({
                    'id': fila[0],
                    'email': fila[1],
                    'clave': fila[2],
                    'estadoCuenta': fila[3],
                    'numDocPers': fila[4],
                    'nombDocumento': fila[5],
                    'nombPers': fila[6],
                    'apePatPers': fila[7],
                    'apeMatPers': fila[8],
                    'f_nacimiento': fila[9],
                    'sexoPers': fila[10],
                    'direccionPers': fila[11],
                    'telefonoPers': fila[12],
                })
        return usuarios
    except Exception as e:
        print(f"Error al listar los usuarios: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

def get_usuario_personal():
    conexion = obtener_conexion()
    try:
        resultados=[]
        with conexion.cursor() as cursor:
            cursor.execute("""
                    SELECT 
                        us.idUsuario,
                        us.email,
                        us.clave,
                        us.estadoCuenta,
                        pe.numDocPers,
                        ti.nombDocumento,
                        pe.nombPers,
                        pe.apePatPers,
                        pe.apeMatPers,
                        pe.sexoPers,
                        pe.direccionPers,
                        pe.telefonoPers,
                        ca.nombCargo,
                        r.nombRol,
                        pa.nombParroquia
                    FROM usuario us
                    INNER JOIN rol_usuario rs ON us.idUsuario = rs.idRolUsuario
                    INNER JOIN personal pe ON us.idUsuario=pe.idUsuario
                    INNER JOIN parroquia_personal pp ON pp.idPersonal=pe.idPersonal
                    INNER JOIN cargo ca ON pp.idCargo=ca.idCargo
                    INNER JOIN parroquia pa ON pa.idParroquia=pp.idParroquia
                    INNER JOIN rol r ON rs.idRol = r.idRol
                    INNER JOIN tipo_documento ti ON pe.idTipoDocumento = ti.idTipoDocumento
                           """)
            resultados=cursor.fetchall()
            for fila in resultados:
                resultados.append({
                    'id':fila[0],
                    'email':fila[1],
                    'estadoCuenta':fila[2],
                    'numDocPers':fila[3],
                    'nombDocumento':fila[4],
                    'nombPers':fila[5],
                    'apePatPers':fila[6],
                    'apeMatPers':fila[7],
                    'sexoPers':fila[8],
                    'direccionPers':fila[9],
                    'telefonoPers':fila[10],
                    'nombCargo':fila[11],
                    'nombParroquia':fila[12]
                })
            return resultados
    except Exception as e:
        print(f"Error al listar los usuarios: {e}")
        return[]
    finally:
        if conexion:
            conexion.close()

def agregar_usuario_feligres(email, clave, numDocFel, nombFel, apePatFel, apeMatFel,
                             f_nacimiento, sexoFel, direccionFel, telefonoFel,
                             idRol, nombreTipoDocumento):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Obtener el idTipoDocumento a partir del nombre
            cursor.execute(
                "SELECT idTipoDocumento FROM tipo_documento WHERE nombDocumento = %s",
                (nombreTipoDocumento,)
            )
            resultado = cursor.fetchone()
            if not resultado:
                return {"ok": False, "mensaje": f"Tipo de documento '{nombreTipoDocumento}' no encontrado"}
            idTipoDocumento = resultado[0]

            # Insertar en usuario
            cursor.execute(
                "INSERT INTO usuario (email, clave, estadoCuenta) VALUES (%s, %s, TRUE)",
                (email, clave)
            )
            idUsuario = cursor.lastrowid

            # Insertar en feligres
            cursor.execute(
                """
                INSERT INTO feligres 
                (numDocFel, nombFel, apePatFel, apeMatFel, f_nacimiento, sexoFel, 
                 direccionFel, telefonoFel, idTipoDocumento, idUsuario)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (numDocFel, nombFel, apePatFel, apeMatFel, f_nacimiento, sexoFel,
                 direccionFel, telefonoFel, idTipoDocumento, idUsuario)
            )

            # Insertar en rol_usuario
            cursor.execute(
                "INSERT INTO rol_usuario (idRol, idUsuario) VALUES (%s, %s)",
                (idRol, idUsuario)
            )

            conexion.commit()
            return {"ok": True, "mensaje": "Usuario agregado correctamente"}

    except Exception as e:
        if conexion:
            conexion.rollback()
        print(f"Error al agregar usuario: {e}")
        return {"ok": False, "mensaje": str(e)}

    finally:
        if conexion:
            conexion.close()



def actualizar_usuario_feligres(email, clave, numDocFel, nombFel, apePatFel, apeMatFel, f_nacimiento,
                                sexoFel, direccionFel, telefonoFel, idRol, idTipoDocumento_nombre, idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Obtener idTipoDocumento a partir del nombre
            cursor.execute("SELECT idTipoDocumento FROM tipo_documento WHERE nombDocumento=%s", (idTipoDocumento_nombre,))
            resultado = cursor.fetchone()
            if resultado:
                idTipoDocumento = resultado[0]
            else:
                return {"ok": False, "mensaje": f"Tipo de documento '{idTipoDocumento_nombre}' no existe"}

            # Actualizar tabla usuario
            cursor.execute(
                "UPDATE usuario SET email=%s, clave=%s WHERE idUsuario=%s",
                (email, clave, idUsuario)
            )

            # Actualizar tabla feligres
            cursor.execute(
                """UPDATE feligres 
                   SET numDocFel=%s, nombFel=%s, apePatFel=%s, apeMatFel=%s,
                       f_nacimiento=%s, sexoFel=%s, direccionFel=%s, telefonoFel=%s, idTipoDocumento=%s
                   WHERE idUsuario=%s""",
                (numDocFel, nombFel, apePatFel, apeMatFel, f_nacimiento,
                 sexoFel, direccionFel, telefonoFel, idTipoDocumento, idUsuario)
            )

            # Asegurar rol correcto (opcional)
            cursor.execute(
                "UPDATE rol_usuario SET idRol=%s WHERE idRolUsuario=%s",
                (idRol, idUsuario)
            )

        conexion.commit()
        return {"ok": True, "mensaje": "Usuario actualizado correctamente"}
    except Exception as e:
        print(f"Error al actualizar usuario: {e}")
        return {"ok": False, "mensaje": str(e)}
    finally:
        conexion.close()



def verificar_relacion_feligres(idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM (
                    SELECT 1
                    FROM feligres fe
                    INNER JOIN usuario us ON fe.idUsuario = us.idUsuario
                    INNER JOIN reserva re ON us.idUsuario = re.idUsuario
                    WHERE us.idUsuario = %s
                ) AS total_relaciones;
            """, (idUsuario,))
            resultado = cursor.fetchone()[0]
            return resultado > 0
    except Exception as e:
        print(f'Error al verificar las relaciones del rol: {e}')
        return {'ok': False, 'mensaje': str(e)}
    finally:
        if conexion:
            conexion.close()

def eliminar_usuario_feligres(idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Eliminar relaciones de rol
            cursor.execute("DELETE FROM rol_usuario WHERE idRolUsuario=%s", (idUsuario,))
            # Eliminar datos de feligres
            cursor.execute("DELETE FROM feligres WHERE idUsuario=%s", (idUsuario,))
            # Eliminar usuario
            cursor.execute("DELETE FROM usuario WHERE idUsuario=%s", (idUsuario,))
        conexion.commit()
        return {"ok": True, "mensaje": "Usuario eliminado correctamente"}
    except Exception as e:
        print(f'Error al eliminar usuario: {e}')
        return {"ok": False, "mensaje": str(e)}
    finally:
        conexion.close()
