INSERT INTO TIPO_DOCUMENTO (nombDocumento, abreviatura, estadoDocumento) VALUES
('Documento Nacional de Identidad', 'DNI', TRUE),
('Carnet de Extranjería', 'CEX', TRUE),
('Pasaporte', 'PAS', TRUE),
('Registro Único de Contribuyentes', 'RUC', TRUE),
('Partida de Nacimiento', 'PDN', TRUE),
('Licencia de Conducir', 'LIC', TRUE),
('Carnet Universitario', 'CUNI', TRUE),
('Carnet de Biblioteca', 'CBIB', TRUE),
('Tarjeta de Identificación Militar', 'TIM', TRUE),
('Tarjeta de Seguro Social', 'TSS', TRUE),
('Certificado de Bautismo', 'CBT', TRUE),
('Certificado de Confirmación', 'CCF', TRUE),
('Certificado de Matrimonio', 'CMA', TRUE),
('Certificado de Defunción', 'CDE', TRUE),
('Constancia de Soltería', 'CSO', TRUE),
('Tarjeta de Identificación Laboral', 'TIL', TRUE),
('Carnet de Voluntariado', 'CVO', TRUE),
('Constancia de Estudios', 'CES', TRUE),
('Certificado de Primera Comunión', 'CPC', TRUE),
('Carnet Parroquial', 'CPA', TRUE),
('Carnet de Donante de Sangre', 'CDS', TRUE),
('Permiso Temporal de Permanencia', 'PTP', TRUE),
('Credencial Ministerial', 'CRM', TRUE),
('Certificado Médico', 'CMED', TRUE),
('Carnet de Colegiatura Profesional', 'CCP', TRUE);

INSERT INTO PARROQUIA 
(nombParroquia, historiaParroquia, descripcionBreve, f_creacion, ruc, telefonoContacto, email, direccion, color, latParroquia, logParroquia, estadoParroquia)
VALUES
-- === PARROQUIAS DE CHICLAYO ===
('Parroquia Santa María Catedral', 'Iglesia principal de Chiclayo, centro espiritual y cultural de la diócesis.', 'Centro espiritual y cultural de la diócesis', '1620-05-15', '20123456781', '074-221001', 'santamaria@parroquia.pe', 'Plaza de Armas, Chiclayo', '#FFD700', -6.771020, -79.840490, TRUE),
('Parroquia San Antonio de Padua', 'Fundada en 1952, destaca por su acción social y educativa.', 'Parroquia educativa y social', '1952-08-10', '20456789123', '074-224502', 'sanantonio@parroquia.pe', 'Av. Grau 456, Chiclayo', '#A52A2A', -6.772310, -79.840120, TRUE),
('Parroquia San Pedro', 'Parroquia histórica que promueve la devoción y las tradiciones lambayecanas.', 'Promueve devoción y tradiciones locales', '1930-03-12', '20567891234', '074-227303', 'sanpedro@parroquia.pe', 'Calle San Pedro 231, Chiclayo', '#2E8B57', -6.771210, -79.841980, TRUE),
('Parroquia San Vicente de Paúl', 'Inspirada en la caridad cristiana, apoya comunidades vulnerables.', 'Apoya comunidades vulnerables', '1965-06-22', '20678912345', '074-226606', 'sanvicente@parroquia.pe', 'Av. Bolognesi 890, Chiclayo', '#4682B4', -6.774510, -79.841200, TRUE),
('Parroquia San José Obrero', 'Conocida por su trabajo con familias y jóvenes.', 'Trabajo con familias y jóvenes', '1970-09-05', '20789123456', '074-225707', 'sanjose@parroquia.pe', 'Av. Balta 1030, Chiclayo', '#FF8C00', -6.772890, -79.838960, TRUE),
('Parroquia Cristo Rey', 'Comunidad joven dedicada a la evangelización urbana.', 'Evangelización urbana', '1985-04-12', '20891234567', '074-229808', 'cristorey@parroquia.pe', 'Urb. Santa Victoria Mz. C Lt. 5, Chiclayo', '#6A5ACD', -6.769540, -79.833910, TRUE),
('Parroquia Nuestra Señora de Fátima', 'Centro de oración y formación espiritual.', 'Formación espiritual', '1990-07-20', '20912345678', '074-222909', 'fatima@parroquia.pe', 'Av. Salaverry 512, Chiclayo', '#DB7093', -6.773940, -79.842710, TRUE),
('Parroquia San Juan Bautista', 'Fundada en los años 80, orientada a la pastoral juvenil.', 'Pastoral juvenil', '1982-11-15', '20134567892', '074-220010', 'sanjuan@parroquia.pe', 'Av. Progreso 601, Chiclayo', '#008080', -6.775310, -79.844520, TRUE),

