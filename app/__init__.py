import os
import calendar
from flask import Flask, render_template, redirect, session, url_for, request
from functools import wraps

from app.tipo_documento.route_tipo_documento import tipoDocumento_bp
from app.auth.route_auth import auth_bp
from app.usuario.route_usuario import usuario_bp
from app.parroquia.route_parroquia import parroquia_bp
from app.cargo.route_cargo import cargo_bp
from app.rol_permiso.route_rol_permiso import rol_bp, permiso_bp
from app.acto_liturgico_requisito.route_acto import acto_bp
from app.pago.route_pago import pago_bp
from app.pago_metodo.route_pago_metodo import pago_metodo_bp
from app.reserva.route_reserva import reserva_bp
from app.acto_liturgico_requisito.route_requisito import requisito_bp
from app.disponibilidad.route_disponibilidad import disponibilidad_bp
from app.acto_liturgico.route_actoLiturgico import acto_liturgico_bp
from app.reportes.route_reporte import reportes_bp
from app.notificacion.route_notificacion import notificacion_bp
from app.documento_requisito.route_documento_requisito import documento_requisito_bp

# ============================================
# DECORADOR DE CONTROL DE ROLES
# ============================================
def requires_roles(*roles):
    def wrapper(fn):
        @wraps(fn)
        def decorated_view(*args, **kwargs):
            if 'idUsuario' not in session:
                return redirect(url_for('iniciar_sesion'))

            rol = session.get('rol_sistema')

            # Administrador SIEMPRE TIENE ACCESO
            if rol and rol.lower() == 'administrador':
                return fn(*args, **kwargs)

            # Validación normal (case-insensitive)
            roles_lower = [r.lower() for r in roles]
            if rol and rol.lower() not in roles_lower:
                return redirect(url_for('principal'))

            return fn(*args, **kwargs)
        return decorated_view
    return wrapper


