from app.bd_sistema import obtener_conexion

def cargar_horas_disponibles(tipo):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            if tipo == 'MISA':
                consulta = """
                    SELECT
                        SUBSTRING_INDEX(SUBSTRING_INDEX(nombClave, '_', 2), '_', -1) AS DiaDeLaSemana,
                        valor AS Hora,
                        idConfiguracion,
                        nombClave,
                        unidad,
                        descripcion
                    FROM configuracion
                    WHERE nombClave LIKE 'MISA_%' AND unidad = 'HORA';
                """
            elif tipo == 'BAUTIZO':
                consulta = """
                    SELECT
                        SUBSTRING_INDEX(SUBSTRING_INDEX(nombClave, '_', 2), '_', -1) AS DiaDeLaSemana,
                        SUBSTRING_INDEX(valor, '-', 1) AS HoraInicio,
                        SUBSTRING_INDEX(valor, '-', -1) AS HoraFin,
                        idConfiguracion,
                        nombClave,
                        unidad,
                        valor AS RangoHoraOriginal,
                        descripcion
                    FROM configuracion
                    WHERE nombClave LIKE 'BAUTIZO_%' AND unidad = 'HORA';
                """
            elif tipo == 'MATRIMONIO':
                consulta = """
                    SELECT
                        SUBSTRING_INDEX(SUBSTRING_INDEX(nombClave, '_', 2), '_', -1) AS DiaDeLaSemana,
                        SUBSTRING_INDEX(valor, '-', 1) AS HoraInicio,
                        SUBSTRING_INDEX(valor, '-', -1) AS HoraFin,
                        idConfiguracion,
                        nombClave,
                        unidad,
                        valor AS RangoHoraOriginal,
                        descripcion
                    FROM configuracion
                    WHERE nombClave LIKE 'MATRIMONIO_%' AND unidad = 'HORA';
                """
            else:
                return {"error": "Tipo no válido. Debe ser MISA, BAUTIZO o MATRIMONIO."}

            cursor.execute(consulta)
            resultados = cursor.fetchall()
            return resultados

    except Exception as e:
        print(f"Error al cargar las horas disponibles: {e}")
        return {"error": str(e)}
    finally:
        conexion.close()

def cantidad_misas_al_dia():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT valor
                FROM configuracion
                WHERE nombClave = 'MISA_LIMITE'
                  AND unidad = 'CANTIDAD';
            """)
            resultado = cursor.fetchone()  # Trae un solo registro
            return resultado
    except Exception as e:
        print(f"Error al cargar la cantidad de misas: {e}")
        return {"error": str(e)}
    finally:
        conexion.close()


def cantidad_limita_matrimonio():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT
                    SUBSTRING_INDEX(valor, '-', 1) AS DiasMinimo,
                    SUBSTRING_INDEX(valor, '-', -1) AS DiasMaximo,
                    valor AS RangoDiasOriginal,
                    nombClave,
                    descripcion
                FROM configuracion
                WHERE nombClave = 'MATRIMONIO_CICLO';
            """)
            resultado = cursor.fetchone()  # O fetchall() si quieres todas las filas
            return resultado
    except Exception as e:
        print(f"Error al cargar el ciclo de matrimonios: {e}")
        return {"error": str(e)}
    finally:
        conexion.close()

