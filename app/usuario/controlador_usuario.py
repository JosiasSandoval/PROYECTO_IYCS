from app.bd_sistema import obtener_conexion

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


#Administrador-feligres:
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


def obtener_feligres_por_id(idUsuario):
    """Obtiene los datos de un feligrés específico usando su idUsuario."""
    conexion = obtener_conexion()
    feligres = None
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    us.email,
                    fe.nombFel,
                    fe.apePatFel,
                    fe.apeMatFel,
                    fe.telefonoFel,
                    fe.direccionFel,
                    fe.f_nacimiento,
                    fe.sexoFel,
                    ti.nombDocumento,
                    fe.numDocFel
                FROM usuario us
                INNER JOIN feligres fe ON us.idUsuario = fe.idUsuario
                INNER JOIN tipo_documento ti ON fe.idTipoDocumento = ti.idTipoDocumento
                WHERE us.idUsuario = %s
            """, (idUsuario,))
            
            fila = cursor.fetchone()
            
            if fila:
                feligres = {
                    'idUsuario': idUsuario, # AGREGADO: Útil para el JS
                    'email': fila[0],
                    'nombFel': fila[1], 
                    'apePatFel': fila[2],
                    'apeMatFel': fila[3],
                    'nombreCompleto': f"{fila[1]} {fila[2]} {fila[3]}", # COMBINACIÓN
                    'telefonoFel': fila[4],
                    'direccionFel': fila[5],
                    # Formatea la fecha para el input type="date"
                    'f_nacimiento': fila[6].strftime("%Y-%m-%d") if fila[6] else None, 
                    'sexoFel': fila[7], # AGREGADO: Dato necesario para actualizar
                    'nombDocumento': fila[8], # AGREGADO: Dato necesario para actualizar
                    'numDocFel': fila[9], # AGREGADO: Dato necesario para actualizar
                }
        return feligres
    except Exception as e:
        print(f"Error CRÍTICO en la consulta SQL del perfil: {e}")
        # Retornar None para que el Router maneje el 404
        return None 
    finally:
        if conexion:
            conexion.close()

def datos_reserva_usuario(nombre):
    """
    Busca feligreses cuyo nombre completo contenga las palabras proporcionadas
    en el parámetro `nombre`. La búsqueda es parcial y mantiene el orden de las palabras.
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Construimos la cadena de búsqueda para SQL LIKE
            palabras = nombre.strip().split()  # divide en palabras
            like_pattern = '%' + '%'.join(palabras) + '%'  # '%Juan%Perez%Lopez%'

            cursor.execute("""
                SELECT 
                    idFeligres,
                    numDocFel, 
                    CONCAT(nombFel, ' ', apePatFel, ' ', apeMatFel) AS nombreCompleto, 
                    telefonoFel, 
                    direccionFel
                FROM feligres
                WHERE CONCAT(nombFel, ' ', apePatFel, ' ', apeMatFel) LIKE %s
            """, (like_pattern,))
            
            resultados = cursor.fetchall()
            return resultados
    except Exception as e:
        print(f'Error al obtener los datos de la reserva: {e}')
        return []
    finally:
        if conexion:
            conexion.close()