-- === PARROQUIAS DE LAMBAYEQUE ===
('Parroquia San Pedro Apóstol', 'Parroquia matriz de la ciudad de Lambayeque.', 'Parroquia matriz', '1900-01-10', '20245678903', '074-282111', 'sanpedroapostol@parroquia.pe', 'Plaza de Armas, Lambayeque', '#DAA520', -6.701520, -79.906110, TRUE),
('Parroquia San Roque', 'Conocida por la tradicional festividad del Santo Patrón San Roque.', 'Festividad del Santo Patrón', '1920-03-20', '20356789014', '074-284212', 'sanroque@parroquia.pe', 'Jr. 8 de Octubre 215, Lambayeque', '#CD5C5C', -6.703340, -79.905430, TRUE),
('Parroquia Santa Lucía', 'Lugar de peregrinación y oración comunitaria.', 'Lugar de peregrinación', '1915-05-18', '20467890125', '074-285313', 'santalucia@parroquia.pe', 'Av. San Martín 300, Lambayeque', '#556B2F', -6.704870, -79.908410, TRUE),
('Parroquia San Martín de Porres', 'Atiende a comunidades rurales y promueve obras de caridad.', 'Obras de caridad', '1960-09-12', '20578901236', '074-286414', 'sanmartin@parroquia.pe', 'Calle Bolívar 180, Lambayeque', '#8B0000', -6.706130, -79.907320, TRUE),
('Parroquia Sagrado Corazón de Jesús', 'Con enfoque en la familia y formación catequética.', 'Formación catequética', '1975-12-01', '20689012347', '074-288515', 'sagradocorazon@parroquia.pe', 'Calle Junín 420, Lambayeque', '#6495ED', -6.702980, -79.904210, TRUE),
('Parroquia Virgen del Carmen', 'Ubicada en el barrio El Porvenir, promueve la solidaridad.', 'Promueve la solidaridad', '1980-06-10', '20790123458', '074-289616', 'virgendelcarmen@parroquia.pe', 'Av. Augusto B. Leguía 601, Lambayeque', '#B8860B', -6.705720, -79.902340, TRUE),

-- === PARROQUIAS DE FERREÑAFE ===
('Parroquia Santa Lucía de Ferreñafe', 'Catedral de la provincia de Ferreñafe, símbolo de fe y cultura.', 'Catedral de Ferreñafe', '1870-04-05', '20801234569', '074-285717', 'santaluciaferre@parroquia.pe', 'Plaza de Armas, Ferreñafe', '#C71585', -6.636540, -79.789880, TRUE),
('Parroquia San Martín de Tours', 'Comunidad activa en la catequesis y servicio social.', 'Catequesis y servicio social', '1925-09-18', '20912345670', '074-286818', 'sanmartintours@parroquia.pe', 'Calle San Martín 145, Ferreñafe', '#32CD32', -6.638150, -79.790220, TRUE),
('Parroquia Señor de los Milagros', 'Promueve la devoción popular y ayuda a enfermos.', 'Devoción popular', '1935-10-10', '20123456791', '074-287919', 'señordemilagros@parroquia.pe', 'Av. Grau 700, Ferreñafe', '#FF4500', -6.639780, -79.791540, TRUE),
('Parroquia Virgen de la Merced', 'Lugar de acogida y servicio a comunidades rurales.', 'Acogida comunitaria', '1940-07-22', '20234567892', '074-288020', 'virgendelamerced@parroquia.pe', 'Jr. Ayacucho 220, Ferreñafe', '#708090', -6.637890, -79.788630, TRUE),
('Parroquia San Pablo', 'Nueva comunidad creada para atender zonas periféricas.', 'Atiende zonas periféricas', '1988-02-15', '20345678903', '074-289121', 'sanpablo@parroquia.pe', 'Av. San Pablo 500, Ferreñafe', '#9932CC', -6.641230, -79.792770, TRUE),

-- === PARROQUIAS RURALES / DISTRITOS ===
('Parroquia San Isidro Labrador', 'Parroquia rural del distrito de Monsefú, dedicada al patrono agricultor.', 'Parroquia rural agrícola', '1968-03-05', '20456789014', '074-291222', 'sanisidro@parroquia.pe', 'Plaza de Armas, Monsefú', '#8B4513', -6.878210, -79.871430, TRUE),
('Parroquia Nuestra Señora del Rosario', 'Ubicada en Pimentel, centro de actividades parroquiales y juveniles.', 'Centro parroquial y juvenil', '1972-05-18', '20567890125', '074-292323', 'rosario@parroquia.pe', 'Av. Grau 120, Pimentel', '#E9967A', -6.836250, -79.934810, TRUE),
('Parroquia San Juan Bautista de Eten', 'Famosa por la tradicional festividad del Divino Niño del Milagro.', 'Festividad del Divino Niño', '1985-12-12', '20678901236', '074-293424', 'sanjuaneten@parroquia.pe', 'Plaza de Armas, Ciudad Eten', '#DC143C', -6.905120, -79.857660, TRUE),
('Parroquia Santa Rosa de Lima', 'Parroquia central del distrito de Santa Rosa, con fuerte vida comunitaria.', 'Vida comunitaria', '1990-09-30', '20789012347', '074-294525', 'santarosa@parroquia.pe', 'Plaza Principal, Santa Rosa', '#00CED1', -6.771880, -79.921450, TRUE);

INSERT INTO CARGO (nombCargo, estadoCargo) VALUES
('Párroco', TRUE),
('Vicario', TRUE),
('Secretario Parroquial', TRUE),
('Catequista', TRUE),
('Sacristán', TRUE),
('Coordinador de Liturgia', TRUE),
('Encargado de Reservas', TRUE),
('Administrador', TRUE),
('Monaguillo', TRUE),
('Músico Litúrgico', TRUE),
('Coordinador de Matrimonios', TRUE),
('Coordinador de Bautismos', TRUE),
('Coordinador de Confirmaciones', TRUE),
('Responsable de Intenciones de Misa', TRUE),
('Encargado de Registro de Actas', TRUE),
('Encargado de Tesorería', TRUE),
('Coordinador de Comunión', TRUE),
('Asistente Pastoral', TRUE),
('Voluntario de Atención', TRUE),
('Encargado de Logística', TRUE);

