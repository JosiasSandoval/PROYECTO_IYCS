from datetime import datetime, timedelta, time
from flask import jsonify,Blueprint,request
from app.acto_liturgico_requisito.controlador_acto import (obtener_acto_parroquia,disponibilidad_acto_parroquia,participante_acto,registrar_participantes_acto)

acto_bp=Blueprint('acto',__name__)

@acto_bp.route('/<int:id>', methods=['GET'])
def acto_parroquia(id):
    datos = obtener_acto_parroquia(id)
    
    return jsonify({
        "success": True,
        "mensaje": "Actos encontrados correctamente",
        "datos": datos
    }), 200

@acto_bp.route('/disponibilidad/<int:idParroquia>/<int:idActo>', methods=['GET'])
def disponibilidad_acto(idParroquia, idActo):
    datos = disponibilidad_acto_parroquia(idParroquia, idActo)

    # Convertir horas o timedelta a string "HH:MM"
    datos_serializables = []
    for d in datos:
        d_copy = d.copy()  # Evitar modificar el original
        if "horaInicioActo" in d_copy:
            hora = d_copy["horaInicioActo"]
            if isinstance(hora, (time, timedelta)):
                if isinstance(hora, timedelta):
                    total_segundos = int(hora.total_seconds())
                    horas = total_segundos // 3600
                    minutos = (total_segundos % 3600) // 60
                    d_copy["horaInicioActo"] = f"{horas:02d}:{minutos:02d}"
                else:
                    d_copy["horaInicioActo"] = hora.strftime("%H:%M")
        datos_serializables.append(d_copy)

    return jsonify({
        "success": True,
        "mensaje": "Actos encontrados correctamente",
        "datos": datos_serializables
    }), 200

@acto_bp.route('/participantes/<int:idActo>', methods=['GET'])
def obtener_participantes(idActo):
    num, lista = participante_acto(idActo)
    return jsonify({
        "num_participantes": num,
        "participantes": lista
    })

@acto_bp.route('/registrar_participante', methods=['POST'])
def registrar_participante_controller():
    try:
        data = request.get_json()
        
        # 1. Extraer datos del payload de JS
        nombParticipante = data.get('nombParticipante')
        rolParticipante = data.get('rolParticipante') # Ya es el rol limpio
        idActo = data.get('idActo')
        idReserva = data.get('idReserva')
        
        # 2. Validación simple de campos
        if not all([nombParticipante, rolParticipante, idActo, idReserva]):
            return jsonify({"ok": False, "mensaje": "Faltan datos en la solicitud del participante."}), 400

        # 3. Llamar a tu función de base de datos
        exito, mensaje = registrar_participantes_acto(nombParticipante, rolParticipante, idActo, idReserva)
        
        if exito:
            return jsonify({"ok": True, "mensaje": mensaje}), 200
        else:
            # Aquí 'mensaje' contendrá el error de la DB
            return jsonify({"ok": False, "mensaje": f"Error DB al registrar participante: {mensaje}"}), 500

    except Exception as e:
        print(f"Error en el controlador de participantes: {e}")
        return jsonify({"ok": False, "mensaje": f"Error interno del servidor al procesar participante: {str(e)}"}), 500