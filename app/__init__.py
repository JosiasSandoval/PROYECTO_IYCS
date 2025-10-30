import os
import calendar
from flask import Flask, render_template,redirect,session,url_for
from app.tipo_documento.route_tipo_documento import tipoDocumento_bp
from app.auth.route_auth import auth_bp
from app.usuario.route_usuario import usuario_bp
from app.parroquia.route_parroquia import parroquia_bp
from app.cargo.route_cargo import cargo_bp
from app.rol_permiso.route_rol_permiso import rol_bp,permiso_bp
from app.acto_liturgico_requisito.route_acto import acto_bp
from app.pago.route_pago import pago_bp
from app.pago_metodo.route_pago_metodo import pago_metodo_bp
from app.reserva.route_reserva import reserva_bp


def crear_app():
    # Obtiene la ruta absoluta de la carpeta 'app'
    base_dir = os.path.abspath(os.path.dirname(__file__))
    
    # Construye la ruta a la carpeta 'site'
    template_dir = os.path.join(base_dir, '..', 'site')

    # Construye la ruta a la carpeta 'static'
    static_dir = os.path.join(base_dir, '..', 'static')
    
    # Se especifica la ruta completa de las carpetas 'site' y 'static'
    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

    app.register_blueprint(tipoDocumento_bp,url_prefix='/api/tipoDocumento')
    app.register_blueprint(auth_bp,url_prefix='/api/auth')
    app.register_blueprint(usuario_bp,url_prefix='/api/usuario')
    app.register_blueprint(parroquia_bp,url_prefix='/api/parroquia')
    app.register_blueprint(cargo_bp,url_prefix='/api/cargo')
    app.register_blueprint(pago_bp,url_prefix='/api/pago')
    app.register_blueprint(rol_bp,url_prefix='/api/rol')
    app.register_blueprint(permiso_bp,url_prefix='/api/permiso')
    app.register_blueprint(acto_bp,url_prefix='/api/acto')
    app.register_blueprint(pago_bp, url_prefix='/api/pago')
    app.register_blueprint(pago_metodo_bp, url_prefix='/api/metodo-pago') 
    app.register_blueprint(reserva_bp,url_prefix='/api/reserva')
    
    @app.route("/")
    def iniciar_sesion():
        return render_template('iniciar_sesion.html')
    
    @app.route('/registrar')
    def registrar():
        return render_template('registrarse.html')
    
    @app.route('/principal')
    def principal():
        if 'idUsuario' not in session:
            return redirect(url_for('iniciar_sesion'))  # manda al login si no hay sesión
        return render_template('pagina_principal.html')

    
    @app.route('/cliente/parroquia')
    def parroquia_cliente():
        return render_template('cliente/parroquia_cliente.html')

    @app.route('/cliente/detalle_parroquia')
    def detalle_parroquia():
        return render_template('cliente/detalle_parroquia.html')
    
    @app.route('/cliente/calendario')
    def calendario_cliente():
        return render_template('cliente/calendario.html')

    @app.route('/cliente/reserva')
    def reserva_cliente():
        if 'idUsuario' not in session:
            return redirect(url_for('iniciar_sesion'))  # manda al login si no hay sesión
        return render_template('cliente/reserva_ubicacion.html')
    
    @app.route('/cliente/reserva_acto')
    def reserva_acto():
        if 'idUsuario' not in session:
            return redirect(url_for('iniciar_sesion'))  # manda al login si no hay sesión
        return render_template('cliente/reserva_acto.html')
    
    @app.route('/cliente/reserva_datos')
    def reserva_datos():
        if 'idUsuario' not in session:
            return redirect(url_for('iniciar_sesion'))  # manda al login si no hay sesión
        return render_template('cliente/reserva_datos.html')
    
    @app.route('/cliente/reserva_requisito')
    def reserva_requisito():
        if 'idUsuario' not in session:
            return redirect(url_for('iniciar_sesion'))  # manda al login si no hay sesión
        return render_template('cliente/reserva_requisito.html')
    
    @app.route('/cliente/reserva_resumen')
    def reserva_resumen():
        if 'idUsuario' not in session:
            return redirect(url_for('iniciar_sesion'))  # manda al login si no hay sesión
        return render_template('cliente/reserva_resumen.html')
    
    @app.route('/cliente/acto_liturgico')
    def acto_liturgico_cliente():
        return render_template('cliente/actos_liturgicos_cliente.html')
    
    @app.route('/cliente/perfil')
    def perfil_cliente():
        return render_template('cliente/perfil.html')


   
    
    #Administrador
    @app.route('/admi/tipo_documento')
    def tipo_documento_admi():
        return render_template('administradores/tipoDocumento.html')
    
    @app.route('/admi/cargo')
    def cargo_admi():
        return render_template('administradores/cargo.html')
    
    @app.route('/admi/parroquia')
    def parroquia_admi():
        return render_template('administradores/parroquia_admi.html')
    
    @app.route('/admi/metodo_pago')
    def metodo_pago_admi():
        return render_template('administradores/metodo_pago.html')
    
    @app.route('/cliente/reserva_ubi')
    def reserva_ubicacion():
        return render_template('cliente/reserva_ubicacion.html')
    @app.route('/cliente/pago')
    def pago():
        return render_template('cliente/pago.html')
    @app.route('/admi/rol')
    def rol_admi():
        return render_template('administradores/rol_permiso.html')

    @app.route('/admi/feligres')
    def feligres_admi():
        return render_template('administradores/usuario_feligres.html')
    
    @app.route('/admi/personal')
    def personal_admi():    
        return render_template('administradores/usuario_personal.html')

    return app



