from app import crear_app

# Crea la aplicación llamando a la fábrica
app = crear_app()

if __name__ == '__main__':
    # Ejecuta el servidor de la aplicación
    app.run(debug=True)
