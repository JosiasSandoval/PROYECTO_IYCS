// =====================================================
// CALENDARIO - MÓDULO FELIGRÉS
// Lógica específica para visualización de reservas del feligrés
// =====================================================

import { log, obtenerNombreEstado, formatearFecha, obtenerColorPorEstado } from './calendario-utils.js';
import { crearCalendario, convertirAEventos } from './calendario-core.js';

/**
 * Inicializa el calendario para feligrés
 */
export async function inicializarFeligres(state) {
    log('🙏 Inicializando calendario para feligrés');
    
    const contenedor = document.querySelector('.fechas');
    
    if (!contenedor) {
        log('⚠️ No se encontró contenedor de calendario');
        return;
    }
    
    // FELIGRÉS NO VE CANCELADAS - Filtrar antes de convertir a eventos
    const reservasVisibles = state.datosFiltrados.filter(r => {
        const estado = r.estado;
        return estado !== 'CANCELADA' && estado !== 'CANCELADO';
    });
    
    log(`🔍 Feligrés: ${state.datosFiltrados.length} total → ${reservasVisibles.length} visibles (sin canceladas)`);
    
    // Convertir reservas a eventos
    const eventosOriginales = convertirAEventos(reservasVisibles);
    
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
            // Si hay 3 o menos, mostrar todas individualmente (ya están ordenadas)
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
    
    // Crear calendario con opciones específicas para feligrés
    log('🔧 Creando calendario con eventos:', eventos);
    log('🔧 Contenedor:', contenedor);
    
    state.calendar = crearCalendario(contenedor, {
        initialView: 'dayGridMonth',
        locale: 'es',
        events: eventos,
        dayMaxEvents: false, // Sin límite para diagnóstico
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
                    // Si es la única reserva, mostrar detalle individual
                    mostrarDetalleReserva(info.event);
                }
            }
        },
        dateClick: function(info) {
            mostrarReservasDelDia(info.dateStr, state.datosFiltrados);
        },
        eventDidMount: function(info) {
            // Debug: confirmar que los eventos se están montando
            log('🎨 Evento montado:', info.event.title, info.event.start);
        }
    });
    
    // Renderizar
    log('🔧 Renderizando calendario...');
    state.calendar.render();
    log('✅ Calendario.render() completado');
    
    // Verificar si hay eventos en el calendario después de renderizar
    setTimeout(() => {
        const eventosRenderizados = state.calendar.getEvents();
        log(`🔍 Eventos en calendario después de render: ${eventosRenderizados.length}`);
        if (eventosRenderizados.length > 0) {
            log('📋 Primeros eventos renderizados:', eventosRenderizados.slice(0, 3).map(e => ({
                title: e.title,
                start: e.start,
                backgroundColor: e.backgroundColor
            })));
        }
    }, 500);
    
    log(`✅ Calendario feligrés renderizado con ${state.datosFiltrados.length} reservas`);
}

/**
 * Muestra detalle de una reserva en modal
 */
