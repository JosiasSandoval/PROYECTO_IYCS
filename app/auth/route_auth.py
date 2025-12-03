from flask import Blueprint, request, jsonify, session, redirect, url_for, flash
from app.auth.controlador_auth import registrar_feligres, autenticar_usuario, verificar_email_existe, cambiar_contrasena
import random
import string

auth_bp = Blueprint('auth', __name__)

# Almacenamiento temporal de códigos de recuperación (en producción usar Redis o base de datos)
codigos_recuperacion = {}

# ============================================================
# 1. LOGIN (VERIFICAR USUARIO)
# ============================================================
@auth_bp.route('/verificar_usuario', methods=['POST'])
def login():
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "error": "No se recibió información válida."}), 400

    email = data.get('email')
    clave = data.get('clave')

    if not email or not clave:
        return jsonify({"success": False, "error": "Debe ingresar correo electrónico y contraseña."}), 400

    resultado_auth = autenticar_usuario(email, clave)

    if resultado_auth and resultado_auth['success']:
        session.clear()
        session['logged_in'] = True
        session['idUsuario'] = resultado_auth['idUsuario']
        session['email'] = resultado_auth['email']
        session['nombre_usuario'] = resultado_auth['nombre_usuario']
        session['nombre'] = resultado_auth.get('nombre', '')
        session['apellidoPaterno'] = resultado_auth.get('apellidoPaterno', '')
        session['apellidoMaterno'] = resultado_auth.get('apellidoMaterno', '')
        session['cargo_usuario'] = resultado_auth['cargo_usuario']
        session['rol_sistema'] = resultado_auth['rol_sistema']
        session['roles_disponibles'] = resultado_auth.get('roles_disponibles', [])
        session['idFeligres'] = resultado_auth.get('idFeligres')
        session['idPersonal'] = resultado_auth.get('idPersonal')
        session['idParroquia'] = resultado_auth.get('idParroquia')

        return jsonify({
            "success": True,
            "mensaje": "Autenticación exitosa",
            "redirect": url_for('auth.dashboard')
        })
    else:
        return jsonify({"success": False, "error": "Correo electrónico o contraseña incorrectos. Por favor, intente nuevamente."}), 401


# ============================================================
# 2. CAMBIAR ROL
# ============================================================
@auth_bp.route('/cambiar_rol', methods=['POST'])
def cambiar_rol():
    if not session.get('logged_in'):
        return jsonify({"success": False, "error": "No está logueado"}), 401

    data = request.get_json()
    nuevo_rol = data.get('rol')

    roles_disponibles = session.get('roles_disponibles', [])
    if nuevo_rol not in roles_disponibles:
        return jsonify({"success": False, "error": "Rol no permitido"}), 403

    session['rol_sistema'] = nuevo_rol
    return jsonify({"success": True, "mensaje": f"Rol cambiado a {nuevo_rol}"})


# ============================================================
# 3. REGISTRO DE FELIGRÉS
# ============================================================
@auth_bp.route('/registrar_feligres', methods=['POST'])
def registro():
    data = request.form
    campos_obligatorios = ['email', 'contraseña', 'nombre', 'documento']
    if not all(data.get(c) for c in campos_obligatorios):
        return jsonify({"error": "Faltan campos obligatorios."}), 400

    try:
        sexo_input = data.get('sexo')
        sexo_letra = sexo_input[0].upper() if sexo_input else None

        try:
            id_tipo_doc = int(data.get('tipo-doc'))
        except (ValueError, TypeError):
            id_tipo_doc = None

        exito, error = registrar_feligres(
            nombFel=data.get('nombre'),
            apePaFel=data.get('apePaterno'),
            apeMaFel=data.get('apeMaterno'),
            numDocFel=data.get('documento'),
            f_nacimiento=data.get('fecha'),
            sexoFel=sexo_letra,
            direccionFel=data.get('direccion'),
            telefonoFel=data.get('telefono'),
            idTipoDocumento=id_tipo_doc,
            email=data.get('email'),
            clave=data.get('contraseña')
        )

        if exito:
            return jsonify({"mensaje": "Registro exitoso"}), 201
        else:
            msg_error = str(error)
            if "Duplicate" in msg_error or "Unique" in msg_error:
                return jsonify({"error": "El correo o documento ya están registrados."}), 409
            return jsonify({"error": f"Error al registrar: {msg_error}"}), 500

    except Exception as e:
        print(f"Error crítico en ruta registro: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500


# ============================================================
# 4. DATOS DE SESIÓN (API PARA HEADER.JS)
# ============================================================
@auth_bp.route('/get_session_data')
def get_session_data():
    if session.get('logged_in'):
        roles = session.get('roles_disponibles', [session.get('rol_sistema')])
        return jsonify({
            "success": True,
            "nombre": session.get('nombre_usuario', 'Usuario'),
            "cargo": session.get('cargo_usuario', 'Feligrés'),
            "rol_actual": session.get('rol_sistema'),
            "roles_disponibles": roles
        })
    else:
        return jsonify({
            "success": False,
            "nombre": "Visitante",
            "cargo": "Invitado"
        }), 200


# ============================================================
# 5. LOGOUT (CERRAR SESIÓN)
# ============================================================
@auth_bp.route('/cerrar_sesion', methods=['GET'])
def logout_route():
    session.clear()
    return jsonify({"success": True, "mensaje": "Sesión cerrada"})


# ============================================================
# 6. DASHBOARD (RUTA PROTEGIDA)
# ============================================================
@auth_bp.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('auth.login'))
    return f"Bienvenido al Dashboard, {session.get('nombre_usuario')}"


