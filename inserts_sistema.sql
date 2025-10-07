--EJEMPLOS
-- INSERTS DE PROVINCIAS DE LAMBAYEQUE
INSERT INTO PROVINCIA (nombProvincia, latProvincia, logProvincia) VALUES
('Chiclayo', -6.7714, -79.8400),
('Ferreñafe', -6.4733, -79.9400),
('Lambayeque', -6.5789, -79.8760);

-- INSERTS DE DISTRITOS (ejemplos)
INSERT INTO DISTRITO (nombDistrito, latDistrito, logDistrito, idProvincia) VALUES
('Chiclayo', -6.7700, -79.8400, 1),
('José Leonardo Ortiz', -6.7440, -79.8740, 1),
('La Victoria', -6.7580, -79.8240, 1),
('Ferreñafe', -6.4733, -79.9400, 2),
('Cañaris', -6.5000, -79.9000, 2),
('Lambayeque', -6.5800, -79.8800, 3),
('Mochumí', -6.6200, -79.9000, 3);

-- INSERTS DE PARROQUIAS con RUC únicos
INSERT INTO PARROQUIA (nombParroquia, descripcionBreve, historiaParroquia, ruc, contacto, f_creacion, direccion, latParroquia, logParroquia, estadoParroquia, idDistrito) VALUES
('Parroquia San José', 'Parroquia histórica en el centro de Chiclayo, con arquitectura colonial y eventos culturales los domingos.', 'Fundada en 1950', 20123456701, 987654321, '1950-06-15', 'Av. Lima 123', -6.7705, -79.8402, TRUE, 1),
('Parroquia Santa María', 'Espacio de oración y encuentro comunitario en José Leonardo Ortiz, con actividades familiares y catequesis.', 'Fundada en 1965', 20123456702, 987654322, '1965-08-20', 'Jr. Arequipa 456', -6.7445, -79.8745, TRUE, 2),
('Parroquia Santo Domingo', 'Parroquia céntrica de La Victoria, conocida por sus vitrales y celebraciones de Semana Santa.', 'Fundada en 1970', 20123456703, 987654323, '1970-04-10', 'Calle Principal 789', -6.7585, -79.8245, TRUE, 3),
('Parroquia San Juan Bautista', 'Parroquia en Ferreñafe con programación cultural y misas diarias, ideal para visitas religiosas y educativas.', 'Fundada en 1940', 20123456704, 987654324, '1940-03-05', 'Jr. Lima 101', -6.4735, -79.9405, TRUE, 4),
('Parroquia Santa Rosa de Lima', 'Parroquia tradicional en Cañaris, rodeada de paisajes rurales y actividades comunitarias.', 'Fundada en 1955', 20123456705, 987654325, '1955-07-10', 'Av. Principal 202', -6.5005, -79.9005, TRUE, 5),
('Parroquia Virgen del Rosario', 'Parroquia en Lambayeque con arquitectura moderna y espacios para catequesis y eventos culturales.', 'Fundada en 1960', 20123456706, 987654326, '1960-09-15', 'Jr. Libertad 303', -6.5805, -79.8805, TRUE, 6),
('Parroquia San Martín de Tours', 'Parroquia en Mochumí, rodeada de naturaleza, con actividades religiosas y talleres comunitarios.', 'Fundada en 1975', 20123456707, 987654327, '1975-05-20', 'Calle Central 404', -6.6205, -79.9005, TRUE, 7);