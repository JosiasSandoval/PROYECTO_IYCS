from flask import Blueprint, request, jsonify
from app.rol_permiso.controlador_rol_permiso import (
    get_listar_rol,
    actualizar_rol,
    agregar_rol,
    busqueda_rol,
    cambiar_estado_rol,
    eliminar_rol,
    verificar_relacion_rol,
    agregar_rol_permiso,
    eliminar_rol_permiso,
    cambiar_estado_permiso,
    mostrar_permisos_rol,
    get_listar_permiso
)

rol_bp = Blueprint('rol', __name__)
permiso_bp = Blueprint('permiso', __name__)

# =====================
# ROL
# =====================
@rol_bp.route('/', methods=['GET'])
def listar_rol():
    try:
        busqueda = request.args.get('busqueda')
        if busqueda:
            datos = busqueda_rol(busqueda)
        else:
            datos = get_listar_rol()
        return jsonify(datos), 200
    except Exception as e:
        print(f'Error al listar los roles: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error al listar roles'}), 500


@rol_bp.route('/agregar', methods=['POST'])
def agregar():
    try:
        datos = request.get_json()
        resultado = agregar_rol(datos.get('nombRol'))
        return jsonify(resultado), 200 if resultado['ok'] else 400
    except Exception as e:
        print(f'Error al agregar rol: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


@rol_bp.route('/actualizar/<int:idRol>', methods=['PUT'])
def actualizar(idRol):
    try:
        datos = request.get_json()
        resultado = actualizar_rol(idRol, datos.get('nombRol'))
        return jsonify(resultado), 200 if resultado['ok'] else 400
    except Exception as e:
        print(f'Error al actualizar el rol: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


@rol_bp.route('/cambiar_estado/<int:idRol>', methods=['PUT'])
def cambiar_estado(idRol):
    resultado = cambiar_estado_rol(idRol)
    if resultado['ok']:
        return jsonify({
            'ok': True,
            'mensaje': resultado['mensaje']
        }), 200
    else:
        return jsonify({'ok': False, 'mensaje': resultado['mensaje']}), 400


@rol_bp.route('/eliminar/<int:idRol>', methods=['DELETE'])
def eliminar(idRol):
    try:
        tiene_relaciones = verificar_relacion_rol(idRol)
        if tiene_relaciones:
            return jsonify({
                'ok': False,
                'mensaje': 'No se puede eliminar el rol porque está relacionado con otras tablas'
            }), 400
        resultado = eliminar_rol(idRol)
        return jsonify(resultado), 200 if resultado['ok'] else 400
    except Exception as e:
        print(f'Error al eliminar rol: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# =====================
# PERMISO
# =====================

@permiso_bp.route('/agregar_rol_permiso', methods=['POST'])
def agregar_rol_permiso_usuario():
    try:
        datos = request.get_json()
        resultado = agregar_rol_permiso(
            datos.get('idRol'),
            datos.get('idPermiso')
        )
        return jsonify(resultado), 200 if resultado['ok'] else 400
    except Exception as e:
        print(f'Error al agregar permiso al rol: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500

@permiso_bp.route('/eliminar_rol_permiso', methods=['POST'])
def eliminar_rol_permiso_usuario():
    try:
        datos = request.get_json()
        resultado = eliminar_rol_permiso(
            datos.get('idRol'),
            datos.get('idPermiso')
        )
        return jsonify(resultado), 200 if resultado['ok'] else 400
    except Exception as e:
        print(f'Error al eliminar permiso del rol: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


@permiso_bp.route('/cambiar_estado/<int:idPermiso>', methods=['PUT'])
def cambiar_estado_permiso_usuario(idPermiso):
    resultado = cambiar_estado_permiso(idPermiso)
    if resultado['ok']:
        return jsonify({
            'ok': True,
            'mensaje': resultado['mensaje']
        }), 200
    else:
        return jsonify({'ok': False, 'mensaje': resultado['mensaje']}), 400

@permiso_bp.route('/',methods=['GET'])
def listar_permisos():
    try:
        datos=get_listar_permiso()
        return jsonify(datos), 200
    except Exception as e:
        print(f'Error al listar los roles: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error al listar roles'}), 500

@permiso_bp.route('/<int:id>',methods=['GET'])
def listar_permisos_rol(id):
    try:
        datos=mostrar_permisos_rol(id)
        return jsonify(datos), 200
    except Exception as e:
        print(f'Error al listar los roles: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error al listar roles'}), 500