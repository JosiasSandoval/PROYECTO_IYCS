from app.bd_sistema import bd_conexion

def registrar_feligres(apellido, nombre, celular,direccion,tipo,documento,correo,clave):
    conexion=bd_conexion()
    with conexion.cursor() as cursor:
        cursor.execute("insert into usuario(nombUsuario,apelUsuario,numDocumento,emailUsuario,direccionUsua,telefono,claveUsuario,idTipoDocumento,idTipoUsua,idCargo)values (%s,%s,%s,%s,%s,%s,%s,%s,1,1)",(nombre,apellido,documento,correo,direccion,celular,clave,tipo),),
    conexion.commit()
    conexion.close()

