from flask import Blueprint, request, jsonify
from app.parroquia.controlador_parroquia import (
    get_obtener_mapa_datos,
    ubicar_parroquia,
    obtener_informacion_parroquia,
    listar_parroquia,
    agregar_parroquia,
    actualizar_parroquia,
    cambiar_estado_parroquia,
    eliminar_parroquia,
    verificar_relacion_parroquia,
    buscar_parroquia,
    obtener_parroquia_secretaria
)

parroquia_bp = Blueprint('parroquia', __name__)

# ======================================================
# 🔹 OBTENER DATOS PARA MAPA
# ======================================================
@parroquia_bp.route('/datos', methods=['GET'])
def obtener_ubicacion():
    try:
        busqueda = request.args.get('busqueda')
        if busqueda:
            datos = ubicar_parroquia(busqueda)
        else:
            datos = get_obtener_mapa_datos()
        return jsonify({'datos': datos})
    except Exception as e:
        print(f"Error al procesar la solicitud de ubicación: {e}")
        return jsonify({'datos': []})


# ======================================================
# 🔹 OBTENER INFORMACIÓN DETALLADA
# ======================================================
@parroquia_bp.route('/informacion/<int:idParroquia>', methods=['GET'])
def informacion_parroquia(idParroquia):
    try:
        datos = obtener_informacion_parroquia(idParroquia)
        return jsonify({'datos': datos})
    except Exception as e:
        print(f"Error al procesar la solicitud de información de la parroquia: {e}")
        return jsonify({'datos': []})


# ======================================================
# 🔹 LISTAR PARROQUIAS
# ======================================================
@parroquia_bp.route('/', methods=['GET'])
def listar():
    try:
        datos = listar_parroquia()
        return jsonify({'ok': True, 'datos': datos})
    except Exception as e:
        print(f'Error al listar parroquias: {e}')
        return jsonify({'ok': False, 'datos': [], 'mensaje': 'Error interno'}), 500


# ======================================================
# AGREGAR PARROQUIA
# ======================================================
@parroquia_bp.route('/agregar', methods=['POST'])
def agregar():
    try:
        datos = request.get_json()
        resultado = agregar_parroquia(
            datos.get('nombParroquia'),
            datos.get('historiaParroquia'),
            datos.get('ruc'),
            datos.get('telefonoContacto'),
            datos.get('direccion'),
            datos.get('color'),
            datos.get('latParroquia'),
            datos.get('logParroquia')
        )
        if resultado:
            return jsonify({'ok': True, 'mensaje': 'Parroquia agregada correctamente'})
        else:
            return jsonify({'ok': False, 'mensaje': 'Error al agregar la parroquia'})
    except Exception as e:
        print(f'Error al agregar parroquia: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# CAMBIAR ESTADO DE PARROQUIA
# ======================================================
@parroquia_bp.route('/cambiar_estado/<int:idParroquia>', methods=['PUT'])
def cambiar_estado(idParroquia):
    resultado = cambiar_estado_parroquia(idParroquia)

    if not resultado['ok']:
        return jsonify({'error': resultado['mensaje']}),404
    
    return jsonify({
        'mensaje': resultado['mensaje'],
        'nuevo_estado': resultado['nuevo_estado']
    }),200


# ======================================================
#  ACTUALIZAR PARROQUIA
# ======================================================
@parroquia_bp.route('/actualizar/<int:idParroquia>', methods=['PUT'])
def actualizar(idParroquia):
    try:
        datos = request.get_json()
        resultado = actualizar_parroquia(
            idParroquia,
            datos.get('nombParroquia'),
            datos.get('historiaParroquia'),
            datos.get('ruc'),
            datos.get('telefonoContacto'),
            datos.get('direccion'),
            datos.get('color'),
            datos.get('latParroquia'),
            datos.get('logParroquia'),
            datos.get('estadoParroquia', True)
        )
        if resultado:
            return jsonify({'ok': True, 'mensaje': 'Parroquia actualizada correctamente'})
        else:
            return jsonify({'ok': False, 'mensaje': 'Error al actualizar la parroquia'})
    except Exception as e:
        print(f'Error al actualizar parroquia: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
#  ELIMINAR PARROQUIA
# ======================================================
@parroquia_bp.route('/eliminar/<int:idParroquia>', methods=['DELETE'])
def eliminar(idParroquia):
    try:
        if verificar_relacion_parroquia(idParroquia):
            return jsonify({'ok': False, 'mensaje': 'No se puede eliminar la parroquia porque tiene registros asociados'})
        else:
            if eliminar_parroquia(idParroquia):
                return jsonify({'ok': True, 'mensaje': 'Parroquia eliminada correctamente'})
            else:
                return jsonify({'ok': False, 'mensaje': 'Error al eliminar la parroquia'})
    except Exception as e:
        print(f'Error al eliminar parroquia: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500
# ======================================================
#  BUSCAR PARROQUIA
# ======================================================
@parroquia_bp.route('/buscar/<string:termino>', methods=['GET'])
def buscar(termino):
    resultados = buscar_parroquia(termino)
    if not resultados:
        return jsonify({'ok': True, 'datos': []})
    return jsonify({'ok': True, 'datos': resultados})

# ======================================================
#  OBTENER PARROQUIA DE SECRETARIA
# ======================================================
@parroquia_bp.route('/secretaria/<int:idUsuario>', methods=['GET'])
def parroquia_secretaria(idUsuario):
    try:
        resultado = obtener_parroquia_secretaria(idUsuario)
        return jsonify(resultado)
    except Exception as e:
        print(f'Error al obtener parroquia de secretaria: {e}')
        return jsonify({'success': False, 'mensaje': 'Error interno'}), 500