INSERT INTO METODO_PAGO (nombMetodo, estadoMetodo) VALUES
('Efectivo', TRUE),
('Tarjeta de Crédito', TRUE),
('Tarjeta de Débito', TRUE),
('Transferencia Bancaria', TRUE),
('Yape', TRUE),
('Plin', TRUE),
('Depósito en Cuenta', TRUE),
('Pago en Línea', TRUE),
('Billetera Digital', TRUE),
('Cheque', TRUE);


INSERT INTO ROL (nombRol, estadoRol) VALUES
('Administrador', TRUE),
('Sacerdote', TRUE),
('Secretaria', TRUE),
('Feligres', TRUE),
('Invitado', TRUE);

INSERT INTO PERMISO (tipoOperacion, nombAccion, nombTabla, descripcionPermiso, estadoPermiso) VALUES
-- ===================== USUARIO =====================
('INSERT', 'Crear Usuario', 'USUARIO', 'Registrar nuevo usuario en el sistema', TRUE),
('UPDATE', 'Editar Usuario', 'USUARIO', 'Modificar información de un usuario', TRUE),
('STATE_CHANGE', 'Cambiar Estado Usuario', 'USUARIO', 'Activar o desactivar un usuario', TRUE),
('SELECT', 'Ver Usuarios', 'USUARIO', 'Listar todos los usuarios del sistema', TRUE),

-- ===================== ROL =====================
('INSERT', 'Crear Rol', 'ROL', 'Registrar un nuevo rol de usuario', TRUE), 
('UPDATE', 'Editar Rol', 'ROL', 'Modificar información del rol', TRUE),
('STATE_CHANGE', 'Cambiar Estado Rol', 'ROL', 'Activar o desactivar un rol', TRUE),
('SELECT', 'Ver Roles', 'ROL', 'Visualizar todos los roles disponibles', TRUE),

-- ===================== ROL_USUARIO =====================
('INSERT', 'Asignar Rol a Usuario', 'ROL_USUARIO', 'Asignar un rol a un usuario específico', TRUE),
('DELETE', 'Quitar Rol a Usuario', 'ROL_USUARIO', 'Eliminar un rol asignado a un usuario', TRUE),
('SELECT', 'Ver Roles por Usuario', 'ROL_USUARIO', 'Consultar roles asignados a usuarios', TRUE),

-- ===================== PERMISO =====================
('INSERT', 'Registrar Permiso', 'PERMISO', 'Registrar un nuevo permiso del sistema', TRUE),
('UPDATE', 'Editar Permiso', 'PERMISO', 'Modificar la información de un permiso', TRUE),
('STATE_CHANGE', 'Cambiar Estado Permiso', 'PERMISO', 'Activar o desactivar un permiso', TRUE),
('SELECT', 'Listar Permisos', 'PERMISO', 'Visualizar todos los permisos registrados', TRUE),

-- ===================== ROL_PERMISO =====================
('INSERT', 'Asignar Permiso a Rol', 'ROL_PERMISO', 'Asignar permisos a un rol', TRUE),
('DELETE', 'Eliminar Permiso de Rol', 'ROL_PERMISO', 'Quitar permisos a un rol', TRUE),
('SELECT', 'Ver Permisos por Rol', 'ROL_PERMISO', 'Visualizar permisos asociados a un rol', TRUE),

-- ===================== PARROQUIA =====================
('INSERT', 'Registrar Parroquia', 'PARROQUIA', 'Registrar una nueva parroquia', TRUE),
('UPDATE', 'Editar Parroquia', 'PARROQUIA', 'Modificar información parroquial', TRUE),
('STATE_CHANGE', 'Cambiar Estado Parroquia', 'PARROQUIA', 'Activar o desactivar parroquia', TRUE),
('SELECT', 'Ver Parroquias', 'PARROQUIA', 'Visualizar lista de parroquias', TRUE),

-- ===================== PARROQUIA_PERSONAL =====================
('INSERT', 'Asignar Personal a Parroquia', 'PARROQUIA_PERSONAL', 'Asignar personal a una parroquia', TRUE),
('UPDATE', 'Editar Asignación', 'PARROQUIA_PERSONAL', 'Modificar fechas o cargo del personal asignado', TRUE),
('STATE_CHANGE', 'Finalizar Asignación', 'PARROQUIA_PERSONAL', 'Terminar relación del personal con la parroquia', TRUE),
('SELECT', 'Ver Personal Asignado', 'PARROQUIA_PERSONAL', 'Ver lista de personal por parroquia', TRUE),

-- ===================== PERSONAL =====================
('INSERT', 'Registrar Personal', 'PERSONAL', 'Registrar nuevo miembro del personal', TRUE),
('UPDATE', 'Editar Personal', 'PERSONAL', 'Actualizar datos del personal', TRUE),
('STATE_CHANGE', 'Cambiar Estado Personal', 'PERSONAL', 'Activar o desactivar personal', TRUE),
('SELECT', 'Ver Personal', 'PERSONAL', 'Ver listado general de personal', TRUE),