def crear_app():
    # Obtiene la ruta absoluta de la carpeta 'app'
    base_dir = os.path.abspath(os.path.dirname(__file__))
    template_dir = os.path.join(base_dir, '..', 'site')
    static_dir = os.path.join(base_dir, '..', 'static')

    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)
    app.config['SECRET_KEY'] = 'clave-super-segura-y-fija-123'

    # Blueprints
    app.register_blueprint(tipoDocumento_bp, url_prefix='/api/tipoDocumento')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(usuario_bp, url_prefix='/api/usuario')
    app.register_blueprint(parroquia_bp,url_prefix='/api/parroquia')
    app.register_blueprint(cargo_bp,url_prefix='/api/cargo')
    app.register_blueprint(pago_bp,url_prefix='/api/pago')
    app.register_blueprint(rol_bp,url_prefix='/api/rol')
    app.register_blueprint(permiso_bp,url_prefix='/api/permiso')
    app.register_blueprint(acto_bp,url_prefix='/api/acto')
    app.register_blueprint(pago_metodo_bp, url_prefix='/api/metodo_pago') 
    app.register_blueprint(reserva_bp,url_prefix='/api/reserva')
    app.register_blueprint(requisito_bp,url_prefix='/api/requisito')
    app.register_blueprint(disponibilidad_bp,url_prefix='/api/disponibilidad')
    app.register_blueprint(acto_liturgico_bp,url_prefix='/api/acto_liturgico')
    app.register_blueprint(reportes_bp, url_prefix='/api/reportes')
    app.register_blueprint(notificacion_bp, url_prefix='/api/notificacion')
    app.register_blueprint(documento_requisito_bp, url_prefix='/api/documento_requisito')

    # ============================================
    # RUTAS DEL FRONTEND
    # ============================================

    @app.route("/")
    def iniciar_sesion():
        return render_template('iniciar_sesion.html')

    @app.route('/registrar')
    def registrar():
        return render_template('registrarse.html')

    @app.route('/recuperar_contrasena')
    def recuperar_contrasena():
        return render_template('recuperacion_clave.html')

    @app.route('/principal')
    @requires_roles('Feligres', 'Secretaria', 'Sacerdote')
    def principal():
        return render_template('pagina_principal.html')

    # ---------------- CLIENTE ----------------
    @app.route('/cliente/parroquia')
    @requires_roles('Feligres', 'Secretaria', 'Sacerdote')
    def parroquia_cliente():
        return render_template('cliente/parroquia_cliente.html')

    @app.route('/cliente/detalle_parroquia')
    @requires_roles('Feligres', 'Secretaria', 'Sacerdote')
    def detalle_parroquia():
        return render_template('cliente/detalle_parroquia.html')

    @app.route('/cliente/calendario')
    @requires_roles('Feligres', 'Secretaria', 'Sacerdote')
    def calendario_cliente():
        # Obtener idParroquia de los parámetros de la URL si viene desde detalle_parroquia
        idParroquia = request.args.get('idParroquia')
        if idParroquia:
            session['idParroquia'] = idParroquia
        return render_template('cliente/calendario.html')

    @app.route('/cliente/acto_liturgico')
    @requires_roles('Feligres', 'Secretaria', 'Sacerdote')
    def acto_liturgico_cliente():
        return render_template('cliente/actos_liturgicos_cliente.html')

    @app.route('/cliente/perfil')
    @requires_roles('Feligres', 'Secretaria', 'Sacerdote', 'Administrador')
    def perfil_cliente():
        return render_template('cliente/perfil.html', id_usuario_logueado=session.get('idUsuario'))

    # --- RESERVAS CLIENTE ---
    @app.route('/cliente/reserva')
    @requires_roles('Feligres', 'Secretaria', 'Sacerdote')
    def reserva_cliente():
        return render_template('cliente/reserva_ubicacion.html')

    @app.route('/cliente/reserva_acto')
    @requires_roles('Feligres', 'Secretaria','Sacerdote')
    def reserva_acto():
        return render_template('cliente/reserva_acto.html')

    @app.route('/cliente/reserva_datos')
    @requires_roles('Feligres', 'Secretaria','Sacerdote')
    def reserva_datos():
        return render_template('cliente/reserva_datos.html')


    @app.route('/admi/secretaria_documentos')
    @requires_roles('Secretaria')
    def secretaria_documentos():
        return render_template('administradores/secretaria_documentos.html')

    @app.route('/cliente/reserva_resumen')
    @requires_roles('Feligres', 'Secretaria','Sacerdote')
    def reserva_resumen():
        return render_template('cliente/reserva_resumen.html')

    @app.route('/cliente/mis_reservas')
    @requires_roles('Feligres', 'Secretaria')
    def mis_reservas():
        return render_template('cliente/mis_reservas.html')

    @app.route('/cliente/pago')
    @requires_roles('Feligres', 'Secretaria')
    def pago_cliente():
        return render_template('cliente/pago.html')

    # ---------------- ADMINISTRADOR ----------------
    @app.route('/admi/tipo_documento')
    @requires_roles('Administrador')
    def tipo_documento_admi():
        return render_template('administradores/tipoDocumento.html')

    @app.route('/admi/cargo')
    @requires_roles('Administrador')
    def cargo_admi():
        return render_template('administradores/cargo.html')

    @app.route('/admi/parroquia')
    @requires_roles('Administrador')
    def parroquia_admi():
        return render_template('administradores/parroquia_admi.html')

    @app.route('/admi/metodo_pago')
    @requires_roles('Administrador')
    def metodo_pago_admi():
        return render_template('administradores/metodo_pago.html')

    @app.route('/admi/rol')
    @requires_roles('Administrador')
    def rol_admi():
        return render_template('administradores/rol_permiso.html')

    @app.route('/admi/feligres')
    @requires_roles('Administrador')
    def feligres_admi():
        return render_template('administradores/usuario_feligres.html')

    @app.route('/admi/personal')
    @requires_roles('Administrador')
    def personal_admi():
        return render_template('administradores/usuario_personal.html')

    @app.route('/admi/acto_liturgico')
    @requires_roles('Administrador')
    def acto_liturgico_admi():
        return render_template('administradores/acto_liturgico.html')
    
    @app.route('/admi/configuracion')
    @requires_roles('Administrador')
    def configuracion_admi():
        return render_template('administradores/configuracion.html')

    @app.route('/admi/disponibilidad')
    @requires_roles('Administrador')
    def disponibilidad_admi():
        return render_template('administradores/disponibilidad.html')

    @app.route('/admi/documento_requisito')
    @requires_roles('Administrador')
    def documento_requisito_admi():
        return render_template('administradores/documento_requisito.html')

    @app.route('/admi/lista_reporte')
    @requires_roles('Administrador')
    def lista_reporte_admi():
        return render_template('administradores/lista_reporte.html')

    @app.route('/admi/parroquia_personal')
    @requires_roles('Administrador','Sacerdote')
    def parroquia_personal_admi():
        return render_template('administradores/parroquia_personal.html')

    @app.route('/admi/reporte')
    @requires_roles('Administrador')
    def reporte_admi():
        return render_template('administradores/reporte_PersonalParroquia.html')

    @app.route('/admi/requisitos')
    @requires_roles('Administrador')
    def requisitos_admi():
        return render_template('administradores/requisitos.html')

    @app.route('/admi/reserva')
    @requires_roles('Administrador')
    def reserva_admi():
        return render_template('administradores/reserva.html')
    
    @app.route('/cerrar_sesion')
    def cerrar_sesion():
        session.clear()
        return redirect(url_for('iniciar_sesion'))
    

    return app
