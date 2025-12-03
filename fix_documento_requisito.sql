-- Script para agregar la columna 'observacion' a la tabla DOCUMENTO_REQUISITO
-- Ejecuta este script si tu base de datos ya existe y no tiene la columna 'observacion'

ALTER TABLE DOCUMENTO_REQUISITO 
ADD COLUMN observacion TEXT NULL AFTER vigenciaDocumento;

