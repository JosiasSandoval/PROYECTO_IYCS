// ==============================
// reserva.js — Lógica de reserva + calendario integrado (VERSIÓN FINAL Y ESTABLE)
// ==============================

let fechaSeleccionada = null;
let horaSeleccionada = null;
let calendario;
// [{ diaSemana: "lun", horaInicioActo: "08:00" }, ...]
let horariosConfiguracion = []; 
const DIA_ABREV = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const idParroquia=sessionStorage.getItem('idParroquiaSeleccionada');
const nombreParroquia=sessionStorage.getItem('nombreParroquiaSeleccionada');

// ==============================
// FUNCIONES DE LIMPIEZA
// ==============================
function limpiarSeleccionActo() {
    fechaSeleccionada = null;
    horaSeleccionada = null;
    document.getElementById('fecha-acto').value = '';
    document.getElementById('hora-acto').value = '';
    
    // 🔑 CORRECCIÓN: Deshabilitar la observación también
    const obsTextarea = document.getElementById('observaciones');
    if (obsTextarea) {
        obsTextarea.value = '';
        obsTextarea.disabled = true;
    }
    
    console.log("🧹 Campos de fecha/hora/observación limpiados.");
}

// ==============================
// INICIALIZACIÓN
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
    console.log("📢 DOM cargado, inicializando reserva...");

    const idParroquiaSeleccionada = sessionStorage.getItem('idParroquiaSeleccionada');

    if (!idParroquiaSeleccionada) {
        const formContainer = document.getElementById('form-container');
        if (formContainer) {
            formContainer.innerHTML = `<p style="color:red; font-weight:bold;">Debes seleccionar una parroquia antes de continuar.</p>`;
        }
        return;
    }
    
    // 🔑 CORRECCIÓN INICIAL: Aseguramos la limpieza al cargar la página si no hay acto seleccionado.
    // Esto evita que datos huérfanos de sesiones anteriores interfieran.
    const actoSelect = document.getElementById('acto-liturgico');
    if (!actoSelect.value) {
        limpiarSeleccionActo();
    }
    
    await cargarActosPorParroquia(idParroquiaSeleccionada);
    cargarDatosPrevios(); // Carga datos SOLO si existen en sessionStorage

    // Inicializar calendario
    const calendarioEl = document.querySelector('.fechas');
    if (calendarioEl) inicializarCalendario(calendarioEl);

    // Cambio de acto
    actoSelect?.addEventListener('change', () => {
        // 🔑 LIMPIEZA CRÍTICA: Limpia la hora, fecha y observación si se cambia el acto
        limpiarSeleccionActo(); 

        const idActo = actoSelect.value;
        if (!idActo) {
            horariosConfiguracion = [];
            pintarDiasDisponibles();
            return;
        }
        cargarDisponibilidadActo(idParroquiaSeleccionada, idActo); 
    });
    
    // Forzar la carga de disponibilidad si ya hay un acto al cargar la página
    if (actoSelect?.value && idParroquiaSeleccionada) {
        cargarDisponibilidadActo(idParroquiaSeleccionada, actoSelect.value);
    }
    
    // 🔑 LISTENER BOTÓN CONFIRMAR HORA DENTRO DEL MODAL (CONFIRMA HORA Y HABILITA OBSERVACIONES)
    document.getElementById('btnConfirmarReserva')?.addEventListener('click', function() {
        if (this.id !== 'btnConfirmarModalHora') return; 

        const modalElement = document.getElementById('modalConfirmacion');
        const modal = bootstrap.Modal.getInstance(modalElement);
        
        if (!horaSeleccionada) {
            alert("⚠️ Por favor, selecciona una hora de la lista antes de confirmar.");
            return;
        }

        // 1. Cargamos los inputs
        document.getElementById('fecha-acto').value = fechaSeleccionada;
        document.getElementById('hora-acto').value = horaSeleccionada;
        
        // 2. HABILITAMOS EL TEXTAREA DE OBSERVACIONES
        const obsTextarea = document.getElementById('observaciones');
        if (obsTextarea) {
            obsTextarea.disabled = false;
            obsTextarea.placeholder = 'Escribe aquí cualquier observación relevante...';
        }
        
        // 3. Cerramos el modal
        modal.hide();
        console.log("✅ Hora confirmada, campos de formulario actualizados y Observaciones habilitadas.");
        
        // 4. Restauramos el botón del footer para su propósito original (si lo tiene)
        this.id = 'btnConfirmarReserva'; 
        this.textContent = 'Confirmar';
        this.classList.remove('btn-primary');
        this.classList.add('btn-success');
    });
    
    // 🔑 LISTENER AL CERRAR EL MODAL (LIMPIEZA DE CAMPOS SI SE CANCELA)
    const modalConfirmacionEl = document.getElementById('modalConfirmacion');
    modalConfirmacionEl?.addEventListener('hidden.bs.modal', function() {
        // Usamos una pequeña demora para asegurar que el evento 'click' del botón confirmar se procese primero
        setTimeout(() => {
             // Si el input de hora o fecha está vacío, significa que se cerró sin confirmar
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
    // ... (sin cambios)
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
                option.textContent = `${acto.acto} (Costo: S/ ${acto.costoBase})`;
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
// Confirmar reserva — Guardar en sessionStorage solo al presionar Siguiente
// ==============================
document.getElementById('btn-siguiente')?.addEventListener('click', function() {
    const actoSelect = document.getElementById('acto-liturgico');
    const idActo = actoSelect?.value;
    const nombreActo = actoSelect?.options[actoSelect.selectedIndex]?.textContent || '';
    const costoBase = actoSelect?.options[actoSelect.selectedIndex]?.dataset?.costoBase || '';
    const observaciones = document.getElementById('observaciones').value; // Obtener observaciones

    if (!idActo) {
        alert("Debe seleccionar un acto antes de continuar.");
        return;
    }
    if (!fechaSeleccionada || !horaSeleccionada) { 
        alert("Debe seleccionar una fecha y hora para el acto.");
        return;
    }

    const reservaData = {
        // ✅ Propiedades solicitadas de la parroquia (sobrescribimos si es necesario)
        idParroquia: idParroquia,
        nombreParroquia: nombreParroquia,
        idActo,
        nombreActo,
        costoBase,
        fecha: fechaSeleccionada,
        hora: horaSeleccionada,
        observaciones: observaciones,// Guardamos la observación
        participantes:{},
        requisitos:{},
        solicitante:{}
    };

    sessionStorage.setItem('reserva', JSON.stringify(reservaData));
    console.log("✅ Datos de reserva guardados en sessionStorage:", reservaData);

    window.location.href = 'reserva_datos';
});

// ==============================
// Cargar datos previos si vuelve atrás
// ==============================
function cargarDatosPrevios() {
    const datosPrevios = sessionStorage.getItem('reserva');
    if (!datosPrevios) return;

    const reserva = JSON.parse(datosPrevios);
    
    // Si ya existe una reserva, la cargamos. Si no, los campos quedan vacíos por la limpieza inicial.
    const actoSelect = document.getElementById('acto-liturgico');
    if (actoSelect && reserva.idActo) actoSelect.value = reserva.idActo;

    if (reserva.fecha) fechaSeleccionada = reserva.fecha;
    if (reserva.hora) horaSeleccionada = reserva.hora;

    document.getElementById('fecha-acto').value = reserva.fecha || '';
    document.getElementById('hora-acto').value = reserva.hora || '';
    
    // Cargar observaciones y habilitar si existen datos
    const obsTextarea = document.getElementById('observaciones');
    if (obsTextarea) {
        obsTextarea.value = reserva.observaciones || '';
        // Habilitamos observaciones solo si hay una hora seleccionada
        obsTextarea.disabled = !(reserva.hora); 
        obsTextarea.placeholder = (reserva.hora) ? 'Escribe aquí cualquier observación relevante...' : '(Deshabilitado hasta seleccionar hora)';
    }
}

// ==============================
// FullCalendar y Disponibilidad (sin cambios en lógica central)
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
    const diaCheck = diaAbrev.trim().toLowerCase(); 
    return horariosConfiguracion.some(h => h.diaSemana === diaCheck); 
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
// Modal para seleccionar hora (FLUJO FINAL)
// ==============================
function abrirModalHoraDisponible(fecha) {
    const fechaObj = new Date(fecha + 'T12:00:00'); 
    const diaCheck = DIA_ABREV[fechaObj.getDay()].toLowerCase(); 

    horaSeleccionada = null; 
    fechaSeleccionada = fecha;

    const modalElement = document.getElementById('modalConfirmacion');
    const modalBody = document.getElementById('confirmacionBody');
    const modalFooter = document.querySelector('#modalConfirmacion .modal-footer'); 
    
    // 1. Configurar botón de Confirmar para el flujo de hora
    const btnConfirmarOriginal = document.getElementById('btnConfirmarReserva');
    if (btnConfirmarOriginal) {
        btnConfirmarOriginal.id = 'btnConfirmarModalHora'; 
        btnConfirmarOriginal.textContent = 'Confirmar Hora'; 
        btnConfirmarOriginal.classList.remove('btn-success');
        btnConfirmarOriginal.classList.add('btn-primary');
    }
    if (modalFooter) modalFooter.style.display = 'flex';
    
    // 2. Obtener las horas disponibles
    const horasDisponibles = horariosConfiguracion
        .filter(h => h.diaSemana === diaCheck)
        .map(h => h.horaInicioActo);

    let contenidoHorasHTML = '';
    
    if (horasDisponibles.length > 0) {
        contenidoHorasHTML = horasDisponibles.map(h => 
            `<button class="list-group-item list-group-item-action hora-opcion" data-hora="${h}">${h}</button>`
        ).join('');
    } else {
        contenidoHorasHTML = '<p class="text-danger">Aviso: No hay horarios disponibles para el día seleccionado.</p>';
    }
    
    // 3. Generar el cuerpo del modal
    modalBody.innerHTML = `
        <p><strong>Fecha seleccionada:</strong> ${fecha}</p>
        <p><strong>Día de la semana:</strong> ${diaCheck.toUpperCase()}</p>
        <p><strong>Selecciona un horario:</strong></p>
        <div class="list-group" id="listaHorasDisponibles">
            ${contenidoHorasHTML}
        </div>
        <p class="mt-2 text-secondary small">Haz clic en la hora deseada y luego en el botón **Confirmar Hora**.</p>
    `;

    // 4. Mostrar el modal
    let modal = bootstrap.Modal.getInstance(modalElement);
    if (!modal) {
        modal = new bootstrap.Modal(modalElement);
    }
    modal.show();

    // 5. Agregar listeners (Solo para SELECCIÓN y RESALTADO)
    document.querySelectorAll('#listaHorasDisponibles .hora-opcion').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#listaHorasDisponibles .hora-opcion').forEach(otherBtn => {
                otherBtn.classList.remove('active', 'btn-success'); 
            });
            btn.classList.add('active', 'btn-success'); 
            horaSeleccionada = btn.dataset.hora;
        });
    });
}