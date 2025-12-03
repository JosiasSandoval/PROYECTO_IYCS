import datetime
from app.bd_sistema import obtener_conexion


def reporte_reservas_por_acto(id_parroquia=None, id_acto=None, estado=None, fecha_inicio=None, fecha_fin=None):
    conexion = None
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:

            # Si se filtra por un ACTO específico
            if id_acto:
                consulta = """
                    SELECT
                        r.idReserva,
                        r.f_reserva,
                        r.h_reserva,
                        p.nombParroquia,
                        CONCAT(f.nombFel, ' ', f.apePatFel, ' ', f.apeMatFel) AS feligres,
                        a.nombActo,
                        a.costoBase,
                        r.estadoReserva

                    FROM RESERVA r
                    JOIN PARROQUIA p ON r.idParroquia = p.idParroquia
                    JOIN FELIGRES f ON r.idSolicitante = f.idFeligres
                    JOIN PARTICIPANTES_ACTO pa ON pa.idReserva = r.idReserva
                    JOIN ACTO_LITURGICO a ON a.idActo = pa.idActo
                    WHERE a.idActo = %s

                """
                params = [id_acto]

            else:
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

            # Filtros
            if id_parroquia:
                consulta += " AND r.idParroquia = %s"
                params.append(id_parroquia)

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
            cursor.execute(consulta, tuple(params))
            filas = cursor.fetchall()

            resultados = []

            for f in filas:
                fecha = f[1]
                hora = f[2]


                if isinstance(hora, datetime.timedelta):
                    total_seg = int(hora.total_seconds())
                    hh = total_seg // 3600
                    mm = (total_seg % 3600) // 60
                    ss = total_seg % 60
                    hora_str = f"{hh:02d}:{mm:02d}:{ss:02d}"
                else:
                    hora_str = hora.strftime("%H:%M:%S") if hora else None

                monto_val = f[6] if f[6] is not None else 0

                resultados.append({
                    'idReserva': f[0],
                    'fechaReserva': fecha.strftime("%Y-%m-%d") if fecha else None,
                    'horaReserva': hora_str,
                    'parroquia': f[3],
                    'feligres': f[4],
                    'acto': f[5] or '---',
                    'monto': float(monto_val),
                    'estado': f[7]
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

#  LISTAR PARROQUIAS (para filtros)

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
        print(f" Error en 'listar_parroquia': {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:

        if conexion:
            conexion.close()


# ======================================================

# LISTAR ACTOS (para filtros)

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


# ======================================================
# REPORTE PAGOS
# ======================================================
def reporte_pagos(id_parroquia=None, tipo=None, fecha_inicio=None, fecha_fin=None):
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            consulta = """
                SELECT 
                    p.idPago,
                    p.f_pago,
                    pa.nombParroquia AS parroquia,
                    CONCAT(f.nombFel, ' ', f.apePatFel, ' ', f.apeMatFel) AS feligres,
                    p.metodoPago,
                    p.montoTotal
                FROM PAGO p
                JOIN PAGO_RESERVA pr ON pr.idPago = p.idPago
                JOIN RESERVA r ON r.idReserva = pr.idReserva
                JOIN PARROQUIA pa ON pa.idParroquia = r.idParroquia
                JOIN FELIGRES f ON f.idFeligres = r.idSolicitante
                WHERE 1=1
            """

            params = []

            if id_parroquia:
                consulta += " AND r.idParroquia = %s"
                params.append(id_parroquia)

            if tipo:
                consulta += " AND p.metodoPago = %s"
                params.append(tipo)

            if fecha_inicio:
                consulta += " AND p.f_pago >= %s"
                params.append(fecha_inicio)

            if fecha_fin:
                consulta += " AND p.f_pago <= %s"
                params.append(fecha_fin)

            cursor.execute(consulta, tuple(params))
            filas = cursor.fetchall()

            resultados = []
            for f in filas:
                resultados.append({
                    'idPago': f[0],
                    'fechaPago': f[1].strftime("%Y-%m-%d") if f[1] else None,
                    'parroquia': f[2],
                    'feligres': f[3],
                    'tipoPago': f[4],
                    'monto': float(f[5]) if f[5] is not None else 0.0
                })

            return resultados

    except Exception as e:
        print("Error reporte_pagos:", e)
        return []

    finally:
        if conexion:
            conexion.close()


# ======================================================
# REPORTES DE USUARIOS FRECUENTES
# ======================================================

def reporte_usuarios_frecuentes(id_parroquia=None, fecha_inicio=None, fecha_fin=None):
    conexion = None
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            consulta = """
                SELECT 
                    CONCAT(f.nombFel, ' ', f.apePatFel, ' ', f.apeMatFel) AS usuario,
                    p.nombParroquia AS parroquia,
                    COUNT(r.idReserva) AS totalReservas
                FROM RESERVA r
                JOIN FELIGRES f ON f.idFeligres = r.idSolicitante
                JOIN PARROQUIA p ON p.idParroquia = r.idParroquia
                WHERE 1=1
            """

            params = []

            if id_parroquia:
                consulta += " AND r.idParroquia = %s"
                params.append(id_parroquia)

            if fecha_inicio:
                consulta += " AND r.f_reserva >= %s"
                params.append(fecha_inicio)

            if fecha_fin:
                consulta += " AND r.f_reserva <= %s"
                params.append(fecha_fin)

            consulta += " GROUP BY f.idFeligres, p.idParroquia ORDER BY totalReservas DESC"

            cursor.execute(consulta, tuple(params))
            filas = cursor.fetchall()

            resultados = []
            for f in filas:
                resultados.append({
                    'usuario': f[0],
                    'parroquia': f[1],
                    'totalReservas': int(f[2])
                })

            return resultados

    except Exception as e:
        print("Error reporte_usuarios_frecuentes:", e)
        return []

    finally:
        if conexion:
            conexion.close()


# ======================================================
# REPORTE PERSONAL POR PARROQUIA
# ======================================================
def listar_cargos():
    conexion = None
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("""
                SELECT idCargo, nombCargo
                FROM CARGO
                WHERE estadoCargo = TRUE
                ORDER BY nombCargo
            """)
            return [{'idCargo': f[0], 'nombCargo': f[1]} for f in cursor.fetchall()]
    except Exception as e:
        print("Error listar_cargos:", e)
        return []
    finally:
        if conexion:
            conexion.close()



def reporte_personal_parroquia(id_parroquia=None, id_cargo=None, vigencia=None):
    conexion = None
    try:
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            consulta = """
                SELECT 
                    pp.idParroquiaPersonal,
                    CONCAT(p.nombPers, ' ', p.apePatPers, ' ', p.apeMatPers) AS nombre,
                    pa.nombParroquia AS parroquia,
                    c.nombCargo AS cargo,
                    pp.f_inicio,
                    pp.f_fin,
                    pp.vigenciaParrPers AS vigencia
                FROM PARROQUIA_PERSONAL pp
                JOIN PERSONAL p ON pp.idPersonal = p.idPersonal
                JOIN PARROQUIA pa ON pp.idParroquia = pa.idParroquia
                JOIN CARGO c ON pp.idCargo = c.idCargo
                WHERE 1=1
            """
            params = []

            if id_parroquia:
                consulta += " AND pp.idParroquia = %s"
                params.append(id_parroquia)
            if id_cargo:
                consulta += " AND pp.idCargo = %s"
                params.append(id_cargo)
            if vigencia is not None:
                consulta += " AND pp.vigenciaParrPers = %s"
                params.append(vigencia)

            consulta += " ORDER BY pa.nombParroquia, c.nombCargo, p.nombPers"

            cursor.execute(consulta, tuple(params))
            filas = cursor.fetchall()

            resultados = []
            for f in filas:
                resultados.append({
                    'id': f[0],
                    'nombre': f[1],
                    'parroquia': f[2],
                    'cargo': f[3],
                    'fecha_inicio': f[4].strftime("%Y-%m-%d") if f[4] else None,
                    'fecha_fin': f[5].strftime("%Y-%m-%d") if f[5] else None,
                    'vigencia': bool(f[6])
                })

            return resultados

    except Exception as e:
        print("Error reporte_personal_parroquia:", e)
        import traceback
        traceback.print_exc()
        return []

    finally:
        if conexion:
            conexion.close()



def estadisticas_personal_parroquia(id_parroquia=None, id_cargo=None, vigencia=None):
    """
    Retorna estadísticas del personal:
    - total_personal
    - total_activo
    - cargo_mas_frecuente
    - grafico_cargos
    - grafico_parroquias
    """
    datos = reporte_personal_parroquia(id_parroquia, id_cargo, vigencia)

    total_personal = len(datos)
    total_activo = sum(1 for d in datos if d['vigencia'])
    
    # Contadores
    cargos_contador = {}
    parroquias_contador = {}
    for d in datos:
        cargo = d.get('cargo', '---') or '---'
        parroquia = d.get('parroquia', '---') or '---'
        cargos_contador[cargo] = cargos_contador.get(cargo, 0) + 1
        parroquias_contador[parroquia] = parroquias_contador.get(parroquia, 0) + 1

    cargo_mas_frecuente = max(cargos_contador, key=cargos_contador.get) if cargos_contador else '---'

    return {
        'total_personal': total_personal,
        'total_activo': total_activo,
        'cargo_mas_frecuente': cargo_mas_frecuente,
        'grafico_cargos': {
            'labels': list(cargos_contador.keys()),
            'data': list(cargos_contador.values())
        },
        'grafico_parroquias': {
            'labels': list(parroquias_contador.keys()),
            'data': list(parroquias_contador.values())
        },
        'lista_personal': datos
    }
