from flask import Blueprint, request, jsonify, abort, g, redirect, url_for
from app.auth.controlador_auth import(
    registrar_usuario_feligres
)

auth_bp=Blueprint('auth',__name__)

@auth_bp.route('/registrar_feligres',methods=['POST'])
def registrar_feligres():
    nombres = request.form.get('nombre')
    apellidos = request.form.get('apellido')
    telefono = request.form.get('telefono')
    direccion = request.form.get('direccion')
    tipo_documento = request.form.get('tipo-doc') 
    documento = request.form.get('documento')
    email = request.form.get('email')
    clave = request.form.get('contraseña') 
    
    if not all([nombres, apellidos, telefono, documento, email, clave]):
        return jsonify({"error": "Faltan campos obligatorios en la solicitud."}), 400

    try:
        # El orden es: (apellido, nombre, celular, direccion, tipo, documento, correo, clave)
        registrar_usuario_feligres(
            apellidos,      
            nombres,        
            telefono,       
            direccion,      
            tipo_documento, 
            documento,      
            email,          
            clave           
        )        
        return jsonify({"mensaje": "Registro exitoso"}), 200     
    except Exception as e:
        return jsonify({"error": "Error interno del servidor. Revisar logs de BD."}), 500
