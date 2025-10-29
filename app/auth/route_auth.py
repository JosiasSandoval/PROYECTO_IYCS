from flask import Blueprint, request, jsonify, abort, g, redirect, url_for,session,render_template
from app.auth.controlador_auth import registrar_usuario_y_feligres, verificar_usuario

auth_bp=Blueprint('auth',__name__)

@auth_bp.route('/verificar_usuario', methods=['POST'])
def get_verificar_usuario():
    # Intentamos obtener JSON del request
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "No se recibió información válida."}), 400

    email = data.get('email')
    clave = data.get('clave')

    if not email or not clave:
        return jsonify({"success": False, "error": "Debe ingresar email y contraseña."}), 400

    try:
        # Verificamos usuario en la base de datos
        id_usuario = verificar_usuario(email, clave)

        if id_usuario:
            # Guardamos idUsuario en sesión
            session['idUsuario'] = id_usuario
            return jsonify({"success": True, "idUsuario": id_usuario})
        else:
            return jsonify({"success": False, "error": "Email o contraseña incorrectos."}), 401

    except Exception as e:
        # Imprimimos error en consola para depuración
        print(f"Error al verificar usuario: {e}")
        return jsonify({"success": False, "error": "Error interno del servidor."}), 500


# ================= DASHBOARD =================
@auth_bp.route('/dashboard')
def dashboard():
    if 'idUsuario' not in session:
        return redirect(url_for('iniciar_sesion'))  # Redirige si no hay sesión
    return render_template('principal.html')

# ================= LOGOUT =================
@auth_bp.route('/logout')
def logout():
    session.pop('idUsuario', None)  # Eliminamos sesión
    return redirect(url_for('auth_bp.iniciar_sesion'))

# ================= REGISTRO FELIGRES =================
@auth_bp.route('/registrar_feligres', methods=['POST'])
def registrar_feligres():
    documento = request.form.get('documento')
    nombres = request.form.get('nombre')
    apePaterno = request.form.get('apePaterno')
    apeMaterno = request.form.get('apeMaterno')
    f_nacimiento = request.form.get('fecha')
    sexo = request.form.get('sexo')
    telefono = request.form.get('telefono')
    direccion = request.form.get('direccion')
    tipo_documento = request.form.get('tipo-doc')
    email = request.form.get('email')
    clave = request.form.get('contraseña')

    # Validación de campos obligatorios
    campos = [documento, nombres, apePaterno, apeMaterno, f_nacimiento, sexo, telefono, direccion, tipo_documento, email, clave]
    if not all(campo and campo.strip() for campo in campos):
        return jsonify({"error": "Faltan campos obligatorios en la solicitud."}), 400

    try:
        # Convertir tipo_documento a int si es posible
        try:
            id_tipo_documento = int(tipo_documento)
        except (ValueError, TypeError):
            id_tipo_documento = None

        sexo_letra = sexo[0].upper() if sexo else ''

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
            print("Error BD:", error)
            return jsonify({"error": "Error interno del servidor. Revisar logs de BD."}), 500

    except Exception as e:
        print("Error general:", e)
        return jsonify({"error": "Error interno del servidor. Revisar logs de BD."}), 500