-- ===================== FELIGRES =====================
('INSERT', 'Registrar Feligres', 'FELIGRES', 'Registrar nuevo feligrés', TRUE),
('UPDATE', 'Editar Feligres', 'FELIGRES', 'Actualizar datos del feligrés', TRUE),
('SELECT', 'Ver Feligreses', 'FELIGRES', 'Visualizar todos los feligreses registrados', TRUE),

-- ===================== GALERIA_PARROQUIA =====================
('INSERT', 'Subir Imagen', 'GALERIA_PARROQUIA', 'Subir imágenes a la galería parroquial', TRUE),
('DELETE', 'Eliminar Imagen', 'GALERIA_PARROQUIA', 'Eliminar imagen de la galería', TRUE),
('SELECT', 'Ver Galería', 'GALERIA_PARROQUIA', 'Visualizar galería parroquial', TRUE),

-- ===================== ACTO_LITURGICO =====================
('INSERT', 'Registrar Acto Litúrgico', 'ACTO_LITURGICO', 'Registrar un nuevo acto litúrgico', TRUE),
('UPDATE', 'Editar Acto Litúrgico', 'ACTO_LITURGICO', 'Modificar datos del acto litúrgico', TRUE),
('DELETE', 'Eliminar Acto Litúrgico', 'ACTO_LITURGICO', 'Eliminar un acto litúrgico del sistema', TRUE),
('SELECT', 'Ver Actos Litúrgicos', 'ACTO_LITURGICO', 'Listar actos litúrgicos registrados', TRUE),

-- ===================== PARROQUIA_ACTO_LITURGICO =====================
('INSERT', 'Asignar Acto a Parroquia', 'PARROQUIA_ACTO_LITURGICO', 'Vincular acto a parroquia', TRUE),
('DELETE', 'Quitar Acto de Parroquia', 'PARROQUIA_ACTO_LITURGICO', 'Eliminar vínculo de acto con parroquia', TRUE),
('SELECT', 'Ver Actos por Parroquia', 'PARROQUIA_ACTO_LITURGICO', 'Ver actos litúrgicos de cada parroquia', TRUE),

-- ===================== REQUISITO =====================
('INSERT', 'Registrar Requisito', 'REQUISITO', 'Registrar un nuevo requisito', TRUE),
('UPDATE', 'Editar Requisito', 'REQUISITO', 'Modificar datos de un requisito', TRUE),
('STATE_CHANGE', 'Cambiar Estado Requisito', 'REQUISITO', 'Activar o desactivar requisito', TRUE),
('SELECT', 'Ver Requisitos', 'REQUISITO', 'Listar requisitos disponibles', TRUE),

-- ===================== ACTO_REQUISITO =====================
('INSERT', 'Asignar Requisito a Acto', 'ACTO_REQUISITO', 'Asignar requisito a acto litúrgico', TRUE),
('DELETE', 'Eliminar Requisito de Acto', 'ACTO_REQUISITO', 'Quitar requisito asignado a acto', TRUE),
('SELECT', 'Ver Requisitos por Acto', 'ACTO_REQUISITO', 'Listar requisitos de cada acto', TRUE),

-- ===================== DOCUMENTO_REQUISITO =====================
('INSERT', 'Subir Documento', 'DOCUMENTO_REQUISITO', 'Subir documento de cumplimiento de requisito', TRUE),
('UPDATE', 'Revisar Documento', 'DOCUMENTO_REQUISITO', 'Revisar y validar documento', TRUE),
('STATE_CHANGE', 'Aprobar o Rechazar Documento', 'DOCUMENTO_REQUISITO', 'Cambiar estado de validación', TRUE),
('SELECT', 'Ver Documentos', 'DOCUMENTO_REQUISITO', 'Visualizar documentos subidos', TRUE),

-- ===================== RESERVA =====================
('INSERT', 'Crear Reserva', 'RESERVA', 'Registrar nueva reserva', TRUE),
('UPDATE', 'Editar Reserva', 'RESERVA', 'Modificar información de reserva', TRUE),
('STATE_CHANGE', 'Confirmar o Cancelar Reserva', 'RESERVA', 'Cambiar estado de reserva (confirmar, cancelar, reprogramar)', TRUE),
('SELECT', 'Listar Reservas', 'RESERVA', 'Ver todas las reservas', TRUE),

-- ===================== PARTICIPANTES_ACTO =====================
('INSERT', 'Registrar Participante', 'PARTICIPANTES_ACTO', 'Registrar nuevo participante en un acto', TRUE),
('DELETE', 'Eliminar Participante', 'PARTICIPANTES_ACTO', 'Eliminar participante de acto', TRUE),
('SELECT', 'Ver Participantes', 'PARTICIPANTES_ACTO', 'Listar participantes de los actos', TRUE),

-- ===================== PAGO =====================
('INSERT', 'Registrar Pago', 'PAGO', 'Registrar nuevo pago', TRUE),
('DELETE', 'Eliminar Pago', 'PAGO', 'Eliminar un pago', TRUE),
('SELECT', 'Ver Pagos', 'PAGO', 'Visualizar lista de pagos realizados', TRUE),

