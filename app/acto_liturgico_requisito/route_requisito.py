from flask import jsonify, Blueprint, request, send_file, current_app
import os
from datetime import datetime,date
from io import BytesIO # Importar para manejo de archivos binarios
from app.acto_liturgico_requisito.controlador_requisito import (
    obtener_requisito_acto,
    registrar_documento_db,
    cambiar_cumplimiento_documento,
    obtener_documento_faltante,
    modificar_documento_requisito,
    get_requisitos,
    registrar_requisito,
    modificar_requisito,
    cambiar_estado_requisito,
    eliminar_requisito,
    verificar_relacion_requisito,
    obtener_documentos_reserva,
    listar_todos_documentos_reserva,
    archivo_documento,
    aprobar_documentos_reserva_parcial,
    aprobar_documento_individual,
    rechazar_documento
)

requisito_bp = Blueprint('requisito', __name__)

# =============================
#       REQUISITOS DEL ACTO
# =============================
@requisito_bp.route('/<int:id>', methods=['GET'])
def obtener_requisito(id):
    """Obtiene todos los requisitos activos para un acto litúrgico dado su ID."""
    datos = obtener_requisito_acto(id)
    return jsonify({
        "success": True,
        "mensaje": "Requisitos encontrados correctamente",
        "datos": datos
    }), 200

# =============================
#   DOCUMENTOS — CAMBIAR ESTADO
# =============================
@requisito_bp.route('/cambiar_estado_documento', methods=['POST'])
def cambiar_estado_documento_route():
    """Cambia el estado de cumplimiento de un documento (CUMPLIDO/NO_CUMPLIDO)."""
    data = request.get_json()
    idDocumento = data.get('idDocumento')
    estadoCumplimiento = data.get('estadoCumplimiento')

    if not idDocumento or estadoCumplimiento is None:
        return jsonify({"ok": False, "mensaje": "Datos incompletos (idDocumento y estadoCumplimiento son obligatorios)"}), 400

    resultado = cambiar_cumplimiento_documento(idDocumento, estadoCumplimiento)
    return jsonify(resultado), 200

# =============================
#     DOCUMENTO — APROBAR INDIVIDUAL
# =============================
@requisito_bp.route('/aprobar', methods=['POST'])
def aprobar_documento_individual_route():
    """
    Aprueba un documento individual por idDocumentoRequisito (que es el idDocumento en la BD).
    """
    data = request.get_json() or {}
    # Aceptar tanto idDocumentoRequisito como idDocumento para compatibilidad
    idDocumentoRequisito = data.get('idDocumentoRequisito') or data.get('idDocumento')
    
    if not idDocumentoRequisito:
        return jsonify({"success": False, "mensaje": "Se requiere idDocumentoRequisito o idDocumento"}), 400
    
    print(f"🔵 Aprobando documento con ID: {idDocumentoRequisito}")
    resultado = aprobar_documento_individual(idDocumentoRequisito)
    print(f"📥 Resultado de aprobación: {resultado}")
    
    if resultado.get("ok"):
        return jsonify({
            "success": True, 
            "mensaje": resultado.get("mensaje"),
            "estadoReserva": resultado.get("estadoReserva")
        }), 200
    else:
        return jsonify({"success": False, "mensaje": resultado.get("error") or resultado.get("mensaje")}), 400

# =============================
#     DOCUMENTO — APROBAR (POR RESERVA)
# =============================
@requisito_bp.route('/documento/aprobar/<int:idReserva>', methods=['POST'])
def aprobar_documento_route(idReserva):
    """
    Aprueba todos los documentos que cumplen. Actualiza estado de reserva
    a PENDIENTE_PAGO si todos están aprobados.
    """
    resultado = aprobar_documentos_reserva_parcial(idReserva)
    if resultado.get("ok"):
        return jsonify({"success": True, "mensaje": resultado.get("mensaje")}), 200
    else:
        return jsonify({"success": False, "error": resultado.get("error") or resultado.get("mensaje")}), 400


# =============================
# RUTA PARA APROBAR DOCUMENTOS (PARCIAL)
# =============================
@requisito_bp.route('/documento/aprobar_parcial/<int:idReserva>', methods=['POST'])
def aprobar_documentos_parcial_route(idReserva):
    """
    Aprueba todos los documentos que cumplen.
    Deja los demás pendientes.
    Actualiza estado de reserva solo si todos están aprobados.
    """
    resultado = aprobar_documentos_reserva_parcial(idReserva)
    if resultado.get("ok"):
        return jsonify({
            "success": True,
            "mensaje": resultado.get("mensaje"),
            "aprobados": resultado.get("aprobados", [])
        }), 200
    else:
        return jsonify({"success": False, "error": resultado.get("error") or resultado.get("mensaje")}), 400


