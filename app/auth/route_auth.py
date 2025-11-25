from flask import Blueprint, request, jsonify, session, redirect, url_for, flash
from app.auth.controlador_auth import registrar_feligres, autenticar_usuario

auth_bp = Blueprint('auth', __name__)

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
        return jsonify({"success": False, "error": "Debe ingresar email y contraseña."}), 400

    # Llamada al controlador unificado
    resultado_auth = autenticar_usuario(email, clave)

    if resultado_auth and resultado_auth['success']:
        # --- GESTIÓN DE SESIÓN ---
        session.clear() # Limpiamos cualquier sesión residual
        session['logged_in'] = True
        
        # Guardamos datos básicos para visualización (Header)
        session['idUsuario'] = resultado_auth['idUsuario']
        session['email'] = resultado_auth['email']
        session['nombre_usuario'] = resultado_auth['nombre_usuario']
        session['cargo_usuario'] = resultado_auth['cargo_usuario']
        
        # Guardamos datos técnicos para lógica de negocio (Reservas, Permisos)
        session['rol_sistema'] = resultado_auth['rol_sistema']
        session['idFeligres'] = resultado_auth.get('idFeligres')
        session['idPersonal'] = resultado_auth.get('idPersonal')
        session['idParroquia'] = resultado_auth.get('idParroquia') # Útil para el insert de reservas

        return jsonify({
            "success": True, 
            "mensaje": "Autenticación exitosa",
            "redirect": url_for('auth.dashboard') # Opcional: URL a donde ir
        })
    else:
        return jsonify({"success": False, "error": "Email o contraseña incorrectos."}), 401


# ============================================================
# 2. REGISTRO DE FELIGRÉS
# ============================================================
@auth_bp.route('/registrar_feligres', methods=['POST'])
def registro():
    data = request.form
    
    # Validación de campos obligatorios
    campos_obligatorios = ['email', 'contraseña', 'nombre', 'documento']
    if not all(data.get(c) for c in campos_obligatorios):
        return jsonify({"error": "Faltan campos obligatorios."}), 400

    try:
        # ---------------------------
        # SEXO: tomar inicial M / F
        # ---------------------------
        sexo_input = data.get('sexo')  # "Masculino" / "Femenino"
        sexo_letra = sexo_input[0].upper() if sexo_input else None

        # ---------------------------
        # Tipo de documento
        # ---------------------------
        try:
            id_tipo_doc = int(data.get('tipo-doc'))
        except (ValueError, TypeError):
            id_tipo_doc = None

        # ---------------------------
        # Enviar datos al controlador
        # ---------------------------
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

            # Error por duplicado (correo o documento)
            if "Duplicate" in msg_error or "Unique" in msg_error:
                return jsonify({"error": "El correo o documento ya están registrados."}), 409
            
            return jsonify({"error": f"Error al registrar: {msg_error}"}), 500

    except Exception as e:
        print(f"Error crítico en ruta registro: {e}")
        return jsonify({"error": "Error interno del servidor."}), 500

# ============================================================
# 3. DATOS DE SESIÓN (API PARA HEADER.JS)
# ============================================================
@auth_bp.route('/get_session_data')
def get_session_data():
    """
    Devuelve JSON con nombre y cargo para pintar el header dinámicamente.
    """
    if session.get('logged_in'):
        return jsonify({
            "success": True,
            "nombre": session.get('nombre_usuario', 'Usuario'),
            "cargo": session.get('cargo_usuario', 'Feligrés'),
            "idUsuario": session.get('idUsuario')
        })
    else:
        return jsonify({
            "success": False,
            "nombre": "Visitante",
            "cargo": "Invitado"
        }), 200 # Devolvemos 200 para que el JS no falle, simplemente muestra "Visitante"


# ============================================================
# 4. LOGOUT (CERRAR SESIÓN)
# ============================================================
@auth_bp.route('/cerrar_sesion')
def logout():
    session.clear()
    flash('Has cerrado sesión correctamente.', 'info')
    # Redirigir al login (asumiendo que tienes una ruta 'login_page' o similar)
    # Si tu ruta de vista login se llama diferente, ajusta 'iniciar_sesion'
    return redirect(url_for('iniciar_sesion')) 


# ============================================================
# 5. DASHBOARD (EJEMPLO DE RUTA PROTEGIDA)
# ============================================================
@auth_bp.route('/dashboard')
def dashboard():
    if not session.get('logged_in'):
        return redirect(url_for('iniciar_sesion'))
    
    # Aquí puedes pasar datos extra a la plantilla usando la sesión
    return f"Bienvenido al Dashboard, {session.get('nombre_usuario')}"
