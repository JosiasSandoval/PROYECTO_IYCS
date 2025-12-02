from datetime import datetime, timedelta, time
from flask import jsonify,Blueprint,request
from app.acto_liturgico_requisito.controlador_acto import (
    obtener_acto_parroquia,disponibilidad_acto_parroquia,participante_acto,registrar_participantes_acto, 
    obtener_configuracion_acto, agregar_horario_acto_parroquia, eliminar_horario_acto_parroquia,
    obtener_actos_con_horarios_parroquia)

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
    
@acto_bp.route('/configuracion/<int:id>', methods=['GET'])
def configuracion_acto(id):
    datos = obtener_configuracion_acto(id)
    
    return jsonify({
        "success": True,
        "mensaje": "Actos encontrados correctamente",
        "datos": datos
    }), 200

# =====================================================
# AGREGAR HORARIO A ACTO_PARROQUIA
# =====================================================
@acto_bp.route('/horario/agregar', methods=['POST'])
def agregar_horario():
    try:
        data = request.get_json()
        
        if not all([data.get('idActo'), data.get('idParroquia'), data.get('diaSemana'), data.get('horaInicioActo')]):
            return jsonify({'success': False, 'mensaje': 'Faltan datos requeridos'}), 400
        
        resultado = agregar_horario_acto_parroquia(
            idActo=data['idActo'],
            idParroquia=data['idParroquia'],
            diaSemana=data['diaSemana'],
            horaInicioActo=data['horaInicioActo'],
            costoBase=data.get('costoBase', 0)
        )
        
        if resultado['ok']:
            return jsonify(resultado), 201
        else:
            return jsonify(resultado), 400
            
    except Exception as e:
        print(f'Error en agregar horario: {e}')
        return jsonify({'success': False, 'mensaje': f'Error interno: {str(e)}'}), 500

# =====================================================
# ELIMINAR HORARIO DE ACTO_PARROQUIA
# =====================================================
@acto_bp.route('/horario/eliminar/<int:idActoParroquia>', methods=['DELETE'])
def eliminar_horario(idActoParroquia):
    try:
        resultado = eliminar_horario_acto_parroquia(idActoParroquia)
        
        if resultado['ok']:
            return jsonify(resultado), 200
        else:
            return jsonify(resultado), 400
            
    except Exception as e:
        print(f'Error en eliminar horario: {e}')
        return jsonify({'success': False, 'mensaje': f'Error interno: {str(e)}'}), 500

# =====================================================
# OBTENER ACTOS CON HORARIOS DE UNA PARROQUIA
# =====================================================
@acto_bp.route('/parroquia/<int:idParroquia>/actos-horarios', methods=['GET'])
def actos_con_horarios_parroquia(idParroquia):
    try:
        datos = obtener_actos_con_horarios_parroquia(idParroquia)
        return jsonify({
            "success": True,
            "mensaje": "Actos con horarios obtenidos correctamente",
            "datos": datos
        }), 200
    except Exception as e:
        print(f'Error en actos con horarios: {e}')
        return jsonify({
            "success": False,
            "mensaje": f"Error al obtener actos con horarios: {str(e)}",
            "datos": []
        }), 500