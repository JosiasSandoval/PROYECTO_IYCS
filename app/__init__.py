import os
import os
from flask import Flask, render_template

def crear_app():
    # Obtiene la ruta absoluta de la carpeta 'app'
    base_dir = os.path.abspath(os.path.dirname(__file__))
    
    # Construye la ruta a la carpeta 'site'
    template_dir = os.path.join(base_dir, '..', 'site')
    
    # Construye la ruta a la carpeta 'static'
    static_dir = os.path.join(base_dir, '..', 'static')
    
    # Se especifica la ruta completa de las carpetas 'site' y 'static'
    app = Flask(__name__, template_folder=template_dir, static_folder=static_dir)

    @app.route("/")
    def iniciar_sesion():
        return render_template('iniciar_sesion.html')
    
    # En tu archivo Python
    @app.route('/registrar')
    def registrar():
        return render_template('registrarse.html')
    
    return app

