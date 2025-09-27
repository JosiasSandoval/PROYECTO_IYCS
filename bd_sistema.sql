-- TABLAS DE UBICACIÓN
CREATE TABLE PROVINCIA (
    idProvincia INT PRIMARY KEY AUTO_INCREMENT not null,
    nombProvincia VARCHAR(100) not null,
    latProvincia decimal(9,6) not null,
    logProvincia decimal(9,6) not null
);

CREATE TABLE DISTRITO (
    idDistrito INT PRIMARY KEY AUTO_INCREMENT not null,
    nombDistrito VARCHAR(100) not null,
    latDistrito  decimal(9,6) not null,
    logDistrito  decimal(9,6) not null,
    idProvincia INT not null,
    FOREIGN KEY (idProvincia) REFERENCES PROVINCIA(idProvincia)
);

-- TABLAS DE PARROQUIA
CREATE TABLE PARROQUIA (
    idParroquia INT PRIMARY KEY AUTO_INCREMENT not null,
    nombParroquia VARCHAR(120) not null,
    descripcionBreve VARCHAR(255) not null,
    historiaParroquia VARCHAR(255) not null,
    ruc INT UNIQUE not null,
    contacto INT not null,
    f_creacion DATE not null,
    direccion VARCHAR(100) not null,
    latParroquia DECIMAL(9,6) NOT NULL,
    logParroquia DECIMAL(9,6) NOT NULL
    estadoParroquia boolean not null,
    idDistrito INT not null,
    FOREIGN KEY (idDistrito) REFERENCES DISTRITO(idDistrito)
);

-- TABLAS DE USUARIO
CREATE TABLE TIPO_DOCUMENTO (
    idTipoDocumento INT PRIMARY KEY AUTO_INCREMENT not null,
    nombDocumento VARCHAR(100) not null
);

CREATE TABLE CARGO (
    idCargo INT PRIMARY KEY AUTO_INCREMENT not null,
    nombCargo VARCHAR(255) not null
);

CREATE TABLE TIPO_USUARIO (
    idTipoUsua INT PRIMARY KEY AUTO_INCREMENT not null,
    nomTipoUsua VARCHAR(100) not null
);

CREATE TABLE USUARIO (
    idUsuario INT PRIMARY KEY AUTO_INCREMENT not null,
    nombUsuario VARCHAR(100) not null,
    apelUsuario VARCHAR(100) not null,
    numDocumento INT UNIQUE not null,
    emailUsuario VARCHAR(100) not null,
    direccionUsua VARCHAR(150),
    telefono CHAR(9) not null,
    claveUsuario CHAR(8) not null,
    idTipoDocumento INT not null,
    idTipoUsua INT not null,
    idCargo INT not null,
    FOREIGN KEY (idTipoDocumento) REFERENCES TIPO_DOCUMENTO(idTipoDocumento),
    FOREIGN KEY (idTipoUsua) REFERENCES TIPO_USUARIO(idTipoUsua),
    FOREIGN KEY (idCargo) REFERENCES CARGO(idCargo)
);

CREATE TABLE PARROQUIA_USUARIO (
    idParroquiaUsuario INT PRIMARY KEY AUTO_INCREMENT not null,
    f_inicio DATE not null,
    f_fin DATE,
    estadoUsu boolean not null,
    idUsuario INT not null,
    idParroquia INT not null,
    FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario),
    FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia)
);

-- TABLAS DE RESERVAS Y ACTOS
CREATE TABLE ACTO_LITURGICO (
    idActo INT PRIMARY KEY AUTO_INCREMENT not null,
    nombActo VARCHAR(100) not null,
    precio DECIMAL(9,2) not null,
    estadoActo boolean not null,
    idParroquia INT not null,
    FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia)
);

CREATE TABLE RESERVA(
    idReserva INT PRIMARY KEY AUTO_INCREMENT not null,
    dirigido VARCHAR(150) not null
    f_reserva DATE not null,
    f_acto DATE not null,
    relacionFamiliar VARCHAR(100) not null,
    observaciones VARCHAR(255) not null,
    idUsuario INT not null,
    idActo INT not null,
    FOREIGN KEY (idUsuario) REFERENCES USUARIO(idUsuario),
    FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo)
);

CREATE TABLE PARTICIPANTES_ACTO (
    idParticipante INT PRIMARY KEY AUTO_INCREMENT not null,
    nombParticipante VARCHAR(150) not null,
    rol VARCHAR(150) not null,
    idActo INT not null,
    FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo)
);

