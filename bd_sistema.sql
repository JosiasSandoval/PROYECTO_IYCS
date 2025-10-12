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

CREATE TABLE AUDITORIA (
    idAuditoria INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    fechaHora DATETIME NOT NULL,
    nombreTabla VARCHAR(50) NOT NULL,
    tipoAccion VARCHAR(10) NOT NULL,
    idRegistroAfectado INT NOT NULL,
    nombreCampo VARCHAR(50) NULL,
    valorAnterior VARCHAR(255) NULL,
    valorNuevo VARCHAR(255) NULL,
    idUsuario INT NOT NULL,
    CONSTRAINT fk_auditoria_usuario FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario)
);

CREATE TABLE ROL (
    idRol INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombRol VARCHAR(30) NOT NULL,
    estadoRol BOOLEAN NOT NULL
);

CREATE TABLE ROL_USUARIO (
    idRol INT NOT NULL,
    idUsuario INT NOT NULL,
    PRIMARY KEY (idRol, idUsuario),
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
    idPermiso INT NOT NULL,
    idRol INT NOT NULL,
    PRIMARY KEY (idPermiso, idRol),
    CONSTRAINT fk_rolpermiso_permiso FOREIGN KEY (idPermiso) REFERENCES PERMISO(idPermiso),
    CONSTRAINT fk_rolpermiso_rol FOREIGN KEY (idRol) REFERENCES ROL(idRol)
);

CREATE TABLE DISPONIBILIDAD_HORARIOS (
    idDisponibilidad INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    diaSemana VARCHAR(20) NOT NULL,
    horaInicio TIME NOT NULL,
    horaFin TIME NOT NULL,
    f_especifica DATE NULL,
    recurrente BOOLEAN NOT NULL,
    idUsuario INT NOT NULL,
    CONSTRAINT fk_disp_usuario FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario)
);

CREATE TABLE CARGO (
    idCargo INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombCargo VARCHAR(30) NOT NULL,
    estadoCargo BOOLEAN NOT NULL
);

CREATE TABLE PARROQUIA (
    idParroquia INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombParroquia VARCHAR(100) NOT NULL,
    descripcionBreve VARCHAR(255) NULL,
    historiaParroquia VARCHAR(255) NULL,
    ruc VARCHAR(30) NOT NULL UNIQUE,
    telefonoContacto VARCHAR(100) NOT NULL,
    infoAdicional VARCHAR(255) NULL,
    horaAtencionInicial TIME NOT NULL,
    horaAtencionFinal TIME NOT NULL,
    f_creacion DATE NOT NULL,
    direccion VARCHAR(150) NULL,
    latParroquia DECIMAL(9,6) NULL,
    logParroquia DECIMAL(9,6) NULL,
    estadoParroquia BOOLEAN NOT NULL
);

CREATE TABLE PARROQUIA_USUARIO (
    idParroquiaUsuario INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    f_inicio DATE NOT NULL,
    f_fin DATE NULL,
    vigencia BOOLEAN NOT NULL,
    idParroquia INT NOT NULL,
    idCargo INT NOT NULL,
    idUsuario INT NOT NULL,
    CONSTRAINT fk_pu_parroquia FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia),
    CONSTRAINT fk_pu_cargo FOREIGN KEY (idCargo) REFERENCES CARGO(idCargo),
    CONSTRAINT fk_pu_usuario FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario)
);

CREATE TABLE GALERIA_PARROQUIA (
    idGaleria INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    imagen VARCHAR(255) NOT NULL,
    idParroquia INT NOT NULL,
    CONSTRAINT fk_galeria_parroquia FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia)
);

CREATE TABLE EVENTO (
    idEvento INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombEvento VARCHAR(150) NOT NULL,
    f_inicio DATE NOT NULL,
    f_fin DATE NULL,
    estadoEvento BOOLEAN NOT NULL
);

CREATE TABLE EVENTO_PARROQUIA (
    idEvento INT NOT NULL,
    idParroquia INT NOT NULL,
    PRIMARY KEY (idEvento, idParroquia),
    CONSTRAINT fk_eventop_evento FOREIGN KEY (idEvento) REFERENCES EVENTO(idEvento),
    CONSTRAINT fk_eventop_parroquia FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia)
);

