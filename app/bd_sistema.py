from dotenv import load_dotenv, find_dotenv
import pymysql, sys, os

dotenv_path = find_dotenv()
if not dotenv_path:
    print("Error: No se encontró el archivo .env en ninguna ruta del proyecto.")
    sys.exit(1)

load_dotenv(dotenv_path)

def obtener_conexion():
    try:
        return pymysql.connect(
            host=os.getenv('DB_HOST'),
            port=int(os.getenv('DB_PORT')),
            user=os.getenv('DB_USER'),
            password=os.getenv('DB_PASSWORD'),
            db=os.getenv('DB_NAME')
        )
    except Exception as e:
        print(f"Error al conectar a la base de datos: {e}")
        sys.exit(1)