# =============================
# RUTA PARA RECHAZAR UN DOCUMENTO INDIVIDUAL
# =============================
@requisito_bp.route('/documento/rechazar', methods=['POST'])
def rechazar_documento_route():
    """
    Rechaza un único documento según el JSON recibido:
    { "idDocumento": int, "idReserva": int, "observacion": "texto opcional" }
    Actualiza el estado de la reserva según documentos restantes.
    """
    data = request.get_json() or {}
    idDocumento = data.get("idDocumento")
    idReserva = data.get("idReserva")
    observacion = data.get("observacion", "")

    if not idDocumento or not idReserva:
        return jsonify({"success": False, "error": "Se requieren idDocumento e idReserva"}), 400

    resultado = rechazar_documento(idDocumento, idReserva, observacion)
    if resultado.get("ok"):
        return jsonify({"success": True, "mensaje": resultado.get("mensaje")}), 200
    else:
        return jsonify({"success": False, "error": resultado.get("error")}), 400



# =============================
#     DOCUMENTO — REGISTRO
# =============================

BASE_UPLOAD = 'static/uploads/reservas/'

@requisito_bp.route('/registrar_documento', methods=['POST'])
def registrar_documento_route():
    try:
        idReserva = request.form.get('idReserva')
        idActoRequisito = request.form.get('idActoRequisito')
        estadoCumplimiento = request.form.get('estadoCumplimiento')
        observacion = request.form.get('observacion')
        vigencia = request.form.get('vigenciaDocumento')
        aprobado = request.form.get('aprobado', 0)

        # Campos opcionales enviados desde frontend
        rutaArchivo = request.form.get('rutaArchivo')
        tipoArchivo = request.form.get('tipoArchivo')
        f_subido = request.form.get('f_subido')

        file = request.files.get('file')

        # Carpeta de la reserva
        carpeta_reserva = os.path.join(BASE_UPLOAD, f"reserva_{idReserva}")
        os.makedirs(carpeta_reserva, exist_ok=True)

        # Si llega un archivo físico, sobrescribir ruta, tipo y fecha
        if file:
            extension = file.filename.split('.')[-1]
            nombre_archivo = f"acto_{idActoRequisito}_{date.today().strftime('%Y%m%d')}.{extension}"
            rutaArchivo = os.path.join(carpeta_reserva, nombre_archivo)
            file.save(rutaArchivo)
            tipoArchivo = file.content_type
            f_subido = date.today()

        # Registrar en BD
        resultado = registrar_documento_db(
            idActoRequisito=idActoRequisito,
            idReserva=idReserva,
            rutaArchivo=rutaArchivo,
            tipoArchivo=tipoArchivo,
            f_subido=f_subido,
            estadoCumplimiento=estadoCumplimiento,
            observacion=observacion,
            vigencia=vigencia,
            aprobado=aprobado
        )

        return jsonify(resultado), 201 if resultado['ok'] else 500

    except Exception as e:
        print("Error en registrar_documento_route:", e)
        return jsonify({'ok': False, 'mensaje': str(e)}), 500


# =============================
#     DOCUMENTO — FALTANTES
# =============================
@requisito_bp.route('/obtener_documento_faltante/<int:idReserva>', methods=['GET'])
def obtener_documento_faltante_route(idReserva):
    """Obtiene los requisitos de documento que están marcados como NO_CUMPLIDO para una reserva."""
    datos = obtener_documento_faltante(idReserva)
    return jsonify({
        "success": True,
        "mensaje": "Documentos faltantes encontrados correctamente",
        "datos": datos
    }), 200

# =============================
#     DOCUMENTO — MODIFICAR
# =============================
@requisito_bp.route('/modificar_documento_requisito/<int:idDocumento>', methods=['PUT'])
def modificar_documento_requisito_route(idDocumento):
    try:
        file = request.files.get('file')

        # Obtener valores actuales desde el form
        idReserva = request.form.get('idReserva')
        idActoRequisito = request.form.get('idActoRequisito') or str(idDocumento)  # si no viene, usar idDocumento
        rutaArchivo = request.form.get('rutaArchivoActual')  # ruta del archivo actual
        tipoArchivo = request.form.get('tipoArchivoActual')
        f_subido = request.form.get('f_subidoActual')

        # Obtener estadoCumplimiento del form si viene (para subir documentos)
        estadoCumplimiento = request.form.get('estadoCumplimiento')
        
        # SI LLEGA ARCHIVO → REEMPLAZAR
        if file:
            # Si existe archivo anterior y la ruta es válida → sobrescribir
            if rutaArchivo and os.path.exists(rutaArchivo):
                rutaGuardar = rutaArchivo
            else:
                # Si no existe archivo anterior → crear nombre nuevo
                carpeta_reserva = os.path.join(BASE_UPLOAD, f"reserva_{idReserva}")
                os.makedirs(carpeta_reserva, exist_ok=True)

                extension = file.filename.split(".")[-1]
                nombreArchivo = f"acto_{idActoRequisito}_{date.today().strftime('%Y%m%d')}.{extension}"
                rutaGuardar = os.path.join(carpeta_reserva, nombreArchivo)

            # Guardar archivo (sobrescribe si ya existía)
            file.save(rutaGuardar)
            print("ARCHIVO GUARDADO EN:", rutaGuardar)

            # Actualizar variables para la BD
            rutaArchivo = rutaGuardar
            tipoArchivo = file.mimetype
            f_subido = date.today()
            
            # Si se sube un archivo y viene estadoCumplimiento, actualizarlo también
            if estadoCumplimiento:
                # Actualizar estadoCumplimiento directamente
                from app.acto_liturgico_requisito.controlador_requisito import cambiar_cumplimiento_documento
                cambiar_cumplimiento_documento(idDocumento, estadoCumplimiento)

        # LLAMAR A LA FUNCIÓN QUE ACTUALIZA BD (solo rutaArchivo, tipoArchivo, f_subido)
        resultado = modificar_documento_requisito(
            idDocumento=idDocumento,
            rutaArchivo=rutaArchivo,
            tipoArchivo=tipoArchivo,
            f_subido=f_subido
        )

        return jsonify(resultado), 200

    except Exception as e:
        print("Error en modificar_documento_requisito_route:", e)
        return jsonify({"ok": False, "mensaje": str(e)}), 500



