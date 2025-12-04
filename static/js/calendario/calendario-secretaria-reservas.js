// =====================================================
// CALENDARIO - MÓDULO SECRETARIA (Vista de Reservas)
// Para cuando la secretaria ve mis_reservas.html
// =====================================================

import { log, obtenerNombreEstado, obtenerColorPorEstado } from './calendario-utils.js';
import { crearCalendario, convertirAEventos } from './calendario-core.js';

/**
 * Inicializa el calendario de reservas para secretaria (en mis_reservas.html)
 */
export async function inicializarSecretariaReservas(state) {
    log('👩‍💼 Inicializando calendario de reservas para secretaria');
    
    const contenedor = document.querySelector('.fechas');
    
    if (!contenedor) {
        log('⚠️ No se encontró contenedor de calendario');
        return;
    }
    
    log(`👩‍💼 Secretaria: ${state.datosFiltrados.length} reservas (incluyendo canceladas)`);
    
    // SECRETARIA VE TODAS las reservas (incluso canceladas)
    const eventosOriginales = convertirAEventos(state.datosFiltrados);
    
    // Agrupar eventos por fecha
    const eventosPorDia = {};
    eventosOriginales.forEach(evento => {
        const fecha = evento.start.split('T')[0];
        if (!eventosPorDia[fecha]) {
            eventosPorDia[fecha] = [];
        }
        eventosPorDia[fecha].push(evento);
    });
    
    // Ordenar eventos de cada día por hora
    Object.keys(eventosPorDia).forEach(fecha => {
        eventosPorDia[fecha].sort((a, b) => {
            const horaA = a.start.split('T')[1] || '00:00';
            const horaB = b.start.split('T')[1] || '00:00';
            return horaA.localeCompare(horaB);
        });
    });
    
    // Crear eventos para el calendario
    const eventos = [];
    Object.keys(eventosPorDia).forEach(fecha => {
        const reservasDia = eventosPorDia[fecha];
        
        if (reservasDia.length <= 3) {
            // Si hay 3 o menos, mostrar todas individualmente (ya ordenadas)
            eventos.push(...reservasDia);
        } else {
            // Si hay más de 3, crear evento especial
            eventos.push({
                start: fecha,
                title: `📋 ${reservasDia.length} reservas`,
                allDay: true,
                backgroundColor: '#6366f1',
                borderColor: '#6366f1',
                textColor: '#ffffff',
                extendedProps: {
                    esMultiple: true,
                    cantidadReservas: reservasDia.length,
                    fecha: fecha
                }
            });
        }
    });
    
    log(`📅 Eventos creados para el calendario: ${eventos.length}`);
    if (eventos.length > 0) {
        log('📌 Primeros eventos:', eventos.slice(0, 3));
    }
    
    // Crear calendario con opciones específicas para secretaria
    state.calendar = crearCalendario(contenedor, {
        initialView: 'dayGridMonth',
        locale: 'es',
        events: eventos,
        dayMaxEvents: 4, // Mostrar máximo 4 eventos por día antes de mostrar "+X más"
        eventClick: function(info) {
            // Si es un evento múltiple (contador), mostrar todas las reservas del día
            if (info.event.extendedProps.esMultiple) {
                mostrarReservasDelDia(info.event.extendedProps.fecha, state.datosFiltrados);
            } else {
                // Si es un evento individual, verificar si hay más reservas ese día
                const fecha = info.event.start.toISOString().split('T')[0];
                const reservasDelDia = state.datosFiltrados.filter(r => r.fecha === fecha);
                
                if (reservasDelDia.length > 1) {
                    // Si hay más de una reserva, mostrar el modal del día
                    mostrarReservasDelDia(fecha, state.datosFiltrados);
                } else {
                    // Si es la única, usar la función global del modal
                    if (typeof window.mostrarDatosDelDia === 'function') {
                        window.mostrarDatosDelDia(info.event);
                    }
                }
            }
        },
        dateClick: function(info) {
            mostrarReservasDelDia(info.dateStr, state.datosFiltrados);
        }
    });
    
    // Renderizar
    state.calendar.render();
    
    log(`✅ Calendario secretaria (reservas) renderizado con ${state.datosFiltrados.length} reservas`);
}

