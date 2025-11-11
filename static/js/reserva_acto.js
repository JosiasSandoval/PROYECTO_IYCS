// ==============================
// reserva_acto.js — Lógica de reserva + calendario integrado (VERSIÓN FINAL CORREGIDA Y OPTIMIZADA)
// ==============================

let fechaSeleccionada = null;
let horaSeleccionada = null;
let calendario;
let horariosConfiguracion = [];
const DIA_ABREV = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const idParroquia = sessionStorage.getItem('idParroquiaSeleccionada');
const nombreParroquia = sessionStorage.getItem('nombreParroquiaSeleccionada');

// ==============================
// FUNCIONES DE NAVEGACIÓN
// ==============================
function volverPasoAnterior() {
    window.location.href = '/cliente/reserva';
}

// ==============================
// FUNCIONES DE LIMPIEZA Y CONTROL DE DATOS
// ==============================
function limpiarSeleccionActo() {
    fechaSeleccionada = null;
    horaSeleccionada = null;
    document.getElementById('fecha-acto').value = '';
    document.getElementById('hora-acto').value = '';

    const obsTextarea = document.getElementById('observaciones');
    if (obsTextarea) {
        obsTextarea.value = '';
        obsTextarea.disabled = true;
        obsTextarea.placeholder = '(No disponible por ahora)';
    }
}

function reiniciarReserva() {
    // Solo eliminar los datos de reserva y no todo el sessionStorage
    sessionStorage.removeItem('reserva');
    limpiarSeleccionActo();

    const actoSelect = document.getElementById('acto-liturgico');
    if (actoSelect) actoSelect.value = '';
    pintarDiasDisponibles();
}

// ==============================
// INICIALIZACIÓN
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("📢 DOM cargado, inicializando reserva...");

    if (!idParroquia) {
        const formContainer = document.getElementById('form-container');
        if (formContainer) {
            formContainer.innerHTML = `<p style="color:red; font-weight:bold;">Debes seleccionar una parroquia antes de continuar.</p>`;
        }
        return;
    }

    // Mostrar nombre de parroquia
    const tituloParroquia = document.getElementById('nombreParroquiaSeleccionada');
    if (tituloParroquia && nombreParroquia) tituloParroquia.textContent = nombreParroquia;

    const actoSelect = document.getElementById('acto-liturgico');
    if (!actoSelect.value) limpiarSeleccionActo();

    // Cargar actos y luego datos previos
    await cargarActosPorParroquia(idParroquia);
    await cargarDatosPrevios();

    const calendarioEl = document.querySelector('.fechas');
    if (calendarioEl) inicializarCalendario(calendarioEl);

    const btnAtras = document.getElementById('btn-atras');
    if (btnAtras) btnAtras.addEventListener('click', volverPasoAnterior);

    // Detectar cambio de acto litúrgico → reiniciar reserva solo si cambia realmente
    actoSelect?.addEventListener('change', () => {
        const idActoSeleccionado = actoSelect.value;
        const reservaGuardada = JSON.parse(sessionStorage.getItem('reserva') || '{}');

        if (!idActoSeleccionado) {
            horariosConfiguracion = [];
            pintarDiasDisponibles();
            return;
        }

        if (reservaGuardada.idActo && reservaGuardada.idActo !== idActoSeleccionado) {
            console.log("🔄 Acto cambiado, reiniciando proceso de reserva...");
            reiniciarReserva();
        }

        cargarDisponibilidadActo(idParroquia, idActoSeleccionado);
    });

    if (actoSelect?.value && idParroquia) {
        cargarDisponibilidadActo(idParroquia, actoSelect.value);
    }

    // Confirmar hora dentro del modal
    document.addEventListener('click', e => {
        if (e.target.id === 'btnConfirmarModalHora') {
            const modalElement = document.getElementById('modalConfirmacion');
            const modal = bootstrap.Modal.getInstance(modalElement);

            if (!horaSeleccionada) {
                alert("⚠️ Por favor, selecciona una hora de la lista antes de confirmar.");
                return;
            }

            document.getElementById('fecha-acto').value = fechaSeleccionada;
            document.getElementById('hora-acto').value = horaSeleccionada;

            const obsTextarea = document.getElementById('observaciones');
            if (obsTextarea) {
                obsTextarea.disabled = false;
                obsTextarea.placeholder = 'Escribe aquí cualquier mencion relevante...';
            }

            modal.hide();
            e.target.id = 'btnConfirmarReserva';
            e.target.textContent = 'Confirmar';
            e.target.classList.remove('btn-primary');
            e.target.classList.add('btn-success');
        }
    });

    const modalConfirmacionEl = document.getElementById('modalConfirmacion');
    modalConfirmacionEl?.addEventListener('hidden.bs.modal', function() {
        setTimeout(() => {
            if (!document.getElementById('fecha-acto').value || !document.getElementById('hora-acto').value) {
                limpiarSeleccionActo();
            }
        }, 100);
    });
});

