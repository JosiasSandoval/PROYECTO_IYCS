from flask import Blueprint, request, jsonify, abort, g, redirect, url_for
from app.auth.controlador_auth import registrar_usuario_y_feligres

auth_bp=Blueprint('auth',__name__)

@auth_bp.route('/registrar_feligres', methods=['POST'])
def registrar_feligres():
    documento = request.form.get('documento')
    nombres = request.form.get('nombre')
    apePaterno = request.form.get('apePaterno')
    apeMaterno = request.form.get('apeMaterno')
    f_nacimiento=request.form.get('fecha')
    sexo = request.form.get('sexo')
    telefono = request.form.get('telefono')
    direccion = request.form.get('direccion')
    tipo_documento = request.form.get('tipo-doc')
    email = request.form.get('email')
    clave = request.form.get('contraseña')

    if not all([nombres, apePaterno, apeMaterno, telefono, sexo, direccion, tipo_documento, documento, email, clave,f_nacimiento]):
        return jsonify({"error": "Faltan campos obligatorios en la solicitud."}), 400

    try:
        id_tipo_documento = tipo_documento if tipo_documento.isdigit() else None
        sexo_letra = sexo[0] if sexo else ''
        exito, error = registrar_usuario_y_feligres(
            documento,
            nombres,
            apePaterno,
            apeMaterno,
            f_nacimiento,
            sexo_letra,         
            direccion,
            telefono,
            id_tipo_documento,
            email,
            clave
        )
        if exito:
            return jsonify({"mensaje": "Registro exitoso"}), 200
        else:
            print("Error general:", error)
            return jsonify({"error": "Error interno del servidor. Revisar logs de BD."}), 500
    except Exception as e:
        print("Error general:", e)
        return jsonify({"error": "Error interno del servidor. Revisar logs de BD."}), 500
