from app.bd_sistema import obtener_conexion

def get_obtener_mapa_datos():
    conexion =obtener_conexion()
    resultados=[]
    with conexion.cursor() as cursor:
        cursor.execute( """
        SELECT
            PR.nombProvincia, PR.latProvincia, PR.logProvincia,
            D.nombDistrito, D.latDistrito, D.logDistrito,
            P.nombParroquia, P.latParroquia, P.logParroquia, 
            P.descripcionBreve
        FROM 
            PROVINCIA PR
        JOIN 
            DISTRITO D ON PR.idProvincia = D.idProvincia
        JOIN 
            PARROQUIA P ON D.idDistrito = P.idDistrito;
        """)
        for fila in cursor.fetchall():
                resultados.append({
                    'nombProvincia': fila[0],
                    'latProvincia': float(fila[1]),
                    'logProvincia': float(fila[2]),
                    
                    'nombDistrito': fila[3],
                    'latDistrito': float(fila[4]),
                    'logDistrito': float(fila[5]),

                    'nombParroquia': fila[6],
                    'latParroquia': float(fila[7]),
                    'logParroquia': float(fila[8]),
                    
                    'descripcionBreve': fila[9],
                })
        return resultados
    conexion.close()
