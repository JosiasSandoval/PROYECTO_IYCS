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

@reserva_bp.route('/nueva_reserva', methods=['POST'])
def nueva_reserva():
    try:
        data = request.get_json()
        fecha = data.get('fecha')
        hora = data.get('hora')
        estado=data.get('estadoReserva')
        mencion = data.get('observaciones') # Puede ser una cadena vacía ("")
        idUsuario = data.get('idUsuario')
        idSolicitante = data.get('idSolicitante')
        idParroquia=data.get('idParroquia')
        

        # 🛑 CORRECCIÓN DE LA VALIDACIÓN:
        # 1. 'mencion' no se valida (puede ser vacío).
        # 2. 'idSolicitante' se añade como obligatorio, ya que se pasa a agregar_reserva.
        if not fecha or not hora or not idUsuario or not idSolicitante:
            return jsonify({"ok": False, "mensaje": "Faltan datos obligatorios (fecha, hora, idUsuario, idSolicitante)."}), 400

        # Si mencion es None (si el campo no existía en el JSON) se inicializa a cadena vacía,
        # aunque data.get('observaciones') ya lo haría si el frontend envía el campo.
        mencion = mencion if mencion is not None else ""
        
        # Llamada a la función que inserta la reserva
        exito, resultado = agregar_reserva(fecha, hora, mencion,estado, idUsuario, idSolicitante,idParroquia)
        
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

@reserva_bp.route('/sacerdote/<string:nombre>', methods=['GET'])
def route_get_reservas_sacerdote(nombre):
    try:
        reservas = get_reservas_sacerdote(nombre)
        return jsonify(reservas), 200
    except Exception as e:
        return jsonify({"ok": False, "mensaje": f"Error al obtener las reservas: {str(e)}"}),

@reserva_bp.route('/secretaria/<int:idUsuario>', methods=['GET'])
def reservas_parroquia_route(idUsuario):
    try:
        reservas = get_reservas_parroquia(idUsuario)  # ya retorna lista de diccionarios
        return jsonify({'success': True, 'datos': reservas})
    except Exception as e:
        return jsonify({'success': False, 'mensaje': str(e)}), 500

# ==========================
# Route: Reservas de Feligres
# ==========================
@reserva_bp.route('/feligres/<int:idUsuario>', methods=['GET'])
def reservas_feligres_route(idUsuario):
    try:
        reservas = get_reservas_feligres(idUsuario)  # ya retorna lista de diccionarios
        return jsonify({'success': True, 'datos': reservas})
    except Exception as e:
        return jsonify({'success': False, 'mensaje': str(e)}), 500
    
@reserva_bp.route('/listar_reservas_pago', methods=['GET'])
def listar_reservas():
    rol = request.args.get('rol')  # Feligrés, Secretaria, Administrador
    idUsuario = request.args.get('idUsuario')  # Opcional, si necesitas filtrar por usuario
    try:
        datos = listar_reservas_por_rol(rol, idUsuario)
        return jsonify({'ok': True, 'datos': datos, 'total': len(datos)})
    except Exception as e:
        print(f'Error al listar reservas: {e}')
        return jsonify({'ok': False, 'datos': [], 'mensaje': 'Error interno'}), 500