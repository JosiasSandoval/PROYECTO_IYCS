-- ===============================================
-- PASO 1: Habilitar el Programador de Eventos
-- ===============================================
-- Esto es necesario para que las tareas programadas (EVENTS) se ejecuten automáticamente.
SET GLOBAL event_scheduler = ON;

-- ===============================================
-- PASO 2: VISTA DE AYUDA (Para simplificar la lógica)
-- ===============================================
-- Crea una vista para relacionar la RESERVA con la configuración de tiempo
CREATE OR REPLACE VIEW Vista_ReservaConfig AS
SELECT
    R.idReserva,
    R.f_reserva,
    R.h_reserva,
    R.estadoReserva,
    C.tiempoMaxCancelacion,
    C.tiempoCambioDocumentos,
    C.tiempoMaxPago,         -- Agregado para el límite de pago
    C.tiempoDuracion,        -- Agregado para calcular la hora de fin del acto
    C.tiempoAprobacionRequisitos, -- AGREGADO: Tiempo límite para la revisión administrativa
    C.unidadTiempoAcciones
FROM
    RESERVA R
JOIN
    PARTICIPANTES_ACTO PA ON R.idReserva = PA.idReserva
JOIN
    ACTO_LITURGICO AL ON PA.idActo = AL.idActo
JOIN
    CONFIGURACION_ACTO C ON AL.idActo = C.idActo
GROUP BY R.idReserva, R.f_reserva, R.h_reserva, R.estadoReserva,
         C.tiempoMaxCancelacion, C.tiempoCambioDocumentos, C.tiempoMaxPago,
         C.tiempoDuracion, C.tiempoAprobacionRequisitos, C.unidadTiempoAcciones;


-- ===============================================
-- PASO 3: PROCEDIMIENTO ALMACENADO (Lógica de la Tarea)
-- ===============================================
-- Este procedimiento encapsula la lógica para actualizar los estados.
DROP PROCEDURE IF EXISTS SP_ActualizarEstadosReserva;
DELIMITER //

