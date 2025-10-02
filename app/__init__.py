import os
from flask import Flask, render_template
from app.tipo_documento.route_tipo_documento import tipoDocumento_bp
from app.auth.route_auth import auth_bp
from app.usuario.route_usuario import usuario_bp
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
    @app.route("/")
    def iniciar_sesion():
        return render_template('iniciar_sesion.html')
    
    @app.route('/registrar')
    def registrar():
        return render_template('registrarse.html')
    
    @app.route('/api')
    def principal():
        return render_template('pagina_principal.html')
    
    return app