// ==============================
// Cargar actos litúrgicos
// ==============================
async function cargarActosPorParroquia(idParroquia) {
    const actoSelect = document.getElementById('acto-liturgico');
    if (!actoSelect) return;
    try {
        const respuesta = await fetch(`/api/acto/${idParroquia}`);
        if (!respuesta.ok) throw new Error("Error al obtener los actos litúrgicos");

        const data = await respuesta.json();
        actoSelect.innerHTML = '<option value="">--Seleccione un acto--</option>';

        if (data.success && Array.isArray(data.datos) && data.datos.length > 0) {
            data.datos.forEach(acto => {
                const option = document.createElement('option');
                option.value = acto.id;
                option.textContent = acto.acto;
                option.dataset.costoBase = acto.costoBase;
                actoSelect.appendChild(option);
            });
        } else {
            actoSelect.innerHTML = '<option value="">No hay actos disponibles</option>';
        }
    } catch (error) {
        console.error("❌ Error cargando actos por parroquia:", error);
        actoSelect.innerHTML = '<option value="">Error al cargar actos</option>';
    }
}

// ==============================
// Confirmar reserva
// ==============================
document.getElementById('btn-siguiente')?.addEventListener('click', function() {
    const actoSelect = document.getElementById('acto-liturgico');
    const idActo = actoSelect?.value;
    const nombreActo = actoSelect?.options[actoSelect.selectedIndex]?.textContent || '';
    const costoBase = actoSelect?.options[actoSelect.selectedIndex]?.dataset?.costoBase || '';
    const observaciones = document.getElementById('observaciones').value;

    if (!idActo) {
        alert("Debe seleccionar un acto antes de continuar.");
        return;
    }
    if (!fechaSeleccionada || !horaSeleccionada) {
        alert("Debe seleccionar una fecha y hora para el acto.");
        return;
    }

    const reservaActual = JSON.parse(sessionStorage.getItem('reserva') || '{}');

const reservaData = {
    ...reservaActual,
    idParroquia,
    nombreParroquia,
    idActo,             // ⚡ usar el acto seleccionado actualmente
    nombreActo,         // ⚡ usar el nombre del acto seleccionado
    costoBase,
    fecha: fechaSeleccionada,
    hora: horaSeleccionada,
    observaciones,
    participantes: reservaActual.participantes || {},
    requisitos: reservaActual.requisitos || {},
    solicitante: reservaActual.solicitante || {}
};

    sessionStorage.setItem('reserva', JSON.stringify(reservaData));
    window.location.href = 'reserva_datos';
});

// ==============================
// Cargar datos previos
// ==============================
async function cargarDatosPrevios() {
    const datosPrevios = sessionStorage.getItem('reserva');
    if (!datosPrevios) return;

    const reserva = JSON.parse(datosPrevios);
    const actoSelect = document.getElementById('acto-liturgico');

    await new Promise(resolve => setTimeout(resolve, 300));

    if (actoSelect && reserva.idActo) actoSelect.value = reserva.idActo;
    if (reserva.fecha) fechaSeleccionada = reserva.fecha;
    if (reserva.hora) horaSeleccionada = reserva.hora;

    document.getElementById('fecha-acto').value = reserva.fecha || '';
    document.getElementById('hora-acto').value = reserva.hora || '';

    const obsTextarea = document.getElementById('observaciones');
    if (obsTextarea) {
        obsTextarea.value = reserva.observaciones || '';
        if (reserva.hora) {
            obsTextarea.disabled = false;
            obsTextarea.placeholder = 'Escribe aquí cualquier observación relevante...';
        } else {
            obsTextarea.disabled = true;
            obsTextarea.placeholder = '(No disponible por ahora)';
        }
    }

    if (reserva.idActo && idParroquia) {
        await cargarDisponibilidadActo(idParroquia, reserva.idActo);
    }
}

