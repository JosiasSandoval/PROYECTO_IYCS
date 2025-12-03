from app.bd_sistema import obtener_conexion

def obtener_acto_parroquia(idParroquia, rol_usuario=''):
    """
    Obtiene los actos litúrgicos de una parroquia filtrados por rol.
    Agrupa por acto para evitar duplicados (un acto puede tener múltiples horarios).
    - feligres: actos con numParticipantes > 1
    - secretaria: todos los actos
    - sacerdote: actos con numParticipantes = 1
    """
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Construir query según rol - usando DISTINCT y GROUP BY para evitar duplicados
            if rol_usuario == 'feligres':
                # Feligrés: solo actos con más de 1 participante
                cursor.execute("""
                    SELECT DISTINCT al.idActo, al.nombActo, MIN(ap.costoBase) as costoBase
                    FROM acto_liturgico al
                    INNER JOIN acto_parroquia ap ON al.idActo = ap.idActo
                    INNER JOIN parroquia pa ON ap.idParroquia = pa.idParroquia
                    WHERE pa.idParroquia = %s AND al.numParticipantes > 1
                    GROUP BY al.idActo, al.nombActo
                    ORDER BY al.nombActo;
                """, (idParroquia,))
            elif rol_usuario == 'sacerdote':
                # Sacerdote: solo actos con exactamente 1 participante
                cursor.execute("""
                    SELECT DISTINCT al.idActo, al.nombActo, MIN(ap.costoBase) as costoBase
                    FROM acto_liturgico al
                    INNER JOIN acto_parroquia ap ON al.idActo = ap.idActo
                    INNER JOIN parroquia pa ON ap.idParroquia = pa.idParroquia
                    WHERE pa.idParroquia = %s AND al.numParticipantes = 1
                    GROUP BY al.idActo, al.nombActo
                    ORDER BY al.nombActo;
                """, (idParroquia,))
            else:
                # Secretaria o cualquier otro rol: todos los actos
                cursor.execute("""
                    SELECT DISTINCT al.idActo, al.nombActo, MIN(ap.costoBase) as costoBase
                    FROM acto_liturgico al
                    INNER JOIN acto_parroquia ap ON al.idActo = ap.idActo
                    INNER JOIN parroquia pa ON ap.idParroquia = pa.idParroquia
                    WHERE pa.idParroquia = %s
                    GROUP BY al.idActo, al.nombActo
                    ORDER BY al.nombActo;
                """, (idParroquia,))
            
            filas = cursor.fetchall()
            
            resultados = []
            for fila in filas:
                resultados.append({
                    'id': fila[0],
                    'acto': fila[1],
                    'costoBase': fila[2]
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener los actos litúrgicos de la parroquia: {e}')
        return []
    finally:
        if conexion:
            conexion.close()

def disponibilidad_acto_parroquia(idParroquia,idActo):
    """
    Obtiene todos los horarios configurados para un acto en una parroquia.
    Normaliza el formato de diaSemana para que coincida con el frontend.
    """
    conexion = obtener_conexion()
    try:    
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT ap.idActoParroquia, ap.diaSemana, ap.horaInicioActo
                FROM acto_liturgico al
                INNER JOIN acto_parroquia ap ON al.idActo = ap.idActo
                INNER JOIN parroquia pa ON ap.idParroquia = pa.idParroquia
                WHERE pa.idParroquia = %s and al.idActo = %s
                ORDER BY ap.diaSemana, ap.horaInicioActo;
            """, (idParroquia,idActo))  
            filas = cursor.fetchall()
            resultados = []
            
            # Mapeo de días de la BD al formato del frontend
            mapeo_dias = {
                'Dom': 'dom',
                'Lun': 'lun',
                'Mar': 'mar',
                'Mié': 'mi',  # Normalizar Mié a mi
                'Mie': 'mi',   # Por si acaso viene sin acento
                'Jue': 'jue',
                'Vie': 'vie',
                'Sáb': 'sáb',
                'Sab': 'sáb'   # Por si acaso viene sin acento
            }
            
            for fila in filas:
                dia_semana_bd = fila[1].strip()
                # Normalizar el día de la semana
                dia_semana_normalizado = mapeo_dias.get(dia_semana_bd, dia_semana_bd.lower())
                
                resultados.append({
                    'idActoParroquia': fila[0],
                    'diaSemana': dia_semana_normalizado,
                    'horaInicioActo': fila[2]
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener disponibilidad de acto liturgicos: {e}')
        return []
    finally:
        if conexion:
            conexion.close()

def obtener_actos_con_horarios_parroquia(idParroquia):
    """Obtiene todos los actos de una parroquia con sus horarios"""
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    al.idActo,
                    al.nombActo,
                    ap.costoBase,
                    ap.idActoParroquia,
                    ap.diaSemana,
                    ap.horaInicioActo
                FROM acto_liturgico al
                INNER JOIN acto_parroquia ap ON al.idActo = ap.idActo
                WHERE ap.idParroquia = %s
                ORDER BY al.nombActo, ap.diaSemana, ap.horaInicioActo;
            """, (idParroquia,))
            
            filas = cursor.fetchall()
            # Agrupar por acto
            actos_dict = {}
            for fila in filas:
                idActo = fila[0]
                nombActo = fila[1]
                costoBase = float(fila[2]) if fila[2] else 0
                idActoParroquia = fila[3]
                diaSemana = fila[4]
                horaInicioActo = fila[5]
                
                if idActo not in actos_dict:
                    actos_dict[idActo] = {
                        'id': idActo,
                        'acto': nombActo,
                        'costoBase': costoBase,
                        'horarios': []
                    }
                
                # Convertir hora a string si es necesario
                hora_str = str(horaInicioActo)
                if hasattr(horaInicioActo, 'strftime'):
                    hora_str = horaInicioActo.strftime('%H:%M')
                elif isinstance(horaInicioActo, str) and len(horaInicioActo) > 5:
                    hora_str = horaInicioActo[:5]
                
                actos_dict[idActo]['horarios'].append({
                    'idActoParroquia': idActoParroquia,
                    'diaSemana': diaSemana,
                    'horaInicioActo': hora_str
                })
            
            return list(actos_dict.values())
    except Exception as e:
        print(f'Error al obtener actos con horarios: {e}')
        return []
    finally:
        if conexion:
            conexion.close()

def participante_acto(idActo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Obtener el número de participantes
            cursor.execute("""
                SELECT numParticipantes
                FROM acto_liturgico
                WHERE idActo = %s
            """, (idActo,))
            fila = cursor.fetchone()
            num_participantes = fila[0] if fila else 0

            # Extraer participantes individuales usando CTE recursivo
            cursor.execute("""
                WITH RECURSIVE Separador AS (
                    SELECT
                        idActo,
                        tipoParticipantes,
                        SUBSTRING_INDEX(tipoParticipantes, ',', 1) AS Participante_Individual,
                        LENGTH(tipoParticipantes) - LENGTH(REPLACE(tipoParticipantes, ',', '')) AS Comas_Restantes
                    FROM acto_liturgico
                    WHERE idActo = %s
                    UNION ALL
                    SELECT
                        T.idActo,
                        SUBSTRING(T.tipoParticipantes, LOCATE(',', T.tipoParticipantes) + 1) AS tipoParticipantes,
                        TRIM(SUBSTRING_INDEX(SUBSTRING(T.tipoParticipantes, LOCATE(',', T.tipoParticipantes) + 1), ',', 1)) AS Participante_Individual,
                        T.Comas_Restantes - 1
                    FROM Separador T
                    WHERE T.Comas_Restantes > 0
                )
                SELECT
                    TRIM(Participante_Individual) AS Tipo_Participante
                FROM Separador
                WHERE Participante_Individual <> '';
            """, (idActo,))

            participantes = [row[0] for row in cursor.fetchall()]

            # Devolver número de participantes y lista de participantes
            return num_participantes, participantes

    except Exception as e:
        print(f'Error al obtener los participantes del acto: {e}')
        return 0, []
    finally:
        if conexion:
            conexion.close()

def registrar_participantes_acto(nombParticipante,rolParticipante,idActo,idReserva):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO participantes_acto (nombParticipante, rolParticipante, idActo, idReserva)
                VALUES (%s, %s, %s,%s);
                """, (nombParticipante,rolParticipante,idActo,idReserva))
            conexion.commit()
            return 1, 'Participantes registrados correctamente'
    except Exception as e:
        print(f'Error al registrar los participantes del acto: {e}')
        return 0, []
    finally:
        if conexion:
            conexion.close()

def obtener_configuracion_acto(idActo):
    conexion = obtener_conexion() # Asegura que la conexión se obtenga aquí
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    idConfigActo, 
                    tiempoDuracion, 
                    tiempoMaxCancelacion, 
                    tiempoMaxReprogramacion, 
                    tiempoAprobacionRequisitos, 
                    tiempoCambioDocumentos, 
                    tiempoMaxPago,
                    tiempoMinimoReserva,
                    tiempoMaximoReserva, 
                    maxActosPorDia, 
                    unidadTiempoAcciones, 
                    unidadTiempoReserva,
                    estadoConfiguracion
                FROM configuracion_acto
                WHERE idActo = %s;
            """, (idActo,))
            
            fila = cursor.fetchone()
            
            if fila:
                # Mapear los resultados a un diccionario usando los índices actualizados (0 a 12)
                resultado = {
                    'ok': True,
                    'idConfigActo': fila[0],
                    'tiempoDuracion': fila[1],
                    'tiempoMaxCancelacion': fila[2],
                    'tiempoMaxReprogramacion': fila[3],
                    'tiempoAprobacionRequisitos': fila[4],
                    'tiempoCambioDocumentos': fila[5],
                    'tiempoMaxPago': fila[6],
                    'tiempoMinimoReserva': fila[7],        # NUEVO
                    'tiempoMaximoReserva': fila[8],        # NUEVO
                    'maxActosPorDia': fila[9],
                    'unidadTiempoAcciones': fila[10],      # CORREGIDO
                    'unidadTiempoReserva': fila[11],       # NUEVO
                    'estadoConfiguracion': fila[12]
                }
                return resultado
            else:
                # Caso donde no hay configuración para ese idActo
                return {'ok': False, 'mensaje': f'No se encontró configuración para el idActo: {idActo}'}
                
    except Exception as e:
        print(f'Error al obtener la configuración del acto: {e}')
        # Retornar mensaje de error detallado
        return {'ok': False, 'mensaje': f'Error al consultar la base de datos: {e}'}
        
    finally:
        if conexion:
            conexion.close()


# ===========================
# AGREGAR HORARIO A ACTO_PARROQUIA
# ===========================
def agregar_horario_acto_parroquia(idActo, idParroquia, diaSemana, horaInicioActo, costoBase):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Verificar si ya existe el horario
            cursor.execute("""
                SELECT idActoParroquia FROM acto_parroquia
                WHERE idActo = %s AND idParroquia = %s AND diaSemana = %s AND horaInicioActo = %s
            """, (idActo, idParroquia, diaSemana, horaInicioActo))
            
            if cursor.fetchone():
                return {'ok': False, 'mensaje': 'Este horario ya existe para este acto y parroquia'}
            
            # Insertar nuevo horario
            cursor.execute("""
                INSERT INTO acto_parroquia (idActo, idParroquia, diaSemana, horaInicioActo, costoBase)
                VALUES (%s, %s, %s, %s, %s)
            """, (idActo, idParroquia, diaSemana, horaInicioActo, costoBase))
            
            conexion.commit()
            idActoParroquia = cursor.lastrowid
            
            return {
                'ok': True,
                'mensaje': 'Horario agregado correctamente',
                'idActoParroquia': idActoParroquia
            }
    except Exception as e:
        print(f'Error al agregar horario: {e}')
        conexion.rollback()
        return {'ok': False, 'mensaje': f'Error al agregar horario: {str(e)}'}
    finally:
        if conexion:
            conexion.close()

# ===========================
# ELIMINAR HORARIO DE ACTO_PARROQUIA
# ===========================
def eliminar_horario_acto_parroquia(idActoParroquia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # Verificar que existe
            cursor.execute("SELECT idActoParroquia FROM acto_parroquia WHERE idActoParroquia = %s", (idActoParroquia,))
            if not cursor.fetchone():
                return {'ok': False, 'mensaje': 'Horario no encontrado'}
            
            # Eliminar
            cursor.execute("DELETE FROM acto_parroquia WHERE idActoParroquia = %s", (idActoParroquia,))
            conexion.commit()
            
            return {'ok': True, 'mensaje': 'Horario eliminado correctamente'}
    except Exception as e:
        print(f'Error al eliminar horario: {e}')
        conexion.rollback()
        return {'ok': False, 'mensaje': f'Error al eliminar horario: {str(e)}'}
    finally:
        if conexion:
            conexion.close()