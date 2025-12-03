-- =========================
-- TABLAS BASE
-- =========================
CREATE TABLE USUARIO (
    idUsuario INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    clave VARCHAR(255) NOT NULL,
    estadoCuenta BOOLEAN NOT NULL
);

CREATE TABLE TIPO_DOCUMENTO (
    idTipoDocumento INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombDocumento VARCHAR(100) NOT NULL,
    abreviatura VARCHAR(10) NOT NULL,
    estadoDocumento BOOLEAN NOT NULL
);

-- =========================
-- PERSONAS
-- =========================
CREATE TABLE FELIGRES (
    idFeligres INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    numDocFel VARCHAR(30) NOT NULL UNIQUE,
    nombFel VARCHAR(50) NOT NULL,
    apePatFel VARCHAR(30) NOT NULL,
    apeMatFel VARCHAR(30) NOT NULL,
    f_nacimiento DATE NOT NULL,
    sexoFel CHAR(1) NOT NULL,
    direccionFel VARCHAR(150) NOT NULL,
    telefonoFel CHAR(9) NOT NULL,
    idTipoDocumento INT NOT NULL,
    idUsuario INT NOT NULL,
    CONSTRAINT fk_feligres_tipodoc FOREIGN KEY (idTipoDocumento) REFERENCES TIPO_DOCUMENTO(idTipoDocumento),
    CONSTRAINT fk_feligres_usuario FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario)
);

CREATE TABLE PERSONAL (
    idPersonal INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    numDocPers VARCHAR(30) NOT NULL UNIQUE,
    nombPers VARCHAR(100) NOT NULL,
    apePatPers VARCHAR(30) NOT NULL,
    apeMatPers VARCHAR(30) NOT NULL,
    sexoPers CHAR(1) NOT NULL,
    direccionPers VARCHAR(150) NOT NULL,
    telefonoPers CHAR(9) NOT NULL,
    idTipoDocumento INT NOT NULL,
    idUsuario INT NOT NULL,
    CONSTRAINT fk_personal_tipodoc FOREIGN KEY (idTipoDocumento) REFERENCES TIPO_DOCUMENTO(idTipoDocumento),
    CONSTRAINT fk_personal_usuario FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario)
);


-- =========================
-- ROLES Y PERMISOS
-- =========================
CREATE TABLE ROL (
    idRol INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombRol VARCHAR(30) NOT NULL,
    estadoRol BOOLEAN NOT NULL
);

CREATE TABLE ROL_USUARIO (
    idRolUsuario INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    idRol INT NOT NULL,
    idUsuario INT NOT NULL,
    CONSTRAINT fk_rolusuario_rol FOREIGN KEY (idRol) REFERENCES ROL(idRol),
    CONSTRAINT fk_rolusuario_usuario FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario)
);

CREATE TABLE PERMISO (
    idPermiso INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    tipoOperacion ENUM('INSERT', 'DELETE', 'UPDATE','STATE_CHANGE', 'SELECT') NOT NULL, 
    nombAccion VARCHAR(50) NOT NULL,
    nombTabla VARCHAR(50) NOT NULL,
    descripcionPermiso VARCHAR(255) NULL,
    estadoPermiso BOOLEAN NOT NULL
);

CREATE TABLE ROL_PERMISO (
    idRolPermiso INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    idPermiso INT NOT NULL,
    idRol INT NOT NULL,
    CONSTRAINT fk_rolpermiso_permiso FOREIGN KEY (idPermiso) REFERENCES PERMISO(idPermiso),
    CONSTRAINT fk_rolpermiso_rol FOREIGN KEY (idRol) REFERENCES ROL(idRol)
);

-- =========================
-- PARROQUIAS Y PERSONAL
-- =========================
CREATE TABLE CARGO (
    idCargo INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombCargo VARCHAR(100) NOT NULL,
    estadoCargo BOOLEAN NOT NULL
);

CREATE TABLE PARROQUIA (
    idParroquia INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombParroquia VARCHAR(100) NOT NULL,
    historiaParroquia VARCHAR(255) NULL,
    descripcionBreve VARCHAR(255) NULL,
    f_creacion DATE NOT NULL,
    ruc VARCHAR(50) NOT NULL,
    telefonoContacto VARCHAR(100) NOT NULL,
    email VARCHAR(100)NOT NULL,
    direccion VARCHAR(150) NOT NULL,
    color CHAR(7) NOT NULL,
    latParroquia DECIMAL(9,6) NULL,
    logParroquia DECIMAL(9,6) NULL,
    estadoParroquia BOOLEAN NOT NULL
);

