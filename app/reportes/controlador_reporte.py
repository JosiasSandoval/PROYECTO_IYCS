from app.bd_sistema import obtener_conexion

# ======================================================
# 🔹 REPORTE DE RESERVAS FILTRADAS
# ======================================================
def reporte_reservas_por_acto(id_parroquia=None, id_acto=None, estado=None, fecha_inicio=None, fecha_fin=None):
    """
    Retorna lista de reservas filtradas según los parámetros recibidos.
    Devuelve campos uniformes: fechaReserva, horaReserva, parroquia, feligres, acto, monto, estado
    """
    conexion = None
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            consulta = """
                SELECT
                    r.idReserva,
                    r.f_reserva,
                    r.h_reserva,
                    p.nombParroquia,
                    CONCAT(f.nombFel, ' ', f.apePatFel, ' ', f.apeMatFel) AS feligres,
                    (
                        SELECT a.nombActo
                        FROM PARTICIPANTES_ACTO pa2
                        JOIN ACTO_LITURGICO a ON a.idActo = pa2.idActo
                        WHERE pa2.idReserva = r.idReserva
                        LIMIT 1
                    ) AS acto,
                    (
                        SELECT a.costoBase
                        FROM PARTICIPANTES_ACTO pa2
                        JOIN ACTO_LITURGICO a ON a.idActo = pa2.idActo
                        WHERE pa2.idReserva = r.idReserva
                        LIMIT 1
                    ) AS monto,
                    r.estadoReserva
                FROM RESERVA r
                JOIN PARROQUIA p ON r.idParroquia = p.idParroquia
                JOIN FELIGRES f ON r.idSolicitante = f.idFeligres
                WHERE 1=1
            """

            params = []

       
            if id_parroquia:
                consulta += " AND r.idParroquia = %s"
                params.append(id_parroquia)

            if id_acto:
                consulta += " AND EXISTS (SELECT 1 FROM PARTICIPANTES_ACTO pa WHERE pa.idReserva = r.idReserva AND pa.idActo = %s)"
                params.append(id_acto)

            if estado:
                consulta += " AND r.estadoReserva = %s"
                params.append(estado)

          
            if fecha_inicio:
                consulta += " AND r.f_reserva >= %s"
                params.append(fecha_inicio)
            if fecha_fin:
                consulta += " AND r.f_reserva <= %s"
                params.append(fecha_fin)

          
            consulta += " ORDER BY r.f_reserva DESC, r.h_reserva DESC"

            print(f"🔍 Debug Query: {consulta}")
            print(f"🔍 Debug Params: {params}")

            cursor.execute(consulta, tuple(params))
            filas = cursor.fetchall()

            resultados = []
            for fila in filas:
           
                fecha = fila[1]
                hora = fila[2]
                monto_val = fila[6] if fila[6] is not None else 0

                resultados.append({
                    'idReserva': fila[0],
                    'fechaReserva': fecha.strftime("%Y-%m-%d") if fecha else None,
                    'horaReserva': hora.strftime("%H:%M:%S") if hora else None,
                    'parroquia': fila[3],
                    'feligres': fila[4],
                    'acto': fila[5] or '---',
                    'monto': float(monto_val),
                    'estado': fila[7]
                })

            return resultados

    except Exception as e:
        print(f" Error en 'reporte_reservas_por_acto': {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 LISTAR PARROQUIAS (para filtros)
# ======================================================
def listar_parroquia():
    conexion = None
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idParroquia, nombParroquia
                FROM PARROQUIA
                WHERE estadoParroquia = TRUE
                ORDER BY nombParroquia
            """)
            return [{'idParroquia': f[0], 'nombParroquia': f[1]} for f in cursor.fetchall()]
    except Exception as e:
        print(f"❌ Error en 'listar_parroquia': {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        if conexion:
            conexion.close()


# ======================================================
# 🔹 LISTAR ACTOS (para filtros)
# ======================================================
def listar_acto():
    conexion = None
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
          
            cursor.execute("""
                SELECT DISTINCT al.idActo, al.nombActo
                FROM ACTO_LITURGICO al
                INNER JOIN ACTO_PARROQUIA ap ON al.idActo = ap.idActo
                ORDER BY al.nombActo
            """)
            return [{'idActo': f[0], 'nombActo': f[1]} for f in cursor.fetchall()]
    except Exception as e:
        print(f" Error en 'listar_acto': {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        if conexion:
            conexion.close()
