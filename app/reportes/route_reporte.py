
from flask import Blueprint, request, jsonify
from app.reportes.controlador_reporte import (
    reporte_reservas_por_acto,
    listar_parroquia,
    listar_acto
)

reportes_bp = Blueprint('reportes', __name__)

@reportes_bp.route('/parroquias', methods=['GET'])
def route_listar_parroquia():
    try:
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
    try:
        
        idParroquia = request.args.get('idParroquia') or request.args.get('id_parroquia')
        idActo = request.args.get('idActo') or request.args.get('id_acto')
        estado = request.args.get('estado')  
        fecha_inicio = request.args.get('fecha_inicio') or request.args.get('fechaInicio')
        fecha_fin = request.args.get('fecha_fin') or request.args.get('fechaFin')

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
    try:
        idParroquia = request.args.get('idParroquia') or request.args.get('id_parroquia')
        idActo = request.args.get('idActo') or request.args.get('id_acto')
        estado = request.args.get('estado')
        fecha_inicio = request.args.get('fecha_inicio') or request.args.get('fechaInicio')
        fecha_fin = request.args.get('fecha_fin') or request.args.get('fechaFin')

      
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