/**
 * Muestra todas las reservas de un día específico (incluye canceladas)
 */
function mostrarReservasDelDia(fecha, todasReservas) {
    // Filtrar reservas de la fecha seleccionada - SECRETARIA VE TODAS (incluso canceladas)
    const reservas = todasReservas
        .filter(r => r.fecha === fecha)
        .sort((a, b) => {
            // Ordenar por hora de inicio
            const horaA = a.hora || '00:00';
            const horaB = b.hora || '00:00';
            return horaA.localeCompare(horaB);
        });
    
    log(`📅 Click en fecha: ${fecha} - ${reservas.length} reserva(s)`);
    
    if (reservas.length === 0) {
        return;
    }
    
    // Procesar participantes para cada reserva
    const procesarParticipantes = (participantesStr) => {
        if (!participantesStr || !participantesStr.trim()) return '';
        
        const participantes = participantesStr
            .split(';')
            .map(p => p.trim())
            .filter(p => p.length > 0);
        
        const sacerdote = participantes.find(p => p.toLowerCase().includes('sacerdote'));
        const beneficiarios = participantes.filter(p => !p.toLowerCase().includes('sacerdote'));
        
        let resultado = [];
        
        if (sacerdote) {
            const nombreSacerdote = sacerdote.includes(':') ? sacerdote.split(':')[1].trim() : sacerdote;
            resultado.push(`<strong>Sacerdote:</strong> ${nombreSacerdote}`);
        }
        
        if (beneficiarios.length > 0) {
            const nombresBeneficiarios = beneficiarios
                .map(b => b.includes(':') ? b.split(':')[1].trim() : b)
                .join(', ');
            resultado.push(`<strong>Beneficiario${beneficiarios.length > 1 ? 's' : ''}:</strong> ${nombresBeneficiarios}`);
        }
        
        return resultado.join('<br>');
    };
    
    // Crear contenido con indicador visual para canceladas
    const contenido = `
        <div class="p-2">
            <p class="text-muted mb-3">Se encontraron ${reservas.length} reserva(s) para este día</p>
            ${reservas.map(r => {
                const esCancelada = r.estado === 'CANCELADA' || r.estado === 'CANCELADO';
                const opacidad = esCancelada ? 'opacity: 0.6; text-decoration: line-through;' : '';
                return `
                <div class="card mb-2" style="border-left: 4px solid ${obtenerColorPorEstado(r.estado)}; ${opacidad}">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="mb-1">${r.titulo} ${esCancelada ? '(Cancelada)' : ''}</h6>
                                <small class="text-muted">
                                    🕐 ${r.hora || 'Sin hora'} | 
                                    <span class="badge badge-sm" style="background-color: ${obtenerColorPorEstado(r.estado)}; color: white;">
                                        ${obtenerNombreEstado(r.estado)}
                                    </span>
                                </small>
                            </div>
                        </div>
                        ${r.participantes ? `<div class="mt-2"><small>👥 ${procesarParticipantes(r.participantes)}</small></div>` : ''}
                    </div>
                </div>
            `}).join('')}
        </div>
    `;
    
    const fechaFormateada = new Date(fecha + 'T00:00:00').toLocaleDateString('es-PE', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    mostrarModal(`Reservas del ${fechaFormateada}`, contenido);
}

/**
 * Muestra un modal genérico
 */
function mostrarModal(titulo, contenido) {
    // Buscar modal existente o crear uno nuevo
    let modal = document.getElementById('modalCalendarioSecretaria');
    
    if (!modal) {
        // Crear modal
        modal = document.createElement('div');
        modal.id = 'modalCalendarioSecretaria';
        modal.className = 'modal fade';
        modal.setAttribute('tabindex', '-1');
        modal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title"></h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }
    
    // Actualizar contenido
    const modalTitle = modal.querySelector('.modal-title');
    const modalBody = modal.querySelector('.modal-body');
    
    if (modalTitle) modalTitle.textContent = titulo;
    if (modalBody) modalBody.innerHTML = contenido;
    
    // Mostrar modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}
