from flask import Blueprint, request, jsonify, redirect, url_for, session, render_template
from app.usuario.controlador_usuario import(
    get_usuario_feligres,
    agregar_usuario_feligres,
    actualizar_usuario_feligres,
    eliminar_usuario_feligres,
    cambiar_estado_cuenta,
    verificar_relacion_feligres,
    obtener_feligres_por_id
)

from app.usuario.controlador_personal import(
    get_datos_personal,
    actualizar_usuario_personal,
    agregar_usuario_personal,
    verificar_relacion_personal,
    eliminar_usuario_personal
)

usuario_bp = Blueprint('usuario', __name__)
#USUARIO- FELIRGRES

@usuario_bp.route('/feligres', methods=['GET'])
def listar_usuarios_feligres():
    datos = get_usuario_feligres()
    usuarios = []

    for u in datos:
        nombreCompleto = f"{u['nombPers']} {u['apePatPers']} {u['apeMatPers']}"
        usuarios.append({
            'id': u['id'],
            'nombreCompleto': nombreCompleto,
            'numDocFel': u['numDocPers'],
            'email': u['email'],
            'clave': u['clave'],
            'estado': u['estadoCuenta'],
            'f_nacimiento': u['f_nacimiento'].strftime("%Y-%m-%d") if u['f_nacimiento'] else None,
            'sexoPers': u['sexoPers'],
            'direccionPers': u['direccionPers'],
            'telefonoPers': u['telefonoPers'],
            'nombDocumento': u['nombDocumento']
        })
    
    return jsonify({'datos': usuarios})


@usuario_bp.route('/agregar_feligres', methods=['POST'])
def agregar_feligres():
    data = request.get_json()

    email = data.get('email')
    clave = data.get('clave')
    numDocFel = data.get('numDocFel')
    nombFel = data.get('nombFel')
    apePatFel = data.get('apePatFel')
    apeMatFel = data.get('apeMatFel')
    f_nacimiento = data.get('f_nacimiento')
    sexoFel = data.get('sexoFel')
    direccionFel = data.get('direccionFel')
    telefonoFel = data.get('telefonoFel')
    idRol = int(data.get('idRol', 0))
    idTipoDocumento = data.get('idTipoDocumento')  # Ya es string

    resultado = agregar_usuario_feligres(
        email, clave, numDocFel, nombFel, apePatFel, apeMatFel,
        f_nacimiento, sexoFel, direccionFel, telefonoFel,
        idRol, idTipoDocumento
    )

    return jsonify(resultado), 200 if resultado['ok'] else 400


@usuario_bp.route('/actualizar_feligres/<int:id>', methods=['PUT'])
def actualizar_feligres(id):
    data = request.get_json()

    email = data.get('email')
    clave = data.get('clave')
    numDocFel = data.get('numDocFel')
    nombFel = data.get('nombFel')
    apePatFel = data.get('apePatFel')
    apeMatFel = data.get('apeMatFel')
    f_nacimiento = data.get('f_nacimiento')
    sexoFel = data.get('sexoFel')
    direccionFel = data.get('direccionFel')
    telefonoFel = data.get('telefonoFel')
    idRol = int(data.get('idRol', 0))
    idTipoDocumento = data.get('idTipoDocumento')  # Ya es string


    resultado = actualizar_usuario_feligres(
        email, clave, numDocFel, nombFel, apePatFel, apeMatFel,
        f_nacimiento, sexoFel, direccionFel, telefonoFel,
        idRol, idTipoDocumento, id
    )

    return jsonify(resultado), 200 if resultado['ok'] else 400


@usuario_bp.route('/eliminar_feligres/<int:id>', methods=['DELETE'])
def eliminar_feligres(id):
    try:
        tiene_relaciones = verificar_relacion_feligres(id)
        if tiene_relaciones:
            return jsonify({
                'ok': False,
                'mensaje': 'No se puede eliminar el feligres porque está relacionado con otras tablas'
            }), 400
        
        resultado = eliminar_usuario_feligres(id)
        return jsonify(resultado), 200 if resultado['ok'] else 400
    except Exception as e:
        print(f'Error al eliminar feligres: {e}')
        return jsonify({'ok': False, 'mensaje': f'Error al eliminar feligres: {str(e)}'}), 500


