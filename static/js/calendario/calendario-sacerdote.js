// =====================================================
// CALENDARIO - MÓDULO SACERDOTE
// Lógica para visualización filtrada de reservas
// =====================================================

import { log, filtrarEventos } from './calendario-utils.js';
import { crearCalendario, actualizarEventosCalendario, convertirAEventos } from './calendario-core.js';

/**
 * Inicializa el calendario para sacerdote
 */
export async function inicializarSacerdote(state) {
    log('✝️ Inicializando calendario para sacerdote');
    
    // Mostrar las tabs del sacerdote
    const tabsContainer = document.getElementById('tabs-sacerdote');
    if (tabsContainer) {
        tabsContainer.style.display = 'flex';
    }
    
    // Inicializar calendario de reservas (tab activo por defecto)
    await inicializarCalendarioReservas(state);
    
    // Configurar listeners de las tabs
    configurarTabsSacerdote(state);
    
    log(`✅ Calendario sacerdote renderizado`);
}

/**
 * Inicializa el calendario de reservas
 */
async function inicializarCalendarioReservas(state) {
    log('📅 Inicializando calendario de reservas');
    
    const contenedor = document.querySelector('.fechas');
    
    if (!contenedor) {
        log('⚠️ No se encontró contenedor de calendario de reservas');
        return;
    }
    
    // Filtrar: mostrar solo reservas donde el sacerdote participa
    // y excluir las canceladas
    state.datosFiltrados = state.datos.filter(d => 
        d.tipo === 'reserva' && 
        d.estado !== 'CANCELADA' && 
        d.estado !== 'CANCELADO'
        // TODO: Agregar filtro adicional para solo mostrar reservas donde participa
    );
    
    // Crear calendario
    state.calendar = crearCalendario(contenedor, {
        initialView: 'timeGridWeek', // Vista semanal por defecto
        events: convertirAEventos(state.datosFiltrados),
        eventClick: (info) => manejarClickReserva(info, state),
        dateClick: (info) => manejarClickFecha(info, state),
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00'
    });
    
    state.calendar.render();
    
    log(`✅ Calendario de reservas renderizado (${state.datosFiltrados.length} reservas)`);
}

/**
 * Inicializa el calendario de gestión de horarios
 */
async function inicializarCalendarioHorarios(state) {
    log('🕐 Inicializando calendario de gestión de horarios');
    
    const contenedor = document.querySelector('.fechas-horarios');
    
    if (!contenedor) {
        log('⚠️ No se encontró contenedor de horarios');
        return;
    }
    
    // Si el calendario ya existe, no recrearlo
    if (state.calendarHorarios) {
        log('ℹ️ Calendario de horarios ya existe');
        return;
    }
    
    // Crear calendario para horarios (vista semanal recurrente)
    state.calendarHorarios = crearCalendario(contenedor, {
        initialView: 'timeGridWeek',
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00',
        slotDuration: '01:00:00',  // Intervalos de 1 hora
        allDaySlot: false,
        selectable: true,
        select: (selectInfo) => {
            // Permitir agregar horarios arrastrando
            if (typeof window.mostrarModalAgregarHorariosMultiples === 'function') {
                window.mostrarModalAgregarHorariosMultiples(selectInfo);
            }
        },
        dateClick: (info) => {
            // Click en hora específica
            const fecha = info.dateStr.split('T')[0];
            const hora = info.dateStr.split('T')[1]?.slice(0, 5) || '08:00';
            
            // Obtener día de la semana
            const fechaObj = new Date(fecha + 'T00:00:00');
            const diasAbrev = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
            const diaSemana = diasAbrev[fechaObj.getDay()];
            
            if (typeof window.mostrarModalAgregarHorarioEspecifico === 'function') {
                window.mostrarModalAgregarHorarioEspecifico(fecha, hora, diaSemana);
            }
        },
        eventClick: (info) => {
            // Click en horario existente para eliminar
            if (typeof window.mostrarModalEliminarHorario === 'function') {
                window.mostrarModalEliminarHorario(info.event);
            }
        }
    });
    
    // Cargar horarios disponibles
    await cargarHorarios(state);
    
    state.calendarHorarios.render();
    
    log('✅ Calendario de horarios renderizado');
}

/**
 * Carga horarios disponibles de la parroquia
 */
