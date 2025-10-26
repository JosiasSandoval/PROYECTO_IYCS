from flask import Blueprint, request, jsonify, redirect, url_for
from app.usuario.controlador_usuario import(
    verificar_usuario,
    get_usuario_feligres,
    get_usuario_personal,
    agregar_usuario_feligres,
    actualizar_usuario_feligres,
    eliminar_usuario_feligres,
    cambiar_estado_cuenta,
    verificar_relacion_feligres
)

usuario_bp = Blueprint('usuario', __name__)

@usuario_bp.route('/verificar_usuario', methods=['POST'])
def get_verificar_usuario():
    data = request.get_json()
    email = data.get('email')
    clave = data.get('clave')

    if not email or not clave:
        return jsonify({"error": "Debe ingresar email y contraseña."}), 400

    try:
        usuario_existe = verificar_usuario(email, clave)
        if usuario_existe:
            return redirect(url_for('principal'))
        else:
            return jsonify({"success": False, "error": "Email o contraseña incorrectos."}), 401
    except Exception as e:
        print(f"Error al verificar usuario: {e}")
        return jsonify({"success": False, "error": "Error interno del servidor."}), 500


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
