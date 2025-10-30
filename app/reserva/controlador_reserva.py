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
