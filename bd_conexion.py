import pymysql

def obtener_conexion():
   return pymysql.connect(localhost='127.0.0.1',
                          user='root', password='root',
                          port=8889, db='')#Acá el nombre de la base de datos local