@usuario_bp.route('/cambiar_estado_cuenta/<int:id>', methods=['PUT'])
def cambiar_estado_cuenta_usuario(id):
    resultado = cambiar_estado_cuenta(id)
    if resultado['ok']:
        return jsonify({
            'ok': True,
            'mensaje': resultado['mensaje']
        }), 200
    else:
        return jsonify({'ok': False, 'mensaje': resultado['mensaje']}), 400

@usuario_bp.route('/personal',methods=['GET'])
def listar_personal():
    datos=get_datos_personal()
    return jsonify({'datos':datos})

@usuario_bp.route('/agregar_personal',methods=['POST'])
def agregar_personal():
    data=request.get_json()
    email=data.get('email')
    clave=data.get('clave')
    numDocPers=data.get('numDocPers')
    nombre=data.get('nombre')
    apePaterno=data.get('apePaterno')
    apeMaterno=data.get('apeMaterno')
    sexo=data.get('sexo')
    direccion=data.get('direccion')
    telefono=data.get('telefono')
    tipoDocumento=data.get('tipoDocumento')
    cargo=data.get('cargo')
    parroquia=data.get('parroquia')
    roles=data.get('roles')
    finicio=data.get('finicio')
    f_fin=data.get('f_fin')
    resultado=agregar_usuario_personal(email,clave,numDocPers,nombre,apePaterno,apeMaterno,sexo,direccion,telefono,tipoDocumento,cargo,parroquia,roles,finicio,f_fin)
    return jsonify(resultado),200 if resultado['ok'] else 400

@usuario_bp.route('/actualizar_personal/<int:id>',methods=['PUT'])
def actualizar_personal(id):
    data=request.get_json()
    email=data.get('email')
    clave=data.get('clave')
    numDocPers=data.get('numDocPers')
    nombre=data.get('nombre')
    apePaterno=data.get('apePaterno')
    apeMaterno=data.get('apeMaterno')
    sexo=data.get('sexo')
    direccion=data.get('direccion')
    telefono=data.get('telefono')
    tipoDocumento=data.get('tipoDocumento')
    cargo=data.get('cargo')
    parroquia=data.get('parroquia')
    roles=data.get('roles')
    finicio=data.get('finicio')
    f_fin=data.get('f_fin')
    resultado=actualizar_usuario_personal(id,email,clave,numDocPers,nombre,apePaterno,apeMaterno,sexo,direccion,telefono,tipoDocumento,cargo,parroquia,roles,finicio,f_fin)
    return jsonify(resultado),200 if resultado['ok'] else 400

@usuario_bp.route('/eliminar_personal/<int:id>', methods=['DELETE'])
def eliminar_personal(id):
    try:
        rel = verificar_relacion_personal(id)

        if not rel["ok"]:
            return jsonify(rel), 500  # Error interno en la verificación

        if rel["bloqueado"]:
            return jsonify({
                "ok": False,
                "mensaje": "No se puede eliminar el personal porque tiene relaciones activas",
                "relaciones": rel["relaciones"]
            }), 400

        resultado = eliminar_usuario_personal(id)

        if resultado.get("ok"):
            return jsonify({
                "ok": True,
                "mensaje": "Personal eliminado correctamente"
            }), 200
        else:
            return jsonify({
                "ok": False,
                "mensaje": "No se pudo eliminar el personal"
            }), 400

    except Exception as e:
        print(f"Error en eliminar_personal: {e}")
        return jsonify({
            "ok": False,
            "mensaje": str(e)
        }), 500
    

@usuario_bp.route('/perfil', methods=['GET'])
def vista_perfil_usuario():
    id_usuario = session.get('idUsuario') 
    
    if not id_usuario:
        return redirect(url_for('auth.login')) 
    return render_template('perfil.html', id_usuario_logueado=id_usuario)

# En router.py, cerca de la línea 235
@usuario_bp.route('/api/perfil/datos', methods=['GET'])
def obtener_datos_perfil():

    from flask import session 
    id_usuario = session.get('idUsuario')
    
    if not id_usuario:
        return jsonify({"ok": False, "mensaje": "Usuario no autenticado"}), 401
    
    datos_feligres = obtener_feligres_por_id(id_usuario)
    
    if datos_feligres:
        return jsonify({"ok": True, "datos": datos_feligres}), 200
    else:
        # Puede ser un 404 si el usuario existe pero no está en la tabla feligres
        return jsonify({"ok": False, "mensaje": "Datos de feligrés no encontrados o error interno."}), 404