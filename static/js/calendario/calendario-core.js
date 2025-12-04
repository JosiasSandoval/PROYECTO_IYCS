// =====================================================
// CALENDARIO - MÓDULO CORE (Inicialización)
// Punto de entrada principal que inicializa FullCalendar
// =====================================================

import { obtenerColorPorEstado, log, logError, normalizarFecha } from './calendario-utils.js';
import { cargarDatosCalendario, obtenerIdParroquia } from './calendario-data-loader.js';
import { inicializarFeligres } from './calendario-feligres.js';
import { inicializarSecretaria } from './calendario-secretaria.js';
import { inicializarSecretariaReservas } from './calendario-secretaria-reservas.js';
import { inicializarSacerdote } from './calendario-sacerdote.js';

// Estado global del calendario
export const calendarioState = {
    rol: null,
    idUsuario: null,
    idParroquia: null,
    calendar: null,
    calendarHorarios: null,
    datos: [],
    datosFiltrados: [],
    horarios: [],
    horariosFiltrados: [],
    esGestionHorarios: false
};

/**
 * Inicializa el módulo del calendario
 */
export async function inicializarCalendario() {
    log('🚀 Inicializando sistema de calendario...');
    
    try {
        // 1. Obtener datos del usuario desde el DOM
        await cargarDatosUsuario();
        
        // 2. Configurar UI según rol
        configurarInterfazPorRol();
        
        // 3. Cargar datos iniciales
        const datos = await cargarDatosCalendario({
            rol: calendarioState.rol,
            idUsuario: calendarioState.idUsuario,
            idParroquia: calendarioState.idParroquia,
            esGestionHorarios: calendarioState.esGestionHorarios
        });
        
        // Guardar todos los datos sin filtrar
        calendarioState.datos = datos;
        calendarioState.datosFiltrados = datos;
        
        log(`✅ Datos cargados: ${datos.length} registros`);
        
        // 4. Inicializar módulo específico del rol
        await inicializarModuloPorRol();
        
        // 5. Exponer estado y funciones globalmente para modales y acciones externas
        window.calendarioState = calendarioState;
        window.recargarCalendario = recargarCalendario;
        
        log('✅ Sistema de calendario inicializado correctamente');
        log('🌐 Función recargarCalendario() disponible globalmente');
        
    } catch (error) {
        logError('Error fatal inicializando calendario', error);
        mostrarErrorFatal();
    }
}

/**
 * Carga información del usuario desde el DOM
 */
async function cargarDatosUsuario() {
    const body = document.body;
    
    calendarioState.rol = body.dataset.rol?.toLowerCase();
    calendarioState.idUsuario = body.dataset.id;
    let idParroquiaInicial = body.dataset.parroquia;
    
    log('📋 Datos del usuario:', {
        rol: calendarioState.rol,
        idUsuario: calendarioState.idUsuario,
        idParroquia: idParroquiaInicial
    });
    
    // Validación básica
    if (!calendarioState.rol || !calendarioState.idUsuario) {
        throw new Error('Datos de usuario incompletos');
    }
    
    // Obtener idParroquia según el rol
    calendarioState.idParroquia = await obtenerIdParroquia(
        calendarioState.rol,
        calendarioState.idUsuario,
        idParroquiaInicial
    );
    
    log('🎯 idParroquia final:', calendarioState.idParroquia);
}

/**
 * Configura la interfaz según el rol del usuario
 */
function configurarInterfazPorRol() {
    const btnRegresar = document.getElementById('btn-regresar-mapa');
    const tabsSacerdote = document.getElementById('tabs-sacerdote');
    
    switch (calendarioState.rol) {
        case 'feligres':
            // Mostrar botón regresar
            if (btnRegresar) btnRegresar.style.display = 'block';
            // Ocultar tabs de sacerdote
            if (tabsSacerdote) tabsSacerdote.style.display = 'none';
            break;
            
        case 'secretaria':
            // Ocultar botón regresar
            if (btnRegresar) btnRegresar.style.display = 'none';
            // Ocultar tabs de sacerdote
            if (tabsSacerdote) tabsSacerdote.style.display = 'none';
            // Determinar si es gestión de horarios
            calendarioState.esGestionHorarios = detectarModoGestionHorarios();
            break;
            
        case 'sacerdote':
            // Ocultar botón regresar
            if (btnRegresar) btnRegresar.style.display = 'none';
            // Mostrar tabs específicas
            if (tabsSacerdote) tabsSacerdote.style.display = 'flex';
            break;
    }
}