CREATE TABLE PARROQUIA_PERSONAL (
    idParroquiaPersonal INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    f_inicio DATE NOT NULL,
    f_fin DATE NULL,
    vigenciaParrPers BOOLEAN NOT NULL,
    idParroquia INT NOT NULL,
    idCargo INT NOT NULL,
    idPersonal INT NOT NULL,
    CONSTRAINT fk_pp_parroquia FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia),
    CONSTRAINT fk_pp_cargo FOREIGN KEY (idCargo) REFERENCES CARGO(idCargo),
    CONSTRAINT fk_pp_personal FOREIGN KEY (idPersonal) REFERENCES PERSONAL(idPersonal)
);

CREATE TABLE DISPONIBILIDAD_HORARIO (
    idDisponibilidad INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    diaSemana VARCHAR(20) NOT NULL,
    horaInicioDis TIME NOT NULL,
    horaFinDis TIME NOT NULL,
    estadoDisponibilidad BOOLEAN NOT NULL,
    idParroquiaPersonal INT NOT NULL,
    CONSTRAINT fk_disp_par_pers FOREIGN KEY (idParroquiaPersonal) REFERENCES PARROQUIA_PERSONAL(idParroquiaPersonal)
);

CREATE TABLE GALERIA_PARROQUIA (
    idGaleria INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    imagen VARCHAR(255) NOT NULL,
    idParroquia INT NOT NULL,
    CONSTRAINT fk_galeria_parroquia FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia)
);

-- =========================
-- ACTOS Y REQUISITOS
-- =========================
CREATE TABLE ACTO_LITURGICO (
    idActo INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombActo VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    numParticipantes int not null,
    tipoParticipantes VARCHAR(255)not null,
    estadoActo BOOLEAN NOT NULL,
    imgActo VARCHAR(255) NOT NULL
);
CREATE TABLE ACTO_PARROQUIA(
    idActoParroquia INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    idActo INT NOT NULL,
    idParroquia INT NOT NULL,
    diaSemana char(3) NOT NULL,
    horaInicioActo time not null,
    costoBase DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_actoparroquia_acto FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo),
    CONSTRAINT fk_parroquia_acto FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia)
);

CREATE TABLE REQUISITO (
    idRequisito INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombRequisito VARCHAR(100) NOT NULL,
    f_requisito DATE NOT NULL,
    descripcion VARCHAR(255) NULL,
    estadoRequisito BOOLEAN NOT NULL
);

CREATE TABLE ACTO_REQUISITO (
    idActoRequisito INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    idActo INT NOT NULL,
    idRequisito INT NOT NULL,
    CONSTRAINT fk_actoreq_acto FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo),
    CONSTRAINT fk_actoreq_requisito FOREIGN KEY (idRequisito) REFERENCES REQUISITO(idRequisito)
);

-- =========================
-- RESERVAS Y DOCUMENTOS
-- =========================
CREATE TABLE RESERVA (
    idReserva INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    f_reserva DATE NOT NULL,
    h_reserva TIME NOT NULL,
    mencion VARCHAR(255) NULL,
    estadoReserva VARCHAR(50) NOT NULL,
    numReprogramaciones INT NOT NULL,
    estadoReprogramado BOOLEAN NOT NULL,
    vigenciaReserva DATE NOT NULL,
    idUsuario INT NOT NULL,
    idSolicitante INT not null,
    idParroquia INT NOT NULL,
    CONSTRAINT fk_reserva_usuario FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario),
    CONSTRAINT fk_reserva_solicitante FOREIGN KEY (idSolicitante) REFERENCES FELIGRES(idFeligres),
    CONSTRAINT fk_reserva_parroquia FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia)
);

CREATE TABLE DOCUMENTO_REQUISITO (
    idDocumento INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    f_subido DATE NULL,
    estadoCumplimiento VARCHAR(50) NOT NULL,
    aprobado BOOLEAN NOT NULL,
    vigenciaDocumento DATE NULL,
    observacion TEXT NULL,
    idReserva INT NOT NULL,
    idActoRequisito INT NOT NULL,
    CONSTRAINT fk_docreq_reserva FOREIGN KEY (idReserva) REFERENCES RESERVA(idReserva),
    CONSTRAINT fk_docreq_requisito FOREIGN KEY (idActoRequisito) REFERENCES ACTO_REQUISITO(idActoRequisito)
);


CREATE TABLE PARTICIPANTES_ACTO (
    idParticipante INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombParticipante VARCHAR(100) NOT NULL,
    rolParticipante VARCHAR(30) NOT NULL,
    idActo INT NOT NULL,
    idReserva INT NOT NULL,
    CONSTRAINT fk_part_reserva FOREIGN KEY (idReserva) REFERENCES RESERVA(idReserva),
    CONSTRAINT fk_part_acto FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo)
);