async function cargarHorarios(state) {
    try {
        // Cargar horarios desde el backend
        const response = await fetch(`/api/acto/parroquia/${state.idParroquia}/actos-horarios`);
        const data = await response.json();
        
        if (!data.success || !data.datos) {
            log('⚠️ No hay horarios disponibles');
            return;
        }
        
        // Convertir horarios a eventos recurrentes
        const diasMap = { 'DOM': 0, 'LUN': 1, 'MAR': 2, 'MIÉ': 3, 'MIE': 3, 'JUE': 4, 'VIE': 5, 'SÁB': 6, 'SAB': 6 };
        
        const eventosHorarios = data.datos.map(h => ({
            id: h.idActoParroquia || h.id,
            title: h.nombreActo || h.titulo,
            daysOfWeek: [diasMap[h.diaSemana?.toUpperCase()] || 0],
            startTime: h.horaInicioActo || h.hora,
            endTime: calcularHoraFin(h.horaInicioActo || h.hora, 60),
            backgroundColor: '#22c55e',
            borderColor: '#22c55e',
            extendedProps: {
                idActo: h.idActo,
                idActoParroquia: h.idActoParroquia || h.id,
                costoBase: h.costoBase,
                tipo: 'horario',
                diaSemana: h.diaSemana,
                hora: h.horaInicioActo || h.hora
            }
        }));
        
        state.calendarHorarios.addEventSource(eventosHorarios);
        
        log(`✅ ${eventosHorarios.length} horarios cargados`);
    } catch (error) {
        console.error('Error cargando horarios:', error);
    }
}

/**
 * Calcula hora de fin dado hora inicio y duración
 */
function calcularHoraFin(horaInicio, duracionMinutos) {
    const [horas, minutos] = horaInicio.split(':').map(Number);
    const totalMinutos = horas * 60 + minutos + duracionMinutos;
    const horasFin = Math.floor(totalMinutos / 60);
    const minutosFin = totalMinutos % 60;
    
    return `${String(horasFin).padStart(2, '0')}:${String(minutosFin).padStart(2, '0')}`;
}

/**
 * Configura las tabs específicas para sacerdote
 */
function configurarTabsSacerdote(state) {
    log('🔧 Configurando tabs del sacerdote');
    
    const btnReservas = document.getElementById('tab-reservas');
    const btnHorarios = document.getElementById('tab-horarios');
    
    if (!btnReservas || !btnHorarios) {
        log('⚠️ No se encontraron botones de tabs');
        return;
    }
    
    // Tab: Mis Reservas
    btnReservas.addEventListener('click', async () => {
        log('📅 Cambiando a vista de reservas');
        // El calendario de reservas ya está inicializado
        // Solo asegurarse de que esté visible
    });
    
    // Tab: Gestionar Horarios
    btnHorarios.addEventListener('click', async () => {
        log('🕐 Cambiando a vista de horarios');
        
        // Inicializar calendario de horarios si no existe
        if (!state.calendarHorarios) {
            await inicializarCalendarioHorarios(state);
        } else {
            // Si ya existe, solo refrescar
            if (typeof window.calendarioFunctions?.recargarHorarios === 'function') {
                await window.calendarioFunctions.recargarHorarios();
            }
        }
    });
}

/**
 * Cambia la vista según la tab seleccionada
 */
function cambiarVistaTab(vista, state) {
    log(`🔄 Cambiando vista: ${vista}`);
    
    switch (vista) {
        case 'confirmadas':
            state.datosFiltrados = state.datos.filter(r => 
                r.estado === 'CONFIRMADO' || r.estado === 'ATENDIDO'
            );
            break;
            
        case 'todas':
            state.datosFiltrados = state.datos.filter(r =>
                r.estado !== 'CANCELADA' && r.estado !== 'RECHAZADA'
            );
            break;
            
        case 'pendientes':
            state.datosFiltrados = state.datos.filter(r => 
                r.estado === 'PENDIENTE_REVISION' || 
                r.estado === 'PENDIENTE_DOCUMENTO'
            );
            break;
    }
    
    // Aplicar filtros adicionales si existen
    aplicarFiltrosAdicionales(state);
    
    // Actualizar calendario
    actualizarEventosCalendario(state.calendar, state.datosFiltrados);
    
    log(`✅ Vista actualizada: ${state.datosFiltrados.length} reservas`);
}

/**
 * Activa una tab visualmente
 */