-- ===================== METODO_PAGO =====================
('INSERT', 'Registrar Método de Pago', 'METODO_PAGO', 'Agregar un nuevo método de pago', TRUE),
('UPDATE', 'Editar Método de Pago', 'METODO_PAGO', 'Modificar información del método de pago', TRUE),
('STATE_CHANGE', 'Cambiar Estado Método de Pago', 'METODO_PAGO', 'Activar o desactivar método de pago', TRUE),
('SELECT', 'Ver Métodos de Pago', 'METODO_PAGO', 'Visualizar métodos de pago disponibles', TRUE),

-- ===================== DISPONIBILIDAD_HORARIO =====================
('INSERT', 'Registrar Disponibilidad', 'DISPONIBILIDAD_HORARIO', 'Registrar horario disponible del personal', TRUE),
('UPDATE', 'Editar Disponibilidad', 'DISPONIBILIDAD_HORARIO', 'Modificar horario disponible', TRUE),
('STATE_CHANGE', 'Desactivar Disponibilidad', 'DISPONIBILIDAD_HORARIO', 'Desactivar disponibilidad de horario', TRUE),
('SELECT', 'Ver Disponibilidad', 'DISPONIBILIDAD_HORARIO', 'Visualizar horarios del personal', TRUE),

-- ===================== EXCEPCION_PERSONAL =====================
('INSERT', 'Registrar Excepción', 'EXCEPCION_PERSONAL', 'Registrar ausencia o permiso especial', TRUE),
('SELECT', 'Ver Excepciones', 'EXCEPCION_PERSONAL', 'Visualizar excepciones registradas', TRUE),
('DELETE', 'Eliminar Excepción', 'EXCEPCION_PERSONAL', 'Eliminar excepción del personal', TRUE),

-- ===================== CONFIGURACION =====================
('UPDATE', 'Editar Configuración', 'CONFIGURACION', 'Modificar parámetros del sistema', TRUE),
('SELECT', 'Ver Configuración', 'CONFIGURACION', 'Ver configuración general', TRUE),
('STATE_CHANGE', 'Cambiar Estado Configuración', 'CONFIGURACION', 'Activar o desactivar configuración', TRUE),
('DELETE','Eliminar Configuración','CONFIGURACION','Eliminar configuración del sistema', TRUE),

-- ===================== AUDITORIAS =====================
('SELECT', 'Ver Auditoría Usuarios', 'AUDITORIA_USUARIO', 'Visualizar registros de auditoría de usuarios', TRUE),
('SELECT', 'Ver Auditoría Parroquias', 'AUDITORIA_PARROQUIA', 'Visualizar registros de auditoría de parroquias', TRUE),
('SELECT', 'Ver Auditoría Reservas', 'AUDITORIA_RESERVA', 'Visualizar registros de auditoría de reservas', TRUE);

-- Administrador: todos los permisos
INSERT INTO ROL_PERMISO (idPermiso, idRol)
SELECT idPermiso, (SELECT idRol FROM ROL WHERE nombRol = 'Administrador')
FROM PERMISO;

-- Sacerdote: permisos sobre FELIGRES, PERSONAL y PARROQUIA_PERSONAL
INSERT INTO ROL_PERMISO (idPermiso, idRol)
SELECT idPermiso, (SELECT idRol FROM ROL WHERE nombRol = 'Sacerdote')
FROM PERMISO
WHERE nombTabla IN ('FELIGRES','PERSONAL','PARROQUIA_PERSONAL') AND tipoOperacion IN ('INSERT','UPDATE','SELECT');

-- Secretaria: permisos sobre RESERVA, FELIGRES, DOCUMENTO_REQUISITO
INSERT INTO ROL_PERMISO (idPermiso, idRol)
SELECT idPermiso, (SELECT idRol FROM ROL WHERE nombRol = 'Secretaria')
FROM PERMISO
WHERE nombTabla IN ('RESERVA','FELIGRES','DOCUMENTO_REQUISITO') AND tipoOperacion IN ('INSERT','UPDATE','SELECT','STATE_CHANGE');

-- Feligres: solo ver información y participar en actos
INSERT INTO ROL_PERMISO (idPermiso, idRol)
SELECT idPermiso, (SELECT idRol FROM ROL WHERE nombRol = 'Feligres')
FROM PERMISO
WHERE nombTabla IN ('ACTO_LITURGICO','PARTICIPANTES_ACTO','RESERVA') AND tipoOperacion = 'SELECT';

-- Invitado: solo ver información pública de actos y parroquias
INSERT INTO ROL_PERMISO (idPermiso, idRol)
SELECT idPermiso, (SELECT idRol FROM ROL WHERE nombRol = 'Invitado')
FROM PERMISO
WHERE nombTabla IN ('ACTO_LITURGICO','PARROQUIA') AND tipoOperacion = 'SELECT';

