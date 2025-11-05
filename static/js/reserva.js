// =================================================================
// Archivo: /static/js/reserva.js (COMPLETO CON BOTONES ATRÁS/SIGUIENTE)
// =================================================================

let horariosConfiguracion = [];
let reglasRestriccion = {};
let fechaSeleccionada = null;

const DIA_MAPEO = ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'];

// ==============================
// Inicialización
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
    const idParroquiaSeleccionada = localStorage.getItem('idParroquiaSeleccionada');

    if (!idParroquiaSeleccionada) {
        const formContainer = document.getElementById('form-container');
        if (formContainer) {
            formContainer.innerHTML = `<p style="color:red; font-weight:bold;">Debes seleccionar una parroquia antes de continuar.</p>`;
        }
        return;
    }

    await cargarReglasRestriccion();
    cargarActosPorParroquia(idParroquiaSeleccionada);
    inicializarCalendario();
    cargarDatosPrevios(); // Cargar datos si se vuelve atrás
});

// ==============================
// Cargar actos litúrgicos
// ==============================
async function cargarActosPorParroquia(idParroquia) {
    const actoSelect = document.getElementById('acto-liturgico');
    if (!actoSelect) return;

    try {
        const response = await fetch(`/api/acto/reserva/${idParroquia}`);
        if (!response.ok) throw new Error(`Error al cargar actos: ${response.statusText}`);
        const data = await response.json();

        actoSelect.innerHTML = '<option value="">--Seleccione un acto--</option>';

        if (data.success && Array.isArray(data.datos) && data.datos.length > 0) {
            data.datos.forEach(acto => {
                const option = document.createElement('option');
                option.value = acto.id;
                option.dataset.nombreActo = acto.acto.toUpperCase().replace(/\s/g, '_');
                option.textContent = `${acto.acto} (Costo: S/ ${parseFloat(acto.costoBase).toFixed(2)})`;
                actoSelect.appendChild(option);
            });
        }

        actoSelect.addEventListener('change', async function() {
            const selectedOption = actoSelect.options[actoSelect.selectedIndex];
            if (!selectedOption.value) {
                actualizarSelectHorarios(null);
                return;
            }

            let tipoBusqueda = selectedOption.dataset.nombreActo;
            tipoBusqueda = tipoBusqueda.replace(/_.*/, '');

            if (tipoBusqueda) {
                const success = await cargarHorariosBase(tipoBusqueda);
                if (success && fechaSeleccionada) {
                    const diaNombre = DIA_MAPEO[new Date(fechaSeleccionada).getDay()];
                    actualizarSelectHorarios(diaNombre);
                }
            }
        });

    } catch (error) {
        console.error("Error cargando actos por parroquia:", error);
    }
}

// ==============================
// Cargar reglas de restricción
// ==============================
async function cargarReglasRestriccion() {
    try {
        const response = await fetch('/api/reserva/reglas_restriccion');
        if (!response.ok) throw new Error('Error al cargar reglas de restricción');
        reglasRestriccion = await response.json();
    } catch (error) {
        console.error("Fallo la llamada a /api/reserva/reglas_restriccion:", error);
        reglasRestriccion = {};
    }
}

// ==============================
// Cargar horarios base desde API
// ==============================
async function cargarHorariosBase(tipo) {
    try {
        const tipoDB = tipo.replace(/_.*/, '');
        const response = await fetch(`/api/reserva/horarios_base?tipo=${tipoDB}`);
        if (!response.ok) throw new Error(`Error al cargar horarios base para ${tipoDB}`);
        const data = await response.json();

        horariosConfiguracion = [];

        data.forEach(slot => {
            if (slot.Hora) {
                horariosConfiguracion.push({
                    dia: slot.DiaDeLaSemana.toUpperCase(),
                    hora: slot.Hora,
                    descripcion: slot.descripcion,
                    id: slot.idConfiguracion
                });
            } else if (slot.HoraInicio && slot.HoraFin) {
                horariosConfiguracion.push({
                    dia: slot.DiaDeLaSemana.toUpperCase(),
                    inicio: slot.HoraInicio,
                    fin: slot.HoraFin,
                    descripcion: slot.descripcion,
                    id: slot.idConfiguracion
                });
            }
        });

        return true;

    } catch (error) {
        console.error("Error cargando horarios base:", error);
        horariosConfiguracion = [];
        return false;
    }
}

// ==============================
// Actualizar select de horarios según día
// ==============================
function actualizarSelectHorarios(diaNombre) {
    const select = document.getElementById('hora-acto');
    const inputFecha = document.getElementById('fecha-acto');
    if (!select) return;

    select.innerHTML = '<option>--Seleccione--</option>';

    if (!diaNombre) return;

    if (inputFecha && fechaSeleccionada) {
        inputFecha.value = fechaSeleccionada;
    }

    const slotsDelDia = horariosConfiguracion.filter(slot => slot.dia === diaNombre);

    slotsDelDia.forEach(slot => {
        const option = document.createElement('option');
        if (slot.hora) {
            option.value = slot.hora;
            option.textContent = `${slot.hora} - ${slot.descripcion || ''}`;
        } else if (slot.inicio && slot.fin) {
            option.value = `${slot.inicio}-${slot.fin}`;
            option.textContent = `${slot.inicio} - ${slot.fin} ${slot.descripcion || ''}`;
        }
        select.appendChild(option);
    });
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
        allDaySlot: false,
        height: '100%',
        slotMinTime: '07:00:00',
        slotMaxTime: '23:00:00',
        slotDuration: '01:00:00',
        slotLabelFormat: { hour: 'numeric', minute: '2-digit', omitZeroMinute: true, meridiem: 'short' },
        slotLabelInterval: '01:00:00',
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' },
        buttonText: { today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día' },

        dateClick: function(info) {
            fechaSeleccionada = info.dateStr;
            const diaNombre = DIA_MAPEO[info.date.getDay()];
            actualizarSelectHorarios(diaNombre);
        }
    });

    calendar.render();
}

