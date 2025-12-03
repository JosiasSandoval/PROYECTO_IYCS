from flask import Blueprint, jsonify, request
# Asegúrate de que esta ruta de importación sea correcta para tu proyecto
from app.acto_liturgico.controlador_actoLiturgico import (
    obtener_actos,
    obtener_acto_por_id,
    registrar_acto,
    actualizar_acto,
    actualizar_estado_acto,
    eliminar_acto
)

# --- CORRECCIÓN ---
# Quitamos el url_prefix. El __init__.py ya define el prefijo correcto.
acto_liturgico_bp = Blueprint('acto_liturgico', __name__)

# ================== LISTAR TODOS ==================
# Esta ruta ahora será: /api/acto_liturgico/actos
@acto_liturgico_bp.route('/actos', methods=['GET'])
def listar_actos():
    datos = obtener_actos()
    return jsonify({"success": True, "datos": datos}), 200

# ================== OBTENER UNO ==================
# Esta ruta ahora será: /api/acto_liturgico/actos/<id>
@acto_liturgico_bp.route('/actos/<int:idActo>', methods=['GET'])
def obtener_acto(idActo):
    acto = obtener_acto_por_id(idActo)
    if acto:
        return jsonify({"success": True, "datos": acto}), 200
    else:
        return jsonify({"success": False, "mensaje": "Acto no encontrado"}), 404