CREATE PROCEDURE SP_ActualizarEstadosReserva()
BEGIN
    -- ----------------------------------------------------
    -- 1. RESERVA ATENDIDA AUTOMÁTICAMENTE
    -- ----------------------------------------------------
    -- Si la hora actual es posterior a la hora de finalización del acto
    -- (f_reserva + h_reserva + tiempoDuracion minutos) y el estado es 'CONFIRMADO',
    -- la reserva pasa a 'ATENDIDO'.
    
    UPDATE RESERVA R
    JOIN Vista_ReservaConfig VRC ON R.idReserva = VRC.idReserva
    SET R.estadoReserva = 'ATENDIDO'
    WHERE 
        R.estadoReserva = 'CONFIRMADO' 
        AND VRC.tiempoDuracion IS NOT NULL
        AND ADDTIME(CONCAT(VRC.f_reserva, ' ', VRC.h_reserva), SEC_TO_TIME(VRC.tiempoDuracion * 60)) < NOW();
        -- ADDTIME(Fecha y Hora de Inicio, Duración en formato TIME) < NOW()
        -- SEC_TO_TIME convierte los minutos (VRC.tiempoDuracion) a un formato de tiempo que ADDTIME necesita.

    -- ----------------------------------------------------
    -- 2. CANCELACIÓN POR INCUMPLIMIENTO DE PLAZO DE PAGO
    -- ----------------------------------------------------
    -- Si la fecha/hora actual es posterior al límite de pago (f_reserva menos tiempoMaxPago)
    -- y la reserva está en 'pendiente_pago', se cancela.
    
    UPDATE RESERVA R
    JOIN Vista_ReservaConfig VRC ON R.idReserva = VRC.idReserva
    SET R.estadoReserva = 'CANCELADO' -- Usamos 'CANCELADO' para la cancelación por falta de pago
    WHERE 
        R.estadoReserva = 'PENDIENTE_PAGO' 
        AND VRC.tiempoMaxPago IS NOT NULL
        AND 
        (
            -- Calcula la fecha/hora límite de pago (restado de la fecha de la reserva)
            CASE VRC.unidadTiempoAcciones
                WHEN 'horas' THEN DATE_SUB(CONCAT(VRC.f_reserva, ' ', VRC.h_reserva), INTERVAL VRC.tiempoMaxPago HOUR)
                WHEN 'dias' THEN DATE_SUB(CONCAT(VRC.f_reserva, ' ', VRC.h_reserva), INTERVAL VRC.tiempoMaxPago DAY)
                ELSE NULL
            END
        ) < NOW();

    -- ----------------------------------------------------
    -- 3. CANCELACIÓN POR INCUMPLIMIENTO DE DOCUMENTOS (USUARIO)
    -- ----------------------------------------------------
    
    -- 3a. Se marca primero el documento como NO_CUMPLIDO si el plazo venció y no fue subido
    UPDATE DOCUMENTO_REQUISITO DR
    JOIN RESERVA R ON DR.idReserva = R.idReserva
    JOIN Vista_ReservaConfig VRC ON R.idReserva = VRC.idReserva
    SET 
        DR.estadoCumplimiento = 'NO_CUMPLIDO', -- CORREGIDO a NO_CUMPLIDO
        DR.observacion = CONCAT('Documento no subido antes del límite de fecha: ', NOW())
    WHERE
        DR.estadoCumplimiento <> 'CUMPLIDO' -- Solo si no ha sido aprobado
        AND DR.rutaArchivo IS NULL 
        AND VRC.tiempoCambioDocumentos IS NOT NULL
        AND 
        (
            CASE VRC.unidadTiempoAcciones
                WHEN 'horas' THEN DATE_SUB(CONCAT(VRC.f_reserva, ' ', VRC.h_reserva), INTERVAL VRC.tiempoCambioDocumentos HOUR)
                WHEN 'dias' THEN DATE_SUB(CONCAT(VRC.f_reserva, ' ', VRC.h_reserva), INTERVAL VRC.tiempoCambioDocumentos DAY)
                ELSE NULL
            END
        ) < NOW();

    -- 3b. Luego se cancela la reserva si tiene documentos NO_CUMPLIDOS por incumplimiento de plazo
    UPDATE RESERVA R
    JOIN Vista_ReservaConfig VRC ON R.idReserva = VRC.idReserva
    SET R.estadoReserva = 'CANCELADO'
    WHERE
        R.estadoReserva = 'PENDIENTE_DOCUMENTO' 
        AND VRC.tiempoCambioDocumentos IS NOT NULL
        AND EXISTS (
            SELECT 1 
            FROM DOCUMENTO_REQUISITO DR
            WHERE 
                DR.idReserva = R.idReserva
                AND DR.estadoCumplimiento = 'NO_CUMPLIDO' -- Verifica si algún documento fue marcado como NO_CUMPLIDO (por 3a)
                AND DR.rutaArchivo IS NULL
                AND 
                (
                    CASE VRC.unidadTiempoAcciones
                        WHEN 'horas' THEN DATE_SUB(CONCAT(VRC.f_reserva, ' ', VRC.h_reserva), INTERVAL VRC.tiempoCambioDocumentos HOUR)
                        WHEN 'dias' THEN DATE_SUB(CONCAT(VRC.f_reserva, ' ', VRC.h_reserva), INTERVAL VRC.tiempoCambioDocumentos DAY)
                        ELSE NULL
                    END
                ) < NOW()
        );
        
    -- ----------------------------------------------------
    -- 4. CANCELACIÓN POR INCUMPLIMIENTO DE PLAZO DE REVISIÓN (ADMINISTRATIVO)
    -- ----------------------------------------------------
    -- Si la fecha/hora actual es posterior al límite de aprobación de requisitos,
    -- y la reserva sigue en 'pendiente_revision' (el personal no revisó a tiempo), se cancela.
    
    UPDATE RESERVA R
    JOIN Vista_ReservaConfig VRC ON R.idReserva = VRC.idReserva
    SET R.estadoReserva = 'CANCELADO' 
    WHERE 
        R.estadoReserva = 'PENDIENTE_REVISION' 
        AND VRC.tiempoAprobacionRequisitos IS NOT NULL
        AND 
        (
            -- Calcula la fecha/hora límite de revisión (restado de la fecha de la reserva)
            CASE VRC.unidadTiempoAcciones
                WHEN 'horas' THEN DATE_SUB(CONCAT(VRC.f_reserva, ' ', VRC.h_reserva), INTERVAL VRC.tiempoAprobacionRequisitos HOUR)
                WHEN 'dias' THEN DATE_SUB(CONCAT(VRC.f_reserva, ' ', VRC.h_reserva), INTERVAL VRC.tiempoAprobacionRequisitos DAY)
                ELSE NULL
            END
        ) < NOW();

END //
DELIMITER ;

-- ===============================================
-- PASO 4: CREAR EL EVENTO PROGRAMADO
-- ===============================================
-- Crea un evento que llama al procedimiento cada 5 minutos.
-- Si el evento ya existe, esta parte lo mantiene activo.
DROP EVENT IF EXISTS EVT_RevisionAutomaticaReservas;
CREATE EVENT EVT_RevisionAutomaticaReservas
ON SCHEDULE EVERY 5 MINUTE
STARTS NOW()
DO
    CALL SP_ActualizarEstadosReserva();
    
-- ===============================================
-- NOTA IMPORTANTE:
-- Los estados de RESERVA que se actualizan son:
-- 'CONFIRMADO' -> 'ATENDIDO' (Cuando pasa la hora de fin)
-- 'pendiente_pago' -> 'CANCELADO' (Si pasa el plazo de pago)
-- 'pendiente_documento' -> 'CANCELADO' (Si pasa el plazo de documentos y no se subieron)
-- 'pendiente_revision' -> 'CANCELADO' (Si el personal no aprueba a tiempo)
-- Asegúrate de que los estados en el código coincidan con los de tu BD.
-- ===============================================