// ==============================
// Botón SIGUIENTE
// ==============================
// ==============================
// Botón SIGUIENTE (actualizado)
// ==============================
document.getElementById('btn-siguiente')?.addEventListener('click', function() {
    const inputFecha = document.getElementById('fecha-acto');
    const selectHora = document.getElementById('hora-acto');
    const inputObservaciones = document.getElementById('observaciones');
    const actoSelect = document.getElementById('acto-liturgico');

    const fecha = inputFecha?.value;
    const hora = selectHora?.value;
    const observaciones = inputObservaciones?.value;
    const idActo = actoSelect?.value;
    const nombreActo = actoSelect?.options[actoSelect.selectedIndex].textContent || '';

    if (!fecha || !hora || !observaciones || !idActo) {
        alert("Debe completar todos los campos antes de continuar.");
        return;
    }

    localStorage.setItem('reserva', JSON.stringify({ 
        idActo,
        nombreActo,    // <-- Guardamos también el nombre
        fecha,
        hora,
        observaciones 
    }));

    window.location.href = 'reserva_datos'; // Cambiar a la URL real
});


// ==============================
// Botón ATRÁS
// ==============================
document.getElementById('btn-atras')?.addEventListener('click', function() {
    const datosPrevios = localStorage.getItem('reserva');
    if (!datosPrevios) {
        window.history.back();
        return;
    }

    const reserva = JSON.parse(datosPrevios);
    // Asume que estamos en la página de selección de acto
    document.getElementById('fecha-acto').value = reserva.fecha || '';
    document.getElementById('hora-acto').value = reserva.hora || '';
    document.getElementById('observaciones').value = reserva.observaciones || '';
    document.getElementById('acto-liturgico').value = reserva.idActo || '';

    // Si quieres, se puede redibujar el calendario con la fecha seleccionada
    if (reserva.fecha) {
        fechaSeleccionada = reserva.fecha;
        const diaNombre = DIA_MAPEO[new Date(reserva.fecha).getDay()];
        actualizarSelectHorarios(diaNombre);
    }
});

// ==============================
// Cargar datos si vuelve atrás
// ==============================
function cargarDatosPrevios() {
    const datosPrevios = localStorage.getItem('reserva');
    if (!datosPrevios) return;

    const reserva = JSON.parse(datosPrevios);
    document.getElementById('fecha-acto').value = reserva.fecha || '';
    document.getElementById('hora-acto').value = reserva.hora || '';
    document.getElementById('observaciones').value = reserva.observaciones || '';
    document.getElementById('acto-liturgico').value = reserva.idActo || '';

    // Mostrar nombre del acto en algún lugar, si quieres
    const nombreActoDiv = document.getElementById('nombre-acto');
    if (nombreActoDiv && reserva.nombreActo) {
        nombreActoDiv.textContent = reserva.nombreActo;
    }

    if (reserva.fecha) {
        fechaSeleccionada = reserva.fecha;
        const diaNombre = DIA_MAPEO[new Date(reserva.fecha).getDay()];
        actualizarSelectHorarios(diaNombre);
    }
}

async function renderizarParticipantesPorActo(acto) {
    const contenedor = document.getElementById('participantes-acto');
    if (!contenedor) return;
    contenedor.innerHTML = ''; // Limpiar previo contenido

    if (!acto) return;

    let ruta = '';
    const tipo = acto.toUpperCase().replace(/\s/g, '_');

    switch (tipo) {
        case 'BAUTISMO':
            ruta = '/api/reserva/requisitos/bautismo';
            break;
        case 'MATRIMONIO':
            ruta = '/api/reserva/requisitos/matrimonio';
            break;
        case 'MISA':
        case 'MISA_DE_DIFUNTOS':
            ruta = '/api/reserva/requisitos/misa';
            break;
        default:
            contenedor.innerHTML = '<p>No hay participantes definidos para este acto.</p>';
            return;
    }

    try {
        const response = await fetch(ruta);
        if (!response.ok) throw new Error('Error cargando participantes/requisitos');
        const data = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            contenedor.innerHTML = '<p>No hay participantes para este acto.</p>';
            return;
        }

        data.forEach(item => {
            // Suponiendo que valor es el nombre del participante
            const nombre = item.valor || item.nombClave;
            const div = document.createElement('div');
            div.className = 'form-group full-width';
            const idCampo = nombre.toLowerCase().replace(/\s/g,'-');
            if (nombre.toLowerCase().includes('observacion')) {
                div.innerHTML = `<label for="${idCampo}">${nombre}</label><textarea id="${idCampo}" name="${idCampo}"></textarea>`;
            } else {
                div.innerHTML = `<label for="${idCampo}">${nombre}</label><input type="text" id="${idCampo}" name="${idCampo}">`;
            }
            contenedor.appendChild(div);
        });

        // Scroll si hay muchos campos
        contenedor.style.maxHeight = '300px';
        contenedor.style.overflowY = 'auto';

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p>Error cargando participantes.</p>';
    }
}