# ============================================================
# 7. RECUPERACIÓN DE CONTRASEÑA - GENERAR CÓDIGO
# ============================================================
@auth_bp.route('/recuperar_contrasena/verificar_email', methods=['POST'])
def verificar_email_recuperacion():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"success": False, "error": "Debe ingresar un correo electrónico."}), 400

    # Verificar si el email existe
    id_usuario = verificar_email_existe(email)

    if id_usuario:
        # Generar código aleatorio de 6 caracteres
        codigo = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
        
        # Guardar el código asociado al email (en producción, usar base de datos o Redis con expiración)
        codigos_recuperacion[email] = codigo

        return jsonify({
            "success": True,
            "mensaje": "Código generado correctamente",
            "codigo": codigo  # En producción, esto se enviaría por email, no se devolvería
        })
    else:
        # Por seguridad, no revelamos si el email existe o no
        return jsonify({
            "success": True,
            "mensaje": "Si el correo existe, recibirás un código de recuperación"
        })


# ============================================================
# 8. RECUPERACIÓN DE CONTRASEÑA - VALIDAR CÓDIGO
# ============================================================
@auth_bp.route('/recuperar_contrasena/validar_codigo', methods=['POST'])
def validar_codigo_recuperacion():
    data = request.get_json()
    email = data.get('email')
    codigo_ingresado = data.get('codigo')

    if not email or not codigo_ingresado:
        return jsonify({"success": False, "error": "Faltan datos requeridos."}), 400

    # Verificar el código
    codigo_correcto = codigos_recuperacion.get(email)

    if codigo_correcto and codigo_correcto == codigo_ingresado.upper():
        return jsonify({
            "success": True,
            "mensaje": "Código válido. Puede cambiar su contraseña."
        })
    else:
        return jsonify({
            "success": False,
            "error": "Código incorrecto. Por favor, verifique e intente nuevamente."
        }), 401


# ============================================================
# 9. RECUPERACIÓN DE CONTRASEÑA - CAMBIAR CONTRASEÑA
# ============================================================
@auth_bp.route('/recuperar_contrasena/cambiar_contrasena', methods=['POST'])
def cambiar_contrasena_recuperacion():
    data = request.get_json()
    email = data.get('email')
    codigo = data.get('codigo')
    nueva_contrasena = data.get('nueva_contrasena')

    if not email or not codigo or not nueva_contrasena:
        return jsonify({"success": False, "error": "Faltan datos requeridos."}), 400

    # Verificar el código nuevamente
    codigo_correcto = codigos_recuperacion.get(email)

    if not codigo_correcto or codigo_correcto != codigo.upper():
        return jsonify({
            "success": False,
            "error": "Código inválido o expirado."
        }), 401

    # Cambiar la contraseña
    exito, error = cambiar_contrasena(email, nueva_contrasena)

    if exito:
        # Eliminar el código usado
        del codigos_recuperacion[email]
        
        return jsonify({
            "success": True,
            "mensaje": "Contraseña cambiada exitosamente."
        })
    else:
        return jsonify({
            "success": False,
            "error": f"Error al cambiar la contraseña: {error}"
        }), 500