/**
 * Detecta si la secretaria está en modo gestión de horarios
 */
function detectarModoGestionHorarios() {
    // Buscar contenedor de horarios
    const contenedorHorarios = document.querySelector('.fechas-horarios');
    return contenedorHorarios !== null;
}

/**
 * Inicializa el módulo específico según el rol
 */
async function inicializarModuloPorRol() {
    log(`🔧 Inicializando módulo para rol: ${calendarioState.rol}`);
    
    // Detectar si estamos en mis_reservas.html
    const enMisReservas = window.location.pathname.includes('mis_reservas');
    
    switch (calendarioState.rol) {
        case 'feligres':
            await inicializarFeligres(calendarioState);
            break;
            
        case 'secretaria':
            // Si está en mis_reservas.html, usar módulo de reservas con agrupamiento
            // Si está en calendario.html, usar módulo de secretaria (gestionar horarios)
            if (enMisReservas) {
                log('📋 Secretaria en mis_reservas.html - usando vista de reservas agrupadas');
                await inicializarSecretariaReservas(calendarioState);
                // Agregar filtro por acto litúrgico para secretaria
                await configurarFiltroActoLiturgico(calendarioState);
            } else {
                await inicializarSecretaria(calendarioState);
            }
            break;
            
        case 'sacerdote':
            await inicializarSacerdote(calendarioState);
            break;
            
        default:
            throw new Error(`Rol desconocido: ${calendarioState.rol}`);
    }
}

/**
 * Crea una instancia de FullCalendar
 */
export function crearCalendario(contenedor, opciones = {}) {
    if (!contenedor) {
        logError('Contenedor de calendario no encontrado');
        return null;
    }
    
    const opcionesDefecto = {
        locale: 'es',
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        buttonText: {
            today: 'Hoy',
            month: 'Mes',
            week: 'Semana',
            day: 'Día'
        },
        height: 'auto',
        dayMaxEvents: false, // Sin límite para ver todos los eventos
        displayEventTime: false, // No mostrar hora separada (ya está en título)
        displayEventEnd: false, // No mostrar hora de fin
        eventDisplay: 'block', // Mostrar como bloques sólidos
        allDaySlot: false,
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00',
        slotDuration: '01:00:00',  // Intervalos de 1 hora por defecto
        eventTimeFormat: { // Formato de hora en eventos
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false
        },
        ...opciones
    };
    
    return new FullCalendar.Calendar(contenedor, opcionesDefecto);
}

/**
 * Convierte datos a formato de eventos de FullCalendar
 */
export function convertirAEventos(datos) {
    if (!datos || datos.length === 0) return [];
    
    return datos
        .filter(d => d.fecha) // Solo eventos con fecha
        .map(d => {
            const color = obtenerColorPorEstado(d.estado);
            
            // Asegurar formato de hora correcto (HH:MM:SS)
            let horaFormateada = d.hora || '08:00';
            if (horaFormateada.length === 5) {
                horaFormateada = horaFormateada + ':00'; // Agregar segundos
            }
            
            return {
                id: d.id,
                title: `${d.titulo} (${horaFormateada.substring(0,5)})`,
                start: d.fecha,
                backgroundColor: color,
                borderColor: color,
                textColor: '#ffffff',
                allDay: true, // Mostrar como evento de día completo para mejor visualización
                display: 'block', // Forzar visualización como bloque
                extendedProps: {
                    estado: d.estado,
                    participantes: d.participantes,
                    descripcion: d.descripcion,
                    parroquia: d.parroquia,
                    costoBase: d.costoBase,
                    idReserva: d.id,
                    idActo: d.idActo,
                    tipo: d.tipo
                },
                // Estilos personalizados para bordes más visibles
                classNames: ['evento-reserva', `estado-${d.estado.toLowerCase()}`]
            };
        });
}

/**
 * Actualiza eventos del calendario
 */