-- USUARIOS
INSERT INTO USUARIO (email, clave, estadoCuenta) VALUES
('juan.perez@mail.com', 'clave123', TRUE),
('ana.lopez@mail.com', 'clave123', TRUE),
('maria.garcia@mail.com', 'clave123', TRUE),
('carlos.sanchez@mail.com', 'clave123', TRUE),
('laura.martinez@mail.com', 'clave123', TRUE),
('jose.ramirez@mail.com', 'clave123', TRUE),
('sofia.gomez@mail.com', 'clave123', TRUE),
('miguel.torres@mail.com', 'clave123', TRUE),
('paula.vasquez@mail.com', 'clave123', TRUE),
('diego.rivera@mail.com', 'clave123', TRUE),
('andrea.castillo@mail.com', 'clave123', TRUE),
('fernando.morales@mail.com', 'clave123', TRUE),
('valeria.soto@mail.com', 'clave123', TRUE),
('eduardo.mendez@mail.com', 'clave123', TRUE),
('isabel.castro@mail.com', 'clave123', TRUE),
('raul.ortega@mail.com', 'clave123', TRUE),
('camila.loyola@mail.com', 'clave123', TRUE),
('jorge.flores@mail.com', 'clave123', TRUE),
('gabriela.ramos@mail.com', 'clave123', TRUE),
('alexander.fernandez@mail.com', 'clave123', TRUE),
('lina.delgado@mail.com', 'clave123', TRUE),
('ricardo.silva@mail.com', 'clave123', TRUE),
('marcela.reyes@mail.com', 'clave123', TRUE),
('esteban.cabrera@mail.com', 'clave123', TRUE),
('natalia.sandoval@mail.com', 'clave123', TRUE),
('pablo.vargas@mail.com', 'clave123', TRUE),
('claudia.mejia@mail.com', 'clave123', TRUE),
('andres.gutierrez@mail.com', 'clave123', TRUE),
('karla.lopez@mail.com', 'clave123', TRUE),
('fernando.tapia@mail.com', 'clave123', TRUE);

-- FELIGRES (primeros 15 usuarios)
INSERT INTO FELIGRES (numDocFel, nombFel, apePatFel, apeMatFel, f_nacimiento, sexoFel, direccionFel, telefonoFel, idTipoDocumento, idUsuario) VALUES
('12345678', 'Juan', 'Perez', 'Lopez', '1990-02-15', 'M', 'Av. Lima 123', '987654321', 1, 1),
('87654321', 'Ana', 'Lopez', 'Diaz', '1985-07-20', 'F', 'Calle Real 456', '987654322', 1, 2),
('11223344', 'Maria', 'Garcia', 'Santos', '1992-05-10', 'F', 'Jiron Sol 789', '987654323', 2, 3),
('44332211', 'Carlos', 'Sanchez', 'Mora', '1988-11-02', 'M', 'Av. Arequipa 321', '987654324', 2, 4),
('55667788', 'Laura', 'Martinez', 'Rojas', '1995-09-18', 'F', 'Calle Luna 159', '987654325', 3, 5),
('66778899', 'Jose', 'Ramirez', 'Vega', '1991-12-01', 'M', 'Av. Sol 852', '987654326', 1, 6),
('99887766', 'Sofia', 'Gomez', 'Alvarez', '1993-03-22', 'F', 'Jiron Mar 753', '987654327', 2, 7),
('44556677', 'Miguel', 'Torres', 'Cruz', '1987-08-13', 'M', 'Calle Nube 951', '987654328', 3, 8),
('22334455', 'Paula', 'Vasquez', 'Lopez', '1996-06-05', 'F', 'Av. Estrella 357', '987654329', 1, 9),
('33445566', 'Diego', 'Rivera', 'Castillo', '1989-01-30', 'M', 'Jiron Cielo 654', '987654330', 2, 10),
('55664433', 'Andrea', 'Castillo', 'Ramos', '1994-04-17', 'F', 'Calle Sol 321', '987654331', 3, 11),
('66775544', 'Fernando', 'Morales', 'Gutierrez', '1986-10-21', 'M', 'Av. Luna 987', '987654332', 1, 12),
('77886655', 'Valeria', 'Soto', 'Fernandez', '1992-12-08', 'F', 'Jiron Mar 852', '987654333', 2, 13),
('88997766', 'Eduardo', 'Mendez', 'Silva', '1990-07-14', 'M', 'Calle Nube 456', '987654334', 3, 14),
('99889977', 'Isabel', 'Castro', 'Reyes', '1993-11-29', 'F', 'Av. Estrella 123', '987654335', 1, 15);

-- PERSONAL (últimos 15 usuarios)
INSERT INTO PERSONAL (numDocPers, nombPers, apePatPers, apeMatPers, sexoPers, direccionPers, telefonoPers, idTipoDocumento, idUsuario) VALUES
('11224455', 'Raul', 'Ortega', 'Lopez', 'M', 'Jiron Sol 741', '987654336', 2, 16),
('22335566', 'Camila', 'Loyola', 'Diaz', 'F', 'Calle Luna 963', '987654337', 3, 17),
('33446677', 'Jorge', 'Flores', 'Vega', 'M', 'Av. Mar 258', '987654338', 1, 18),
('44557788', 'Gabriela', 'Ramos', 'Castillo', 'F', 'Jiron Cielo 147', '987654339', 2, 19),
('55668899', 'Alexander', 'Fernandez', 'Mendez', 'M', 'Calle Sol 369', '987654340', 3, 20),
('66779900', 'Lina', 'Delgado', 'Silva', 'F', 'Av. Estrella 852', '987654341', 1, 21),
('77880011', 'Ricardo', 'Silva', 'Lopez', 'M', 'Jiron Luna 753', '987654342', 2, 22),
('88991122', 'Marcela', 'Reyes', 'Vega', 'F', 'Calle Mar 951', '987654343', 3, 23),
('99002233', 'Esteban', 'Cabrera', 'Castillo', 'M', 'Av. Sol 357', '987654344', 1, 24),
('10111213', 'Natalia', 'Sandoval', 'Fernandez', 'F', 'Jiron Cielo 258', '987654345', 2, 25),
('11121314', 'Pablo', 'Vargas', 'Ramos', 'M', 'Calle Luna 147', '987654346', 3, 26),
('12131415', 'Claudia', 'Mejia', 'Silva', 'F', 'Av. Estrella 369', '987654347', 1, 27),
('13141516', 'Andres', 'Gutierrez', 'Lopez', 'M', 'Jiron Mar 456', '987654348', 2, 28),
('14151617', 'Karla', 'Lopez', 'Diaz', 'F', 'Calle Sol 852', '987654349', 3, 29),
('15161718', 'Fernando', 'Tapia', 'Castillo', 'M', 'Av. Luna 753', '987654350', 1, 30);

