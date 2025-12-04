// ==============================
// reserva_acto.js — Lógica de reserva + calendario integrado (VERSIÓN FINAL con CONFIGURACIÓN ACTO + ENFOQUE AUTOMÁTICO DE MES)
// ==============================

let fechaSeleccionada = null;
let horaSeleccionada = null;
let calendario;
let horariosConfiguracion = [];
let configuracionActo = { tiempoMinimoReserva: 0, tiempoMaximoReserva: null, tiempoDuracion: 60 };
const DIA_ABREV = ["Dom", "Lun", "Mar", "Mi", "Jue", "Vie", "Sáb"];
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
    sessionStorage.removeItem('reserva');
    limpiarSeleccionActo();

    const actoSelect = document.getElementById('acto-liturgico');
    if (actoSelect) {
        actoSelect.value = '';
        // Forzar actualización visual del select
        actoSelect.dispatchEvent(new Event('change'));
    }
    
    // Limpiar horarios y configuración
    horariosConfiguracion = [];
    configuracionActo = { tiempoMinimoReserva: 0, tiempoMaximoReserva: null, tiempoDuracion: 60 };
    
    pintarDiasDisponibles();
    
    console.log('✅ Reserva reiniciada completamente');
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

    const tituloParroquia = document.getElementById('nombreParroquiaSeleccionada');
    if (tituloParroquia && nombreParroquia) tituloParroquia.textContent = nombreParroquia;

    const actoSelect = document.getElementById('acto-liturgico');
    if (!actoSelect.value) limpiarSeleccionActo();

    await cargarActosPorParroquia(idParroquia);
    await cargarDatosPrevios();

    const calendarioEl = document.querySelector('.fechas');
    if (calendarioEl) inicializarCalendario(calendarioEl);

    const btnAtras = document.getElementById('btn-atras');
    if (btnAtras) btnAtras.addEventListener('click', volverPasoAnterior);

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
                obsTextarea.placeholder = 'Escribe aquí cualquier mención relevante...';
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
        idActo,
        nombreActo,
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
            const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

            // ⚙️ Validar tiempo mínimo de reserva
            const fechaMin = new Date(hoy);
            fechaMin.setDate(fechaMin.getDate() + (configuracionActo.tiempoMinimoReserva || 0));
            if (fechaLocal < fechaMin) {
                alert(`⚠️ Solo puedes reservar a partir del ${fechaMin.toLocaleDateString()}.`);
                return;
            }

            const diaAbrev = DIA_ABREV[fechaLocal.getDay()].toLowerCase();
            if (!fechaDisponible(diaAbrev)) {
                alert("⚠️ Este día no tiene horarios disponibles.");
                return;
            }

            abrirModalHoraDisponible(info.dateStr);
        }
    });
    calendario.render();
}

// ⚙️ NUEVO: Cargar disponibilidad + configuración
async function cargarDisponibilidadActo(idParroquia, idActo) {
    try {
        const resp = await fetch(`/api/acto/disponibilidad/${idParroquia}/${idActo}`);
        if (!resp.ok) throw new Error("Error al obtener disponibilidad del acto");
        const data = await resp.json();
        
        // Cargar TODOS los horarios configurados (puede haber múltiples horarios por día)
        horariosConfiguracion = Array.isArray(data.datos)
            ? data.datos.map(d => {
                // Normalizar diaSemana (ya viene normalizado del backend, pero por seguridad)
                let diaSemana = d.diaSemana.trim().toLowerCase();
                // Asegurar que "mié" o "mie" se conviertan a "mi"
                if (diaSemana === 'mié' || diaSemana === 'mie') {
                    diaSemana = 'mi';
                }
                
                return {
                    diaSemana: diaSemana,
                    horaInicioActo: d.horaInicioActo.substring(0, 5)
                };
            })
            : [];
        
        console.log(`📅 Cargados ${horariosConfiguracion.length} horarios para el acto ${idActo}:`, horariosConfiguracion);

        const respConfig = await fetch(`/api/acto/configuracion/${idActo}`);
        if (respConfig.ok) {
            const dataConfig = await respConfig.json();
            if (dataConfig.success && dataConfig.datos) {
                configuracionActo = {
                    tiempoMinimoReserva: dataConfig.datos.tiempoMinimoReserva || 0,
                    tiempoMaximoReserva: dataConfig.datos.tiempoMaximoReserva || null,
                    tiempoDuracion: dataConfig.datos.tiempoDuracion || 60  // Duración en minutos
                };
            }
        }

        console.log("⚙️ Configuración aplicada:", configuracionActo);
        console.log("📅 Horarios disponibles:", horariosConfiguracion);
        pintarDiasDisponibles();

        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        const fechaInicio = new Date(hoy);
        fechaInicio.setDate(fechaInicio.getDate() + (configuracionActo.tiempoMinimoReserva || 0));

        if (calendario) calendario.gotoDate(fechaInicio);
    } catch (error) {
        console.error("❌ Error cargando disponibilidad/configuración:", error);
        horariosConfiguracion = [];
        configuracionActo = { tiempoMinimoReserva: 0, tiempoMaximoReserva: null, tiempoDuracion: 60 };
        pintarDiasDisponibles();
    }
}

