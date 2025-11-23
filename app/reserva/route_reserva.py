from flask import Blueprint, request, jsonify
from app.reserva.controlador_reserva import (
    agregar_reserva,
    cambiar_estado_reserva,
    eliminar_reserva,
    reprogramar_reserva,
    get_reservas_sacerdote,
    get_reservas_id_usuario,
    obtener_todas_reservas_admin
)

reserva_bp = Blueprint('reserva', __name__)

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
        
        if not fecha or not hora or not idUsuario or not idSolicitante:
            return jsonify({"ok": False, "mensaje": "Faltan datos obligatorios."}), 400

        # Ahora retorna tupla consistente
        exito, resultado = agregar_reserva(fecha, hora, mencion, estado, idUsuario, idSolicitante, idParroquia)
        
        if exito:
            return jsonify({"ok": True, "mensaje": "Reserva agregada.", "idReserva": resultado}), 200
        else:
            return jsonify({"ok": False, "mensaje": f"Error al agregar: {resultado}"}), 500
            
    except Exception as e:
        return jsonify({"ok": False, "mensaje": f"Error interno: {str(e)}"}), 500

@reserva_bp.route('/cambiar_estado/<int:idReserva>', methods=['POST'])
def route_cambiar_estado(idReserva):
    try:
        data = request.get_json() or {}
        accion = data.get('accion', 'continuar')

        # Ya no fallará el desempaquetado porque el controlador ahora retorna tupla
        exito, resultado = cambiar_estado_reserva(idReserva, accion)

        if exito:
            return jsonify({"ok": True, "nuevo_estado": resultado}), 200
        else:
            return jsonify({"ok": False, "mensaje": f"Error: {resultado}"}), 400

    except Exception as e:
        return jsonify({"ok": False, "mensaje": f"Ocurrió un error: {str(e)}"}), 500

@reserva_bp.route('/reprogramar', methods=['POST'])
def route_reprogramar():
    try:
        data = request.get_json()
        idReserva = data.get('idReserva')
        fecha = data.get('fecha')
        hora = data.get('hora')
        observaciones = data.get('observaciones', '')

        if not idReserva or not fecha or not hora:
            return jsonify({"ok": False, "mensaje": "Faltan datos para reprogramar"}), 400

        exito, mensaje = reprogramar_reserva(idReserva, fecha, hora, observaciones)

        if exito:
            return jsonify({"ok": True, "mensaje": mensaje}), 200
        else:
            return jsonify({"ok": False, "mensaje": mensaje}), 400
            
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)}), 500

@reserva_bp.route('/eliminar/<int:idReserva>', methods=['DELETE'])
def route_eliminar(idReserva):
    try:
        exito, mensaje = eliminar_reserva(idReserva)
        
        if exito:
            return jsonify({"ok": True, "mensaje": mensaje}), 200
        else:
            return jsonify({"ok": False, "mensaje": mensaje}), 400
    except Exception as e:
        return jsonify({"ok": False, "mensaje": str(e)}), 500

@reserva_bp.route('/reserva_sacerdote/<string:nombre>', methods=['GET'])
def route_get_reservas_sacerdote(nombre):
    try:
        reservas = get_reservas_sacerdote(nombre)
        return jsonify(reservas), 200
    except Exception as e:
        # Corregida la coma sobrante
        return jsonify({"ok": False, "mensaje": f"Error: {str(e)}"}), 500

@reserva_bp.route('/reserva_usuario/<int:idUsuario>/<string:rol>', methods=['GET'])
def route_get_reservas_id_usuario(idUsuario, rol):
    try:
        idParroquia = request.args.get('idParroquia')
        reservas = get_reservas_id_usuario(idUsuario, rol, idParroquia)
        return jsonify({"ok": True, "datos": reservas}), 200
    except Exception as e:
        return jsonify({"ok": False, "mensaje": f"Error: {str(e)}"}), 500
    

@reserva_bp.route('/admin/listado', methods=['GET'])
def route_admin_listado():
    try:
        reservas = obtener_todas_reservas_admin()
        return jsonify({"success": True, "datos": reservas}), 200
    except Exception as e:
        return jsonify({"success": False, "mensaje": str(e)}), 500