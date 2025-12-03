from flask import Blueprint, request, jsonify

from app.reportes.controlador_reporte import (

    reporte_reservas_por_acto,
    listar_parroquia,
    listar_acto,
    reporte_pagos,
    reporte_usuarios_frecuentes,
    reporte_personal_parroquia,
    estadisticas_personal_parroquia

)

reportes_bp = Blueprint('reportes', __name__)


@reportes_bp.route('/parroquias', methods=['GET'])
def route_listar_parroquia():
    from flask import session
    try:
        # Admin Local solo puede ver su parroquia en reportes
        rol = session.get('rol_sistema', '').lower()
        es_admin_global = session.get('es_admin_global', False)
        idParroquia_usuario = session.get('idParroquia')
        
        if rol == 'administrador' and not es_admin_global:
            # Admin Local: solo su parroquia
            if idParroquia_usuario:
                datos = [{'idParroquia': idParroquia_usuario}]
            else:
                datos = []
        else:
            # Admin Global u otros roles: todas las parroquias
            datos = listar_parroquia()
        
        return jsonify({'ok': True, 'datos': datos}), 200

    except Exception as e:
        print(f"Error en /parroquias: {e}")
        return jsonify({'ok': False, 'datos': [], 'mensaje': str(e)}), 500



@reportes_bp.route('/actos', methods=['GET'])
def route_listar_acto():

    try:
        datos = listar_acto()
        return jsonify({'ok': True, 'datos': datos}), 200

    except Exception as e:

        print(f"Error en /actos: {e}")
        return jsonify({'ok': False, 'datos': [], 'mensaje': str(e)}), 500



@reportes_bp.route('/reservas', methods=['GET'])
def route_reporte_reservas():
    from flask import session
    try:
        idParroquia = request.args.get('idParroquia') or request.args.get('id_parroquia')
        idActo = request.args.get('idActo') or request.args.get('id_acto')
        estado = request.args.get('estado')  
        fecha_inicio = request.args.get('fecha_inicio') or request.args.get('fechaInicio')
        fecha_fin = request.args.get('fecha_fin') or request.args.get('fechaFin')

        # Admin Local: forzar su parroquia
        rol = session.get('rol_sistema', '').lower()
        es_admin_global = session.get('es_admin_global', False)
        idParroquia_usuario = session.get('idParroquia')
        
        if rol == 'administrador' and not es_admin_global:
            idParroquia = idParroquia_usuario  # Forzar su parroquia

        try:
            idParroquia = int(idParroquia) if idParroquia else None
        except:
            idParroquia = None
        try:
            idActo = int(idActo) if idActo else None
        except:
            idActo = None

        resultados = reporte_reservas_por_acto(
            id_parroquia=idParroquia,
            id_acto=idActo,
            estado=estado,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )
        return jsonify({'ok': True, 'datos': resultados}), 200

    except Exception as e:
        print(f"Error en endpoint /reservas: {e}")
        return jsonify({'ok': False, 'mensaje': str(e)}), 500





@reportes_bp.route('/estadisticas', methods=['GET'])
def route_estadisticas():
    """
    Retorna estadísticas agregadas para gráficos:
    - Reservas por acto
    - Reservas por parroquia
    - Ingresos totales
    - Total de reservas
    """
    from flask import session
    try:

        idParroquia = request.args.get('idParroquia') or request.args.get('id_parroquia')
        idActo = request.args.get('idActo') or request.args.get('id_acto')
        estado = request.args.get('estado')
        fecha_inicio = request.args.get('fecha_inicio') or request.args.get('fechaInicio')
        fecha_fin = request.args.get('fecha_fin') or request.args.get('fechaFin')

        # Admin Local: forzar su parroquia
        rol = session.get('rol_sistema', '').lower()
        es_admin_global = session.get('es_admin_global', False)
        idParroquia_usuario = session.get('idParroquia')
        
        if rol == 'administrador' and not es_admin_global:
            idParroquia = idParroquia_usuario

        try:
            idParroquia = int(idParroquia) if idParroquia else None

        except:
            idParroquia = None
        try:
            idActo = int(idActo) if idActo else None
        except:
            idActo = None


        resultados = reporte_reservas_por_acto(
            id_parroquia=idParroquia,
            id_acto=idActo,
            estado=estado,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin

        )

        actos_contador = {}
        parroquias_contador = {}
        ingresos_totales = 0

        for r in resultados:

            acto = r.get('acto', '---')
            actos_contador[acto] = actos_contador.get(acto, 0) + 1
            parroquia = r.get('parroquia', '---')
            parroquias_contador[parroquia] = parroquias_contador.get(parroquia, 0) + 1
            ingresos_totales += float(r.get('monto', 0))


        actos_labels = list(actos_contador.keys())
        actos_data = list(actos_contador.values())

        parroquias_labels = list(parroquias_contador.keys())
        parroquias_data = list(parroquias_contador.values())

        return jsonify({

            'ok': True,
            'total_reservas': len(resultados),
            'ingresos_totales': float(ingresos_totales),
            'acto_mas_solicitado': max(actos_contador, key=actos_contador.get) if actos_contador else '---',
            'grafico_actos': {

                'labels': actos_labels,
                'data': actos_data

            },

            'grafico_parroquias': {
                'labels': parroquias_labels,
                'data': parroquias_data

            }

        }), 200

    except Exception as e:

        print(f"Error en /estadisticas: {e}")
        return jsonify({'ok': False, 'mensaje': str(e)}), 500



