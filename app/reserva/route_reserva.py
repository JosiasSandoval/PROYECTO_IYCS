from flask import Blueprint, request, jsonify
from app.reserva.controlador_reserva import (
    agregar_reserva,
    cambiar_estado_reserva,
    eliminar_reserva,
    reprogramar_reserva,
    get_reservas_sacerdote,
    get_reservas_feligres,
    get_reservas_parroquia,
    listar_reservas_por_rol
)

reserva_bp = Blueprint('reserva', __name__)


# ==========================
# NUEVA RESERVA
# ==========================
@reserva_bp.route('/nueva_reserva', methods=['POST'])
def nueva_reserva():
    try:
        data = request.get_json()
        fecha = data.get('fecha')
        hora = data.get('hora')
        estado = data.get('estadoReserva')
        mencion = data.get('observaciones', "")
        idUsuario = data.get('idUsuario')
        idSolicitante = data.get('idSolicitante')
        idParroquia = data.get('idParroquia')
        absorcionPago = data.get('absorcionPago', False)

        if not fecha or not hora or not idUsuario or not idSolicitante:
            return jsonify({
                "ok": False,
                "mensaje": "Faltan datos obligatorios (fecha, hora, idUsuario, idSolicitante)."
            }), 400

        # 🔹 Validar que el horario esté disponible
        from app.reserva.controlador_reserva import validar_horario_disponible
        horario_disponible, mensaje_validacion = validar_horario_disponible(fecha, hora, idParroquia)
        if not horario_disponible:
            return jsonify({
                "ok": False,
                "mensaje": mensaje_validacion
            }), 400

        # 🔹 Si viene con estado RESERVA_PARROQUIA o absorcionPago=True, usar estado especial
        if estado == 'RESERVA_PARROQUIA' or absorcionPago:
            estado = 'RESERVA_PARROQUIA'

        exito, resultado = agregar_reserva(fecha, hora, mencion, estado, idUsuario, idSolicitante, idParroquia)
        
        if exito:
            return jsonify({
                "ok": True,
                "mensaje": "Reserva agregada exitosamente.",
                "idReserva": resultado
            }), 200

        return jsonify({"ok": False, "mensaje": f"Error al agregar reserva: {resultado}"}), 500

    except Exception as e:
        return jsonify({"ok": False, "mensaje": f"Error interno: {str(e)}"}), 500



# ==========================
# CAMBIAR ESTADO
# ==========================
@reserva_bp.route('/cambiar_estado/<int:idReserva>', methods=['POST'])
def route_cambiar_estado(idReserva):
    try:
        data = request.get_json() or {}
        accion = data.get('accion', 'continuar')

        exito, resultado = cambiar_estado_reserva(idReserva, accion)

        if exito:
            return jsonify({"ok": True, "nuevo_estado": resultado}), 200
        
        return jsonify({
            "ok": False,
            "mensaje": f"Error al cambiar estado: {resultado}"
        }), 400

    except Exception as e:
        return jsonify({"ok": False, "mensaje": f"Ocurrió un error: {str(e)}"}), 500



# ==========================
# RESERVAS DEL SACERDOTE
# ==========================
@reserva_bp.route('/sacerdote/<int:idUsuario>', methods=['GET'])
def route_get_reservas_sacerdote(idUsuario):
    try:
        reservas = get_reservas_sacerdote(idUsuario)
        return jsonify({'success': True, 'datos': reservas}), 200
    except Exception as e:
        return jsonify({"success": False, "mensaje": f"Error al obtener las reservas: {str(e)}"}), 500



# ==========================
# RESERVAS DE LA SECRETARIA
# ==========================
@reserva_bp.route('/secretaria/<int:idUsuario>', methods=['GET'])
def reservas_parroquia_route(idUsuario):
    try:
        reservas = get_reservas_parroquia(idUsuario)
        return jsonify({'success': True, 'datos': reservas})
    except Exception as e:
        return jsonify({'success': False, 'mensaje': str(e)}), 500



# ==========================
# RESERVAS DEL FELIGRÉS
# ==========================
@reserva_bp.route('/feligres/<int:idUsuario>', methods=['GET'])
def reservas_feligres_route(idUsuario):
    try:
        reservas = get_reservas_feligres(idUsuario)
        return jsonify({'success': True, 'datos': reservas})
    except Exception as e:
        return jsonify({'success': False, 'mensaje': str(e)}), 500



# ==========================
# LISTAR RESERVAS SEGÚN ROL
# ==========================
@reserva_bp.route('/listar_reservas_pago', methods=['GET'])
def listar_reservas():
    try:
        rol = request.args.get('rol')
        idUsuario = request.args.get('idUsuario')

        datos = listar_reservas_por_rol(rol, idUsuario)

        return jsonify({'ok': True, 'datos': datos, 'total': len(datos)})

    except Exception as e:
        print(f'Error al listar reservas: {e}')
        return jsonify({'ok': False, 'datos': [], 'mensaje': 'Error interno'}), 500

# ==========================
# OBTENER RESERVAS POR FECHA Y PARROQUIA (para validación de horarios)
# ==========================
@reserva_bp.route('/reservas_fecha/<int:idParroquia>/<fecha>', methods=['GET'])
def reservas_por_fecha(idParroquia, fecha):
    try:
        from app.reserva.controlador_reserva import obtener_reservas_por_fecha
        reservas = obtener_reservas_por_fecha(idParroquia, fecha)
        return jsonify({
            "ok": True,
            "reservas": reservas
        }), 200
    except Exception as e:
        print(f"Error al obtener reservas por fecha: {e}")
        return jsonify({"ok": False, "mensaje": str(e)}), 500
