from app.bd_sistema import obtener_conexion
from werkzeug.security import generate_password_hash

# ================== OBTENER TODOS (para la tabla) ==================
def obtener_personales():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Unimos PERSONAL, USUARIO y su CARGO vigente
            cursor.execute("""
                SELECT 
                    p.idPersonal, p.nombPers, p.apePatPers, p.apeMatPers, 
                    p.numDocPers, u.email, u.estadoCuenta, u.idUsuario, 
                    c.nombCargo
                FROM PERSONAL p
                JOIN USUARIO u ON p.idUsuario = u.idUsuario
                LEFT JOIN PARROQUIA_PERSONAL pp ON p.idPersonal = pp.idPersonal AND pp.vigenciaParrPers = TRUE
                LEFT JOIN CARGO c ON pp.idCargo = c.idCargo
                ORDER BY p.apePatPers ASC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idPersonal": fila[0],
                    "nombPers": fila[1],
                    "apePatPers": fila[2],
                    "apeMatPers": fila[3],
                    "numDocPers": fila[4],
                    "email": fila[5],
                    "estadoCuenta": bool(fila[6]),
                    "idUsuario": fila[7],
                    "nombCargo": fila[8] # Puede ser NULL si no tiene cargo vigente
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener personal: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UNO (para el modal Ver/Editar) ==================
def obtener_personal_por_id(idPersonal):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Obtenemos TODOS los campos del personal y su email
            cursor.execute("""
                SELECT 
                    p.idPersonal, p.nombPers, p.apePatPers, p.apeMatPers, 
                    p.numDocPers, p.sexoPers, p.direccionPers, 
                    p.telefonoPers, p.idTipoDocumento, u.email, u.estadoCuenta, u.idUsuario
                FROM PERSONAL p
                JOIN USUARIO u ON p.idUsuario = u.idUsuario
                WHERE p.idPersonal = %s;
            """, (idPersonal,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idPersonal": fila[0],
                    "nombPers": fila[1],
                    "apePatPers": fila[2],
                    "apeMatPers": fila[3],
                    "numDocPers": fila[4],
                    "sexoPers": fila[5],
                    "direccionPers": fila[6],
                    "telefonoPers": fila[7],
                    "idTipoDocumento": fila[8],
                    "email": fila[9],
                    "estadoCuenta": bool(fila[10]),
                    "idUsuario": fila[11]
                }
            return None
    except Exception as e:
        print(f"Error al obtener personal por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== AGREGAR (Transacción) ==================
def registrar_personal(data):
    conexion = obtener_conexion()
    try:
        # Encriptamos la contraseña
        hash_clave = generate_password_hash(data["clave"])
        
        with conexion.cursor() as cursor:
            # Iniciamos la transacción
            conexion.begin()
            
            # 1. Crear el USUARIO
            cursor.execute("""
                INSERT INTO USUARIO (email, clave, estadoCuenta)
                VALUES (%s, %s, %s);
            """, (data["email"], hash_clave, True)) # Se crea activo por defecto
            
            idUsuario_creado = cursor.lastrowid
            
            # 2. Crear el PERSONAL
            cursor.execute("""
                INSERT INTO PERSONAL (
                    numDocPers, nombPers, apePatPers, apeMatPers, 
                    sexoPers, direccionPers, telefonoPers, idTipoDocumento, idUsuario
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                data["numDocPers"],
                data["nombPers"],
                data["apePatPers"],
                data["apeMatPers"],
                data.get("sexoPers"),
                data.get("direccionPers"),
                data.get("telefonoPers"),
                data["idTipoDocumento"],
                idUsuario_creado # Usamos el ID del usuario creado
            ))
            
            conexion.commit()
            return True, "Personal registrado exitosamente"
            
    except Exception as e:
        if conexion:
            conexion.rollback()
        print(f"Error al registrar personal: {e}")
        if "USUARIO.email_UNIQUE" in str(e):
            return False, "El correo electrónico ya está registrado."
        if "PERSONAL.numDocPers_UNIQUE" in str(e):
             return False, "El número de documento ya está registrado."
        return False, f"Error al registrar: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR (Transacción) ==================
