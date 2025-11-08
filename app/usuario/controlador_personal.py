from app.bd_sistema import obtener_conexion

def get_datos_personal():
    conexion = obtener_conexion()
    try:
        resultados_dict = {}

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
                    pp.f_inicio,           
                    pp.f_fin,              
                    pp.vigenciaParrPers,   
                    ca.nombCargo,          
                    r.nombRol,             
                    pa.nombParroquia       
                FROM usuario us
                INNER JOIN rol_usuario ru ON us.idUsuario = ru.idUsuario
                INNER JOIN rol r ON r.idRol = ru.idRol
                INNER JOIN personal pe ON us.idUsuario = pe.idUsuario
                INNER JOIN tipo_documento ti ON ti.idTipoDocumento = pe.idTipoDocumento
                INNER JOIN parroquia_personal pp ON pp.idPersonal = pe.idPersonal
                INNER JOIN cargo ca ON ca.idCargo = pp.idCargo
                INNER JOIN parroquia pa ON pa.idParroquia = pp.idParroquia
                ORDER BY us.idUsuario;
            """)

            resultados = cursor.fetchall()

            for fila in resultados:
                id_user = fila[0]

                if id_user not in resultados_dict:
                    resultados_dict[id_user] = {
                        'idUsuario': fila[0],
                        'email': fila[1],
                        'clave': fila[2],
                        'estadoCuenta': fila[3],
                        'numDocPers': fila[4],
                        'nombDocumento': fila[5],
                        'nombPers': fila[6],
                        'apePatPers': fila[7],
                        'apeMatPers': fila[8],
                        'sexoPers': fila[9],
                        'direccionPers': fila[10],
                        'telefonoPers': fila[11],
                        'f_inicio': fila[12],
                        'f_fin': fila[13],
                        'vigenciaParrPers': fila[14],
                        'nombCargo': fila[15],
                        'nombParroquia': fila[17],
                        'roles': []
                    }

                rol = fila[16]
                if rol not in resultados_dict[id_user]['roles']:
                    resultados_dict[id_user]['roles'].append(rol)

        return list(resultados_dict.values())

    except Exception as e:
        print(f'Error al obtener los datos del personal: {e}')
        return []

    finally:
        if conexion:
            conexion.close()



def agregar_usuario_personal(email, clave, numDocPers, nombre, apePaterno, apeMaterno, sexo, direccion,
                             telefono, tipoDocumento, cargo, parroquia, roles, finicio, f_fin):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:

            # ✅ Insert Usuario
            cursor.execute("""
                INSERT INTO usuario (email, clave, estadoCuenta)
                VALUES (%s, %s, TRUE);
            """, (email, clave))
            idUsuario = cursor.lastrowid

            # ✅ Tipo Documento
            cursor.execute("SELECT idTipoDocumento FROM tipo_documento WHERE nombDocumento=%s",
                           (tipoDocumento,))
            idTipoDocumento = cursor.fetchone()
            idTipoDocumento = idTipoDocumento[0] if idTipoDocumento else None

            # ✅ Insert Personal
            cursor.execute("""
                INSERT INTO personal (numDocPers, nombPers, apePatPers, apeMatPers, sexoPers, direccionPers, telefonoPers, idTipoDocumento, idUsuario)
                VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s);
            """, (numDocPers, nombre, apePaterno, apeMaterno, sexo, direccion, telefono, idTipoDocumento, idUsuario))
            idPersonal = cursor.lastrowid

            # ✅ Cargo
            cursor.execute("SELECT idCargo FROM cargo WHERE nombCargo=%s", (cargo,))
            idCargo = cursor.fetchone()[0]

            # ✅ Parroquia
            cursor.execute("SELECT idParroquia FROM parroquia WHERE nombParroquia=%s", (parroquia,))
            idParroquia = cursor.fetchone()[0]

            # ✅ Insert Parroquia-Personal
            cursor.execute("""
                INSERT INTO parroquia_personal (f_inicio, f_fin, vigenciaParrPers, idCargo, idParroquia, idPersonal)
                VALUES (%s,%s,TRUE,%s,%s,%s);
            """, (finicio, f_fin, idCargo, idParroquia, idPersonal))

            # ✅ Insert Roles (uno o varios)
            if isinstance(roles, str):
                roles = [roles]  # convertir a lista

            for rol in roles:
                cursor.execute("SELECT idRol FROM rol WHERE nombRol=%s", (rol,))
                result = cursor.fetchone()
                if result:
                    idRol = result[0]
                    cursor.execute("INSERT INTO rol_usuario (idRol, idUsuario) VALUES (%s,%s)",
                                   (idRol, idUsuario))

        conexion.commit()
        return {"ok": True, "mensaje": "Usuario agregado correctamente"}

    except Exception as e:
        conexion.rollback()
        print(f"Error al agregar usuario personal: {e}")
        return {"ok": False, "mensaje": str(e)}

    finally:
        if conexion:
            conexion.close()
 
def actualizar_usuario_personal(idUsuario, email, clave, numDocPers, nombre, apePaterno, apeMaterno, sexo,
                                direccion, telefono, tipoDocumento, cargo, parroquia,
                                roles, f_inicio, f_fin):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:

            # ✅ Actualizar Usuario
            cursor.execute("""
                UPDATE usuario
                SET email=%s, clave=%s
                WHERE idUsuario=%s;
            """, (email, clave, idUsuario))

            # ✅ Buscar idTipoDocumento
            cursor.execute("SELECT idTipoDocumento FROM tipo_documento WHERE nombDocumento=%s",
                           (tipoDocumento,))
            idTipo = cursor.fetchone()
            idTipoDocumento = idTipo[0] if idTipo else None

            # ✅ Actualizar Personal
            cursor.execute("""
                UPDATE personal
                SET numDocPers=%s, nombPers=%s, apePatPers=%s, apeMatPers=%s,
                    sexoPers=%s, direccionPers=%s, telefonoPers=%s, idTipoDocumento=%s
                WHERE idUsuario=%s;
            """, (numDocPers, nombre, apePaterno, apeMaterno, sexo,
                  direccion, telefono, idTipoDocumento, idUsuario))

            # ✅ Obtener idPersonal para relaciones
            cursor.execute("SELECT idPersonal FROM personal WHERE idUsuario=%s", (idUsuario,))
            idPersonal = cursor.fetchone()[0]

            # ✅ Obtener cargo y parroquia
            cursor.execute("SELECT idCargo FROM cargo WHERE nombCargo=%s", (cargo,))
            idCargo = cursor.fetchone()[0]

            cursor.execute("SELECT idParroquia FROM parroquia WHERE nombParroquia=%s", (parroquia,))
            idParroquia = cursor.fetchone()[0]

            # ✅ Actualizar parroquia_personal
            cursor.execute("""
                UPDATE parroquia_personal
                SET f_inicio=%s, f_fin=%s, vigenciaParrPers=TRUE,
                    idCargo=%s, idParroquia=%s
                WHERE idPersonal=%s;
            """, (f_inicio, f_fin, idCargo, idParroquia, idPersonal))

            # ✅ Actualizar Roles
            # 1️⃣ Eliminar roles actuales
            cursor.execute("DELETE FROM rol_usuario WHERE idUsuario=%s", (idUsuario,))

            # 2️⃣ Insertar roles nuevos
            if isinstance(roles, str):
                roles = [roles]  # Convertir si es un solo rol

            for rol in roles:
                cursor.execute("SELECT idRol FROM rol WHERE nombRol=%s", (rol,))
                result = cursor.fetchone()
                if result:
                    cursor.execute("""
                        INSERT INTO rol_usuario (idRol, idUsuario)
                        VALUES (%s, %s);
                    """, (result[0], idUsuario))

        conexion.commit()
        return {"ok": True, "mensaje": "Usuario actualizado correctamente ✅"}

    except Exception as e:
        conexion.rollback()
        print(f"Error al actualizar usuario personal: {e}")
        return {"ok": False, "mensaje": str(e)}

    finally:
        if conexion:
            conexion.close()

def eliminar_usuario_personal(idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Primero eliminar personal porque tiene FK hacia usuario
            cursor.execute("""
                DELETE FROM personal WHERE idUsuario = %s
            """, (idUsuario,))
            
            # Luego eliminar usuario
            cursor.execute("""
                DELETE FROM usuario WHERE idUsuario = %s
            """, (idUsuario,))

        conexion.commit()
        return True, "Usuario y personal eliminados correctamente"
    except Exception as e:
        print("Error al eliminar personal:", e)
        return False, "Error al eliminar personal"
    finally:
        conexion.close()


def verificar_relacion_personal(idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:

            # ✅ Obtener primero idPersonal a partir del usuario
            cursor.execute("""
                SELECT idPersonal 
                FROM personal 
                WHERE idUsuario = %s
            """, (idUsuario,))
            result = cursor.fetchone()

            idPersonal = result[0] if result else None

            relaciones = []

            # ✅ Verificar roles
            cursor.execute("""
                SELECT COUNT(*) 
                FROM rol_usuario 
                WHERE idUsuario = %s
            """, (idUsuario,))
            if cursor.fetchone()[0] > 0:
                relaciones.append("rol_usuario")

            # ✅ Verificar parroquia relacionada
            if idPersonal is not None:
                cursor.execute("""
                    SELECT COUNT(*) 
                    FROM parroquia_personal 
                    WHERE idPersonal = %s
                """, (idPersonal,))
                if cursor.fetchone()[0] > 0:
                    relaciones.append("parroquia_personal")

        return {
            "ok": True,
            "bloqueado": len(relaciones) > 0,
            "relaciones": relaciones
        }

    except Exception as e:
        print(f"Error al verificar relaciones del personal: {e}")
        return {"ok": False, "bloqueado": True, "relaciones": []}

def personal_reserva_datos(idParroquia):
    conexion=obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
            SELECT
                CONCAT(pe.nombPers, ' ', pe.apePatPers, ' ', pe.apeMatPers) AS nombreCompleto
            FROM
                personal pe
            INNER JOIN
                parroquia_personal pp ON pe.idPersonal = pp.idPersonal
            INNER JOIN
                usuario us ON us.idUsuario = pe.idUsuario
            INNER JOIN
                rol_usuario ru ON us.idUsuario = ru.idUsuario
            INNER JOIN
                rol r ON ru.idRol = r.idRol
            WHERE
                r.nombRol = 'Sacerdote'
                AND pp.idParroquia =%s;
            """,(idParroquia,))
            resultados=cursor.fetchall()
            return resultados
    except Exception as e:
        print(f"Error al obtener datos del personal: {e}")
        return {"ok": False, "bloqueado": True, "relaciones": []}
    finally:
        if conexion:
            conexion.close()