export function actualizarEventosCalendario(calendar, datos) {
    if (!calendar) {
        logError('No hay instancia de calendario');
        return;
    }
    
    // Remover eventos existentes
    calendar.removeAllEvents();
    
    // Agregar nuevos eventos
    const eventos = convertirAEventos(datos);
    calendar.addEventSource(eventos);
    
    log(`📅 ${eventos.length} eventos agregados al calendario`);
}

/**
 * Recarga los datos del calendario automáticamente
 * Útil después de acciones como cancelar, pagar, etc.
 */
export async function recargarCalendario() {
    try {
        log('🔄 Recargando datos del calendario...');
        
        // Cargar nuevos datos
        const datos = await cargarDatosCalendario({
            rol: calendarioState.rol,
            idUsuario: calendarioState.idUsuario,
            idParroquia: calendarioState.idParroquia,
            esGestionHorarios: calendarioState.esGestionHorarios
        });
        
        // Actualizar estado
        calendarioState.datos = datos;
        calendarioState.datosFiltrados = datos;
        
        // Actualizar el calendario visual
        if (calendarioState.calendar) {
            actualizarEventosCalendario(calendarioState.calendar, calendarioState.datosFiltrados);
        }
        
        log('✅ Calendario recargado exitosamente');
        return true;
        
    } catch (error) {
        logError('Error recargando calendario', error);
        return false;
    }
}

/**
 * Muestra un error fatal al usuario
 */
function mostrarErrorFatal() {
    const contenedor = document.querySelector('.fechas') || document.querySelector('.fechas-horarios');
    
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="alert alert-danger m-4" role="alert">
                <h4 class="alert-heading">❌ Error al cargar el calendario</h4>
                <p>Ha ocurrido un error al inicializar el sistema de calendario.</p>
                <hr>
                <p class="mb-0">Por favor, recarga la página o contacta al administrador.</p>
                <button class="btn btn-primary mt-3" onclick="location.reload()">
                    🔄 Recargar página
                </button>
            </div>
        `;
    }
}

/**
 * Configura filtro por acto litúrgico para secretaria en mis_reservas
 */
async function configurarFiltroActoLiturgico(state) {
    const contenedor = document.getElementById('filtros-superiores');
    
    if (!contenedor) {
        log('⚠️ No se encontró contenedor de filtros');
        return;
    }
    
    try {
        // Cargar actos litúrgicos de la parroquia
        const resActos = await fetch(`/api/acto/${state.idParroquia}`);
        const dataActos = await resActos.json();
        
        let actosHTML = '<option value="">Todos los actos litúrgicos</option>';
        
        if (dataActos.success && dataActos.datos) {
            actosHTML += dataActos.datos.map(a => 
                `<option value="${a.id}">${a.acto}</option>`
            ).join('');
        }
        
        // Crear filtro
        contenedor.innerHTML = `
            <div class="row mb-3">
                <div class="col-md-6">
                    <label class="form-label fw-bold">Filtrar por acto litúrgico:</label>
                    <select id="filtroActoLiturgico" class="form-select">
                        ${actosHTML}
                    </select>
                </div>
            </div>
        `;
        
        // Event listener para aplicar filtro
        document.getElementById('filtroActoLiturgico')?.addEventListener('change', (e) => {
            const actoSeleccionado = e.target.value;
            
            if (actoSeleccionado) {
                // Filtrar por acto específico
                state.datosFiltrados = state.datos.filter(d => 
                    d.tipo === 'reserva' && 
                    d.idActo == actoSeleccionado &&
                    d.estado !== 'CANCELADA' && 
                    d.estado !== 'CANCELADO'
                );
            } else {
                // Mostrar todos (excepto canceladas)
                state.datosFiltrados = state.datos.filter(d => 
                    d.tipo === 'reserva' && 
                    d.estado !== 'CANCELADA' && 
                    d.estado !== 'CANCELADO'
                );
            }
            
            // Actualizar calendario
            actualizarEventosCalendario(state.calendar, state.datosFiltrados);
            
            log(`Filtro aplicado: ${state.datosFiltrados.length} de ${state.datos.length} reservas`);
        });
        
        log('✅ Filtro por acto litúrgico configurado');
    } catch (error) {
        console.error('Error configurando filtro:', error);
    }
}

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarCalendario);
} else {
    inicializarCalendario();
}
