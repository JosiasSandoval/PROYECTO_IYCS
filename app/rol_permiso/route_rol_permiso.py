from flask import Blueprint, render_template,request,jsonify
from app.rol_permiso.controlador_rol_permiso import (
    get_listar_rol,
    actualizar_rol,
    agregar_rol,
    busqueda_rol,
    cambiar_estado_rol,
    eliminar_rol,
    verificar_relacion_rol,
    get_listar_permiso,
    cambiar_estado_permiso,
    eliminar_permiso_revocado,
    agregar_rol_permiso,
    asignar_permiso_usuario,
    revocar_permiso_usuario
)

rol_bp=Blueprint('rol',__name__)
permiso_bp=Blueprint('permiso',__name__)

@rol_bp.route('/',methods=['GET'])
def listar_rol():
    try:
        busqueda=request.args.get('busqueda')
        if busqueda:
            datos=busqueda_rol(busqueda)
        else:
            datos=get_listar_rol()
        return jsonify({'datos':datos})
    except Exception as e:
        print(f'Error al listar los roles: {e}')
        return jsonify({'datos':[]}),500
    
@rol_bp.route('/agregar',methods=['POST'])
def agregar():
    try:
        datos=request.get_data({
            'nombRol':request.form.get('nombRol')
        })
        agregar_rol(datos.get('nombRol'))
        return jsonify({'ok':True,'mensaje':'Rol agregado correctamente'})
    except Exception as e:
        print(f'Error al agregar rol: {e}')
        return jsonify({'ok':False,'mensaje':'Error interno'}),500

@rol_bp.route('/actualizar/<int:idRol>',methods=['PUT'])
def actualizar(idRol):
    try:
        datos=request.get_json()
        actualizar_rol(
            idRol,
            datos.get('nombRol')
        )
        return jsonify({'ok':True,'mensaje':'Rol actualizado correctamente'})
    except Exception as e:
        print(f'Error al actualizar el rol:{e}')
        return jsonify({'ok':False,'mensaje':'Error interno'}),500

@rol_bp.route('/cambiar_estado/<int:idRol>',methods=['PUT'])
def cambiar_estado(idRol):
    resultado=cambiar_estado_rol(idRol)
    if resultado['ok']:
        return jsonify({
            'ok':True,
            'mensaje':'Estado cambiado correctamente',
            'nuevo_estado':resultado['nuevo_estado']
        })
    else:
        return jsonify({'ok':False,'mensaje':resultado['mensaje']}),400

@rol_bp.route('/eliminar/<int:idRol>',methods=['DELETE'])
def eliminar(idRol):
    numero=verificar_relacion_rol(idRol)
    if numero>0:
        return jsonify({'error':'No se puede eliminar el rol porque está relacionado con otras tablas'}),400
    else:
        eliminar_rol(idRol)
        return jsonify({'ok':True,'mensaje':'Rol eliminado correctamente'})

@permiso_bp.route('/',methods=['GET'])
def listar_permiso():
    resultados=get_listar_permiso()
    return jsonify(resultados),200

@permiso_bp.route('/',methods=['GET'])
def listar_permiso():
    try:
        datos=get_listar_permiso()
        return jsonify({'datos':datos})
    except Exception as e:
        print(f'Error al listar los permisos: {e}')
        return jsonify({'datos':[]}),500

@permiso_bp.route('/cambiar_estado/<int:idPermiso>/<int:idUsuario>',methods=['PUT'])
def cambiar_estado_permiso_usuario(idPermiso,idUsuario):
    resultado=cambiar_estado_permiso(idPermiso,idUsuario)
    if resultado['ok']:
        return jsonify({
            'ok':True,
            'mensaje':'Estado cambiado correctamente',
            'nuevo_estado':resultado['nuevo_estado']
        })
    else:
        return jsonify({'ok':False,'mensaje':resultado['mensaje']}),400

@permiso_bp.route('/eliminar_permiso/<int:idPermiso>/<int:idUsuario>',methods=['DELETE'])
def eliminar_permiso_usuario(idPermiso,idUsuario):
    resultado=eliminar_permiso_revocado(idUsuario,idPermiso)
    if resultado['ok']:
        return jsonify({
            'ok':True,
            'mensaje':'Permiso revocado correctamente'
        })
    else:
        return jsonify({'error':'No se puede eliminar el permiso revocado al usuario'}),400

@permiso_bp.route('/agregar_rol_permiso',methods=['POST'])
def agregar_rol_permiso_usuario():
    try:
        datos=request.get_json()
        agregar_rol_permiso(
            datos.get('idRol'),
            datos.get('idPermiso')
        )
        return jsonify({'ok':True,'mensaje':'Permiso asignado correctamente'})
    except Exception as e:
        print(f'Error al agregar permiso al usuario: {e}')
        return jsonify({'ok':False,'mensaje':'Error interno'}),500

@permiso_bp.route('/asignar_permiso_usuario',methods=['POST'])
def asignar_permiso_usuario_rol():
    try:
        datos=request.get_json()
        asignar_permiso_usuario(
            datos.get('idUsuario'),
            datos.get('idPermiso')
        )
        return jsonify({'ok':True,'mensaje':'Permiso asignado correctamente'})
    except Exception as e:
        print(f'Error al agregar permiso al usuario: {e}')
        return jsonify({'ok':False,'mensaje':'Error interno'}),500

@permiso_bp.route('/revocar_permiso_usuario',methods=['POST'])
def revocar_permiso_usuario_rol():
    try:
        datos=request.get_json()
        revocar_permiso_usuario(
            datos.get('idUsuario'),
            datos.get('idPermiso')
        )
        return jsonify({'ok':True,'mensaje':'Permiso revocado correctamente'})
    except Exception as e:
        print(f'Error al agregar permiso al usuario: {e}')
        return jsonify({'ok':False,'mensaje':'Error interno'}),500


