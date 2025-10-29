from flask import Blueprint, request, jsonify
from app.cargo.controlador_cargo import (
    listar_cargo,
    agregar_cargo,
    actualizar_cargo,
    cambiar_estado_cargo,
    verificar_relacion_cargo,
    eliminar_cargo
)

cargo_bp = Blueprint('cargo', __name__)

@cargo_bp.route('/', methods=['GET'])
def listado_cargo():
    cargo = listar_cargo()
    return jsonify(cargo), 200

@cargo_bp.route('/agregar', methods=['POST'])
def agregar_nuevo_cargo():
    datos = request.get_json()
    nombCargo = datos.get('nombCargo')
    if not nombCargo:
        return jsonify({'error': 'Faltan datos'}), 400
    agregar_cargo(nombCargo)
    return jsonify({'mensaje': 'Registro exitoso'}), 201

@cargo_bp.route('/actualizar/<int:id>', methods=['PUT'])
def actualizar_cargo_route(id):
    datos = request.get_json()
    nombCargo = datos.get('nombCargo')
    if not nombCargo:
        return jsonify({'error': 'Faltan datos'}), 400
    actualizar_cargo(id, nombCargo)
    return jsonify({'mensaje': 'Actualización exitosa'}), 200

@cargo_bp.route('/cambiar_estado/<int:id>', methods=['PUT'])
def cambiar_estado_route(id):
    resultado = cambiar_estado_cargo(id)
    if not resultado['ok']:
        return jsonify({'error': resultado['mensaje']}), 404
    return jsonify({
        'mensaje': resultado['mensaje'],
        'nuevo_estado': resultado['nuevo_estado']
    }), 200

@cargo_bp.route('/eliminar/<int:id>', methods=['DELETE'])
def eliminar_cargo_route(id):
    # Verificar si hay registros relacionados
    relacion = verificar_relacion_cargo(id)
    if relacion > 0:
        return jsonify({
            'error': 'No se puede eliminar el cargo porque está relacionado con otros registros.'
        }), 400

    # Intentar eliminar y capturar errores
    resultado = eliminar_cargo(id)
    if not resultado.get('ok'):
        return jsonify({'error': resultado.get('mensaje', 'Error al eliminar cargo')}), 500

    return jsonify({'mensaje': 'Cargo eliminado correctamente'}), 200
