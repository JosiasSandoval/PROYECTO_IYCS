from flask import Blueprint, jsonify, request
from app.reserva.controlador_reserva import(
    agregar_reserva)
#from app.reserva.configuracion_reserva

reserva_bp = Blueprint('reserva', __name__)

@reserva_bp.route('/nueva_reserva', methods=['POST'])
def nueva_reserva():
    try:
        data = request.get_json()
        fecha = data.get('fecha')
        hora = data.get('hora')
        observaciones = data.get('observaciones')
        idUsuario = data.get('idUsuario')

        # Validación simple
        if not fecha or not hora or not observaciones or not idUsuario:
            return "Faltan datos en la solicitud.", 400

        # Llamada a la función que inserta la reserva
        exito, mensaje = agregar_reserva(fecha, hora, observaciones, idUsuario)
        
        if exito:
            return mensaje, 200  # Ej: "Reserva creada correctamente"
        else:
            return mensaje, 500  # Ej: "Error al crear la reserva"

    except Exception as e:
        return f"Ocurrió un error: {str(e)}", 500