function activarTab(boton) {
    // Remover clase activa de todos
    document.querySelectorAll('#tabs-sacerdote button').forEach(btn => {
        btn.classList.remove('active', 'btn-primary');
        btn.classList.add('btn-outline-primary');
    });
    
    // Activar el seleccionado
    boton.classList.remove('btn-outline-primary');
    boton.classList.add('active', 'btn-primary');
}

/**
 * Configura filtros adicionales para sacerdote
 */
function configurarFiltrosSacerdote(state) {
    const contenedorFiltros = document.getElementById('filtros-superiores');
    
    if (!contenedorFiltros) return;
    
    contenedorFiltros.innerHTML = `
        <div class="row g-3">
            <div class="col-md-6">
                <label class="form-label">Buscar reserva:</label>
                <input type="text" id="filtroBusqueda" class="form-control" 
                       placeholder="Nombre, acto, participante...">
            </div>
            <div class="col-md-3">
                <label class="form-label">Desde:</label>
                <input type="date" id="filtroFechaInicio" class="form-control">
            </div>
            <div class="col-md-3">
                <label class="form-label">Hasta:</label>
                <input type="date" id="filtroFechaFin" class="form-control">
            </div>
        </div>
    `;
    
    // Event listeners
    document.getElementById('filtroBusqueda')?.addEventListener('input', () => 
        aplicarFiltrosAdicionales(state)
    );
    
    document.getElementById('filtroFechaInicio')?.addEventListener('change', () => 
        aplicarFiltrosAdicionales(state)
    );
    
    document.getElementById('filtroFechaFin')?.addEventListener('change', () => 
        aplicarFiltrosAdicionales(state)
    );
}

/**
 * Aplica filtros adicionales sobre los datos ya filtrados
 */
function aplicarFiltrosAdicionales(state) {
    const inputBusqueda = document.getElementById('filtroBusqueda');
    const inputFechaInicio = document.getElementById('filtroFechaInicio');
    const inputFechaFin = document.getElementById('filtroFechaFin');
    
    const busqueda = inputBusqueda?.value || '';
    const fechaInicio = inputFechaInicio?.value || null;
    const fechaFin = inputFechaFin?.value || null;
    
    // Aplicar filtros sobre datosFiltrados
    let datos = [...state.datosFiltrados];
    
    if (busqueda) {
        datos = datos.filter(d => {
            const texto = `${d.titulo} ${d.descripcion} ${d.participantes}`.toLowerCase();
            return texto.includes(busqueda.toLowerCase());
        });
    }
    
    if (fechaInicio) {
        datos = datos.filter(d => d.fecha >= fechaInicio);
    }
    
    if (fechaFin) {
        datos = datos.filter(d => d.fecha <= fechaFin);
    }
    
    // Actualizar calendario con filtros aplicados
    actualizarEventosCalendario(state.calendar, datos);
    
    log(`Filtros aplicados: ${datos.length} reservas`);
}

/**
 * Maneja click en una reserva
 */
function manejarClickReserva(info, state) {
    const props = info.event.extendedProps;
    log('📌 Click en reserva:', props.idReserva);
    
    // Usar la función del modal global desde calendario-modals.js
    if (typeof mostrarDatosDelDia === 'function') {
        const fecha = info.event.startStr.split('T')[0];
        mostrarDatosDelDia(fecha);
    } else {
        console.error('mostrarDatosDelDia no está disponible');
    }
}

/**
 * Maneja click en una fecha
 */
function manejarClickFecha(info, state) {
    const fecha = info.dateStr;
    log('📅 Click en fecha:', fecha);
    
    // Usar la función del modal global desde calendario-modals.js
    if (typeof mostrarDatosDelDia === 'function') {
        mostrarDatosDelDia(fecha);
    } else {
        console.error('mostrarDatosDelDia no está disponible');
    }
}

/**
 * Muestra modal con detalles de reserva para sacerdote
 */
function mostrarModalDetalleReservaSacerdote(reserva) {
    log('Modal detalle reserva sacerdote:', reserva);
    
    // TODO: Implementar o llamar a función de modales
    // Incluir opciones como:
    // - Marcar como atendida
    // - Agregar observaciones
    // - Ver documentos
}

/**
 * Muestra modal con reservas del día
 */
function mostrarModalReservasDia(fecha, reservas) {
    log(`Reservas del día ${fecha}:`, reservas.length);
    
    // TODO: Implementar o llamar a función de modales
}