INSERT INTO PARROQUIA_PERSONAL (f_inicio, f_fin, vigenciaParrPers, idParroquia, idCargo, idPersonal) VALUES
('2020-01-15', NULL, TRUE, 1, 1, 1),
('2021-03-10', NULL, TRUE, 2, 2, 2),
('2019-07-20', NULL, TRUE, 3, 3, 3),
('2022-02-01', NULL, TRUE, 4, 4, 4),
('2020-09-05', NULL, TRUE, 5, 5, 5),
('2021-11-18', NULL, TRUE, 6, 6, 6),
('2019-12-25', NULL, TRUE, 7, 7, 7),
('2022-05-30', NULL, TRUE, 8, 8, 8),
('2020-06-15', NULL, TRUE, 9, 9, 9),
('2021-08-10', NULL, TRUE, 10, 10, 10),
('2019-03-20', NULL, TRUE, 11, 11, 11),
('2022-01-05', NULL, TRUE, 12, 12, 12),
('2020-04-22', NULL, TRUE, 13, 13, 13),
('2021-10-12', NULL, TRUE, 14, 14, 14),
('2019-09-30', NULL, TRUE, 15, 15, 15);

INSERT INTO ROL_USUARIO (idRol, idUsuario) VALUES
(4, 1),
(4, 2),
(4, 3),
(4, 4),
(4, 5),
(4, 6),
(4, 7),
(4, 8),
(4, 9),
(4, 10),
(4, 11),
(4, 12),
(4, 13),
(4, 14),
(4, 15),
(2, 16),
(2, 17),
(3, 18),
(3, 19),
(3, 20),
(3, 21),
(3, 22),
(1, 23),
(4, 24),
(4, 25),
(3, 26),
(3, 27),
(3, 28),
(3, 29),
(3, 30);

INSERT INTO ACTO_LITURGICO (nombActo, descripcion, costoBase, estadoActo, imgActo) VALUES
('Misa Individual', 'Celebración de la Eucaristía solicitada para una intención particular (difuntos, acción de gracias, etc.).', 100.00, TRUE, 'http://googleusercontent.com/image_collection/image_retrieval/1717714486912590687_0'),
('Misa Comunitaria', 'Celebración de la Eucaristía con múltiples intenciones, abierta a la comunidad de la parroquia.', 50.00, TRUE, 'http://googleusercontent.com/image_collection/image_retrieval/5719853306317319414_0'),
('Bautismo Comunitario', 'Sacramento de Bautismo celebrado en grupo, en fechas y horarios fijos.', 150.00, TRUE, 'http://googleusercontent.com/image_collection/image_retrieval/6921707883363271527_0'),
('Bautismo Individual', 'Sacramento de Bautismo celebrado de forma privada, fuera de los horarios comunes.', 250.00, TRUE, 'http://googleusercontent.com/image_collection/image_retrieval/6921707883363271527_0'),
('Matrimonio (Normal)', 'Sacramento del Matrimonio de dos feligreses propios de la parroquia.', 300.00, TRUE, 'http://googleusercontent.com/image_collection/image_retrieval/14486673798989280698_0'),
('Matrimonio (Traslado)', 'Sacramento del Matrimonio de feligreses externos que solicitan realizarlo en esta parroquia.', 500.00, TRUE, 'http://googleusercontent.com/image_collection/image_retrieval/14486673798989280698_0'),
('Confirmación', 'Sacramento que perfecciona la gracia bautismal y confiere el Espíritu Santo.', 100.00, TRUE, 'http://googleusercontent.com/image_collection/image_retrieval/818614702535729351_0'),
('Misa de Exequias', 'Celebración litúrgica por el eterno descanso del difunto. (Sujeta a horarios).', 200.00, TRUE, 'https://ejemplo.com/imagen_funeral_catolico.jpg'),
('Unción de Enfermos', 'Sacramento para confortar y dar fortaleza espiritual a los enfermos graves.', 0.00, TRUE, 'https://ejemplo.com/imagen_uncion_enfermos.jpg'),
('Adoración Eucarística', 'Exposición y adoración del Santísimo Sacramento. Generalmente gratuita.', 0.00, TRUE, 'https://ejemplo.com/imagen_adoracion_eucaristica.jpg');

