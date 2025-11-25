from flask import Blueprint, render_template, request, jsonify
from datetime import datetime
from app.pago.controlador_pago import (
    registrar_pago,
    registrar_pago_reserva,
    obtener_pago,
    listar_pagos_por_reserva,
    listar_todos_pagos,
    actualizar_estado_pago,
    cambiar_vigencia_pago,
    eliminar_pago,
    obtener_total_pagado_reserva,
    verificar_pago_completado,
    verificar_relacion_pago,
    obtener_estadisticas_pagos
)

pago_bp = Blueprint('pago', __name__)

# ======================================================
# 🔹 PÁGINA DE PAGO
# ======================================================
@pago_bp.route('/pago', methods=['GET'])
def pagina_pago():
    return render_template('pago.html')

# ======================================================
# 🔹 PROCESAR PAGO
# ======================================================
@pago_bp.route('/registrar_pago', methods=['POST'])
def procesar_pago():
    try:
        datos = request.form
        # Validaciones
        if not datos.get('montoTotal'):
            return jsonify({'ok': False, 'mensaje': 'El monto total es requerido'}), 400
        if not datos.get('metodoPago'):
            return jsonify({'ok': False, 'mensaje': 'El tipo de pago es requerido'}), 400
        if not datos.get('numeroTransaccion'):
            return jsonify({'ok': False, 'mensaje': 'El número de transacción es requerido'}), 400

        f_pago_actual = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        estado_pago = datos.get('estadoPago', 'PENDIENTE').upper()
        if estado_pago not in ['PENDIENTE', 'APROBADO', 'CANCELADO']:
            estado_pago = 'PENDIENTE'

        resultado = registrar_pago(
            f_pago=f_pago_actual,
            montoTotal=float(datos['montoTotal']),
            metodoPago=datos['metodoPago'].upper(),
            numeroTransaccion=datos['numeroTransaccion'],
            estadoPago=estado_pago
        )

        if resultado['ok']:
            return jsonify(resultado), 201
        else:
            return jsonify(resultado), 400

    except Exception as e:
        print(f'Error al procesar pago: {e}')
        return jsonify({'ok': False, 'mensaje': f'Error interno: {str(e)}'}), 500

# ======================================================
# 🔹 REGISTRAR PAGO POR RESERVA
# ======================================================
@pago_bp.route('/registrar_pago_reserva', methods=['POST'])
def procesar_pago_reserva():
    try:
        datos = request.form
        if not datos.get('idReserva') or not datos.get('idPago') or not datos.get('monto'):
            return jsonify({'ok': False, 'mensaje': 'ID de reserva, ID de pago y monto son requeridos'}), 400

        resultado = registrar_pago_reserva(
            idReserva=int(datos['idReserva']),
            idPago=int(datos['idPago']),
            monto=float(datos['monto'])
        )
        return jsonify(resultado), 201 if resultado['ok'] else 400

    except Exception as e:
        print(f'Error al procesar detalle de pago reserva: {e}')
        return jsonify({'ok': False, 'mensaje': f'Error interno: {str(e)}'}), 500

# ======================================================
# 🔹 LISTAR TODOS LOS PAGOS
# ======================================================
@pago_bp.route('/listar_pagos', methods=['GET'])
def listar_pagos():
    try:
        datos = listar_todos_pagos()
        return jsonify({'ok': True, 'datos': datos, 'total': len(datos)})
    except Exception as e:
        print(f'Error al listar pagos: {e}')
        return jsonify({'ok': False, 'datos': [], 'mensaje': 'Error interno'}), 500

