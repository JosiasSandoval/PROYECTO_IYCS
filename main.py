from app import crear_app
import os
# Crea la aplicación llamando a la fábrica
app = crear_app()

app.secret_key = os.urandom(24)  # genera una clave aleatoria

if __name__ == '__main__':
    # Ejecuta el servidor de la aplicación
    app.run(debug=True)