@reportes_bp.route('/reservas/actos', methods=['POST'])
def route_reporte_reservas_post():

    try:
        data = request.get_json() or {}
        return route_reporte_reservas()

    except Exception as e:

        print(f"Error en POST /reservas/actos: {e}")
        return jsonify({'ok': False, 'mensaje': str(e)}), 500
    


# ======================================================
# REPORTE PAGOS
# ======================================================
@reportes_bp.route('/pagos', methods=['GET'])
def route_reporte_pagos():
    from flask import session
    try:
        # Parámetros recibidos desde el frontend
        idParroquia = request.args.get('idParroquia')
        tipo = request.args.get('tipo')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        # Admin Local: forzar su parroquia
        rol = session.get('rol_sistema', '').lower()
        es_admin_global = session.get('es_admin_global', False)
        idParroquia_usuario = session.get('idParroquia')
        
        if rol == 'administrador' and not es_admin_global:
            idParroquia = idParroquia_usuario

        # Convertir idParroquia a entero si existe
        try:
            idParroquia = int(idParroquia) if idParroquia else None
        except:
            idParroquia = None

        datos = reporte_pagos(
            id_parroquia=idParroquia,
            tipo=tipo,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )

        return jsonify({'ok': True, 'datos': datos}), 200
    
    except Exception as e:
        print("Error en /pagos:", e)
        return jsonify({'ok': False, 'mensaje': str(e)}), 500


@reportes_bp.route('/pagos/estadisticas', methods=['GET'])
def route_estadisticas_pagos():
    try:
        idParroquia = request.args.get('idParroquia')
        tipo = request.args.get('tipo')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        # Convertir idParroquia a entero si existe
        try:
            idParroquia = int(idParroquia) if idParroquia else None
        except:
            idParroquia = None

        datos = reporte_pagos(
            id_parroquia=idParroquia,
            tipo=tipo,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )

        # Estadísticas
        tipos = {}
        parroquias = {}
        total = 0.0

        for p in datos:
            # Manejo seguro de valores
            tipo_pago = p.get('tipoPago', '---') or '---'
            parroquia = p.get('parroquia', '---') or '---'
            try:
                monto = float(p.get('monto', 0) or 0)
            except:
                monto = 0.0

            tipos[tipo_pago] = tipos.get(tipo_pago, 0) + 1
            parroquias[parroquia] = parroquias.get(parroquia, 0) + 1
            total += monto

        return jsonify({
            'ok': True,
            'total_pagos': len(datos),
            'total_recaudado': total,
            'tipo_mas_frecuente': max(tipos, key=tipos.get) if tipos else '---',
            'grafico_tipo': {
                'labels': list(tipos.keys()),
                'data': list(tipos.values())
            },
            'grafico_parroquias': {
                'labels': list(parroquias.keys()),
                'data': list(parroquias.values())
            }
        }), 200

    except Exception as e:
        print("Error en /pagos/estadisticas:", e)
        return jsonify({'ok': False, 'mensaje': str(e)}), 500


# ======================================================
# NUEVA RUTA — LISTA DE TIPOS DE PAGO PARA EL FRONTEND
# ======================================================
@reportes_bp.route('/pagos/tipos_pago', methods=['GET'])
def route_tipos_pago():
    try:
        tipos = [
            {"idTipo": 1, "nombreTipo": "Efectivo"},
            {"idTipo": 2, "nombreTipo": "Tarjeta"},
            {"idTipo": 3, "nombreTipo": "Transferencia"},
            {"idTipo": 4, "nombreTipo": "Yape"},
            {"idTipo": 5, "nombreTipo": "Plin"}
        ]
        return jsonify({'ok': True, 'datos': tipos}), 200
    except Exception as e:
        return jsonify({'ok': False, 'mensaje': str(e)}), 500