function fechaDisponible(diaAbrev) {
    // Normalizar el día para comparación
    let diaNormalizado = diaAbrev.trim().toLowerCase();
    if (diaNormalizado === 'mié' || diaNormalizado === 'mie') {
        diaNormalizado = 'mi';
    }
    
    return horariosConfiguracion.some(h => {
        let diaHorario = h.diaSemana.trim().toLowerCase();
        if (diaHorario === 'mié' || diaHorario === 'mie') {
            diaHorario = 'mi';
        }
        return diaHorario === diaNormalizado;
    });
}

function pintarDiasDisponibles() {
    if (!calendario) return;
    calendario.removeAllEvents();

    const eventos = [];
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0);

    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(fechaInicio.getDate() + (configuracionActo.tiempoMinimoReserva || 0));

    const fechaFin = new Date(hoy);
    if (configuracionActo.tiempoMaximoReserva) {
        fechaFin.setDate(fechaFin.getDate() + configuracionActo.tiempoMaximoReserva);
    } else {
        fechaFin.setFullYear(fechaFin.getFullYear() + 3);
    }

    for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
        const fechaStr = d.toISOString().split('T')[0];
        const diaAbrev = DIA_ABREV[d.getDay()].toLowerCase();
        const color = fechaDisponible(diaAbrev) ? "#b8f7b0" : "#f7b0b0";

        eventos.push({ start: fechaStr, display: 'background', backgroundColor: color });
    }

    calendario.addEventSource(eventos);
}

