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
    """Renderiza la página de pago"""
    return render_template('pago.html')


# ======================================================
# 🔹 PROCESAR PAGO
# ======================================================
@pago_bp.route('/registrar_pago', methods=['POST'])
def procesar_pago():
    """Procesa un nuevo pago, generando la fecha en el servidor."""
    try:
        datos = request.form  # <-- FORM DATA

        # Validaciones
        if not datos.get('montoTotal'):
            return jsonify({'ok': False, 'mensaje': 'El monto total es requerido'}), 400
        if not datos.get('metodoPago'):
            return jsonify({'ok': False, 'mensaje': 'El tipo de pago es requerido'}), 400
        if not datos.get('numeroTransaccion'):
            return jsonify({'ok': False, 'mensaje': 'El número de transacción es requerido'}), 400

        # Fecha generada en backend
        f_pago_actual = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

        # Estado del pago
        estado_pago = datos.get('estadoPago', 'PENDIENTE').upper()

        # Garantizar valor válido del ENUM
        if estado_pago not in ['PENDIENTE', 'APROBADO', 'CANCELADO']:
            estado_pago = 'PENDIENTE'

        resultado = registrar_pago(
            f_pago=f_pago_actual,
            montoTotal=float(datos['montoTotal']),
            metodoPago=datos['metodoPago'],
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

@pago_bp.route('/registrar_pago_reserva', methods=['POST'])
def procesar_pago_reserva():
    try:
        datos = request.form  # <-- FORM DATA

        if not datos.get('idReserva'):
            return jsonify({'ok': False, 'mensaje': 'El ID de la reserva es requerido'})
        if not datos.get('idPago'):
            return jsonify({'ok': False, 'mensaje': 'El ID del pago es requerido'})
        if not datos.get('monto'):
            return jsonify({'ok': False, 'mensaje': 'Monto de la reserva requerido'})

        resultado = registrar_pago_reserva(
            idReserva=int(datos['idReserva']),
            idPago=int(datos['idPago']),
            monto=float(datos['monto'])
        )

        if resultado['ok']:
            return jsonify(resultado), 201

    except Exception as e:
        print(f'Error al procesar el detalle pago reserva: {e}')
        return jsonify({'ok': False, 'mensaje': f'Error interno: {str(e)}'}), 500



# ======================================================
# 🔹 LISTAR TODOS LOS PAGOS
# ======================================================
@pago_bp.route('/listar_pagos', methods=['GET'])
def listar_pagos():
    """Lista todos los pagos del sistema"""
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
    """Obtiene los detalles de un pago específico"""
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
    """Lista todos los pagos de una reserva específica"""
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
    """Actualiza el estado de un pago"""
    try:
        datos = request.get_json()
        nuevo_estado = datos.get('estadoPago')
        
        if not nuevo_estado:
            return jsonify({'ok': False, 'mensaje': 'El estado es requerido'}), 400
        
        # Validar estados permitidos
        estados_validos = ['Completado', 'Pendiente', 'Rechazado', 'Cancelado']
        if nuevo_estado not in estados_validos:
            return jsonify({
                'ok': False, 
                'mensaje': f'Estado inválido. Debe ser uno de: {", ".join(estados_validos)}'
            }), 400
        
        resultado = actualizar_estado_pago(idPago, nuevo_estado)
        
        if resultado:
            return jsonify({'ok': True, 'mensaje': 'Estado actualizado correctamente'})
        else:
            return jsonify({'ok': False, 'mensaje': 'Error al actualizar el estado'}), 400
            
    except Exception as e:
        print(f'Error al actualizar estado: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 CAMBIAR VIGENCIA DE PAGO
# ======================================================
@pago_bp.route('/cambiar_vigencia_pago/<int:idPago>', methods=['PUT'])
def cambiar_vigencia(idPago):
    """Cambia la vigencia de un pago (activar/desactivar)"""
    try:
        resultado = cambiar_vigencia_pago(idPago)
        
        if resultado['ok']:
            return jsonify({
                'ok': True,
                'mensaje': 'Vigencia actualizada correctamente',
                'nueva_vigencia': resultado['nueva_vigencia']
            })
        else:
            return jsonify({'ok': False, 'mensaje': resultado['mensaje']}), 400
            
    except Exception as e:
        print(f'Error al cambiar vigencia: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 ELIMINAR PAGO
# ======================================================
@pago_bp.route('/eliminar_pago/<int:idPago>', methods=['DELETE'])
def eliminar_pago_route(idPago):
    """Elimina un pago del sistema"""
    try:
        # Verificar si se puede eliminar
        if not verificar_relacion_pago(idPago):
            return jsonify({'ok': False, 'mensaje': 'El pago no existe'}), 404
        
        resultado = eliminar_pago(idPago)
        
        if resultado:
            return jsonify({'ok': True, 'mensaje': 'Pago eliminado correctamente'})
        else:
            return jsonify({'ok': False, 'mensaje': 'Error al eliminar el pago'}), 400
            
    except Exception as e:
        print(f'Error al eliminar pago: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 VERIFICAR PAGO DE RESERVA
# ======================================================
@pago_bp.route('/verificar_pago_reserva/<int:idReserva>', methods=['GET'])
def verificar_pago_reserva(idReserva):
    """Verifica si una reserva tiene pago completado"""
    try:
        tiene_pago = verificar_pago_completado(idReserva)
        total_pagado = obtener_total_pagado_reserva(idReserva)
        
        return jsonify({
            'ok': True,
            'tiene_pago_completado': tiene_pago,
            'total_pagado': total_pagado
        })
        
    except Exception as e:
        print(f'Error al verificar pago: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 OBTENER TOTAL PAGADO POR RESERVA
# ======================================================
@pago_bp.route('/total_pagado_reserva/<int:idReserva>', methods=['GET'])
def obtener_total_reserva(idReserva):
    """Obtiene el total pagado de una reserva"""
    try:
        total = obtener_total_pagado_reserva(idReserva)
        return jsonify({'ok': True, 'total_pagado': total})
    except Exception as e:
        print(f'Error al obtener total: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 ESTADÍSTICAS DE PAGOS
# ======================================================
@pago_bp.route('/estadisticas_pagos', methods=['GET'])
def estadisticas():
    """Obtiene estadísticas generales de pagos"""
    try:
        datos = obtener_estadisticas_pagos()
        
        if datos:
            return jsonify({'ok': True, 'datos': datos})
        else:
            return jsonify({'ok': False, 'mensaje': 'No se pudieron obtener las estadísticas'}), 400
            
    except Exception as e:
        print(f'Error al obtener estadísticas: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 PÁGINA DE CONFIRMACIÓN
# ======================================================
@pago_bp.route('/confirmacion_pago', methods=['GET'])
def confirmacion_pago():
    """Renderiza la página de confirmación de pago"""
    try:
        id_pago = request.args.get('idPago')
        
        if not id_pago:
            return "ID de pago no proporcionado", 400
        
        # Obtener detalles del pago
        detalles_pago = obtener_pago(int(id_pago))
        
        if not detalles_pago:
            return "Pago no encontrado", 404
        
        return render_template('confirmacion_pago.html', pago=detalles_pago)
        
    except Exception as e:
        print(f'Error en confirmación: {e}')
        return "Error al cargar la confirmación", 500