// ==============================
// FullCalendar y Disponibilidad
// ==============================
function inicializarCalendario(calendarioEl) {
    calendario = new FullCalendar.Calendar(calendarioEl, {
        initialView: 'dayGridMonth',
        locale: 'es',
        selectable: true,
        headerToolbar: { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' },
        dateClick: function(info) {
            const fechaLocal = new Date(info.dateStr + 'T12:00:00');
            const actoSelect = document.getElementById('acto-liturgico');
            if (!actoSelect || !actoSelect.value) {
                alert("⚠️ Por favor, selecciona un acto litúrgico primero.");
                return;
            }

            const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
            if (fechaLocal < hoy) return;

            const diaAbrev = DIA_ABREV[fechaLocal.getDay()].toLowerCase();
            const disponible = fechaDisponible(diaAbrev);
            if (!disponible) {
                alert("⚠️ Este día no tiene horarios disponibles.");
                return;
            }

            abrirModalHoraDisponible(info.dateStr);
        }
    });
    calendario.render();
}

async function cargarDisponibilidadActo(idParroquia, idActo) {
    try {
        const resp = await fetch(`/api/acto/disponibilidad/${idParroquia}/${idActo}`);
        if (!resp.ok) throw new Error("Error al obtener disponibilidad del acto");

        const data = await resp.json();
        horariosConfiguracion = Array.isArray(data.datos)
            ? data.datos.map(d => ({
                diaSemana: d.diaSemana.trim().toLowerCase(),
                horaInicioActo: d.horaInicioActo.substring(0, 5)
            }))
            : [];

        pintarDiasDisponibles();
    } catch (error) {
        console.error("❌ Error cargando disponibilidad:", error);
        horariosConfiguracion = [];
        pintarDiasDisponibles();
    }
}

function fechaDisponible(diaAbrev) {
    return horariosConfiguracion.some(h => h.diaSemana === diaAbrev.trim().toLowerCase());
}

function pintarDiasDisponibles() {
    if (!calendario) return;
    calendario.removeAllEvents();

    const eventos = [];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
    const fechaFin = new Date(hoy); fechaFin.setMonth(fechaFin.getMonth() + 6);

    for (let d = new Date(hoy); d <= fechaFin; d.setDate(d.getDate() + 1)) {
        const fechaStr = d.toISOString().split('T')[0];
        const diaAbrev = DIA_ABREV[d.getDay()].toLowerCase();

        let color = "#ccc";
        if (d >= hoy) color = fechaDisponible(diaAbrev) ? "#b8f7b0" : "#f7b0b0";

        eventos.push({ start: fechaStr, display: 'background', backgroundColor: color });
    }
    calendario.addEventSource(eventos);
}

// ==============================
// Modal para seleccionar hora
// ==============================
function abrirModalHoraDisponible(fecha) {
    const fechaObj = new Date(fecha + 'T12:00:00');
    const diaCheck = DIA_ABREV[fechaObj.getDay()].toLowerCase();

    horaSeleccionada = null;
    fechaSeleccionada = fecha;

    const modalElement = document.getElementById('modalConfirmacion');
    const modalBody = document.getElementById('confirmacionBody');
    const modalFooter = document.querySelector('#modalConfirmacion .modal-footer');

    const btnConfirmarOriginal = document.getElementById('btnConfirmarReserva');
    if (btnConfirmarOriginal) {
        btnConfirmarOriginal.id = 'btnConfirmarModalHora';
        btnConfirmarOriginal.textContent = 'Confirmar Hora';
        btnConfirmarOriginal.classList.remove('btn-success');
        btnConfirmarOriginal.classList.add('btn-primary');
    }
    if (modalFooter) modalFooter.style.display = 'flex';

    const horasDisponibles = horariosConfiguracion
        .filter(h => h.diaSemana === diaCheck)
        .map(h => h.horaInicioActo);

    const contenidoHorasHTML = horasDisponibles.length > 0
        ? horasDisponibles.map(h =>
            `<button class="list-group-item list-group-item-action hora-opcion" data-hora="${h}">${h}</button>`
        ).join('') :
        '<p class="text-danger">Aviso: No hay horarios disponibles para el día seleccionado.</p>';

    modalBody.innerHTML = `
        <p><strong>Fecha seleccionada:</strong> ${fecha}</p>
        <p><strong>Día de la semana:</strong> ${diaCheck.toUpperCase()}</p>
        <p><strong>Selecciona un horario:</strong></p>
        <div class="list-group" id="listaHorasDisponibles">
            ${contenidoHorasHTML}
        </div>
        <p class="mt-2 text-secondary small">Haz clic en la hora deseada y luego en el botón <strong>Confirmar Hora</strong>.</p>
    `;

    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) modal = new bootstrap.Modal(modalElement);
    modal.show();

    document.querySelectorAll('#listaHorasDisponibles .hora-opcion').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#listaHorasDisponibles .hora-opcion').forEach(otherBtn =>
                otherBtn.classList.remove('active', 'btn-success')
            );
            btn.classList.add('active', 'btn-success');
            horaSeleccionada = btn.dataset.hora;
        });
    });
}
