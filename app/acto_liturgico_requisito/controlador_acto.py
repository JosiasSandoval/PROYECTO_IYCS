from app.bd_sistema import obtener_conexion

def obtener_acto_parroquia(idParroquia):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT al.idActo, al.nombActo,al.costoBase
                FROM acto_liturgico al
                INNER JOIN acto_parroquia ap ON al.idActo = ap.idActo
                INNER JOIN parroquia pa ON ap.idParroquia = pa.idParroquia
                WHERE pa.idParroquia = %s;
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
    conexion = obtener_conexion()
    try:    
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT ap.diaSemana, ap.horaInicioActo
                FROM acto_liturgico al
                INNER JOIN acto_parroquia ap ON al.idActo = ap.idActo
                INNER JOIN parroquia pa ON ap.idParroquia = pa.idParroquia
                WHERE pa.idParroquia = %s and al.idActo = %s;
            """, (idParroquia,idActo))  
            filas = cursor.fetchall()
            resultados = []
            for fila in filas:
                resultados.append({
                    'diaSemana': fila[0],
                    'horaInicioActo': fila[1]
                })
            return resultados
    except Exception as e:
        print(f'Error al obtener disponibilidad de acto liturgicos: {e}')
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