-- TABLAS DE REQUISITOS Y DOCUMENTOS
CREATE TABLE REQUISITOS (
    idRequisito INT PRIMARY KEY AUTO_INCREMENT not null,
    nombRequisito VARCHAR(100) not null,
    f_requisito DATE not null,
    descripcion VARCHAR(255) not null
);

CREATE TABLE ACTO_REQUISITO (
    idActo INT not null,
    idRequisito INT not null,
    obligatorio boolean not null,
    PRIMARY KEY (idActo, idRequisito),
    FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo),
    FOREIGN KEY (idRequisito) REFERENCES REQUISITOS(idRequisito)
);

CREATE TABLE DOCUMENTO_REQUISITO (
    idDocumento INT PRIMARY KEY AUTO_INCREMENT not null,
    rutaArchivo varchar(255) not null,
    tipoArchivo VARCHAR(50) not null,
    f_subido DATE not null,
    idReserva INT not null,
    idRequisito INT not null,
    FOREIGN KEY (idReserva) REFERENCES RESERVA(idReserva),
    FOREIGN KEY (idRequisito) REFERENCES REQUISITOS(idRequisito)
);

-- TABLAS DE PAGOS Y DESCUENTOS
CREATE TABLE METODO_PAGO(
    idMetodo INT PRIMARY KEY AUTO_INCREMENT not null,
    nombMetodo VARCHAR(150) not null
);

CREATE TABLE DESCUENTO (
    idDescuento INT PRIMARY KEY AUTO_INCREMENT not null,
    porcentaje DECIMAL(4,2) not null,
    f_inicio DATE not null,
    f_fin DATE not null,
    codicion INT not null,
    activo boolean not null
);

CREATE TABLE PAGO(
    idPago INT PRIMARY KEY AUTO_INCREMENT not null,
    monto DECIMAL(9,2) not null,
    f_pago DATE,
    numTarjeta INT not null,
    estadoPago VARCHAR(100) not null,
    idMetodo INT not null,
    idDescuento INT not null,
    idReserva INT not null,
    FOREIGN KEY (idMetodo) REFERENCES METODO_PAGO(idMetodo),
    FOREIGN KEY (idDescuento) REFERENCES DESCUENTO(idDescuento),
    FOREIGN KEY (idReserva) REFERENCES RESERVA(idReserva)
);

-- TABLAS DE REPROGRAMACIÓN
CREATE TABLE REPROGRAMACION (
    idReprogramacion INT PRIMARY KEY AUTO_INCREMENT not null,
    f_anterior DATE not null,
    h_anterior DATE not null,
    f_nueva DATE not null,
    h_nueva DATE not null,
    motivo VARCHAR(255) not null,
    reprogramacion DATE not null,
    usuario_reprogramo INT not null,
    idReserva INT not null,
    FOREIGN KEY (idReserva) REFERENCES RESERVA(idReserva),
    FOREIGN KEY (usuario_reprogramo) REFERENCES USUARIO(idUsuario)
);

-- TABLAS DE HORARIOS Y DÍAS
CREATE TABLE DIA (
    idDia INT PRIMARY KEY AUTO_INCREMENT not null,
    nombDia VARCHAR(10) not null
);

CREATE TABLE HORARIO(
    idHorario INT PRIMARY KEY AUTO_INCREMENT not null,
    f_inicio DATE not null,
    f_fin DATE not null,
    nombServicio VARCHAR(150) not null,
    idDia INT not null,
    idParroquia INT not null,
    FOREIGN KEY (idDia) REFERENCES DIA(idDia),
    FOREIGN KEY (idParroquia) REFERENCES PARROQUIA(idParroquia)
);

-- TABLAS DE POLÍTICAS
CREATE TABLE POLITICAS (
    idPolitica INT PRIMARY KEY AUTO_INCREMENT not null,
    nombPolitica VARCHAR(150) not null,
    descripcion VARCHAR(255) not null,
    valorDias INT not null,
    estadoPolitica boolean not null
);

CREATE TABLE ACTO_LITURGICO_POLITICAS (
    idActo INT not null,
    idPolitica INT not null,
    PRIMARY KEY (idActo, idPolitica),
    FOREIGN KEY (idActo) REFERENCES ACTO_LITURGICO(idActo),
    FOREIGN KEY (idPolitica) REFERENCES POLITICAS(idPolitica)
);