# ================== REGISTRAR (VALIDACIÓN MEJORADA) ==================
@acto_liturgico_bp.route('/actos', methods=['POST'])
def crear_acto():
    data = request.get_json()
    
    # Campos obligatorios del nuevo modal
    campos_requeridos = ["nombActo", "numParticipantes", "tipoParticipantes","imgActo"]
    
    if not data or not all(campo in data for campo in campos_requeridos):
        return jsonify({"success": False, "mensaje": "Datos incompletos. Faltan campos obligatorios."}), 400
    
    exito, mensaje = registrar_acto(data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 201
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR (VALIDACIÓN MEJORADA) ==================
@acto_liturgico_bp.route('/actos/<int:idActo>', methods=['PUT'])
def editar_acto(idActo):
    data = request.get_json()

    # Campos obligatorios del nuevo modal
    campos_requeridos = ["nombActo", "numParticipantes", "tipoParticipantes", "imgActo"]

    if not data or not all(campo in data for campo in campos_requeridos):
        return jsonify({"success": False, "mensaje": "Datos incompletos. Faltan campos obligatorios."}), 400

    exito, mensaje = actualizar_acto(idActo, data)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== ACTUALIZAR ESTADO (PARCIAL) ==================
# Esta ruta ahora será: /api/acto_liturgico/actos/<id>/estado
@acto_liturgico_bp.route('/actos/<int:idActo>/estado', methods=['PATCH'])
def cambiar_estado_acto(idActo):
    data = request.get_json()
    if "estado" not in data:
        return jsonify({"success": False, "mensaje": "Estado no proporcionado"}), 400

    exito = actualizar_estado_acto(idActo, data["estado"])
    if exito:
        return jsonify({"success": True, "mensaje": "Estado actualizado"}), 200
    else:
        return jsonify({"success": False, "mensaje": "Error al actualizar estado"}), 500

# ================== ELIMINAR ==================
@acto_liturgico_bp.route('/actos/<int:idActo>', methods=['DELETE']) 
def borrar_acto(idActo):
    exito, mensaje = eliminar_acto(idActo)
    if exito:
        return jsonify({"success": True, "mensaje": mensaje}), 200
    else:
        return jsonify({"success": False, "mensaje": mensaje}), 500

# ================== VALIDAR HORARIO ==================
@acto_liturgico_bp.route('/validar_horario', methods=['POST'])
def validar_horario_disponibilidad():
    """
    Valida si un horario está disponible considerando:
    1. Duración del acto (desde configuracion_acto)
    2. Reservas existentes de la parroquia
    3. Horarios ya registrados
    """
    from app.bd_sistema import obtener_conexion
    from datetime import datetime, timedelta
    
    data = request.get_json()
    fecha = data.get('fecha')
    hora = data.get('hora')  # formato HH:MM
    idActo = data.get('idActo')
    idParroquia = data.get('idParroquia')
    
    if not all([fecha, hora, idActo, idParroquia]):
        return jsonify({"success": False, "mensaje": "Faltan datos obligatorios"}), 400
    
    # Validar rango de hora permitido (7am - 11pm)
    try:
        hora_obj = datetime.strptime(hora, '%H:%M')
        if hora_obj.hour < 7 or hora_obj.hour >= 23:
            return jsonify({
                "success": False,
                "disponible": False,
                "mensaje": "⏰ Los horarios deben estar entre las 7:00 AM y las 11:00 PM"
            }), 200
    except ValueError:
        return jsonify({"success": False, "mensaje": "Formato de hora inválido"}), 400
    
    conexion = obtener_conexion()
    try:
        with conexion.cursor() as cursor:
            # 1. Obtener duración del acto desde configuracion_acto
            cursor.execute("""
                SELECT tiempoDuracion
                FROM configuracion_acto
                WHERE idActo = %s
            """, (idActo,))
            
            config = cursor.fetchone()
            if not config:
                # Si no hay configuración, asumimos 1 hora
                duracion_minutos = 60
            else:
                # tiempoDuracion siempre está en minutos según los inserts
                duracion_minutos = config[0]
            
            # Calcular hora de fin
            hora_inicio = datetime.strptime(hora, '%H:%M')
            hora_fin = hora_inicio + timedelta(minutes=duracion_minutos)
            hora_fin_str = hora_fin.strftime('%H:%M:00')
            hora_inicio_str = hora + ':00'
            
            # 2. Verificar reservas existentes que se solapan
            cursor.execute("""
                SELECT COUNT(*) as total, GROUP_CONCAT(DISTINCT al.nombActo SEPARATOR ', ') as actos
                FROM reserva r
                INNER JOIN participantes_acto pa ON r.idReserva = pa.idReserva
                INNER JOIN acto_liturgico al ON pa.idActo = al.idActo
                INNER JOIN configuracion_acto ca ON al.idActo = ca.idActo
                WHERE r.idParroquia = %s
                AND r.f_reserva = %s
                AND r.estadoReserva NOT IN ('CANCELADO', 'RECHAZADO')
                AND (
                    (r.h_reserva >= %s AND r.h_reserva < %s) OR
                    (ADDTIME(r.h_reserva, SEC_TO_TIME(ca.tiempoDuracion * 60)) > %s AND r.h_reserva <= %s)
                )
            """, (idParroquia, fecha, hora_inicio_str, hora_fin_str, hora_inicio_str, hora_inicio_str))
            
            resultado = cursor.fetchone()
            reservas_conflicto = resultado[0] if resultado else 0
            actos_conflicto = resultado[1] if resultado else ""
            
            if reservas_conflicto > 0:
                return jsonify({
                    "success": False,
                    "disponible": False,
                    "mensaje": f"❌ Este horario ya está ocupado por una reserva de: {actos_conflicto}",
                    "tipo": "reserva"
                }), 200
            
            # 3. Verificar horarios ya registrados que se solapan
            cursor.execute("""
                SELECT COUNT(*) as total
                FROM acto_parroquia ap
                INNER JOIN configuracion_acto ca ON ap.idActo = ca.idActo
                WHERE ap.idParroquia = %s
                AND ap.diaSemana = UPPER(LEFT(DAYNAME(STR_TO_DATE(%s, '%%Y-%%m-%%d')), 3))
                AND (
                    (ap.horaInicioActo >= %s AND ap.horaInicioActo < %s) OR
                    (ADDTIME(ap.horaInicioActo, SEC_TO_TIME(ca.tiempoDuracion * 60)) > %s AND ap.horaInicioActo <= %s)
                )
            """, (idParroquia, fecha, hora_inicio_str, hora_fin_str, hora_inicio_str, hora_inicio_str))
            
            resultado = cursor.fetchone()
            horarios_conflicto = resultado[0] if resultado else 0
            
            if horarios_conflicto > 0:
                return jsonify({
                    "success": False,
                    "disponible": False,
                    "mensaje": f"⚠️ Ya existe un horario que se solapa con este (duración: {duracion_minutos} min)",
                    "tipo": "horario"
                }), 200
            
            # Horario disponible
            return jsonify({
                "success": True,
                "disponible": True,
                "mensaje": "✅ Horario disponible",
                "duracion_minutos": duracion_minutos
            }), 200
            
    except Exception as e:
        print(f"Error validando horario: {e}")
        return jsonify({"success": False, "mensaje": f"Error: {str(e)}"}), 500
    finally:
        if conexion:
            conexion.close()