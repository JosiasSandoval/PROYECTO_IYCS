from flask import Blueprint, request, jsonify
from app.tipo_documento.controlador_tipo_documento import (
    listar_tipo_documento,
    cambiar_estado_tipo_documento,
    agregar_tipo_documento,
    actualizar_tipo_documento,
    obtener_tipo_documento,
    eliminar_tipo_documento,
    verificar_relacion_tipo_documento
)

tipoDocumento_bp = Blueprint('tipoDocumento', __name__)

# ✅ Listar tipos de documento
@tipoDocumento_bp.route('/', methods=['GET'])
def get_tipos_documento():
    documentos = listar_tipo_documento()
    return jsonify(documentos), 200

# ✅ Agregar nuevo tipo de documento
@tipoDocumento_bp.route('/agregar', methods=['POST'])
def agregar_tipo():
    datos = request.get_json()
    nombre = datos.get('nombre')
    abreviatura = datos.get('abreviatura')

    if not nombre or not abreviatura:
        return jsonify({'error': 'Faltan datos'}), 400

    agregar_tipo_documento(nombre, abreviatura)
    return jsonify({'mensaje': 'Registro exitoso'}), 201


# ✅ Actualizar tipo de documento
@tipoDocumento_bp.route('/actualizar/<int:id>', methods=['PUT'])
def actualizar_tipo(id):
    datos = request.get_json()
    nombre = datos.get('nombre')
    abreviatura = datos.get('abreviatura')

    if not nombre or not abreviatura:
        return jsonify({'error': 'Faltan datos'}), 400

    actualizar_tipo_documento(id, nombre, abreviatura)
    return jsonify({'mensaje': 'Actualización exitosa'}), 200


# ✅ Cambiar estado (activo/inactivo)
@tipoDocumento_bp.route('/cambiar_estado/<int:id>', methods=['PUT'])
def cambiar_estado(id):
    resultado = cambiar_estado_tipo_documento(id)

    if not resultado['ok']:
        return jsonify({'error': resultado['mensaje']}), 404

    return jsonify({
        'mensaje': resultado['mensaje'],
        'nuevo_estado': resultado['nuevo_estado']
    }), 200


# ✅ Buscar por nombre o abreviatura
@tipoDocumento_bp.route('/busqueda_documento/<string:busqueda>', methods=['GET'])
def busqueda_documento(busqueda):
    documento = obtener_tipo_documento(busqueda)

    if not documento:
        return jsonify({'error': 'Documento no encontrado'}), 404

    return jsonify(documento), 200

#Eliminar tipo de documento
@tipoDocumento_bp.route('/eliminar/<int:id>',methods=['DELETE'])
def eliminar_tipo(id):
    numero=verificar_relacion_tipo_documento(id)
    if numero>0:
        return jsonify({'error': 'No se puede eliminar el tipo de documento porque está relacionado con otras tablas. Por favor, revise las dependencias.'}),409
    else:
        try:
            eliminar_tipo_documento(id)
            return jsonify({'mensaje':'Tipo de documento eliminado correctamente'}),200
        except Exception as e:
            return jsonify({'error':f'Error al eliminar el tipo de documento: {str(e)}'}),500