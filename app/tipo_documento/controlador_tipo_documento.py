from app.bd_sistema import bd_conexion

def listar_tipo_documento():
    conexion=bd_conexion()
    documento=[]
    with conexion.cursor() as cursor:
        cursor.execute("select nombDocumento from tipoDocumento")
        documento.fetchall()
    conexion.close()
    return documento