-- =========================
-- PAGOS
-- =========================
CREATE TABLE METODO_PAGO (
    idMetodo INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombMetodo VARCHAR(50) NOT NULL,
    estadoMetodo BOOLEAN NOT NULL
);

-- TABLA PAGO
DROP TABLE IF EXISTS PAGO;
CREATE TABLE PAGO (
    idPago INT PRIMARY KEY AUTO_INCREMENT,
    -- idReserva y la restricción UNIQUE han sido movidos a la tabla PAGO_RESERVA
    f_pago DATETIME NULL,
    montoTotal DECIMAL(10, 2) NULL, -- Suma de todos los detalles, debe coincidir con la suma de las reservas
    metodoPago VARCHAR(50) NULL, -- Ej: 'Tarjeta', 'Efectivo', 'Transferencia'
    numeroTransaccion VARCHAR(100), -- ID de la transacción bancaria/digital o nota manual
    estadoPago ENUM('PENDIENTE', 'APROBADO', 'CANCELADO') NOT NULL DEFAULT 'PENDIENTE'
);

-- TABLA PAGO_RESERVA (NUEVA TABLA DE UNIÓN)
DROP TABLE IF EXISTS PAGO_RESERVA;
CREATE TABLE PAGO_RESERVA (
    idPagoReserva INT PRIMARY KEY AUTO_INCREMENT,
    idPago INT NOT NULL,    -- Clave foránea al pago (Un pago puede tener muchas reservas)
    idReserva INT NOT NULL, -- Clave foránea a la reserva (Una reserva solo puede estar aquí una vez)
    montoReserva INT NOT NULL,
    FOREIGN KEY (idPago) REFERENCES PAGO(idPago),
    FOREIGN KEY (idReserva) REFERENCES RESERVA(idReserva),
    
    -- RESTRICCIÓN CLAVE: Una reserva solo puede aparecer una vez en esta tabla.
    CONSTRAINT UQ_Reserva_En_Pago UNIQUE (idReserva) 
);

-- =========================
-- CONFIGURACIÓN Y EXCEPCIONES
-- =========================
CREATE TABLE CONFIGURACION_ACTO (
    idConfigActo INT PRIMARY KEY AUTO_INCREMENT,
    idActo INT NOT NULL,

    -- Duración del Acto (Sigue siendo obligatorio)
    tiempoDuracion INT NOT NULL,                  -- Duración en minutos

    -- Tiempos de Límites de Acción (Ahora Opcionales/NULL)
    tiempoMaxCancelacion INT NOT NULL,            -- Máx. tiempo antes del acto que se puede cancelar
    tiempoMaxReprogramacion INT NOT NULL,         -- Máx. tiempo antes del acto que se puede reprogramar
    tiempoAprobacionRequisitos INT NOT NULL,      -- Tiempo límite para aprobar requisitos
    tiempoCambioDocumentos INT NOT NULL,          -- Tiempo límite para cambiar documentos
    tiempoMaxPago INT NOT NULL,                   -- Tiempo máximo para realizar el pago

    -- Rango de Reserva (Ahora Opcionales/NULL)
    tiempoMinimoReserva INT NULL,             -- Mínimo de tiempo de anticipación para reservar
    tiempoMaximoReserva INT NULL,             -- Máximo de tiempo de anticipación para reservar

    -- Configuración General
    maxActosPorDia INT NULL,                 -- Cuántos actos de este tipo se pueden celebrar por día
    
    -- Unidades de Tiempo (Estas deben ser NOT NULL si se usan los campos de tiempo)
    -- Podrías considerar hacerlas NULL también, o usar el ENUM solo si el tiempo NO es NULL.
    unidadTiempoAcciones ENUM('horas', 'dias') NOT NULL,
    unidadTiempoReserva ENUM('dias', 'meses', 'años') NOT NULL, 

    estadoConfiguracion BOOLEAN NOT NULL,
    CONSTRAINT fk_configacto_acto FOREIGN KEY (idActo)
        REFERENCES ACTO_LITURGICO(idActo)
);

CREATE TABLE NOTIFICACION (
    idNotificacion INT AUTO_INCREMENT PRIMARY KEY,
    idUsuario INT NOT NULL,
    titulo VARCHAR(100),
    mensaje TEXT,
    leido TINYINT(1) DEFAULT 0, -- 0: No leído, 1: Leído
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    enlace VARCHAR(255), -- Ejemplo: '/cliente/mis_reservas'
    icono VARCHAR(50) DEFAULT 'info', -- 'info', 'check', 'warning'
    CONSTRAINT fk_notif_usuario FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario)
);