# =============================
#     REQUISITOS CRUD
# =============================
@requisito_bp.route('/requisito', methods=['GET'])
def listar_requisitos_route():
    datos = get_requisitos()
    return jsonify({'datos': datos}), 200

@requisito_bp.route('/registrar_requisito', methods=['POST'])
def registrar_requisito_route():
    data = request.get_json()
    # Recibimos f_requisito del frontend
    resultado = registrar_requisito(
        data.get('nombRequisito'), 
        data.get('descripcion'),
        data.get('f_requisito') 
    )
    return jsonify(resultado), 200

@requisito_bp.route('/modificar_requisito/<int:idRequisito>', methods=['PUT'])
def modificar_requisito_route_id(idRequisito):
    data = request.get_json()
    resultado = modificar_requisito(
        idRequisito,
        data.get('nombRequisito'),
        data.get('descripcion'),
        data.get('f_requisito')
    )
    return jsonify(resultado), 200

@requisito_bp.route('/cambiar_estado_requisito/<int:idRequisito>', methods=['PUT'])
def cambiar_estado_requisito_route(idRequisito):
    """Alterna el estado (activo/inactivo) de un requisito."""
    resultado = cambiar_estado_requisito(idRequisito)
    return jsonify(resultado), 200

@requisito_bp.route('/eliminar_requisito/<int:idRequisito>', methods=['DELETE'])
def eliminar_requisito_route(idRequisito):
    """Elimina un requisito si no tiene relaciones con actos litúrgicos."""
    try:
        # 1. Verificar si tiene relaciones antes de intentar eliminar
        if verificar_relacion_requisito(idRequisito):
            return jsonify({'ok': False, 'mensaje': 'No se puede eliminar el requisito porque está relacionado a uno o más actos litúrgicos'}), 400

        # 2. Si no hay relaciones, proceder a eliminar
        resultado = eliminar_requisito(idRequisito)
        return jsonify(resultado), 200 if resultado['ok'] else 400
    except Exception as e:
        print("Error al eliminar requisito:", e)
        return jsonify({'ok': False, 'mensaje': 'Error interno del servidor'}), 500

# =============================
#     DOCUMENTOS DE RESERVA
# =============================
@requisito_bp.route('/obtener_documentos_reserva/<int:idReserva>', methods=['GET'])
def obtener_documentos_reserva_route(idReserva):
    """Obtiene los documentos asociados a una reserva que están pendientes de revisión."""
    datos = obtener_documentos_reserva(idReserva)
    return jsonify({"success": True, "mensaje": "Documentos encontrados correctamente", "datos": datos}), 200

@requisito_bp.route('/listar/<int:idReserva>', methods=['GET'])
def listar_documentos_reserva_route(idReserva):
    """Lista todos los documentos de una reserva (sin filtrar por estado)."""
    datos = listar_todos_documentos_reserva(idReserva)
    return jsonify({"success": True, "mensaje": "Documentos encontrados correctamente", "datos": datos}), 200

@requisito_bp.route('/archivo/<int:idDocumento>', methods=['GET'])
def archivo_documento_route(idDocumento):
    datos = archivo_documento(idDocumento)

    if not datos:
        return jsonify({"success": False, "mensaje": "No se encontró el archivo"}), 404

    ruta_relativa = datos["rutaArchivo"]

    # Normalizar slashes
    ruta_relativa = ruta_relativa.replace("app/", "").replace("app\\", "")

    # Construir ruta absoluta
    ruta_absoluta = os.path.join(os.getcwd(), ruta_relativa)

    print("Ruta final:", ruta_absoluta)

    if not os.path.exists(ruta_absoluta):
        print("❌ Ruta inexistente:", ruta_absoluta)
        return jsonify({"success": False, "mensaje": "Archivo no encontrado"}), 500

    return send_file(ruta_absoluta, as_attachment=True)