# ======================================================
# REPORTES DE USUARIOS FRECUENTES
# ======================================================

@reportes_bp.route('/usuarios', methods=['GET'])
def route_reporte_usuarios():
    try:
        idParroquia = request.args.get('idParroquia')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        try:
            idParroquia = int(idParroquia) if idParroquia else None
        except:
            idParroquia = None

        datos = reporte_usuarios_frecuentes(
            id_parroquia=idParroquia,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )

        return jsonify({'ok': True, 'datos': datos}), 200
    except Exception as e:
        print("Error en /usuarios:", e)
        return jsonify({'ok': False, 'mensaje': str(e)}), 500


@reportes_bp.route('/usuarios/estadisticas', methods=['GET'])
def route_estadisticas_usuarios():
    try:
        idParroquia = request.args.get('idParroquia')
        fecha_inicio = request.args.get('fecha_inicio')
        fecha_fin = request.args.get('fecha_fin')

        try:
            idParroquia = int(idParroquia) if idParroquia else None
        except:
            idParroquia = None

        datos = reporte_usuarios_frecuentes(
            id_parroquia=idParroquia,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin
        )

        total_usuarios = len(datos)
        total_reservas = sum(u['totalReservas'] for u in datos)
        usuario_mas_activo = max(datos, key=lambda x: x['totalReservas'])['usuario'] if datos else '---'

        grafico_usuarios = {
            'labels': [u['usuario'] for u in datos],
            'data': [u['totalReservas'] for u in datos]
        }

        return jsonify({
            'ok': True,
            'total_usuarios': total_usuarios,
            'total_reservas': total_reservas,
            'usuario_mas_activo': usuario_mas_activo,
            'grafico_usuarios': grafico_usuarios
        }), 200

    except Exception as e:
        print("Error en /usuarios/estadisticas:", e)
        return jsonify({'ok': False, 'mensaje': str(e)}), 500
    
# ======================================================
# REPORTE DE PERSONAL
# ======================================================
from app.reportes.controlador_reporte import reporte_personal_parroquia, listar_cargos

@reportes_bp.route('/personal', methods=['GET'])
def route_reporte_personal():
    try:
        idParroquia = request.args.get('idParroquia')
        idCargo = request.args.get('idCargo')
        vigencia = request.args.get('vigencia')

        # Convertir valores
        try: idParroquia = int(idParroquia) if idParroquia else None
        except: idParroquia = None
        try: idCargo = int(idCargo) if idCargo else None
        except: idCargo = None
        if vigencia is not None:
            vigencia = vigencia.lower() in ['true','1']

        datos = reporte_personal_parroquia(
            id_parroquia=idParroquia,
            id_cargo=idCargo,
            vigencia=vigencia
        )

        return jsonify({'ok': True, 'datos': datos}), 200
    except Exception as e:
        print("Error en /personal:", e)
        return jsonify({'ok': False, 'mensaje': str(e)}), 500


@reportes_bp.route('/personal/cargos', methods=['GET'])
def route_listar_cargos():
    try:
        datos = listar_cargos()
        return jsonify({'ok': True, 'datos': datos}), 200
    except Exception as e:
        print("Error en /personal/cargos:", e)
        return jsonify({'ok': False, 'mensaje': str(e)}), 500



@reportes_bp.route('/personal/estadisticas', methods=['GET'])
def route_estadisticas_personal():
    try:
        idParroquia = request.args.get('idParroquia')
        idCargo = request.args.get('idCargo')
        vigencia = request.args.get('vigencia')

        try: idParroquia = int(idParroquia) if idParroquia else None
        except: idParroquia = None
        try: idCargo = int(idCargo) if idCargo else None
        except: idCargo = None
        if vigencia is not None:
            vigencia = vigencia.lower() in ['true','1']

        datos = estadisticas_personal_parroquia(
            id_parroquia=idParroquia,
            id_cargo=idCargo,
            vigencia=vigencia
        )

        return jsonify({'ok': True, **datos}), 200

    except Exception as e:
        print("Error en /personal/estadisticas:", e)
        return jsonify({'ok': False, 'mensaje': str(e)}), 500
