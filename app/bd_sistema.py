import pymysql
from dotenv import load_dotenv
import os
import sys

dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')

if not os.path.exists(dotenv_path):
    print(f"Error: No se encontró el archivo .env en {dotenv_path}")
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

get_db_connection = obtener_conexion