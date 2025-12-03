from flask import Blueprint, request, jsonify, session
from app.acto_parroquia.controlador_acto_parroquia import (
    listar_acto_parroquia, agregar_acto_parroquia, 
    actualizar_acto_parroquia, eliminar_acto_parroquia, 
    obtener_combos_ap
)

acto_parroquia_bp = Blueprint('acto_parroquia', __name__)

@acto_parroquia_bp.route('/', methods=['GET'])
def listar():
    id_usuario = session.get('idUsuario')
    rol = session.get('rol_sistema')
    es_admin_global = session.get('es_admin_global', False)
    idParroquia = session.get('idParroquia')
    if not id_usuario: return jsonify({'error': 'No autorizado'}), 401
    datos = listar_acto_parroquia(id_usuario, rol, es_admin_global, idParroquia)
    return jsonify(datos), 200

@acto_parroquia_bp.route('/guardar', methods=['POST'])
def guardar():
    d = request.get_json()
    es_admin_global = session.get('es_admin_global', False)
    idParroquia = session.get('idParroquia')
    
    # Si el admin no es global, solo puede agregar a su parroquia
    if not es_admin_global and idParroquia:
        if int(d['idParroquia']) != int(idParroquia):
            return jsonify({'error': 'No tiene permisos para agregar actos en otras parroquias'}), 403
    
    ok, msg = agregar_acto_parroquia(d['idActo'], d['idParroquia'], d['dia'], d['hora'], d['costo'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@acto_parroquia_bp.route('/actualizar/<int:id>', methods=['PUT'])
def actualizar(id):
    d = request.get_json()
    es_admin_global = session.get('es_admin_global', False)
    idParroquia = session.get('idParroquia')
    
    # Si el admin no es global, validar que solo pueda actualizar su parroquia
    if not es_admin_global and idParroquia:
        # Verificar que el acto_parroquia pertenezca a su parroquia
        from app.bd_sistema import obtener_conexion
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("SELECT idParroquia FROM ACTO_PARROQUIA WHERE idActoParroquia = %s", (id,))
            resultado = cursor.fetchone()
            if resultado and int(resultado[0]) != int(idParroquia):
                conexion.close()
                return jsonify({'error': 'No tiene permisos para actualizar actos de otras parroquias'}), 403
        conexion.close()
        
        # También validar que el nuevo idParroquia sea el mismo
        if int(d['idParroquia']) != int(idParroquia):
            return jsonify({'error': 'No puede cambiar la parroquia del acto'}), 403
    
    ok, msg = actualizar_acto_parroquia(id, d['idActo'], d['idParroquia'], d['dia'], d['hora'], d['costo'])
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@acto_parroquia_bp.route('/eliminar/<int:id>', methods=['DELETE'])
def eliminar(id):
    es_admin_global = session.get('es_admin_global', False)
    idParroquia = session.get('idParroquia')
    
    # Si el admin no es global, validar que solo pueda eliminar de su parroquia
    if not es_admin_global and idParroquia:
        from app.bd_sistema import obtener_conexion
        conexion = obtener_conexion()
        with conexion.cursor() as cursor:
            cursor.execute("SELECT idParroquia FROM ACTO_PARROQUIA WHERE idActoParroquia = %s", (id,))
            resultado = cursor.fetchone()
            if resultado and int(resultado[0]) != int(idParroquia):
                conexion.close()
                return jsonify({'error': 'No tiene permisos para eliminar actos de otras parroquias'}), 403
        conexion.close()
    
    ok, msg = eliminar_acto_parroquia(id)
    return jsonify({'mensaje': msg}) if ok else (jsonify({'error': msg}), 500)

@acto_parroquia_bp.route('/combos', methods=['GET'])
def combos():
    id_usuario = session.get('idUsuario')
    rol = session.get('rol_sistema')
    es_admin_global = session.get('es_admin_global', False)
    idParroquia = session.get('idParroquia')
    datos = obtener_combos_ap(id_usuario, rol, es_admin_global, idParroquia)
    return jsonify(datos), 200