# ======================================================
# 🔹 OBTENER PAGO POR ID
# ======================================================
@pago_bp.route('/pago/<int:idPago>', methods=['GET'])
def obtener_pago_por_id(idPago):
    try:
        resultado = obtener_pago(idPago)
        if resultado:
            return jsonify({'ok': True, 'datos': resultado})
        else:
            return jsonify({'ok': False, 'mensaje': 'Pago no encontrado'}), 404
    except Exception as e:
        print(f'Error al obtener pago: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500

# ======================================================
# 🔹 LISTAR PAGOS POR RESERVA
# ======================================================
@pago_bp.route('/pagos_reserva/<int:idReserva>', methods=['GET'])
def listar_pagos_reserva(idReserva):
    try:
        datos = listar_pagos_por_reserva(idReserva)
        return jsonify({'ok': True, 'datos': datos, 'total': len(datos)})
    except Exception as e:
        print(f'Error al listar pagos de reserva: {e}')
        return jsonify({'ok': False, 'datos': [], 'mensaje': 'Error interno'}), 500

# ======================================================
# 🔹 ACTUALIZAR ESTADO DE PAGO
# ======================================================
@pago_bp.route('/actualizar_estado_pago/<int:idPago>', methods=['PUT'])
def actualizar_estado(idPago):
    try:
        datos = request.get_json()
        nuevo_estado = datos.get('estadoPago')
        if not nuevo_estado:
            return jsonify({'ok': False, 'mensaje': 'El estado es requerido'}), 400

        estados_validos = ['Completado', 'Pendiente', 'Rechazado', 'Cancelado']
        if nuevo_estado not in estados_validos:
            return jsonify({'ok': False, 'mensaje': f'Estado inválido. Debe ser uno de: {", ".join(estados_validos)}'}), 400

        resultado = actualizar_estado_pago(idPago, nuevo_estado)
        return jsonify({'ok': resultado, 'mensaje': 'Estado actualizado correctamente' if resultado else 'Error al actualizar el estado'})

    except Exception as e:
        print(f'Error al actualizar estado: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500

# ======================================================
# 🔹 CAMBIAR VIGENCIA DE PAGO
# ======================================================
@pago_bp.route('/cambiar_vigencia_pago/<int:idPago>', methods=['PUT'])
def cambiar_vigencia(idPago):
    try:
        resultado = cambiar_vigencia_pago(idPago)
        return jsonify({
            'ok': resultado.get('ok', False),
            'mensaje': resultado.get('mensaje', 'Error interno'),
            'nueva_vigencia': resultado.get('nueva_vigencia')
        })
    except Exception as e:
        print(f'Error al cambiar vigencia: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500

# ======================================================
# 🔹 ELIMINAR PAGO
# ======================================================
@pago_bp.route('/eliminar_pago/<int:idPago>', methods=['DELETE'])
def eliminar_pago_route(idPago):
    try:
        if not verificar_relacion_pago(idPago):
            return jsonify({'ok': False, 'mensaje': 'El pago no existe'}), 404

        resultado = eliminar_pago(idPago)
        return jsonify({'ok': resultado, 'mensaje': 'Pago eliminado correctamente' if resultado else 'Error al eliminar el pago'})
    except Exception as e:
        print(f'Error al eliminar pago: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500

# ======================================================
# 🔹 VERIFICAR PAGO DE RESERVA
# ======================================================
@pago_bp.route('/verificar_pago_reserva/<int:idReserva>', methods=['GET'])
def verificar_pago_reserva(idReserva):
    try:
        tiene_pago = verificar_pago_completado(idReserva)
        total_pagado = obtener_total_pagado_reserva(idReserva)
        return jsonify({'ok': True, 'tiene_pago_completado': tiene_pago, 'total_pagado': total_pagado})
    except Exception as e:
        print(f'Error al verificar pago: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500

# ======================================================
# 🔹 ESTADÍSTICAS DE PAGOS
# ======================================================
@pago_bp.route('/estadisticas_pagos', methods=['GET'])
def estadisticas():
    try:
        datos = obtener_estadisticas_pagos()
        if datos:
            return jsonify({'ok': True, 'datos': datos})
        return jsonify({'ok': False, 'mensaje': 'No se pudieron obtener las estadísticas'}), 400
    except Exception as e:
        print(f'Error al obtener estadísticas: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


