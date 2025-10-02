from flask import Blueprint, request, jsonify, abort, g, redirect, url_for
from app.tipo_documento.controlador_tipo_documento import(
    listar_tipo_documento
)
tipoDocumento_bp=Blueprint('tipoDocumento',__name__)

@tipoDocumento_bp.route('/', methods=['GET'])
def get_tipos_documento():
    const=listar_tipo_documento()
    return jsonify(const)