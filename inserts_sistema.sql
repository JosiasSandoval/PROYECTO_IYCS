INSERT INTO TIPO_DOCUMENTO (nombDocumento, abreviatura, estadoDocumento) VALUES
('Documento Nacional de Identidad', 'DNI', TRUE),
('Carnet de Extranjería', 'CEX', TRUE),
('Pasaporte', 'PAS', TRUE),
('Registro Único de Contribuyentes', 'RUC', TRUE),
('Partida de Nacimiento', 'PDN', FALSE),
('Licencia de Conducir', 'LIC', TRUE),
('Carnet Universitario', 'CUNI', TRUE),
('Carnet de Biblioteca', 'CBIB', FALSE),
('Tarjeta de Identificación Militar', 'TIM', TRUE),
('Tarjeta de Seguro Social', 'TSS', TRUE),
('Certificado de Bautismo', 'CBT', TRUE),
('Certificado de Confirmación', 'CCF', TRUE),
('Certificado de Matrimonio', 'CMA', TRUE),
('Certificado de Defunción', 'CDE', FALSE),
('Constancia de Soltería', 'CSO', TRUE),
('Tarjeta de Identificación Laboral', 'TIL', TRUE),
('Carnet de Voluntariado', 'CVO', FALSE),
('Constancia de Estudios', 'CES', TRUE),
('Certificado de Primera Comunión', 'CPC', TRUE),
('Carnet Parroquial', 'CPA', TRUE),
('Carnet de Donante de Sangre', 'CDS', FALSE),
('Permiso Temporal de Permanencia', 'PTP', TRUE),
('Credencial Ministerial', 'CRM', TRUE),
('Certificado Médico', 'CMED', TRUE),
('Carnet de Colegiatura Profesional', 'CCP', TRUE);

INSERT INTO PARROQUIA 
(nombParroquia, historiaParroquia, ruc, telefonoContacto, direccion, color, latParroquia, logParroquia, estadoParroquia)
VALUES
-- === PARROQUIAS DE CHICLAYO ===
('Parroquia Santa María Catedral', 'Iglesia principal de Chiclayo, centro espiritual y cultural de la diócesis.', '20123456781', '074-221001', 'Plaza de Armas, Chiclayo', '#FFD700', -6.771020, -79.840490, TRUE),
('Parroquia San Antonio de Padua', 'Fundada en 1952, destaca por su acción social y educativa.', '20456789123', '074-224502', 'Av. Grau 456, Chiclayo', '#A52A2A', -6.772310, -79.840120, TRUE),
('Parroquia San Pedro', 'Parroquia histórica que promueve la devoción y las tradiciones lambayecanas.', '20567891234', '074-227303', 'Calle San Pedro 231, Chiclayo', '#2E8B57', -6.771210, -79.841980, TRUE),
('Parroquia San Vicente de Paúl', 'Inspirada en la caridad cristiana, apoya comunidades vulnerables.', '20678912345', '074-226606', 'Av. Bolognesi 890, Chiclayo', '#4682B4', -6.774510, -79.841200, TRUE),
('Parroquia San José Obrero', 'Conocida por su trabajo con familias y jóvenes.', '20789123456', '074-225707', 'Av. Balta 1030, Chiclayo', '#FF8C00', -6.772890, -79.838960, TRUE),
('Parroquia Cristo Rey', 'Comunidad joven dedicada a la evangelización urbana.', '20891234567', '074-229808', 'Urb. Santa Victoria Mz. C Lt. 5, Chiclayo', '#6A5ACD', -6.769540, -79.833910, TRUE),
('Parroquia Nuestra Señora de Fátima', 'Centro de oración y formación espiritual.', '20912345678', '074-222909', 'Av. Salaverry 512, Chiclayo', '#DB7093', -6.773940, -79.842710, TRUE),
('Parroquia San Juan Bautista', 'Fundada en los años 80, orientada a la pastoral juvenil.', '20134567892', '074-220010', 'Av. Progreso 601, Chiclayo', '#008080', -6.775310, -79.844520, TRUE),