def agregar_reserva(fecha,hora,observaciones,idUsuario):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
                INSERT INTO reserva (fecha, hora, observaciones, estadoReserva, numero, estadoReprogramacion, vigenciaReserva,idUsuario)
                VALUES (%s, %s, 'SOLICITUD', %s, 0, FALSE, TRUE,%s);""",(fecha,hora,observaciones,idUsuario))
            conexion.commit()
            return {"mensaje": "Reserva agregada exitosamente"}
    except Exception as e:
        print(f"Error al agregar la reserva: {e}")
        return {"error": str(e)}
    finally:
        if conexion:
            conexion.close()

def reprogramar_reserva(idReserva,fecha,hora,observaciones):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("select numReprogramacion from reserva where idReserva=%s",(idReserva))
            numReprogramacion = cursor.fetchone()
            numReprogramacion=numReprogramacion[0]+1
            cursor.execute("UPDATE reserva SET fecha=%s, hora=%s, numReprogramacion=%s, estadoReprogramacion='FALSE',observaciones=%s WHERE idReserva=%s",(fecha,hora,numReprogramacion,observaciones,idReserva))
        conexion.commit()
        return {"mensaje": "Reserva reprogramada exitosamente"}   
    except Exception as e:
        print(f"Error al reprogramar la reserva: {e}")
        return {"error": str(e)}
    finally:
        if conexion:
            conexion.close()

def requisitos_bautismo():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
SELECT
    -- 1. Extrae el nombre del participante/requisito del final de la clave:
    CASE
        -- Si la clave contiene '_ROL_', extrae el nombre del ROL
        WHEN T1.nombClave LIKE '%_ROL_%' THEN 
             SUBSTRING_INDEX(T1.nombClave, '_ROL_', -1)
        -- Si la clave contiene '_PASTOR', usa 'PASTOR'
        WHEN T1.nombClave LIKE '%_PASTOR%' THEN 'PASTOR'
        ELSE T1.nombClave -- Caso por defecto o error
    END AS tipoParticipante,
    
    T1.valor,
    T1.descripcion
    
FROM
    CONFIGURACION AS T1
WHERE
  +
    T1.nombClave LIKE 'REQUERIMIENTO_ACTO_BAUTISMO_%'
    AND T1.estadoConfiguracion = TRUE;
            """)
            resultado = cursor.fetchall()  # Trae todos los registros
            return resultado
    except Exception as e:
        print(f"Error al cargar requisitos Bautismo: {e}")
        return None
    finally:
        conexion.close()


def requisitos_matrimonio():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
SELECT
    -- 1. Extrae el nombre del participante/requisito del final de la clave:
    CASE
        -- Si la clave contiene '_ROL_', extrae el nombre del ROL
        WHEN T1.nombClave LIKE '%_ROL_%' THEN 
             SUBSTRING_INDEX(T1.nombClave, '_ROL_', -1)
        -- Si la clave contiene '_PASTOR', usa 'PASTOR'
        WHEN T1.nombClave LIKE '%_PASTOR%' THEN 'PASTOR'
        ELSE T1.nombClave -- Caso por defecto o error
    END AS tipoParticipante,
    
    T1.valor,
    T1.descripcion
    
FROM
    CONFIGURACION AS T1
WHERE
    -- Filtra todas las claves que contienen el nombre del acto 'MATRIMONIO'
    T1.nombClave LIKE 'REQUERIMIENTO_ACTO_MATRIMONIO_%'
    AND T1.estadoConfiguracion = TRUE;
            """)
            resultado = cursor.fetchall()
            return resultado
    except Exception as e:
        print(f"Error al cargar requisitos Matrimonio: {e}")
        return None
    finally:
        conexion.close()


def requisitos_misa():
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            cursor.execute("""
SELECT
    -- 1. Extrae el nombre del participante/requisito del final de la clave:
    CASE
        -- Si la clave contiene '_ROL_', extrae el nombre del ROL
        WHEN T1.nombClave LIKE '%_ROL_%' THEN 
             SUBSTRING_INDEX(T1.nombClave, '_ROL_', -1)
        -- Si la clave contiene '_PASTOR', usa 'PASTOR'
        WHEN T1.nombClave LIKE '%_PASTOR%' THEN 'PASTOR'
        ELSE T1.nombClave -- Caso por defecto o error
    END AS tipoParticipante,
    
    T1.valor,
    T1.descripcion
    
FROM
    CONFIGURACION AS T1
WHERE
    -- Filtra todas las claves que contienen el nombre del acto 'MATRIMONIO'
    T1.nombClave LIKE 'REQUERIMIENTO_ACTO_MATRIMONIO_%'
    AND T1.estadoConfiguracion = TRUE;
            """)
            resultado = cursor.fetchall()
            return resultado
    except Exception as e:
        print(f"Error al cargar requisitos Misa: {e}")
        return None
    finally:
        conexion.close()
