from flask import Blueprint, request, jsonify
from app.reserva.controlador_reserva import (
    agregar_reserva,
    cambiar_estado_reserva,
    eliminar_reserva,
    reprogramar_reserva
)

reserva_bp = Blueprint('reserva', __name__)

@reserva_bp.route('/nueva_reserva', methods=['POST'])
def nueva_reserva():
    try:
        data = request.get_json()
        fecha = data.get('fecha')
        hora = data.get('hora')
        mencion = data.get('observaciones') # Puede ser una cadena vacía ("")
        idUsuario = data.get('idUsuario')
        idSolicitante = data.get('idSolicitante')

        # 🛑 CORRECCIÓN DE LA VALIDACIÓN:
        # 1. 'mencion' no se valida (puede ser vacío).
        # 2. 'idSolicitante' se añade como obligatorio, ya que se pasa a agregar_reserva.
        if not fecha or not hora or not idUsuario or not idSolicitante:
            return jsonify({"ok": False, "mensaje": "Faltan datos obligatorios (fecha, hora, idUsuario, idSolicitante)."}), 400

        # Si mencion es None (si el campo no existía en el JSON) se inicializa a cadena vacía,
        # aunque data.get('observaciones') ya lo haría si el frontend envía el campo.
        mencion = mencion if mencion is not None else ""
        
        # Llamada a la función que inserta la reserva
        exito, resultado = agregar_reserva(fecha, hora, mencion, idUsuario, idSolicitante)
        
        if exito:
            # 💡 NOTA: Asumiendo que 'resultado' contiene el idReserva directamente.
            return jsonify({"ok": True, "mensaje": "Reserva agregada exitosamente.", "idReserva": resultado}), 200
        else:
            return jsonify({"ok": False, "mensaje": f"Error al agregar la reserva: {resultado}"}), 500
            
    except Exception as e:
        # Error general del servidor o JSON inválido
        return jsonify({"ok": False, "mensaje": f"Error interno del servidor: {str(e)}"}), 500

@reserva_bp.route('/cambiar_estado/<int:idReserva>', methods=['POST'])
def route_cambiar_estado(idReserva):
    try:
        data = request.get_json() or {}
        accion = data.get('accion', 'continuar')  # Por defecto 'continuar'

        exito, resultado = cambiar_estado_reserva(idReserva, accion)

        if exito:
            return jsonify({"ok": True, "nuevo_estado": resultado}), 200
        else:
            return jsonify({"ok": False, "mensaje": f"Error al cambiar el estado de la reserva: {resultado}"}), 400

    except Exception as e:
        return jsonify({"ok": False, "mensaje": f"Ocurrió un error: {str(e)}"}), 500
