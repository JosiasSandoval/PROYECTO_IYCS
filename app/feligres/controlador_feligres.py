from app.bd_sistema import obtener_conexion
from werkzeug.security import generate_password_hash # Para encriptar claves

# ================== OBTENER TODOS (para la tabla) ==================
def obtener_feligreses():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Unimos FELIGRES y USUARIO para obtener los datos de la tabla
            cursor.execute("""
                SELECT 
                    f.idFeligres, 
                    f.nombFel, 
                    f.apePatFel, 
                    f.apeMatFel, 
                    f.numDocFel, 
                    u.email, 
                    u.estadoCuenta,
                    u.idUsuario
                FROM FELIGRES f
                JOIN USUARIO u ON f.idUsuario = u.idUsuario
                ORDER BY f.apePatFel ASC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idFeligres": fila[0],
                    "nombFel": fila[1],
                    "apePatFel": fila[2],
                    "apeMatFel": fila[3],
                    "numDocFel": fila[4],
                    "email": fila[5],
                    "estadoCuenta": bool(fila[6]),
                    "idUsuario": fila[7]
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener feligreses: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UNO (para el modal Ver/Editar) ==================
def obtener_feligres_por_id(idFeligres):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Obtenemos TODOS los campos del feligrés y su email
            cursor.execute("""
                SELECT 
                    f.idFeligres, f.nombFel, f.apePatFel, f.apeMatFel, 
                    f.numDocFel, f.f_nacimiento, f.sexoFel, f.direccionFel, 
                    f.telefonoFel, f.idTipoDocumento, u.email, u.estadoCuenta, u.idUsuario
                FROM FELIGRES f
                JOIN USUARIO u ON f.idUsuario = u.idUsuario
                WHERE f.idFeligres = %s;
            """, (idFeligres,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idFeligres": fila[0],
                    "nombFel": fila[1],
                    "apePatFel": fila[2],
                    "apeMatFel": fila[3],
                    "numDocFel": fila[4],
                    "f_nacimiento": fila[5].isoformat() if fila[5] else None,
                    "sexoFel": fila[6],
                    "direccionFel": fila[7],
                    "telefonoFel": fila[8],
                    "idTipoDocumento": fila[9],
                    "email": fila[10],
                    "estadoCuenta": bool(fila[11]),
                    "idUsuario": fila[12]
                }
            return None
    except Exception as e:
        print(f"Error al obtener feligrés por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()

# ================== AGREGAR (Transacción) ==================
def registrar_feligres(data):
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
            
            # Obtenemos el ID del usuario recién creado
            idUsuario_creado = cursor.lastrowid
            
            # 2. Crear el FELIGRES
            cursor.execute("""
                INSERT INTO FELIGRES (
                    numDocFel, nombFel, apePatFel, apeMatFel, f_nacimiento, 
                    sexoFel, direccionFel, telefonoFel, idTipoDocumento, idUsuario
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, (
                data["numDocFel"],
                data["nombFel"],
                data["apePatFel"],
                data["apeMatFel"],
                data.get("f_nacimiento"), # .get() para campos opcionales
                data.get("sexoFel"),
                data.get("direccionFel"),
                data.get("telefonoFel"),
                data["idTipoDocumento"],
                idUsuario_creado # Usamos el ID del usuario creado
            ))
            
            # Si todo fue bien, confirmamos la transacción
            conexion.commit()
            return True, "Feligrés registrado exitosamente"
            
    except Exception as e:
        # Si algo falla, revertimos
        if conexion:
            conexion.rollback()
        print(f"Error al registrar feligrés: {e}")
        if "USUARIO.email_UNIQUE" in str(e):
            return False, "El correo electrónico ya está registrado."
        if "FELIGRES.numDocFel_UNIQUE" in str(e):
             return False, "El número de documento ya está registrado."
        return False, f"Error al registrar: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR (Transacción) ==================
def actualizar_feligres(idFeligres, data):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            conexion.begin()
            
            # 1. Actualizar FELIGRES
            cursor.execute("""
                UPDATE FELIGRES SET
                    numDocFel = %s, nombFel = %s, apePatFel = %s, apeMatFel = %s, 
                    f_nacimiento = %s, sexoFel = %s, direccionFel = %s, 
                    telefonoFel = %s, idTipoDocumento = %s
                WHERE idFeligres = %s;
            """, (
                data["numDocFel"],
                data["nombFel"],
                data["apePatFel"],
                data["apeMatFel"],
                data.get("f_nacimiento"),
                data.get("sexoFel"),
                data.get("direccionFel"),
                data.get("telefonoFel"),
                data["idTipoDocumento"],
                idFeligres
            ))
            
            # 2. Actualizar USUARIO (solo el email)
            cursor.execute("""
                UPDATE USUARIO SET email = %s
                WHERE idUsuario = %s;
            """, (data["email"], data["idUsuario"]))
            
            conexion.commit()
            return True, "Feligrés actualizado exitosamente"
            
    except Exception as e:
        if conexion:
            conexion.rollback()
        print(f"Error al actualizar feligrés: {e}")
        if "USUARIO.email_UNIQUE" in str(e):
            return False, "El correo electrónico ya está registrado por otro usuario."
        if "FELIGRES.numDocFel_UNIQUE" in str(e):
             return False, "El número de documento ya está registrado por otro usuario."
        return False, f"Error al actualizar: {e}"
    finally:
        if conexion:
            conexion.close()

# ================== ACTUALIZAR ESTADO (Simple) ==================
def actualizar_estado_feligres(idUsuario, estado):
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

# ================== ELIMINAR (Transacción) ==================
def eliminar_feligres(idFeligres):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            conexion.begin()
            
            # 1. Obtener el idUsuario antes de borrar el feligrés
            cursor.execute("SELECT idUsuario FROM FELIGRES WHERE idFeligres = %s;", (idFeligres,))
            fila = cursor.fetchone()
            if not fila:
                raise Exception("Feligrés no encontrado")
            idUsuario_a_borrar = fila[0]
            
            # 2. Eliminar FELIGRES (debe ir primero por la Foreign Key)
            cursor.execute("DELETE FROM FELIGRES WHERE idFeligres = %s;", (idFeligres,))
            
            # 3. Eliminar USUARIO
            cursor.execute("DELETE FROM USUARIO WHERE idUsuario = %s;", (idUsuario_a_borrar,))
            
            conexion.commit()
            return True, "Feligrés eliminado exitosamente"
            
    except Exception as e:
        if conexion:
            conexion.rollback()
        print(f"Error al eliminar feligrés: {e}")
        # Manejar error si el feligrés tiene reservas activas, etc.
        if "foreign key constraint" in str(e).lower():
             return False, "No se puede eliminar: el feligrés tiene reservas u otros registros asociados."
        return False, f"Error al eliminar: {e}"
    finally:
        if conexion:
            conexion.close()