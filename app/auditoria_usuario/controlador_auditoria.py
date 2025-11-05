from app.bd_sistema import obtener_conexion

# ================== OBTENER AUDITORÍA DE USUARIOS ==================
def obtener_auditoria_usuarios():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    idAuditoria, fechaHora, nombreTabla, tipoAccion, 
                    idRegistroAfectado, nombreCampo, valorAnterior, valorNuevo
                FROM AUDITORIA_USUARIO
                ORDER BY fechaHora DESC;
            """)
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    "idAuditoria": fila[0],
                    "fechaHora": fila[1].isoformat(), # Convertir a string ISO
                    "nombreTabla": fila[2],
                    "tipoAccion": fila[3],
                    "idRegistroAfectado": fila[4],
                    "nombreCampo": fila[5],
                    "valorAnterior": fila[6],
                    "valorNuevo": fila[7]
                })
            return resultados
    except Exception as e:
        print(f"Error al obtener auditoría de usuarios: {e}")
        return []
    finally:
        if conexion:
            conexion.close()

# ================== OBTENER UN REGISTRO POR ID ==================
def obtener_auditoria_usuario_por_id(idAuditoria):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    idAuditoria, fechaHora, nombreTabla, tipoAccion, 
                    idRegistroAfectado, nombreCampo, valorAnterior, valorNuevo
                FROM AUDITORIA_USUARIO
                WHERE idAuditoria = %s;
            """, (idAuditoria,))
            fila = cursor.fetchone()
            if fila:
                return {
                    "idAuditoria": fila[0],
                    "fechaHora": fila[1].isoformat(),
                    "nombreTabla": fila[2],
                    "tipoAccion": fila[3],
                    "idRegistroAfectado": fila[4],
                    "nombreCampo": fila[5],
                    "valorAnterior": fila[6],
                    "valorNuevo": fila[7]
                }
            return None
    except Exception as e:
        print(f"Error al obtener registro de auditoría por ID: {e}")
        return None
    finally:
        if conexion:
            conexion.close()