-- === PARROQUIAS DE LAMBAYEQUE (PROVINCIA) ===
('Parroquia San Pedro Apóstol', 'Parroquia matriz de la ciudad de Lambayeque.', '20245678903', '074-282111', 'Plaza de Armas, Lambayeque', '#DAA520', -6.701520, -79.906110, TRUE),
('Parroquia San Roque', 'Conocida por la tradicional festividad del Santo Patrón San Roque.', '20356789014', '074-284212', 'Jr. 8 de Octubre 215, Lambayeque', '#CD5C5C', -6.703340, -79.905430, TRUE),
('Parroquia Santa Lucía', 'Lugar de peregrinación y oración comunitaria.', '20467890125', '074-285313', 'Av. San Martín 300, Lambayeque', '#556B2F', -6.704870, -79.908410, TRUE),
('Parroquia San Martín de Porres', 'Atiende a comunidades rurales y promueve obras de caridad.', '20578901236', '074-286414', 'Calle Bolívar 180, Lambayeque', '#8B0000', -6.706130, -79.907320, TRUE),
('Parroquia Sagrado Corazón de Jesús', 'Con enfoque en la familia y formación catequética.', '20689012347', '074-288515', 'Calle Junín 420, Lambayeque', '#6495ED', -6.702980, -79.904210, TRUE),
('Parroquia Virgen del Carmen', 'Ubicada en el barrio El Porvenir, promueve la solidaridad.', '20790123458', '074-289616', 'Av. Augusto B. Leguía 601, Lambayeque', '#B8860B', -6.705720, -79.902340, TRUE),

-- === PARROQUIAS DE FERREÑAFE ===
('Parroquia Santa Lucía de Ferreñafe', 'Catedral de la provincia de Ferreñafe, símbolo de fe y cultura.', '20801234569', '074-285717', 'Plaza de Armas, Ferreñafe', '#C71585', -6.636540, -79.789880, TRUE),
('Parroquia San Martín de Tours', 'Comunidad activa en la catequesis y servicio social.', '20912345670', '074-286818', 'Calle San Martín 145, Ferreñafe', '#32CD32', -6.638150, -79.790220, TRUE),
('Parroquia Señor de los Milagros', 'Promueve la devoción popular y ayuda a enfermos.', '20123456791', '074-287919', 'Av. Grau 700, Ferreñafe', '#FF4500', -6.639780, -79.791540, TRUE),
('Parroquia Virgen de la Merced', 'Lugar de acogida y servicio a comunidades rurales.', '20234567892', '074-288020', 'Jr. Ayacucho 220, Ferreñafe', '#708090', -6.637890, -79.788630, TRUE),
('Parroquia San Pablo', 'Nueva comunidad creada para atender zonas periféricas.', '20345678903', '074-289121', 'Av. San Pablo 500, Ferreñafe', '#9932CC', -6.641230, -79.792770, TRUE),

-- === PARROQUIAS RURALES / DISTRITOS ===
('Parroquia San Isidro Labrador', 'Parroquia rural del distrito de Monsefú, dedicada al patrono agricultor.', '20456789014', '074-291222', 'Plaza de Armas, Monsefú', '#8B4513', -6.878210, -79.871430, TRUE),
('Parroquia Nuestra Señora del Rosario', 'Ubicada en Pimentel, centro de actividades parroquiales y juveniles.', '20567890125', '074-292323', 'Av. Grau 120, Pimentel', '#E9967A', -6.836250, -79.934810, TRUE),
('Parroquia San Juan Bautista de Eten', 'Famosa por la tradicional festividad del Divino Niño del Milagro.', '20678901236', '074-293424', 'Plaza de Armas, Ciudad Eten', '#DC143C', -6.905120, -79.857660, TRUE),
('Parroquia Santa Rosa de Lima', 'Parroquia central del distrito de Santa Rosa, con fuerte vida comunitaria.', '20789012347', '074-294525', 'Plaza Principal, Santa Rosa', '#00CED1', -6.771880, -79.921450, TRUE);


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
