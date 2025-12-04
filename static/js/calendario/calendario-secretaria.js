// =====================================================
// CALENDARIO - MÓDULO SECRETARIA
// Lógica EXCLUSIVA para gestión de horarios (NO ve reservas)
// =====================================================

import { log, logError } from './calendario-utils.js';
import { crearCalendario } from './calendario-core.js';

/**
 * Inicializa el calendario para secretaria - SOLO gestión de horarios
 */
export async function inicializarSecretaria(state) {
    log('👩‍💼 Inicializando calendario para secretaria - Gestión de horarios');
    
    const contenedor = document.querySelector('.fechas');
    
    if (!contenedor) {
        logError('No se encontró contenedor de calendario');
        return;
    }
    
    // Crear calendario para gestión de horarios (vista semanal)
    state.calendarHorarios = crearCalendario(contenedor, {
        initialView: 'timeGridWeek',
        slotMinTime: '06:00:00',
        slotMaxTime: '22:00:00',
        slotDuration: '01:00:00',  // Intervalos de 1 hora
        allDaySlot: false,
        selectable: true,
        select: (selectInfo) => {
            // Permitir agregar múltiples horarios arrastrando
            if (typeof window.mostrarModalAgregarHorariosMultiples === 'function') {
                window.mostrarModalAgregarHorariosMultiples(selectInfo);
            }
        },
        dateClick: (info) => {
            // Click en hora específica para agregar horario
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
    await cargarHorariosSecretaria(state);
    
    state.calendarHorarios.render();
    
    log('✅ Calendario de gestión de horarios renderizado');
}

/**
 * Carga horarios disponibles de la parroquia
 */
async function cargarHorariosSecretaria(state) {
    try {
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