function mostrarDetalleReserva(evento) {
    const props = evento.extendedProps;
    
    log('📌 Click en reserva:', props.idReserva);
    
    // Procesar participantes si existen
    let participantesHTML = '';
    if (props.participantes && props.participantes.trim()) {
        const participantes = props.participantes
            .split(';')
            .map(p => p.trim())
            .filter(p => p.length > 0);
        
        // Separar sacerdote y beneficiarios
        const sacerdote = participantes.find(p => p.toLowerCase().includes('sacerdote'));
        const beneficiarios = participantes.filter(p => !p.toLowerCase().includes('sacerdote'));
        
        let listaHTML = '';
        
        if (sacerdote) {
            // Extraer solo el nombre del sacerdote (después de ":")
            const nombreSacerdote = sacerdote.includes(':') ? sacerdote.split(':')[1].trim() : sacerdote;
            listaHTML += `
                <div class="mb-2">
                    <small class="text-muted d-block">Sacerdote</small>
                    <strong>${nombreSacerdote}</strong>
                </div>`;
        }
        
        if (beneficiarios.length > 0) {
            const nombresBeneficiarios = beneficiarios
                .map(b => b.includes(':') ? b.split(':')[1].trim() : b)
                .map(b => `<li>${b}</li>`)
                .join('');
            
            listaHTML += `
                <div class="mb-2">
                    <small class="text-muted d-block">Beneficiario${beneficiarios.length > 1 ? 's' : ''}</small>
                    <ul class="mt-1 mb-0" style="padding-left: 20px;">
                        ${nombresBeneficiarios}
                    </ul>
                </div>`;
        }
        
        if (listaHTML) {
            participantesHTML = `
                <div class="col-12 mb-3">
                    <div class="d-flex align-items-start">
                        <span style="font-size: 1.2rem; margin-right: 10px;">👥</span>
                        <div style="flex: 1;">
                            ${listaHTML}
                        </div>
                    </div>
                </div>`;
        }
    }
    
    // Crear contenido del modal
    const contenido = `
        <div class="p-3">
            <h5 class="mb-4 text-center">${evento.title}</h5>
            
            <div class="row">
                <div class="col-12 mb-3">
                    <div class="d-flex align-items-center">
                        <span style="font-size: 1.2rem; margin-right: 10px;">📅</span>
                        <div>
                            <small class="text-muted d-block">Fecha</small>
                            <strong>${evento.start.toLocaleDateString('es-PE', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                            })}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="col-12 mb-3">
                    <div class="d-flex align-items-center">
                        <span style="font-size: 1.2rem; margin-right: 10px;">🕐</span>
                        <div>
                            <small class="text-muted d-block">Hora</small>
                            <strong>${evento.start.toLocaleTimeString('es-PE', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                            })}</strong>
                        </div>
                    </div>
                </div>
                
                <div class="col-12 mb-3">
                    <div class="d-flex align-items-center">
                        <span style="font-size: 1.2rem; margin-right: 10px;">🔖</span>
                        <div>
                            <small class="text-muted d-block">Estado</small>
                            <span class="badge" style="background-color: ${obtenerColorPorEstado(props.estado)}; color: white; font-size: 0.9rem;">
                                ${obtenerNombreEstado(props.estado)}
                            </span>
                        </div>
                    </div>
                </div>
                
                ${props.parroquia ? `
                <div class="col-12 mb-3">
                    <div class="d-flex align-items-center">
                        <span style="font-size: 1.2rem; margin-right: 10px;">📍</span>
                        <div>
                            <small class="text-muted d-block">Parroquia</small>
                            <strong>${props.parroquia}</strong>
                        </div>
                    </div>
                </div>` : ''}
                
                ${props.costoBase ? `
                <div class="col-12 mb-3">
                    <div class="d-flex align-items-center">
                        <span style="font-size: 1.2rem; margin-right: 10px;">💰</span>
                        <div>
                            <small class="text-muted d-block">Costo</small>
                            <strong>S/ ${parseFloat(props.costoBase).toFixed(2)}</strong>
                        </div>
                    </div>
                </div>` : ''}
                
                ${participantesHTML}
                
                ${props.descripcion ? `
                <div class="col-12 mb-2">
                    <div class="d-flex align-items-start">
                        <span style="font-size: 1.2rem; margin-right: 10px;">📝</span>
                        <div>
                            <small class="text-muted d-block">Descripción</small>
                            <p class="mb-0">${props.descripcion}</p>
                        </div>
                    </div>
                </div>` : ''}
            </div>
        </div>
    `;
    
    mostrarModal('Detalle de Reserva', contenido);
}

/**
 * Muestra todas las reservas de un día específico (incluye canceladas)
 */
function mostrarReservasDelDia(fecha, todasReservas) {
    // Filtrar reservas de la fecha seleccionada
    // FELIGRÉS: Filtrar canceladas también del modal
    const reservas = todasReservas
        .filter(r => {
            const esFechaCorrecta = r.fecha === fecha;
            const noEsCancelada = r.estado !== 'CANCELADA' && r.estado !== 'CANCELADO';
            return esFechaCorrecta && noEsCancelada;
        })
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
    
    // Crear contenido
    const contenido = `
        <div class="p-2">
            <p class="text-muted mb-3">Se encontraron ${reservas.length} reserva(s) activa(s) para este día</p>
            ${reservas.map(r => `
                <div class="card mb-2" style="border-left: 4px solid ${obtenerColorPorEstado(r.estado)};">
                    <div class="card-body py-2">
                        <div class="d-flex justify-content-between align-items-start mb-2">
                            <div>
                                <h6 class="mb-1">${r.titulo}</h6>
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
            `).join('')}
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
    let modal = document.getElementById('modalCalendarioFeligres');
    
    if (!modal) {
        // Crear modal
        modal = document.createElement('div');
        modal.id = 'modalCalendarioFeligres';
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
