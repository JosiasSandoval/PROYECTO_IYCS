from flask import Blueprint, request, jsonify, redirect, url_for
from app.usuario.controlador_usuario import(
    verificar_usuario
)

usuario_bp = Blueprint('usuario', __name__)

@usuario_bp.route('/verificar_usuario', methods=['POST'])
def get_verificar_usuario():
    email = request.form.get('email')
    clave = request.form.get('clave')

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