INSERT INTO ACTO_PARROQUIA (idActo, idParroquia) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11), (1, 12), (1, 13), (1, 14), (1, 15), (1, 16), (1, 17), (1, 18), (1, 19), (1, 20), (1, 21), (1, 22), (1, 23),
(2, 1), (2, 2), (2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), (2, 10), (2, 11), (2, 12), (2, 13), (2, 14), (2, 15), (2, 16), (2, 17), (2, 18), (2, 19), (2, 20), (2, 21), (2, 22), (2, 23),
(3, 1), (3, 2), (3, 3), (3, 4), (3, 5), (3, 6), (3, 7), (3, 8), (3, 9), (3, 10), (3, 11), (3, 12), (3, 13), (3, 14), (3, 15), (3, 16), (3, 17), (3, 18), (3, 19), (3, 20), (3, 21), (3, 22), (3, 23),
(4, 1), (4, 2), (4, 3), (4, 4), (4, 5), (4, 6), (4, 7), (4, 8), (4, 9), (4, 10), (4, 11), (4, 12), (4, 13), (4, 14), (4, 15), (4, 16), (4, 17), (4, 18), (4, 19), (4, 20), (4, 21), (4, 22), (4, 23),
(5, 1), (5, 2), (5, 3), (5, 4), (5, 5), (5, 6), (5, 7), (5, 8), (5, 9), (5, 10), (5, 11), (5, 12), (5, 13), (5, 14), (5, 15), (5, 16), (5, 17), (5, 18), (5, 19), (5, 20), (5, 21), (5, 22), (5, 23),
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 6), (6, 7), (6, 8), (6, 9), (6, 10), (6, 11), (6, 12), (6, 13), (6, 14), (6, 15), (6, 16), (6, 17), (6, 18), (6, 19), (6, 20), (6, 21), (6, 22), (6, 23);

INSERT INTO REQUISITO (nombRequisito, f_requisito, descripcion, estadoRequisito) VALUES
-- *******************************************************************
-- Requisitos para BAUTISMO (Comunitario/Individual)
-- *******************************************************************
('Acta de Nacimiento', NULL, 'Documento oficial que certifica el nacimiento del niño(a).', TRUE),
('Consentimiento de Padres', NULL, 'Declaración firmada de ambos padres o tutores legales.', TRUE),
('Catequesis Prebautismal', NULL, 'Constancia de asistencia a la charla de preparación de padres y padrinos.', TRUE),
('Padrinos Confirmados', NULL, 'Los padrinos deben ser católicos, estar confirmados y llevar una vida congruente con la fe.', TRUE),
('Documentos de Padrinos', NULL, 'Copia del acta de Confirmación y, si están casados, del acta de Matrimonio Eclesiástico.', TRUE),

-- *******************************************************************
-- Requisitos para CONFIRMACIÓN
-- *******************************************************************
('Acta de Bautismo', NULL, 'Certificado que acredita la recepción del sacramento del Bautismo.', TRUE),
('Acta de Primera Comunión', NULL, 'Certificado de haber recibido previamente la Eucaristía.', TRUE),
('Catequesis de Confirmación', NULL, 'Comprobante de haber asistido y aprobado el curso de catequesis (usualmente 1-2 años).', TRUE),
('Confesión Previa', '2025-10-25', 'Haber recibido el sacramento de la Penitencia (Confesión) días antes de la ceremonia.', TRUE),

-- *******************************************************************
-- Requisitos para MATRIMONIO (Normal/Traslado)
-- *******************************************************************
('Acta de Bautismo Actualizada (Novios)', NULL, 'Certificado reciente (no mayor a 6 meses) de Bautismo de ambos contrayentes.', TRUE),
('Acta de Confirmación (Novios)', NULL, 'Certificado de haber recibido el sacramento de la Confirmación.', TRUE),
('Acta de Primera Comunión (Novios)', NULL, 'Certificado de haber recibido la Primera Comunión.', TRUE),
('Pláticas Prematrimoniales', NULL, 'Constancia de asistencia al curso prematrimonial impartido por la Diócesis.', TRUE),
('Proclamas Matrimoniales', NULL, 'Comprobante de la publicación de las amonestaciones en las parroquias de origen.', TRUE),
('Fotocopia Cédula/DNI', NULL, 'Copia de identificación de los novios, padrinos y testigos.', TRUE),
('Licencia de Traslado', NULL, 'Documento que permite celebrar el matrimonio en una parroquia diferente a la de domicilio (solo para Matrimonio Traslado).', TRUE),

-- *******************************************************************
-- Requisitos para PRIMERA COMUNIÓN
-- *******************************************************************
('Acta de Bautismo', NULL, 'Certificado que acredita la recepción del sacramento del Bautismo.', TRUE),
('Catequesis Eucarística', NULL, 'Comprobante de haber asistido y aprobado el curso de catequesis (usualmente 2 años).', TRUE),
('Edad Mínima', NULL, 'Haber cumplido la edad requerida (ej. 8 años) y tener uso de razón.', TRUE),

-- *******************************************************************
-- Requisitos para MISA DE EXEQUIAS
-- *******************************************************************
('Acta de Defunción', NULL, 'Documento civil que acredita el fallecimiento de la persona.', TRUE),
('Petición Familiar', NULL, 'Solicitud formal de la familia para la celebración de la Misa (no es estrictamente un requisito canónico, sino administrativo).', TRUE);
