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
    abreviatura CHAR(3) NOT NULL,
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
-- AUDITORÍAS
-- =========================
CREATE TABLE AUDITORIA_USUARIO (
    idAuditoria INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    fechaHora DATETIME NOT NULL,
    nombreTabla VARCHAR(50) NOT NULL,
    tipoAccion VARCHAR(10) NOT NULL,
    idRegistroAfectado INT NOT NULL,
    nombreCampo VARCHAR(50) NULL,
    valorAnterior VARCHAR(255) NULL,
    valorNuevo VARCHAR(255) NULL
);

CREATE TABLE AUDITORIA_RESERVA (
    idAuditoria INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    fechaHora DATETIME NOT NULL,
    nombreTabla VARCHAR(50) NOT NULL,
    tipoAccion VARCHAR(10) NOT NULL,
    idRegistroAfectado INT NOT NULL,
    nombreCampo VARCHAR(50) NULL,
    valorAnterior VARCHAR(255) NULL,
    valorNuevo VARCHAR(255) NULL
);

CREATE TABLE AUDITORIA_PARROQUIA (
    idAuditoria INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    fechaHora DATETIME NOT NULL,
    nombreTabla VARCHAR(50) NOT NULL,
    tipoAccion VARCHAR(10) NOT NULL,
    idRegistroAfectado INT NOT NULL,
    nombreCampo VARCHAR(50) NULL,
    valorAnterior VARCHAR(255) NULL,
    valorNuevo VARCHAR(255) NULL
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
    nombCargo VARCHAR(30) NOT NULL,
    estadoCargo BOOLEAN NOT NULL
);

CREATE TABLE PARROQUIA (
    idParroquia INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombParroquia VARCHAR(100) NOT NULL,
    historiaParroquia VARCHAR(255) NULL,
    ruc VARCHAR(30) NOT NULL UNIQUE,
    telefonoContacto VARCHAR(100) NOT NULL,
    direccion VARCHAR(150) NULL,
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
    costoBase DECIMAL(8,2) NOT NULL DEFAULT 0.00,
    estadoActo BOOLEAN NOT NULL,
    imgActo VARCHAR(255) NULL,
    idParroquia INT NOT NULL,
    CONSTRAINT fk_acto_parroquia FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia)
);

CREATE TABLE REQUISITO (
    idRequisito INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombRequisito VARCHAR(100) NOT NULL,
    f_requisito DATE NULL,
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
    observaciones VARCHAR(255) NULL,
    estadoReserva VARCHAR(50) NOT NULL,
    numReprogramaciones INT NOT NULL,
    estadoReprogramado BOOLEAN NOT NULL,
    vigenciaReserva BOOLEAN NOT NULL,
    idUsuario INT NOT NULL,
    CONSTRAINT fk_reserva_usuario FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario)
);

CREATE TABLE DOCUMENTO_REQUISITO (
    idDocumento INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    rutaArchivo VARCHAR(255) NOT NULL,
    tipoArchivo VARCHAR(100) NULL,
    f_subido DATETIME NOT NULL,
    estadoCumplimiento VARCHAR(50) NOT NULL,
    vigenciaDocumento BOOLEAN NOT NULL,
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

CREATE TABLE PAGO (
    idPago INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    montoTotal DECIMAL(8,2) NOT NULL,
    f_transaccion DATETIME NOT NULL,
    numTarjeta VARCHAR(30) NULL,
    estadoPago VARCHAR(50) NOT NULL,
    vigenciaPago BOOLEAN NOT NULL,
    idMetodo INT NOT NULL,
    idReserva INT NOT NULL,
    CONSTRAINT fk_pago_metodo FOREIGN KEY (idMetodo) REFERENCES METODO_PAGO(idMetodo),
    CONSTRAINT fk_pago_reserva FOREIGN KEY (idReserva) REFERENCES RESERVA(idReserva)
);

-- =========================
-- CONFIGURACIÓN Y EXCEPCIONES
-- =========================
CREATE TABLE CONFIGURACION (
    idConfiguracion INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombClave VARCHAR(150) NOT NULL,
    unidad VARCHAR(50) NOT NULL,
    valor VARCHAR(30) NOT NULL,
    descripcion VARCHAR(255) NULL,
    estadoConfiguracion BOOLEAN NOT NULL
);

CREATE TABLE EXCEPCION_PERSONAL (
    idExcepcion INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombreExcepcion VARCHAR(100) NOT NULL,
    fechaInicioExcepcion DATE NOT NULL,
    fechaFinExcepcion DATE,
    motivoExcepcion VARCHAR(255) NOT NULL,
    tipoExcepcion VARCHAR(100) NOT NULL,
    estadoExcepcion BOOLEAN NOT NULL,
    idPersonal INT NOT NULL,
    CONSTRAINT fk_excepcion_personal FOREIGN KEY (idPersonal) REFERENCES PERSONAL(idPersonal)
);
