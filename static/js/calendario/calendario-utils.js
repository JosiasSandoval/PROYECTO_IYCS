// =====================================================
// CALENDARIO - UTILIDADES COMPARTIDAS
// Funciones auxiliares usadas por todos los módulos
// =====================================================

/**
 * Obtiene el color según el estado de la reserva
 * Colores simples y profesionales
 */
export function obtenerColorPorEstado(estado) {
    const colores = {
        'CONFIRMADO': '#34d399',          // verde suave
        'ATENDIDO': '#9ca3af',            // gris
        'PENDIENTE_PAGO': '#fb923c',      // naranja suave
        'PENDIENTE_DOCUMENTO': '#fbbf24', // amarillo suave
        'PENDIENTE_REVISION': '#60a5fa',  // azul suave
        'CANCELADA': '#f87171',           // rojo suave
        'CANCELADO': '#f87171',           
        'RECHAZADA': '#f87171',           
        'RECHAZADO': '#f87171',           
        'RESERVA_PARROQUIA': '#a78bfa',   // morado suave
        'default': '#9ca3af'              // gris
    };
    
    return colores[estado] || colores.default;
}

/**
 * Obtiene el nombre legible del estado
 */
export function obtenerNombreEstado(estado) {
    const nombres = {
        'PENDIENTE_PAGO': 'Pendiente de Pago',
        'PENDIENTE_DOCUMENTO': 'Pendiente de Documentos',
        'PENDIENTE_REVISION': 'En Revisión',
        'CONFIRMADO': 'Confirmado',
        'ATENDIDO': 'Atendido',
        'CANCELADA': 'Cancelada',
        'CANCELADO': 'Cancelada',
        'RECHAZADA': 'Rechazada',
        'RECHAZADO': 'Rechazada',
        'RESERVA_PARROQUIA': 'Reserva Parroquial'
    };
    
    return nombres[estado] || estado;
}

/**
 * Formatea fecha a formato local
 */
export function formatearFecha(fecha) {
    if (!fecha) return 'Fecha inválida';
    
    try {
        const fechaObj = new Date(fecha);
        return fechaObj.toLocaleDateString('es-PE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch (e) {
        console.error('Error formateando fecha:', e);
        return fecha;
    }
}

/**
 * Valida que una fecha no esté en el pasado
 */
export function esFechaFutura(fecha) {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const fechaObj = new Date(fecha);
    fechaObj.setHours(0, 0, 0, 0);
    
    return fechaObj >= hoy;
}

/**
 * Normaliza fecha a formato YYYY-MM-DD
 */
export function normalizarFecha(fecha) {
    if (!fecha) return null;
    
    try {
        // Si ya está en formato correcto
        if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return fecha;
        }
        
        const fechaObj = new Date(fecha);
        const year = fechaObj.getFullYear();
        const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
        const day = String(fechaObj.getDate()).padStart(2, '0');
        
        return `${year}-${month}-${day}`;
    } catch (e) {
        console.error('Error normalizando fecha:', e);
        return null;
    }
}

/**
 * Muestra mensaje de alerta
 */
export function mostrarAlerta(mensaje, tipo = 'info') {
    // Usar SweetAlert2 si está disponible
    if (typeof Swal !== 'undefined') {
        const iconos = {
            'success': 'success',
            'error': 'error',
            'warning': 'warning',
            'info': 'info'
        };
        
        Swal.fire({
            icon: iconos[tipo] || 'info',
            title: mensaje,
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
        });
    } else {
        // Fallback a alert nativo
        alert(mensaje);
    }
}

/**
 * Obtiene parámetros de URL
 */
export function obtenerParametroURL(nombre) {
    const params = new URLSearchParams(window.location.search);
    return params.get(nombre);
}

/**
 * Debounce para optimizar búsquedas
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Valida formato de hora HH:MM
 */
export function esHoraValida(hora) {
    if (!hora) return false;
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(hora);
}

/**
 * Obtiene el nombre del día de la semana
 */
export function obtenerNombreDia(fecha) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const fechaObj = new Date(fecha);
    return dias[fechaObj.getDay()];
}

/**
 * Genera opciones de hora para select
 */
export function generarOpcionesHora(horaInicio = 6, horaFin = 22, intervalo = 60) {
    const opciones = [];
    
    for (let hora = horaInicio; hora <= horaFin; hora++) {
        for (let minuto = 0; minuto < 60; minuto += intervalo) {
            const horaStr = String(hora).padStart(2, '0');
            const minutoStr = String(minuto).padStart(2, '0');
            opciones.push(`${horaStr}:${minutoStr}`);
        }
    }
    
    return opciones;
}

/**
 * Filtra eventos según criterios
 */
export function filtrarEventos(eventos, filtros = {}) {
    if (!eventos || eventos.length === 0) return [];
    
    return eventos.filter(evento => {
        // Filtrar por estado
        if (filtros.estados && filtros.estados.length > 0) {
            if (!filtros.estados.includes(evento.estado)) {
                return false;
            }
        }
        
        // Filtrar por fecha
        if (filtros.fechaInicio) {
            if (evento.fecha < filtros.fechaInicio) {
                return false;
            }
        }
        
        if (filtros.fechaFin) {
            if (evento.fecha > filtros.fechaFin) {
                return false;
            }
        }
        
        // Filtrar por búsqueda de texto
        if (filtros.busqueda) {
            const busqueda = filtros.busqueda.toLowerCase();
            const textoEvento = `${evento.titulo} ${evento.descripcion}`.toLowerCase();
            if (!textoEvento.includes(busqueda)) {
                return false;
            }
        }
        
        return true;
    });
}

/**
 * Log de debug con timestamp
 */
export function log(mensaje, datos = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${mensaje}`, datos || '');
}

/**
 * Log de error con timestamp
 */
export function logError(mensaje, error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ❌ ${mensaje}`, error);
}
