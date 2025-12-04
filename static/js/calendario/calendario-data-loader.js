// =====================================================
// CALENDARIO - CARGADOR DE DATOS
// Maneja toda la lógica de carga de datos desde API
// =====================================================

import { log, logError, normalizarFecha } from './calendario-utils.js';

/**
 * Carga datos según el rol y contexto del usuario
 */
export async function cargarDatosCalendario(config) {
    const { rol, idUsuario, idParroquia, esGestionHorarios } = config;
    
    log('🔄 Cargando datos del calendario', config);
    
    try {
        // 1. Si estamos en mis_reservas, usar datos ya cargados
        if (await verificarDatosMisReservas()) {
            return await obtenerDatosMisReservas();
        }
        
        // 2. Si es secretaria en modo gestión de horarios
        if (rol === 'secretaria' && esGestionHorarios) {
            return await cargarHorariosDisponibles(idParroquia);
        }
        
        // 3. Cargar reservas según rol
        return await cargarReservasPorRol(rol, idUsuario, idParroquia);
        
    } catch (error) {
        logError('Error cargando datos del calendario', error);
        return [];
    }
}

/**
 * Verifica si estamos en la página de mis_reservas y hay datos
 */
async function verificarDatosMisReservas() {
    const esPaginaMisReservas = window.location.pathname.includes('mis_reservas');
    
    if (!esPaginaMisReservas) {
        return false;
    }
    
    log('⏳ Detectada página mis_reservas, esperando datos...');
    
    // Esperar máximo 3 segundos a que se carguen las reservas
    let intentos = 0;
    while (!window.reservasParaCalendario && intentos < 30) {
        await new Promise(resolve => setTimeout(resolve, 100));
        intentos++;
    }
    
    if (window.reservasParaCalendario) {
        log(`✅ Datos de mis_reservas encontrados (${window.reservasParaCalendario.length} reservas)`);
        return true;
    }
    
    log('⚠️ Timeout: No se cargaron datos de mis_reservas');
    return false;
}

/**
 * Obtiene y mapea datos de mis_reservas.js
 */
async function obtenerDatosMisReservas() {
    if (!window.reservasParaCalendario || window.reservasParaCalendario.length === 0) {
        return [];
    }
    
    return window.reservasParaCalendario.map(mapearReserva);
}

/**
 * Carga reservas según el rol del usuario
 */
async function cargarReservasPorRol(rol, idUsuario, idParroquia) {
    let endpoint = '';
    
    switch (rol) {
        case 'feligres':
            endpoint = `/api/reserva/feligres/${idUsuario}`;
            log('🙏 Cargando reservas de feligrés');
            break;
            
        case 'secretaria':
            endpoint = `/api/reserva/secretaria/${idUsuario}`;
            log('👩‍💼 Cargando reservas de secretaria');
            break;
            
        case 'sacerdote':
            endpoint = `/api/reserva/sacerdote/${idUsuario}`;
            log('✝️ Cargando reservas de sacerdote');
            break;
            
        default:
            logError('Rol desconocido', rol);
            return [];
    }
    
    const response = await fetch(endpoint);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
        logError('API respondió con success=false', data);
        return [];
    }
    
    log(`✅ ${data.datos.length} reservas cargadas`);
    return data.datos.map(mapearReserva);
}

/**
 * Carga horarios disponibles para gestión (secretaria/sacerdote)
 */
async function cargarHorariosDisponibles(idParroquia) {
    if (!idParroquia) {
        logError('No se proporcionó idParroquia');
        return [];
    }
    
    log(`🕐 Cargando horarios disponibles de parroquia ${idParroquia}`);
    
    const endpoint = `/api/acto/parroquia/${idParroquia}/actos-horarios`;
    const response = await fetch(endpoint);
    
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.success) {
        logError('Error cargando horarios', data);
        return [];
    }
    
    log(`✅ ${data.datos.length} horarios disponibles cargados`);
    return data.datos.map(mapearHorario);
}

/**
 * Mapea una reserva al formato estándar del calendario
 */
function mapearReserva(reserva) {
    return {
        id: reserva.idReserva || null,
        titulo: reserva.nombreActo || reserva.nombActo || reserva.acto || 'Sin nombre',
        fecha: normalizarFecha(reserva.fecha || reserva.f_reserva),
        hora: (reserva.hora || reserva.h_reserva || '00:00').slice(0, 5),
        estado: reserva.estadoReserva || 'SIN_ESTADO',
        participantes: reserva.participantes || 'Desconocido',
        descripcion: reserva.mencion || reserva.descripcion || '',
        costoBase: reserva.costoBase || null,
        parroquia: reserva.nombreParroquia || reserva.nombParroquia || '',
        idActo: reserva.idActo || null,
        idParroquia: reserva.idParroquia || null,
        tipo: 'reserva'
    };
}

/**
 * Mapea un horario disponible al formato del calendario
 */
function mapearHorario(horario) {
    return {
        id: horario.idActoParroquia || null,
        titulo: horario.nombreActo || horario.nombActo || 'Horario disponible',
        fecha: null, // Los horarios se repiten semanalmente
        hora: horario.horaInicio || horario.horaInicioActo || '00:00',
        diaSemana: horario.diaSemana || null,
        estado: 'DISPONIBLE',
        costoBase: horario.costoBase || null,
        idActo: horario.idActo || null,
        idParroquia: horario.idParroquia || null,
        tipo: 'horario'
    };
}

/**
 * Obtiene el idParroquia según el rol del usuario
 */
export async function obtenerIdParroquia(rol, idUsuario, idParroquiaInicial) {
    // Si ya tenemos idParroquia, usarlo
    if (idParroquiaInicial && idParroquiaInicial !== '') {
        return idParroquiaInicial;
    }
    
    // Para secretaria, consultar API
    if (rol === 'secretaria') {
        log('🔍 Consultando idParroquia para secretaria...');
        
        try {
            const response = await fetch(`/api/parroquia/secretaria/${idUsuario}`);
            const data = await response.json();
            
            if (data.success && data.idParroquia) {
                log(`✅ idParroquia obtenido: ${data.idParroquia}`);
                return data.idParroquia;
            }
        } catch (error) {
            logError('Error obteniendo idParroquia de secretaria', error);
        }
    }
    
    // Para feligres, buscar en sessionStorage
    if (rol === 'feligres') {
        const idParroquia = sessionStorage.getItem('idParroquiaSeleccionada');
        
        if (idParroquia) {
            log(`✅ idParroquia desde sessionStorage: ${idParroquia}`);
            
            // Actualizar sesión en backend
            fetch(`/cliente/calendario?idParroquia=${idParroquia}`, { 
                method: 'GET' 
            }).catch(e => logError('Error actualizando sesión', e));
            
            return idParroquia;
        }
    }
    
    // Para sacerdote, usar valor por defecto (temporal)
    if (rol === 'sacerdote') {
        log('⚠️ Sacerdote sin idParroquia, usando valor por defecto');
        return '1'; // TODO: Implementar lógica real
    }
    
    logError('No se pudo determinar idParroquia', { rol, idUsuario });
    return null;
}

/**
 * Refresca los datos del calendario
 */
export async function refrescarDatos(config) {
    log('🔄 Refrescando datos del calendario...');
    return await cargarDatosCalendario(config);
}
