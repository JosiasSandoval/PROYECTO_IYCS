// ==============================
// calendario_reserva.js — Lógica solo del calendario
// ==============================

let horariosConfiguracion = [];
let reglasRestriccion = {};
let fechaSeleccionada = null;
const DIA_MAPEO = ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'];

document.addEventListener('DOMContentLoaded', async () => {
    await cargarReglasRestriccion();
    inicializarCalendario();
});

// ==============================
// Cargar reglas de restricción
// ==============================

async function cargarReglasRestriccion() {
    try {
        const response = await fetch('/api/reserva/reglas_restriccion');
        if (!response.ok) throw new Error('Error al cargar reglas de restricción');
        reglasRestriccion = await response.json();
    } catch (error) {
        console.error("Fallo al cargar reglas de restricción:", error);
        reglasRestriccion = {};
    }
}

// ==============================
// Inicializar calendario
// ==============================
function inicializarCalendario() {
    const calendarioEl = document.querySelector('.fechas');
    if (!calendarioEl) return;

    const calendar = new FullCalendar.Calendar(calendarioEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        selectable: true,
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
        buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' },

        dateClick: function(info) {
            fechaSeleccionada = info.dateStr;
            const diaNombre = DIA_MAPEO[info.date.getDay()];
            document.getElementById('fecha-acto').value = fechaSeleccionada;
            actualizarSelectHorarios(diaNombre);
        }
    });

    calendar.render();
}

// ==============================
// Actualizar horarios según día
// ==============================
function actualizarSelectHorarios(diaNombre) {
    const select = document.getElementById('hora-acto');
    if (!select) return;

    select.innerHTML = '<option>--Seleccione--</option>';

    const slotsDelDia = horariosConfiguracion.filter(slot => slot.dia === diaNombre);
    slotsDelDia.forEach(slot => {
        const option = document.createElement('option');
        option.value = slot.hora || `${slot.inicio}-${slot.fin}`;
        option.textContent = slot.descripcion || option.value;
        select.appendChild(option);
    });
}
