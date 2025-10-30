from flask import Blueprint, jsonify, request
from app.reserva.controlador_reserva import(
    cargar_horas_disponibles, cantidad_misas_al_dia, cantidad_limita_matrimonio,
    agregar_reserva,
    requisitos_bautismo, 
    requisitos_matrimonio, 
    requisitos_misa)
reserva_bp = Blueprint('reserva', __name__)

@reserva_bp.route('/horarios_base', methods=['GET'])
def get_horarios_base():
    # 1. Obtener el parámetro 'tipo' de la URL
    tipo = request.args.get('tipo', '').upper()
    
    if tipo not in ['MISA', 'BAUTIZO', 'MATRIMONIO']:
        return jsonify({"error": "Parámetro 'tipo' inválido o faltante."}), 400

    # 2. Ejecutar la consulta
    resultados = cargar_horas_disponibles(tipo)
    
    if isinstance(resultados, dict) and 'error' in resultados:
        return jsonify(resultados), 500

    # 3. Convertir cada fila (tupla) en un diccionario manualmente según tipo
    data = []
    for fila in resultados:
        if tipo == 'MISA':
            data.append({
                "DiaDeLaSemana": fila[0],
                "Hora": fila[1],
                "idConfiguracion": fila[2],
                "nombClave": fila[3],
                "unidad": fila[4],
                "descripcion": fila[5]
            })
        else:  # BAUTIZO o MATRIMONIO
            data.append({
                "DiaDeLaSemana": fila[0],
                "HoraInicio": fila[1],
                "HoraFin": fila[2],
                "idConfiguracion": fila[3],
                "nombClave": fila[4],
                "unidad": fila[5],
                "RangoHoraOriginal": fila[6],
                "descripcion": fila[7]
            })

    return jsonify(data)


@reserva_bp.route('/reglas_restriccion', methods=['GET'])
def get_reglas_restriccion():
    # MISA_LIMITE
    limite_misas_data = cantidad_misas_al_dia()
    if isinstance(limite_misas_data, dict) and 'error' in limite_misas_data:
        return jsonify({"error": "Error al cargar el límite de misas."}), 500
    
    # MATRIMONIO_CICLO
    limites_matrimonio_data = cantidad_limita_matrimonio()
    if isinstance(limites_matrimonio_data, dict) and 'error' in limites_matrimonio_data:
        return jsonify({"error": "Error al cargar el ciclo de matrimonio."}), 500

    # Acceder por índice (tupla)
    respuesta = {
        "misa_limite_diario": limite_misas_data[0] if limite_misas_data else None,  # fila[0] -> valor
        "matrimonio_ciclo_dias": {
            "minimo": limites_matrimonio_data[0] if limites_matrimonio_data else None,  # fila[0] -> DiasMinimo
            "maximo": limites_matrimonio_data[1] if limites_matrimonio_data else None,  # fila[1] -> DiasMaximo
        }
    }
    return jsonify(respuesta)

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

# --- RUTA PARA REQUISITOS DE BAUTISMO ---
@reserva_bp.route('/requisitos/bautismo', methods=['GET'])
def req_bautismo():
    resultado = requisitos_bautismo()
    return jsonify(resultado)

# --- RUTA PARA REQUISITOS DE MATRIMONIO ---
@reserva_bp.route('/requisitos/matrimonio', methods=['GET'])
def req_matrimonio():
    resultado = requisitos_matrimonio()
    return jsonify(resultado)

# --- RUTA PARA REQUISITOS DE MISA ---
@reserva_bp.route('/requisitos/misa', methods=['GET'])
def req_misa():
    resultado = requisitos_misa()
    return jsonify(resultado)