def actualizar_personal(idPersonal, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            conexion.begin()
            
            # 1. Actualizar PERSONAL
            cursor.execute("""
                UPDATE PERSONAL SET
                    numDocPers = %s, nombPers = %s, apePatPers = %s, apeMatPers = %s, 
                    sexoPers = %s, direccionPers = %s, telefonoPers = %s, idTipoDocumento = %s
                WHERE idPersonal = %s;
            """, (
                data["numDocPers"],
                data["nombPers"],
                data["apePatPers"],
                data["apeMatPers"],
                data.get("sexoPers"),
                data.get("direccionPers"),
                data.get("telefonoPers"),
                data["idTipoDocumento"],
                idPersonal
            ))
            
            # 2. Actualizar USUARIO (solo el email)
            cursor.execute("""
                UPDATE USUARIO SET email = %s
                WHERE idUsuario = %s;
            """, (data["email"], data["idUsuario"]))
            
            conexion.commit()
            return True, "Personal actualizado exitosamente"
            
    except Exception as e:
        if conexion:
            conexion.rollback()
        print(f"Error al actualizar personal: {e}")
        if "USUARIO.email_UNIQUE" in str(e):
            return False, "El correo electrónico ya está registrado por otro usuario."
        if "PERSONAL.numDocPers_UNIQUE" in str(e):
             return False, "El número de documento ya está registrado por otro usuario."
        return False, f"Error al actualizar: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO (Simple) ==================
def actualizar_estado_personal(idUsuario, estado):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # El estado está en la tabla USUARIO
            cursor.execute("""
                UPDATE USUARIO SET estadoCuenta = %s
                WHERE idUsuario = %s;
            """, (estado, idUsuario))
            conexion.commit()
            return True
    except Exception as e:
        print(f"Error al actualizar estado: {e}")
        return False
    finally:
        if conexion:
            conexion.close()

# ================== ELIMINAR (Transacción Robusta) ==================
def eliminar_personal(idPersonal):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            conexion.begin()
            
            # 1. Obtener el idUsuario antes de borrar
            cursor.execute("SELECT idUsuario FROM PERSONAL WHERE idPersonal = %s;", (idPersonal,))
            fila = cursor.fetchone()
            if not fila:
                raise Exception("Personal no encontrado")
            idUsuario_a_borrar = fila[0]
            
            # 2. Eliminar dependencias (en orden)
            # 2a. Asignaciones a parroquias
            cursor.execute("DELETE FROM PARROQUIA_PERSONAL WHERE idPersonal = %s;", (idPersonal,))
            # 2b. Excepciones de horario
            cursor.execute("DELETE FROM EXCEPCION_PERSONAL WHERE idPersonal = %s;", (idPersonal,))
            
            # 3. Eliminar PERSONAL
            cursor.execute("DELETE FROM PERSONAL WHERE idPersonal = %s;", (idPersonal,))
            
            # 4. Eliminar dependencias de USUARIO
            # 4a. Roles de usuario
            cursor.execute("DELETE FROM ROL_USUARIO WHERE idUsuario = %s;", (idUsuario_a_borrar,))
            
            # 5. Eliminar USUARIO
            cursor.execute("DELETE FROM USUARIO WHERE idUsuario = %s;", (idUsuario_a_borrar,))
            
            conexion.commit()
            return True, "Personal eliminado exitosamente (junto con su usuario y asignaciones)."
            
    except Exception as e:
        if conexion:
            conexion.rollback()
        print(f"Error al eliminar personal: {e}")
        return False, f"Error al eliminar: {e}"
    finally:
        if conexion:
            conexion.close()