CREATE TABLE ACTO_LITURGICO (
    idActo INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombActo VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NULL,
    costoBase DECIMAL(5,2) NOT NULL DEFAULT 0.00,
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
    idActo INT NOT NULL,
    idRequisito INT NOT NULL,
    obligatorio BOOLEAN NOT NULL,
    PRIMARY KEY (idActo, idRequisito),
    CONSTRAINT fk_actoreq_acto FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo),
    CONSTRAINT fk_actoreq_requisito FOREIGN KEY (idRequisito) REFERENCES REQUISITO(idRequisito)
);

CREATE TABLE RESERVA (
    idReserva INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    cliente VARCHAR(100) NOT NULL,
    f_reserva DATE NOT NULL,
    h_reserva TIME NOT NULL,
    observaciones VARCHAR(255) NULL,
    estadoReserva VARCHAR(50) NOT NULL,
    motivoCancelacion VARCHAR(255) NULL,
    numReprogramaciones INT NOT NULL,
    estadoReprogramado BOOLEAN NOT NULL,
    idActo INT NOT NULL,
    idPersonal INT NOT NULL,
    idFeligres INT NOT NULL,
    CONSTRAINT fk_reserva_acto FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo),
    CONSTRAINT fk_reserva_personal FOREIGN KEY (idPersonal) REFERENCES PERSONAL(idPersonal),
    CONSTRAINT fk_reserva_feligres FOREIGN KEY (idFeligres) REFERENCES FELIGRES(idFeligres)
);

CREATE TABLE DOCUMENTO_REQUISITO (
    idDocumento INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    rutaArchivo VARCHAR(255) NOT NULL,
    tipoArchivo VARCHAR(100) NULL,
    f_subido DATETIME NOT NULL,
    idReserva INT NOT NULL,
    idRequisito INT NOT NULL,
    CONSTRAINT fk_docreq_reserva FOREIGN KEY (idReserva) REFERENCES RESERVA(idReserva),
    CONSTRAINT fk_docreq_requisito FOREIGN KEY (idRequisito) REFERENCES REQUISITO(idRequisito)
);

CREATE TABLE PARTICIPANTES_ACTO (
    idParticipante INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombParticipante VARCHAR(100) NOT NULL,
    rol VARCHAR(30) NOT NULL,
    idActo INT NOT NULL,
    CONSTRAINT fk_part_acto FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo)
);

CREATE TABLE DESCUENTO (
    idDescuento INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    porcentaje DECIMAL(5,2) NOT NULL,
    f_inicio DATE NOT NULL,
    f_fin DATE NULL,
    condicion VARCHAR(255) NULL,
    estadoDescuento BOOLEAN NOT NULL 
);

CREATE TABLE METODO_PAGO (
    idMetodo INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombMetodo VARCHAR(50) NOT NULL,
    estadoMetodo BOOLEAN NOT NULL
);

CREATE TABLE PAGO (
    idPago INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    montoTotal DECIMAL(6,2) NOT NULL,
    f_transaccion DATETIME NOT NULL,
    numTarjeta VARCHAR(30) NULL,
    estadoPago VARCHAR(50) NOT NULL,
    idMetodo INT NOT NULL,
    idReserva INT NOT NULL,
    CONSTRAINT fk_pago_metodo FOREIGN KEY (idMetodo) REFERENCES METODO_PAGO(idMetodo),
    CONSTRAINT fk_pago_reserva FOREIGN KEY (idReserva) REFERENCES RESERVA(idReserva)
);

CREATE TABLE APLICACION_DESCUENTO (
    idDescuento INT NOT NULL,
    idPago INT NOT NULL,
    montoDescuento DECIMAL(5,2) NOT NULL,
    f_aplicacion DATE NOT NULL,
    PRIMARY KEY (idDescuento, idPago),
    CONSTRAINT fk_aplic_desc_fkdesc FOREIGN KEY (idDescuento) REFERENCES DESCUENTO(idDescuento),
    CONSTRAINT fk_aplic_desc_fkpago FOREIGN KEY (idPago) REFERENCES PAGO(idPago)
);

CREATE TABLE CONFIGURACION (
    idConfiguracion INT PRIMARY KEY AUTO_INCREMENT NOT NULL,
    nombClave VARCHAR(150) NOT NULL,
    unidad VARCHAR(50) NOT NULL,
    valor VARCHAR(30) NOT NULL,
    descripcion VARCHAR(255) NULL,
    idActo INT NOT NULL,
    CONSTRAINT fk_config_acto FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo)
);