// ==============================
// Modal para seleccionar hora (MEJORADO: filtra horarios bloqueados)
// ==============================
async function abrirModalHoraDisponible(fecha) {
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

    // Obtener TODOS los horarios configurados para este día
    // Normalizar diaCheck para asegurar coincidencia
    let diaCheckNormalizado = diaCheck;
    if (diaCheckNormalizado === 'mié' || diaCheckNormalizado === 'mie') {
        diaCheckNormalizado = 'mi';
    }
    
    const horariosConfigurados = horariosConfiguracion
        .filter(h => {
            let diaHorario = h.diaSemana.trim().toLowerCase();
            if (diaHorario === 'mié' || diaHorario === 'mie') {
                diaHorario = 'mi';
            }
            return diaHorario === diaCheckNormalizado;
        })
        .map(h => h.horaInicioActo);
    
    console.log(`🔍 Día seleccionado: ${diaCheckNormalizado}, Horarios configurados encontrados:`, horariosConfigurados);

    // Obtener nombre del acto para verificar si es misa
    const actoSelect = document.getElementById('acto-liturgico');
    const nombreActo = actoSelect?.options[actoSelect.selectedIndex]?.textContent?.toLowerCase() || '';
    const esMisa = nombreActo.includes('misa');
    
    console.log(`📿 Es misa: ${esMisa}, Nombre acto: ${nombreActo}`);

    // Inicializar horariosBloqueados fuera del bloque para que esté disponible siempre
    let horariosBloqueados = [];
    let horasDisponibles = [];

    // REGLA CRÍTICA: Las misas NUNCA tienen restricciones
    if (esMisa) {
        // Para misas: mostrar TODOS los horarios configurados, sin filtrar bloqueados
        horasDisponibles = horariosConfigurados;
        console.log("✅ MISA: Mostrando todos los horarios sin restricciones:", horasDisponibles);
    } else {
        // Para actos con requisitos: obtener horarios bloqueados y filtrar
        try {
            const respBloqueados = await fetch(`/api/reserva/horarios_bloqueados/${idParroquia}/${fecha}`);
            if (respBloqueados.ok) {
                const dataBloqueados = await respBloqueados.json();
                if (dataBloqueados.ok && Array.isArray(dataBloqueados.horarios_bloqueados)) {
                    horariosBloqueados = dataBloqueados.horarios_bloqueados.map(h => {
                        // Asegurar formato HH:MM
                        if (typeof h === 'string') {
                            return h.substring(0, 5);
                        }
                        return String(h).substring(0, 5);
                    });
                }
            }
        } catch (error) {
            console.error("Error obteniendo horarios bloqueados:", error);
        }
        
        console.log("🔒 Horarios bloqueados para", fecha, ":", horariosBloqueados);
        
        // Filtrar horarios disponibles (configurados pero no bloqueados)
        horasDisponibles = horariosConfigurados.filter(h => !horariosBloqueados.includes(h));
        
        // REGLA: Solo para actos con requisitos (bautizos, matrimonios) se bloquea por duración
        if (configuracionActo.tiempoDuracion && configuracionActo.tiempoDuracion > 60) {
            const horasFinales = [];
            horariosBloqueados.forEach(horaBloqueada => {
                // Agregar la hora bloqueada
                horasFinales.push(horaBloqueada);
                
                // Calcular horas adicionales bloqueadas por duración
                const [h, m] = horaBloqueada.split(':').map(Number);
                const minutosBloqueados = h * 60 + m;
                const duracionMinutos = configuracionActo.tiempoDuracion;
                
                // Bloquear horas durante la duración (cada hora)
                let minutosActual = minutosBloqueados + 60;
                while (minutosActual < minutosBloqueados + duracionMinutos) {
                    const horaBloqueadaExtra = `${String(Math.floor(minutosActual / 60)).padStart(2, '0')}:${String(minutosActual % 60).padStart(2, '0')}`;
                    if (!horasFinales.includes(horaBloqueadaExtra)) {
                        horasFinales.push(horaBloqueadaExtra);
                    }
                    minutosActual += 60;
                }
            });
            horariosBloqueados = horasFinales;
            
            // Re-filtrar con los horarios adicionales bloqueados
            const horasDisponiblesFinal = horariosConfigurados.filter(h => !horariosBloqueados.includes(h));
            horasDisponibles.length = 0;
            horasDisponibles.push(...horasDisponiblesFinal);
        }
    }

    const contenidoHorasHTML = horasDisponibles.length > 0
        ? horasDisponibles.map(h => {
            // Para misas, nunca mostrar como bloqueada
            const estaBloqueada = esMisa ? false : horariosBloqueados.includes(h);
            return `<button class="list-group-item list-group-item-action hora-opcion ${estaBloqueada ? 'disabled' : ''}" 
                    data-hora="${h}" ${estaBloqueada ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
                    ${h} ${estaBloqueada ? '(Ocupado)' : ''}
                    </button>`;
        }).join('') :
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

    document.querySelectorAll('#listaHorasDisponibles .hora-opcion:not(.disabled)').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#listaHorasDisponibles .hora-opcion').forEach(otherBtn =>
                otherBtn.classList.remove('active', 'btn-success')
            );
            btn.classList.add('active', 'btn-success');
            horaSeleccionada = btn.dataset.hora;
        });
    });
}

// ==============================
// Guardar mención en sessionStorage
// ==============================
function guardarMencion() {
    const textareaMencion = document.getElementById('observaciones');
    if (textareaMencion && textareaMencion.value.trim()) {
        let reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');
        reservaData.observaciones = textareaMencion.value.trim();
        sessionStorage.setItem('reserva', JSON.stringify(reservaData));
    }
}

// Guardar mención al cambiar
if (document.getElementById('observaciones')) {
    document.getElementById('observaciones').addEventListener('blur', guardarMencion);
}// ==============================
// 🔹 Mostrar/Ocultar campo "Mención" según acto y rol
// ==============================
document.addEventListener("DOMContentLoaded", () => {
    const selectActo = document.getElementById("acto-liturgico");
    const grupoMencion = document.getElementById('grupo-mencion');
    const textareaMencion = document.getElementById('observaciones');
    const rolUsuario = document.body.dataset.rol?.toLowerCase();
    
    // 🔹 Para sacerdote, OCULTAR mención (se ingresa en reserva_datos)
    if (rolUsuario === 'sacerdote') {
        if (grupoMencion) {
            grupoMencion.style.display = 'none';
            console.log('🔹 Sacerdote: Campo mención oculto en reserva_acto');
        }
        return; // No necesita más lógica
    }
    
    // 🔹 Para otros roles, mantener lógica existente

    if (selectActo && grupoMencion) {
        selectActo.addEventListener("change", () => {
            const texto = selectActo.options[selectActo.selectedIndex].textContent.toLowerCase();

            if (texto.includes("bautismo") || texto.includes("matrimonio")) {
                grupoMencion.style.display = "none";
            } else {
                grupoMencion.style.display = "block";
            }
        });
    }
});
