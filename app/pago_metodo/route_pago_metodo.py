from flask import Blueprint, request, jsonify
from app.pago_metodo.controlador_pago_metodo import (
    listar_metodo_pago,
    agregar_metodo_pago,
    cambiar_estado_metodo_pago,
    eliminar_metodo_pago,
    actualizar_metodo_pago,
    verificar_relacion_metodo_pago
)

pago_bp= Blueprint('pago', __name__)



# ======================================================
# 🔹 LISTAR MÉTODOS DE PAGO
# ======================================================
@pago_metodo_bp.route('/metodo', methods=['GET'])
def listar():
    try:
        datos = listar_metodo_pago()
        return jsonify({'ok': True, 'datos': datos})
    except Exception as e:
        print(f'Error al listar métodos de pago: {e}')
        return jsonify({'ok': False, 'datos': [], 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 AGREGAR MÉTODO DE PAGO
# ======================================================
@pago_metodo_bp.route('/agregar_metodo', methods=['POST'])
def agregar():
    try:
        datos = request.get_json()
        resultado = agregar_metodo_pago(
            datos.get('nombMetodo')
        )
        if resultado:
            return jsonify({'ok': True, 'mensaje': 'Método de pago agregado correctamente'})
        else:
            return jsonify({'ok': False, 'mensaje': 'Error al agregar el método de pago'})
    except Exception as e:
        print(f'Error al agregar método de pago: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 CAMBIAR ESTADO DEL MÉTODO DE PAGO
# ======================================================
@pago_metodo_bp.route('/cambiar_estado_metodo/<int:idMetodo>', methods=['PUT'])
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
# 🔹 ACTUALIZAR MÉTODO DE PAGO
# ======================================================
@pago_metodo_bp.route('/actualizar_metodo/<int:idMetodo>', methods=['PUT'])
def actualizar(idMetodo):
    try:
        datos = request.get_json()
        resultado = actualizar_metodo_pago(
            idMetodo,
            datos.get('nombMetodo')
        )
        if resultado:
            return jsonify({'ok': True, 'mensaje': 'Método de pago actualizado correctamente'})
        else:
            return jsonify({'ok': False, 'mensaje': 'Error al actualizar el método de pago'})
    except Exception as e:
        print(f'Error al actualizar método de pago: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500


# ======================================================
# 🔹 ELIMINAR MÉTODO DE PAGO
# ======================================================
@pago_metodo_bp.route('/eliminar/<int:idMetodo>', methods=['DELETE'])
def eliminar(idMetodo):
    try:
        if verificar_relacion_metodo_pago(idMetodo):
            return jsonify({'ok': False, 'mensaje': 'No se puede eliminar el método de pago porque tiene registros asociados'})
        else:
            if eliminar_metodo_pago(idMetodo):
                return jsonify({'ok': True, 'mensaje': 'Método de pago eliminado correctamente'})
            else:
                return jsonify({'ok': False, 'mensaje': 'Error al eliminar el método de pago'})
    except Exception as e:
        print(f'Error al eliminar método de pago: {e}')
        return jsonify({'ok': False, 'mensaje': 'Error interno'}), 500
