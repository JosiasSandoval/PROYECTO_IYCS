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