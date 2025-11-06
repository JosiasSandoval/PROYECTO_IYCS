// ==============================
// calendario_reserva.js — Lógica solo del calendario
// ==============================

let fechaSeleccionada = null;
let horaSeleccionada = null;
let calendario;
const DIA_MAPEO = ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'];

document.addEventListener('DOMContentLoaded', () => {
    inicializarCalendario();

    // Cuando cambie el acto litúrgico, recarga disponibilidad
    const actoSelect = document.getElementById('acto-liturgico');
    if (actoSelect) {
        actoSelect.addEventListener('change', async () => {
            await cargarDisponibilidadActo();
        });
    }
});

// ==============================
// Inicializar calendario
// ==============================
function inicializarCalendario() {
    const calendarioEl = document.querySelector('.fechas');
    if (!calendarioEl) return;

    calendario = new FullCalendar.Calendar(calendarioEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        selectable: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek'
        },
        buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana' },

        // Bloquear fechas pasadas
        validRange: {
            start: new Date().toISOString().split('T')[0]
        },

        // Evento al hacer clic en un día
        dateClick: function(info) {
            const fecha = info.dateStr;
            const hoy = new Date().toISOString().split('T')[0];

            // Evitar selección de días pasados
            if (fecha < hoy) {
                alert("❌ No puedes seleccionar una fecha pasada.");
                return;
            }

            // Validar si la fecha pertenece al día disponible
            const diaNombre = DIA_MAPEO[info.date.getDay()];
            if (!fechaDisponible(diaNombre)) {
                alert("⚠️ Este día no está disponible para el acto seleccionado.");
                return;
            }

            fechaSeleccionada = fecha;
            abrirModalHoraDisponible(fecha);
        }
    });

    calendario.render();
}

// ==============================
// Cargar disponibilidad del acto seleccionado
// ==============================
async function cargarDisponibilidadActo() {
    const actoSelect = document.getElementById('acto-liturgico');
    const idActo = actoSelect?.value;

    if (!idActo) {
        limpiarCalendario();
        return;
    }

    try {
        // 🔹 Aquí podrías llamar a tu API Flask real
        const respuesta = await fetch(`/api/acto/disponibilidad/${idActo}`);
        const data = await respuesta.json();

        if (data.success && Array.isArray(data.datos)) {
            // Guarda las configuraciones
            window.horariosConfiguracion = data.datos.map(d => ({
                diaSemana: d.diaSemana.toUpperCase(),
                hora: d.horaInicio
            }));

            // Pintar los días disponibles en el calendario
            pintarDiasDisponibles();
        } else {
            limpiarCalendario();
        }
    } catch (error) {
        console.error("Error cargando disponibilidad:", error);
        limpiarCalendario();
    }
}

// ==============================
// Verifica si un día está disponible
// ==============================
function fechaDisponible(nombreDia) {
    if (!window.horariosConfiguracion) return false;
    return window.horariosConfiguracion.some(h => h.diaSemana === nombreDia);
}

// ==============================
// Pinta los días disponibles en verde
// ==============================
function pintarDiasDisponibles() {
    if (!calendario) return;
    calendario.removeAllEvents();

    const eventos = [];
    const fechaActual = new Date();
    const finMes = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);

    for (let d = new Date(); d <= finMes; d.setDate(d.getDate() + 1)) {
        const nombreDia = DIA_MAPEO[d.getDay()];
        if (fechaDisponible(nombreDia)) {
            eventos.push({
                title: "Disponible",
                start: d.toISOString().split('T')[0],
                display: 'background',
                backgroundColor: '#b8f7b0'
            });
        }
    }

    calendario.addEventSource(eventos);
}

// ==============================
// Limpia el calendario
// ==============================
function limpiarCalendario() {
    if (calendario) calendario.removeAllEvents();
    window.horariosConfiguracion = [];
}

// ==============================
// Abre modal con hora disponible
// ==============================
function abrirModalHoraDisponible(fecha) {
    const nombreDia = DIA_MAPEO[new Date(fecha).getDay()];
    const horasDisponibles = window.horariosConfiguracion
        .filter(h => h.diaSemana === nombreDia)
        .map(h => h.hora);

    if (horasDisponibles.length === 0) {
        alert("⚠️ No hay horarios disponibles para este día.");
        return;
    }

    const modalBody = document.getElementById('confirmacionBody');
    modalBody.innerHTML = `
        <p><strong>Fecha seleccionada:</strong> ${fecha}</p>
        <p><strong>Selecciona un horario:</strong></p>
        <div class="list-group">
            ${horasDisponibles.map(hora => `
                <button class="list-group-item list-group-item-action hora-opcion">${hora}</button>
            `).join('')}
        </div>
    `;

    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmacion'));
    modal.show();

    // Asignar click a cada hora
    document.querySelectorAll('.hora-opcion').forEach(btn => {
        btn.addEventListener('click', () => {
            horaSeleccionada = btn.textContent;
            document.getElementById('fechaSeleccionadaModal').textContent = fecha;
            document.getElementById('horaSeleccionadaModal').textContent = horaSeleccionada;
            confirmarReservaDesdeModal(modal);
        });
    });
}

// ==============================
// Confirmar reserva desde el modal
// ==============================
function confirmarReservaDesdeModal(modal) {
    const btnConfirmar = document.getElementById('btnConfirmarReserva');

    btnConfirmar.onclick = () => {
        document.getElementById('fecha-acto').value = fechaSeleccionada;
        document.getElementById('hora-acto').value = horaSeleccionada;
        modal.hide();

        alert("✅ Fecha y hora seleccionadas correctamente.");
    };
}
