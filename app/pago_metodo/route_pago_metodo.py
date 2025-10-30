from flask import Blueprint, request, jsonify
from app.pago_metodo.controlador_pago_metodo import (
    listar_metodo_pago,
    agregar_metodo_pago,
    cambiar_estado_metodo_pago,
    eliminar_metodo_pago,
    actualizar_metodo_pago,
    verificar_relacion_metodo_pago
)

pago_metodo_bp= Blueprint('pago', __name__)



# ======================================================
# 🔹 LISTAR METODO PAGO
# ======================================================
@pago_bp.route('/metodo', methods=['GET'])
def listar():
    try:
        datos = listar_metodo_pago()
        return jsonify({'ok': True, 'datos': datos})
    except Exception as e:
        print(f'Error al listar parroquias: {e}')
        return jsonify({'ok': False, 'datos': [], 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 AGREGAR PARROQUIA
# ======================================================
@pago_bp.route('/agregar_metodo', methods=['POST'])
def agregar():
    try:
        datos = request.get_json()
        resultado = agregar_metodo_pago(
            datos.get('nombMetodo')
        )
        if resultado:
            return jsonify({'ok': True, 'mensaje': 'Parroquia agregada correctamente'})
        else:
            return jsonify({'ok': False, 'mensaje': 'Error al agregar la parroquia'})
    except Exception as e:
        print(f'Error al agregar parroquia: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# CAMBIAR ESTADO DE METODO PAGO
# ======================================================
@pago_bp.route('/cambiar_estado_metodo/<int:idMetodo>', methods=['PUT'])
def cambiar_estado(idMetodo):
    resultado = cambiar_estado_metodo_pago(idMetodo)
    if resultado['ok']:
        return jsonify({
            'ok': True,
            'mensaje': 'Estado cambiado correctamente',
            'nuevo_estado': resultado['nuevo_estado']
        })
    else:
        return jsonify({'ok': False, 'mensaje': resultado['mensaje']}), 400


# ======================================================
# 🔹 ACTUALIZAR PARROQUIA
# ======================================================
@pago_bp.route('/actualizar_metodo/<int:idMetodo>', methods=['PUT'])
def actualizar(idMetodo):
    try:
        datos = request.get_json()
        resultado = actualizar_metodo_pago(
            idMetodo,
            datos.get('nombMetodo')
        )
        if resultado:
            return jsonify({'ok': True, 'mensaje': 'Parroquia actualizada correctamente'})
        else:
            return jsonify({'ok': False, 'mensaje': 'Error al actualizar la parroquia'})
    except Exception as e:
        print(f'Error al actualizar parroquia: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 ELIMINAR PARROQUIA
# ======================================================
@pago_bp.route('/eliminar/<int:idMetodo>', methods=['DELETE'])
def eliminar(idMetodo):
    try:
        if verificar_relacion_metodo_pago(idMetodo):
            return jsonify({'ok': False, 'mensaje': 'No se puede eliminar la parroquia porque tiene registros asociados'})
        else:
            if eliminar_metodo_pago(idMetodo):
                return jsonify({'ok': True, 'mensaje': 'Parroquia eliminada correctamente'})
            else:
                return jsonify({'ok': False, 'mensaje': 'Error al eliminar la parroquia'})
    except Exception as e:
        print(f'Error al eliminar parroquia: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500
