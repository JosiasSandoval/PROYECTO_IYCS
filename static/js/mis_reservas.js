let calendarioRepro = null;
let horariosRepro = [];
let configRepro = { tiempoMinimoReserva: 0, tiempoMaximoReserva: null };
let fechaReservaOriginal = null;

// Matrices de días para coincidir con BD y UI
const DIA_ABREV_REPRO = ["Dom", "Lun", "Mar", "Mi", "Jue", "Vie", "Sáb"];
const DIAS_LARGOS_REPRO = ["DOMINGO", "LUNES", "MARTES", "MIÉRCOLES", "JUEVES", "VIERNES", "SÁBADO"];

document.addEventListener('DOMContentLoaded', async () => {
    const bodyElement = document.body;
    const rolUsuario = bodyElement.dataset.rol?.toLowerCase();
    const idUsuarioSesion = bodyElement.dataset.id;

    if (!idUsuarioSesion || !rolUsuario) {
        window.location.href = '/principal';
        return;
    }

    // ← CORREGIDO
    let configActos = null;
    let reservasGlobal = [];


    async function cargarConfiguracion(idActo) {
        try {
            const res = await fetch(`/api/acto/configuracion/${idActo}`);
            if (!res.ok) throw new Error('Error al cargar configuración');
            const data = await res.json();

            if (data.success && data.datos) {
                configActos = data.datos;  // ← GUARDADO CORRECTO
                return data.datos;
            }

            return null;
        } catch (e) {
            console.error('Error en cargarConfiguracion:', e);
            return null;
        }
    }


    // Función para calcular fecha límite
    function calcularFechaLimite(fechaBase, tiempoLimite, unidad) {
        if (!fechaBase || !tiempoLimite) return null;
        
        const fecha = new Date(fechaBase);
        if (isNaN(fecha.getTime())) return null;
        
        if (unidad === 'horas') {
            fecha.setHours(fecha.getHours() - tiempoLimite);
        } else if (unidad === 'dias') {
            fecha.setDate(fecha.getDate() - tiempoLimite);
        }
        
        return fecha;
    }

    // Función para obtener mensaje de fecha límite formateado
    async function obtenerMensajeLimite(reserva, tipo) {
        if (!reserva || !reserva.idActo) return null;
        
        // Cargar configuración para este acto específico
        const config = await cargarConfiguracion(reserva.idActo);
        if (!config) return null;
        
        const unidad = config.unidadTiempoAcciones || 'horas';
        let tiempoLimite = 0;
        let accionTexto = '';
        
        switch (tipo) {
            case "cambiarDocumento":
                tiempoLimite = config.tiempoCambioDocumentos;
                accionTexto = 'subir o modificar documentos';
                break;
            case "cancelar":
                tiempoLimite = config.tiempoMaxCancelacion;
                accionTexto = 'cancelar';
                break;
            case "pagar":
                tiempoLimite = config.tiempoMaxPago;
                accionTexto = 'pagar';
                break;
            case "reprogramar":
                tiempoLimite = config.tiempoMaxReprogramacion;
                accionTexto = 'reprogramar';
                break;
            default:
                return null;
        }
        
        if (!tiempoLimite) return null;
        
        const fechaHoraBase = `${reserva.fecha}T${reserva.hora || '00:00:00'}`;
        const fechaLimite = calcularFechaLimite(fechaHoraBase, tiempoLimite, unidad);
        
        if (!fechaLimite) return null;
        
        const fechaStr = fechaLimite.toLocaleString("es-PE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
        
        return `Hasta ${fechaStr} tienes para ${accionTexto}`;
    }
    function cerrarModal() {
        const modal = document.getElementById("modalReserva");
        if (modal) modal.style.display = "none";
    }
    const closeBtn = document.querySelector(".modal .close");
    if (closeBtn) closeBtn.addEventListener("click", cerrarModal);

    function calcularHoraFinal(horaInicio, fechaReserva, duracionMinutos) {
        const duracion = parseInt(duracionMinutos);
        if (isNaN(duracion) || !horaInicio || !fechaReserva) return 'N/A';
        try {
            const fechaHoraInicio = new Date(`${fechaReserva}T${horaInicio}`);
            const fechaHoraFinal = new Date(fechaHoraInicio.getTime() + duracion * 60000);
            return fechaHoraFinal.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        } catch { return 'Inválida'; }
    }

async function cargarReservas() {
    try {
        let endpoint = '';
        if (rolUsuario === 'secretaria') {
            endpoint = `/api/reserva/secretaria/${idUsuarioSesion}`;
        } else if (rolUsuario === 'feligres') {
            endpoint = `/api/reserva/feligres/${idUsuarioSesion}`;
        } else { 
            console.error("Rol desconocido:", rolUsuario); 
            return; 
        }

        const response = await fetch(endpoint);
        if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
        const data = await response.json();

        reservasGlobal = (data.success && data.datos)
            ? await Promise.all(data.datos.map(async dato => {
                if (dato.idActo) dato.configActo = await cargarConfiguracion(dato.idActo);
                dato.nombreActo = dato.nombreActo || dato.acto || '';
                dato.nombreFeligres = dato.nombreFeligres || dato.feligres || '';
                dato.nombreParroquia = dato.nombreParroquia || dato.parroquia || '';
                dato.fecha = dato.fecha || '';
                dato.hora = dato.hora || '';
                return dato;
            })) : [];

        // Log para depuración
        console.log('Reservas cargadas para calendario:', reservasGlobal.length);
        
        // Exportar reservasGlobal para que el calendario pueda acceder
        window.reservasParaCalendario = reservasGlobal;
        console.log('✅ window.reservasParaCalendario listo con', reservasGlobal.length, 'reservas');

        // Referencias a tablas
        const tablaConfirmadas = document.querySelector('#tabla-confirmadas tbody');
        const tablaPendientes = document.querySelector('#tabla-pendientes tbody');
        const tablaCanceladas = document.querySelector('#tabla-canceladas tbody');

        tablaPendientes.innerHTML = '';
        tablaConfirmadas.innerHTML = '';
        tablaCanceladas.innerHTML = '';

        // Procesar reservas de forma secuencial para manejar async correctamente
        for (const dato of reservasGlobal) {
            const estado = (dato.estadoReserva || '').toUpperCase();
            const fila = document.createElement('tr');
            let accionesHTML = `<button class="btn-accion ver" onclick="verReserva(${dato.idReserva})">Ver</button>`;
            let mensajeLimiteHTML = '';

            if (rolUsuario === 'secretaria') {
                // Tab Pendiente -> solo reservas PENDIENTE_REVISION
                if (estado === 'PENDIENTE_REVISION') {
                    const mensajeCancelar = await obtenerMensajeLimite(dato, 'cancelar');
                    if (mensajeCancelar) {
                        mensajeLimiteHTML = `<div class="mensaje-limite" style="font-size: 0.85rem; color: #666; margin-bottom: 5px;">${mensajeCancelar}</div>`;
                    }
                    accionesHTML = mensajeLimiteHTML + accionesHTML + `
                        <button class="btn-accion reprogramar" onclick="aprobarDocumento(${dato.idReserva})">Revisión</button>
                        <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                    fila.innerHTML = `
                        <td>${dato.nombreActo}</td>
                        <td>${dato.fecha || 'N/A'}</td>
                        <td>${dato.hora || 'N/A'}</td>
                        <td>${dato.nombreParroquia}</td>
                        <td>${dato.nombreFeligres}</td>
                        <td>${dato.estadoReserva || 'N/A'}</td>
                        <td>${accionesHTML}</td>
                    `;
                    tablaPendientes.appendChild(fila);
                }
            } else if (rolUsuario === 'feligres') {
                // Tab Pendiente -> todas las reservas pendientes
                if (estado.includes('PENDIENTE')) {
                    let mensajeInfo = '';
                    
                    // Verificar si es MISA (no necesita documentos)
                    const esMisa = dato.nombreActo && dato.nombreActo.toLowerCase().includes('misa');
                    
                    if (estado.includes('PENDIENTE_PAGO')) {
                        accionesHTML = accionesHTML + `
                            <button class="btn-accion pagar" onclick="pagarReserva(${dato.idReserva})">Pagar</button>
                            <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                        
                        // Solo mostrar mensaje de documentos si NO es misa
                        if (!esMisa) {
                            mensajeInfo = `<div class="mensaje-info-pago" style="font-size: 0.9rem; color: #856404; background-color: #fff3cd; padding: 8px; border-radius: 4px; margin-bottom: 5px; border: 1px solid #ffc107;">
                                <strong>ℹ️ Información:</strong> Los documentos de los requisitos se entregan 100% en físico en la parroquia.
                            </div>`;
                        }
                    } else if (estado.includes('PENDIENTE_DOCUMENTO')) {
                        // PENDIENTE_DOCUMENTO: solo Ver y Cancelar (documentos se entregan físicamente)
                        accionesHTML = accionesHTML + `
                            <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                        
                        // Solo mostrar mensaje si NO es misa
                        if (!esMisa) {
                            mensajeInfo = `<div class="mensaje-info-pago" style="font-size: 0.9rem; color: #856404; background-color: #fff3cd; padding: 8px; border-radius: 4px; margin-bottom: 5px; border: 1px solid #ffc107;">
                                <strong>ℹ️ Información:</strong> Entregue los documentos físicamente en la parroquia para completar su reserva.
                            </div>`;
                        }
                    } else {
                        // Para otros estados pendientes, solo mostrar cancelar
                        accionesHTML = accionesHTML + `
                            <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                    }

                    fila.innerHTML = `
                        <td>${dato.nombreActo}</td>
                        <td>${dato.fecha || 'N/A'}</td>
                        <td>${dato.hora || 'N/A'}</td>
                        <td>${dato.nombreParroquia}</td>
                        <td>${dato.estadoReserva || 'N/A'}</td>
                        <td>${mensajeInfo}${accionesHTML}</td>
                    `;
                    tablaPendientes.appendChild(fila);
                }
            }

            // Confirmadas (incluye CONFIRMADO, ATENDIDO, COMPLETADO)
            if (estado.includes('CONFIRMADO') || estado === 'ATENDIDO' || estado === 'COMPLETADO') {
                // Para secretaria: solo ver y cancelar
                if (rolUsuario === 'secretaria') {
                    accionesHTML = `
                        <button class="btn-accion ver" onclick="verReserva(${dato.idReserva})">Ver</button>
                        <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                } else {
                    // Para feligres: ver, reprogramar y cancelar
                    accionesHTML += `
                        <button class="btn-accion reprogramar" onclick="reprogramarReserva(${dato.idReserva})">Reprogramar</button>
                        <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                }
                
                fila.innerHTML = `
                    <td>${dato.nombreActo}</td>
                    <td>${dato.fecha || 'N/A'}</td>
                    <td>${dato.hora || 'N/A'}</td>
                    <td>${dato.nombreParroquia}</td>
                    ${rolUsuario === 'secretaria' ? `<td>${dato.nombreFeligres}</td>` : ''}
                    <td>${dato.estadoReserva || 'N/A'}</td>
                    <td>${accionesHTML}</td>
                `;
                tablaConfirmadas.appendChild(fila);
            }

            // Canceladas
            if (estado.includes('CANCELADO')) {
                fila.innerHTML = `
                    <td>${dato.nombreActo}</td>
                    <td>${dato.fecha || 'N/A'}</td>
                    <td>${dato.hora || 'N/A'}</td>
                    <td>${dato.nombreParroquia}</td>
                    ${rolUsuario === 'secretaria' ? `<td>${dato.nombreFeligres}</td>` : ''}
                    <td>${dato.estadoReserva || 'N/A'}</td>
                    <td>${accionesHTML}</td>
                `;
                tablaCanceladas.appendChild(fila);
            }
        }

        // Placeholder si no hay filas
        const placeholderColspan = rolUsuario === 'secretaria' ? 7 : 6;
        if (!tablaPendientes.rows.length) tablaPendientes.innerHTML = `<tr><td colspan="${placeholderColspan}" class="placeholder">No hay reservas pendientes</td></tr>`;
        if (!tablaConfirmadas.rows.length) tablaConfirmadas.innerHTML = `<tr><td colspan="${placeholderColspan}" class="placeholder">No hay reservas confirmadas</td></tr>`;
        if (!tablaCanceladas.rows.length) tablaCanceladas.innerHTML = `<tr><td colspan="${placeholderColspan}" class="placeholder">No hay reservas canceladas</td></tr>`;

    } catch (error) {
        console.error('❌ Fallo al obtener datos de la reserva', error);
    }
}



    async function cambiarEstadoReservaAPendienteRevision(idReserva) {
        try {
            const resp = await fetch(`/api/reserva/cambiar_estado/${idReserva}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'continuar' })
            });
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const json = await resp.json();
            if (json.ok) {
                // Auto-actualizar el calendario si está disponible
                if (typeof window.recargarCalendario === 'function') {
                    window.recargarCalendario();
                }
            }
            return json.ok;
        } catch (e) {
            console.error('Error al cambiar estado de reserva:', e);
            return false;
        }
    }

    // ============================
    // VER RESERVA
    // ============================
    window.verReserva = (idReserva) => {
        const modal = document.getElementById("modalReserva");
        const modalBody = document.getElementById("modal-body");
        const modalTitle = document.getElementById("modal-title");
        const modalFooter = document.getElementById("modal-footer");

        const reserva = reservasGlobal.find(r => r.idReserva == idReserva);
        if (!reserva) { alert("Error: no se encontró la reserva."); return; }

        // Calcular la hora final usando la duración del acto desde la configuración
        const duracion = reserva.configActo?.tiempoDuracion || 0;
        const horaFinal = calcularHoraFinal(reserva.hora, reserva.fecha, duracion);

        modalTitle.textContent = "Detalle de la Reserva";

        let participantes = "SIN PARTICIPANTES";
        if (reserva.participantes) {
            participantes = reserva.participantes
                .split(";")
                .map(p => {
                    let limpio = p.trim().toUpperCase();
                    limpio = limpio.replace(/BENEFICIARIO[_S]*[:]?/gi, "BENEFICIARIO(S):");
                    return `<li>${limpio}</li>`;
                })
                .join("");
        }

        modalBody.innerHTML = `
            <div class="detalle-reserva">
                <p><strong>Acto:</strong> ${reserva.nombreActo}</p>
                <p><strong>Costo:</strong> ${reserva.costoBase}</p>
                <p><strong>Fecha:</strong> ${reserva.fecha}</p>
                <p><strong>Hora de Inicio:</strong> ${reserva.hora}</p>
                <p><strong>Hora de Fin:</strong> ${horaFinal}</p>
                <p><strong>Parroquia:</strong> ${reserva.nombreParroquia}</p>
                <p><strong>Mención:</strong> ${reserva.mencion || '---'}</p>
                <p><strong>Estado:</strong> ${reserva.estadoReserva}</p>
                <h4>PARTICIPANTES</h4>
                <ul>${participantes}</ul>
            </div>
        `;

        modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
        document.getElementById("cerrarModalBtn").onclick = cerrarModal;
        modal.style.display = "block";
    };

    // ------------------------------------------------------------
    // ============================
    // CANCELAR RESERVA
    // ============================
    // ------------------------------------------------------------
    window.cancelarReserva = async (idReserva) => {
        const reserva = reservasGlobal.find(r => r.idReserva == idReserva);
        if (!reserva) {
            alert("Reserva no encontrada");
            return;
        }

        // Verificar fecha límite
        const mensajeLimite = await obtenerMensajeLimite(reserva, 'cancelar');
        if (mensajeLimite) {
            const confirmar = window.confirm(`${mensajeLimite}\n\n¿Estás seguro de cancelar esta reserva?`);
            if (!confirmar) return;
        } else {
            if (!window.confirm("¿Estás seguro de cancelar esta reserva?")) return;
        }

        try {
            const response = await fetch(`/api/reserva/cambiar_estado/${idReserva}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'cancelar' })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            if (data.ok) {
                alert(`Reserva cancelada correctamente. Nuevo estado: ${data.nuevo_estado || 'CANCELADO'}`);
                cargarReservas();
                // Auto-actualizar el calendario si está disponible
                if (typeof window.recargarCalendario === 'function') {
                    window.recargarCalendario();
                }
            } else {
                alert(`No se pudo cancelar: ${data.mensaje || 'Error desconocido'}`);
            }
        } catch (error) {
            console.error("Error de cancelación:", error);
            alert("Error al intentar comunicarse con el servidor para cancelar la reserva.");
        }
    };

    // ------------------------------------------------------------
    // ============================
    // PAGAR RESERVA
    // ============================
    // ------------------------------------------------------------
    window.pagarReserva = async (idReserva) => {
        const reserva = reservasGlobal.find(r => r.idReserva == idReserva);

        if (!reserva) {
            alert("Reserva no encontrada");
            return;
        }

        // Obtener mensaje de fecha límite (ya se muestra en la tabla, pero por si acaso)
        const mensajeLimite = await obtenerMensajeLimite(reserva, 'pagar');
        if (mensajeLimite) {
            const confirmar = window.confirm(`${mensajeLimite}\n\n¿Desea continuar con el pago?`);
            if (!confirmar) return;
        }

        sessionStorage.setItem('reservaPago', JSON.stringify({
            idReserva: reserva.idReserva,
        }));

        // Redirección a la página de pago
        window.location.href = '/cliente/pago';
    };

    // ==========================================
// REPROGRAMAR RESERVA (CON DETALLE VISUAL)
// ==========================================
window.reprogramarReserva = async (idReserva) => {
    const reserva = reservasGlobal.find(r => r.idReserva == idReserva);
    if (!reserva) { alert("Reserva no encontrada localmente."); return; }

    // VALIDACIÓN: Se necesita el ID del Acto para cargar el calendario
    // (Asegúrate de haber actualizado el backend como indicamos antes)
    if (!reserva.idActo) {
        alert("Error: Faltan datos del acto (idActo). Por favor recargue la página.");
        return;
    }

    // Guardamos la fecha original para bloquearla en el calendario
    fechaReservaOriginal = reserva.fecha;

    // A. Configurar Modal (Hacerlo Grande)
    const modalElement = document.getElementById("modalReserva");
    const modalContent = modalElement.querySelector('.modal-content');
    modalContent.className = 'modal-content modal-repro-xl'; // Clase CSS ancha
    
    const modalBody = document.getElementById("modal-body");
    const modalTitle = document.getElementById("modal-title");
    const modalFooter = document.getElementById("modal-footer");

    modalTitle.innerHTML = "Reprogramar Reserva";

    // B. Renderizar HTML (Estructura idéntica a reserva_acto.html)
    // Usamos las clases: reserva-acto-container, left-column, right-column
    modalBody.innerHTML = `
        <div class="reserva-acto-container">
            
            <div class="left-column">
                <h5 class="section-title">Datos de la Reserva</h5>
                
                <div class="info-actual-card mb-3">
                    <strong>Reserva Actual:</strong>
                    <div style="margin-top:5px; color:#333;">
                        ${reserva.nombreActo}<br>
                        ${reserva.fecha} - ${reserva.hora}<br>
                        <small style="color:#666">${reserva.nombreParroquia}</small>
                    </div>
                </div>

                <div class="form-group mb-3">
                    <label>Nueva Fecha:</label>
                    <input type="text" id="nuevaFechaDisplay" class="form-control input-readonly" readonly placeholder="Seleccione en el calendario 👉">
                    <input type="hidden" id="nuevaFechaVal">
                </div>

                <div class="form-group mb-3">
                    <label>Nueva Hora:</label>
                    <input type="text" id="nuevaHoraDisplay" class="form-control input-readonly" readonly placeholder="Seleccione hora tras fecha">
                    <input type="hidden" id="nuevaHoraVal">
                </div>

                <div class="form-group mb-3">
                    <label>Motivo del cambio:</label>
                    <textarea id="motivoReprogramacion" class="form-control" rows="3" placeholder="Indique la razón..."></textarea>
                </div>
                
                <div id="mensaje-error-repro" class="mensaje-error"></div>
            </div>

            <div class="right-column">
                <h5 class="section-title">Selección de Fecha</h5>
                <div id="calendar-repro"></div>
            </div>
        </div>
    `;

    // C. Botones Footer
    modalFooter.innerHTML = `
        <button class="btn btn-secondary" onclick="cerrarModalRepro()">Cancelar</button>
        <button class="btn btn-primary" id="btnGuardarRep">Guardar Cambios</button>
    `;

    // Evento Guardar
    document.getElementById("btnGuardarRep").onclick = async () => {
        const fecha = document.getElementById("nuevaFechaVal").value;
        const hora = document.getElementById("nuevaHoraVal").value;
        const motivo = document.getElementById("motivoReprogramacion").value.trim();
        const errorDiv = document.getElementById("mensaje-error-repro");
        
        errorDiv.textContent = "";

        if(!fecha || !hora) {
            errorDiv.textContent = "Seleccione una nueva fecha y hora.";
            return;
        }
        if(!motivo) {
            errorDiv.textContent = "Ingrese el motivo del cambio.";
            return;
        }

        try {
            const btn = document.getElementById("btnGuardarRep");
            btn.disabled = true; btn.textContent = "Procesando...";

            const res = await fetch('/api/reserva/reprogramar', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({ idReserva, fecha, hora, observaciones: motivo })
            });
            const data = await res.json();
            
            if(data.ok) {
                alert("Reserva reprogramada con éxito.");
                cerrarModalRepro();
                cargarReservas();
            } else {
                errorDiv.textContent = data.mensaje;
                btn.disabled = false; btn.textContent = "Guardar Cambios";
            }
        } catch(e) { console.error(e); }
    };

    // D. Mostrar Modal e Iniciar Calendario
    document.getElementById("modalReserva").style.display = "block";
    
    // Retardo necesario para que FullCalendar detecte el tamaño del contenedor visible
    setTimeout(() => {
        initCalendarRepro(reserva.idActo, reserva.idParroquia);
    }, 100);
};

window.cerrarModalRepro = () => {
    document.getElementById("modalReserva").style.display = "none";
};

// ---------------------------------------------------------
// 2. INICIALIZAR CALENDARIO (FullCalendar)
// ---------------------------------------------------------
function initCalendarRepro(idActo, idParroquia) {
    const el = document.getElementById('calendar-repro');
    if(!el) return;

    calendarioRepro = new FullCalendar.Calendar(el, {
        initialView: 'dayGridMonth',
        locale: 'es',
        headerToolbar: { left: 'prev,next', center: 'title', right: 'dayGridMonth' },
        height: '100%',
        showNonCurrentDates: false,
        selectable: true,
        dateClick: (info) => clickFechaRepro(info.dateStr)
    });
    calendarioRepro.render();
    
    // Cargar disponibilidad usando el ID del acto
    cargarDispoRepro(idActo, idParroquia);
}

// ---------------------------------------------------------
// 3. CARGAR DATOS DE DISPONIBILIDAD
// ---------------------------------------------------------
async function cargarDispoRepro(idActo, idParroquia) {
    try {
        // Horarios (Días verdes)
        const res = await fetch(`/api/acto/disponibilidad/${idParroquia}/${idActo}`);
        const data = await res.json();
        
        // Normalizar texto para evitar problemas de tildes (mié -> mie)
        // La BD suele devolver "Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"
        horariosRepro = (data.datos || []).map(d => ({
            dia: d.diaSemana.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").substring(0,3),
            hora: d.horaInicioActo.substring(0,5)
        }));

        // Configuración (Tiempos mínimos)
        const resCfg = await fetch(`/api/acto/configuracion/${idActo}`);
        const dataCfg = await resCfg.json();
        if(dataCfg.success && dataCfg.datos) {
            configRepro.tiempoMinimoReserva = dataCfg.datos.tiempoMinimoReserva || 0;
            configRepro.tiempoMaximoReserva = dataCfg.datos.tiempoMaximoReserva || null;
        }
        
        pintarDiasRepro();

    } catch(e) { console.error("Error cargando disponibilidad:", e); }
}

// ---------------------------------------------------------
// 4. PINTAR DÍAS (Validando fecha actual)
// ---------------------------------------------------------
function pintarDiasRepro() {
    if(!calendarioRepro) return;
    calendarioRepro.removeAllEvents();
    const eventos = [];
    const hoy = new Date();
    hoy.setHours(0,0,0,0);
    
    const fechaInicio = new Date(hoy);
    fechaInicio.setDate(fechaInicio.getDate() + configRepro.tiempoMinimoReserva);
    
    const fechaFin = new Date(hoy);
    if(configRepro.tiempoMaximoReserva) {
        fechaFin.setDate(fechaFin.getDate() + configRepro.tiempoMaximoReserva);
    } else {
        fechaFin.setFullYear(fechaFin.getFullYear() + 1);
    }

    for(let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
        const fechaStr = d.toISOString().split('T')[0];
        
        // BLOQUEAR FECHA ORIGINAL (No se pinta de verde)
        if (fechaStr === fechaReservaOriginal) continue;

        const diaIndex = d.getDay();
        const diaAbrev = DIA_ABREV_REPRO[diaIndex].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (horariosRepro.some(h => h.dia === diaAbrev)) {
            eventos.push({
                start: fechaStr,
                display: 'background',
                backgroundColor: '#b8f7b0' // Verde disponible (Bootstrap success light)
            });
        }
    }
    calendarioRepro.addEventSource(eventos);
}

// ---------------------------------------------------------
// 5. CLIC EN FECHA Y MODAL AZUL DE HORAS
// ---------------------------------------------------------
function clickFechaRepro(dateStr) {
    // Validación 1: Fecha actual
    if (dateStr === fechaReservaOriginal) return alert("Fecha actual de la reserva. Elija otra.");

    // Validación 2: Tiempo mínimo
    const d = new Date(dateStr + 'T12:00:00');
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const minDate = new Date(hoy);
    minDate.setDate(minDate.getDate() + configRepro.tiempoMinimoReserva);

    if(d < minDate) return alert("Fecha no disponible por antelación mínima.");

    // Validación 3: Existencia de horarios
    const diaIndex = d.getDay();
    const diaAbrev = DIA_ABREV_REPRO[diaIndex].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    const horas = horariosRepro
        .filter(h => h.dia === diaAbrev)
        .map(h => h.hora).sort();

    if(horas.length === 0) return alert("Día sin horarios disponibles.");

    // ABRIR MODAL AZUL DE HORAS (infoModal)
    // Usamos las clases CSS .modal-header.bg-primary definidas en el CSS nuevo
    const modalInfo = new bootstrap.Modal(document.getElementById('infoModal'));
    
    // Forzar estilo azul en el header
    const header = document.querySelector('#infoModal .modal-header');
    header.className = 'modal-header bg-primary text-white'; 
    document.getElementById('modalTitulo').textContent = "Confirmar Reserva";
    
    const nombreDia = DIAS_LARGOS_REPRO[diaIndex];

    document.getElementById('modalCuerpo').innerHTML = `
        <div style="padding: 10px;">
            <p style="margin-bottom: 5px;"><strong>Fecha seleccionada:</strong> ${dateStr}</p>
            <p style="margin-bottom: 15px;"><strong>Día de la semana:</strong> ${nombreDia}</p>
            
            <p style="margin-bottom: 8px;"><strong>Selecciona un horario:</strong></p>
            
            <div class="d-grid gap-2" style="grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); display:grid;">
                ${horas.map(h => `
                    <button class="btn btn-outline-primary fw-bold" onclick="selHoraRepro('${dateStr}','${h}')" style="padding:10px;">
                        ${h}
                    </button>
                `).join('')}
            </div>

            <p style="margin-top: 15px; color: #666; font-size: 0.85rem;">
                Haz clic en la hora deseada y luego en el botón Confirmar Hora.
            </p>
        </div>
    `;
    
    // Ocultamos footer porque la selección es directa al clic
    const footer = document.querySelector('#infoModal .modal-footer');
    if(footer) footer.style.display = 'none';
    
    window.infoModalInstance = modalInfo;
    modalInfo.show();
}

window.selHoraRepro = (fecha, hora) => {
    // Llenar inputs en el modal grande
    document.getElementById('nuevaFechaVal').value = fecha;
    document.getElementById('nuevaFechaDisplay').value = fecha;
    document.getElementById('nuevaHoraVal').value = hora;
    document.getElementById('nuevaHoraDisplay').value = hora;
    
    // Efecto visual de éxito
    const inputDisplay = document.getElementById('nuevaHoraDisplay');
    inputDisplay.classList.add('bg-success', 'text-white');
    setTimeout(() => {
        inputDisplay.classList.remove('bg-success', 'text-white');
    }, 600);

    if(window.infoModalInstance) window.infoModalInstance.hide();
};

// ---------------------------------------------------------
// 5. MANEJAR CLIC EN FECHA
// ---------------------------------------------------------
function manejarClickFechaRepro(dateStr) {
    // A. Validar que no sea la fecha original
    if (dateStr === fechaReservaOriginal) {
        alert("Esta es la fecha de tu reserva actual. Por favor selecciona un dia distinto.");
        return;
    }

    const fechaObj = new Date(dateStr + 'T12:00:00');
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    
    // B. Validar tiempo minimo
    const fechaMin = new Date(hoy);
    fechaMin.setDate(fechaMin.getDate() + configRepro.tiempoMinimoReserva);
    
    if (fechaObj < fechaMin) {
        alert(`Solo puedes reservar a partir del ${fechaMin.toLocaleDateString()}`);
        return;
    }

    // C. Validar si el dia tiene horarios
    const diaIndex = fechaObj.getDay();
    const diaAbrev = DIA_ABREV_REPRO[diaIndex].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const horasPosibles = horariosRepro
        .filter(h => h.dia === diaAbrev)
        .map(h => h.hora)
        .sort();

    if (horasPosibles.length === 0) {
        alert("No hay horarios disponibles para este dia.");
        return;
    }

    // D. Abrir Modal de Confirmacion (Estilo Azul)
    abrirModalConfirmarHoraEstilo(dateStr, horasPosibles, diaIndex);
}

// ---------------------------------------------------------
// 6. SUB-MODAL DE CONFIRMACION DE HORA (ESTILO AZUL)
// ---------------------------------------------------------
function abrirModalConfirmarHoraEstilo(fechaStr, horas, diaIndex) {
    const modalElement = document.getElementById('infoModal');
    const modalTitulo = document.getElementById("modalTitulo");
    const modalCuerpo = document.getElementById("modalCuerpo");
    const modalFooter = modalElement.querySelector('.modal-footer');

    // Estilo Encabezado Azul
    const header = modalElement.querySelector('.modal-header');
    header.className = "modal-header bg-primary text-white"; 
    
    // Obtener nombre del dia largo
    const nombreDia = DIAS_LARGOS_REPRO[diaIndex];

    modalTitulo.textContent = "Confirmar Reserva"; 

    // Generar botones de hora con estilo limpio
    const botonesHoras = horas.map(h => `
        <button class="btn-hora-simple" onclick="seleccionarHoraFinal('${fechaStr}', '${h}')">
            ${h}
        </button>
    `).join('');

    // Cuerpo del modal identico a la captura azul
    modalCuerpo.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 10px;">
            <p style="margin-bottom: 5px; font-size:1rem;"><strong>Fecha seleccionada:</strong> ${fechaStr}</p>
            <p style="margin-bottom: 15px; font-size:1rem;"><strong>Dia de la semana:</strong> ${nombreDia}</p>
            
            <p style="margin-bottom: 8px; font-weight:bold;">Selecciona un horario:</p>
            
            <div class="grid-horas">
                ${botonesHoras}
            </div>
            
            <p style="margin-top: 15px; color: #666; font-size: 0.9rem;">
                Haz clic en la hora deseada para confirmar.
            </p>
        </div>
    `;

    // Ocultar Footer (no es necesario botones extra)
    if(modalFooter) modalFooter.style.display = 'none';

    // Mostrar Modal
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();

    // Guardar referencia global para cerrarlo luego
    window.infoModalInstance = modalInstance;
}

// Funcion llamada al hacer clic en una hora
window.seleccionarHoraFinal = (fecha, hora) => {
    // Llenar inputs del modal GRANDE
    document.getElementById('nuevaFechaVal').value = fecha;
    document.getElementById('nuevaFechaDisplay').value = fecha;
    document.getElementById('nuevaHoraVal').value = hora;
    document.getElementById('nuevaHoraDisplay').value = hora;

    // Feedback visual (parpadeo verde en el input)
    const inputDisplay = document.getElementById("nuevaHoraDisplay");
    inputDisplay.style.backgroundColor = "#d1e7dd"; 
    inputDisplay.style.borderColor = "#198754";
    setTimeout(() => {
        inputDisplay.style.backgroundColor = "#fff";
        inputDisplay.style.borderColor = "#ced4da";
    }, 800);

    // Cerrar modal pequeno
    if(window.infoModalInstance) window.infoModalInstance.hide();
};

    // ============================
    // PESTAÑAS
    // ============================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Ocultar tab "Pendientes" para Secretaria (solo ver Calendario, Confirmadas y Canceladas)
    if (rolUsuario === 'secretaria') {
        const tabPendientes = document.querySelector('.tab-btn[data-tab="pendientes"]');
        const contentPendientes = document.getElementById('tab-pendientes');
        if (tabPendientes) tabPendientes.style.display = 'none';
        if (contentPendientes) contentPendientes.style.display = 'none';
    }
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const target = btn.dataset.tab;
            tabContents.forEach(tc => {
                tc.classList.toggle('active', tc.id === 'tab-' + target);
            });
        });
    });

// ============================
// APROBAR / RECHAZAR DOCUMENTOS (para secretaria)
// ============================
window.aprobarDocumento = async function (idReserva) {
    const modal = document.getElementById("modalReserva");
    const modalBody = document.getElementById("modal-body");
    const modalTitle = document.getElementById("modal-title");
    const modalFooter = document.getElementById("modal-footer");

    modalTitle.textContent = `Aprobar Documentos`;
    modalBody.innerHTML = "<p>Cargando documentos para revisión...</p>";
    modalFooter.innerHTML = "";
    modal.style.display = "block";

    try {
        const resp = await fetch(`/api/requisito/obtener_documentos_reserva/${idReserva}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const json = await resp.json();

        if (!json.success || !Array.isArray(json.datos) || json.datos.length === 0) {
            modalBody.innerHTML = "<p>No hay documentos entregados para esta reserva.</p>";
            modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
            document.getElementById("cerrarModalBtn").onclick = cerrarModal;
            return;
        }

        // Construir lista de documentos con controles
        let html = `<div class="lista-requisitos">`;
        json.datos.forEach((doc, idx) => {
            const estado = (doc.estadoCumplimiento || '').toUpperCase();
            const nombre = doc.nombRequisito || doc.nombDocumento || `Documento ${doc.idDocumento}`;
            html += `
                <div class="req-item" data-id-documento="${doc.idDocumento}" style="margin-bottom:12px;">
                    <p><strong>${nombre}</strong></p>
                    <div style="display:flex;gap:12px;align-items:center;">
                        <a href="javascript:void(0);" onclick="descargarArchivo(${doc.idDocumento})">Descargar</a>
                        <label>
                            Acción:
                            <select class="accion-doc" data-idx="${idx}" data-id-documento="${doc.idDocumento}">
                                <option value="mantener">Mantener</option>
                                <option value="aprobar"${estado === 'CUMPLE' ? ' selected' : ''}>Aprobar</option>
                                <option value="rechazar">Rechazar</option>
                            </select>
                        </label>
                    </div>
                    <div class="obs-container" id="obs_${idx}" style="margin-top:8px; display:none;">
                        <label>Observación (si rechaza):</label><br>
                        <textarea class="obs-text" data-idx="${idx}" style="width:100%;min-height:60px;"></textarea>
                    </div>
                </div>`;
        });
        html += `</div>`;
        modalBody.innerHTML = html;

        // Footer con botones Guardar y Cerrar
        modalFooter.innerHTML = `
            <button class="btn-accion guardar" id="guardarAprobacion">Guardar cambios</button>
            <button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>
        `;
        document.getElementById("cerrarModalBtn").onclick = cerrarModal;

        // Mostrar/ocultar textarea cuando se seleccione "rechazar"
        modalBody.querySelectorAll('.accion-doc').forEach(sel => {
            sel.addEventListener('change', (e) => {
                const idx = e.target.dataset.idx;
                const cont = document.getElementById(`obs_${idx}`);
                cont.style.display = e.target.value === 'rechazar' ? 'block' : 'none';
            });
        });

        // Guardar cambios
        document.getElementById('guardarAprobacion').onclick = async () => {
            const acciones = Array.from(modalBody.querySelectorAll('.accion-doc')).map(s => {
                const idx = s.dataset.idx;
                const obsEl = modalBody.querySelector(`.obs-text[data-idx="${idx}"]`);
                return {
                    idDocumento: s.dataset.idDocumento,
                    accion: s.value,
                    observacion: obsEl ? obsEl.value.trim() : ""
                };
            });

            try {
                // Procesar cada documento individualmente
                for (const doc of acciones) {
                    if (doc.accion === 'aprobar') {
                        await fetch(`/api/requisito/documento/aprobar_parcial/${idReserva}`, { method: 'POST' });
                    } else if (doc.accion === 'rechazar') {
                        await fetch(`/api/requisito/documento/rechazar`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                idDocumento: doc.idDocumento, 
                                idReserva: idReserva, 
                                observacion: doc.observacion 
                            })
                        });
                    }
                }

                alert('Acciones procesadas correctamente.');
                cerrarModal();
                cargarReservas();
                // Auto-actualizar el calendario si está disponible
                if (typeof window.recargarCalendario === 'function') {
                    window.recargarCalendario();
                }

            } catch (err) {
                console.error('Error al procesar documentos:', err);
                alert('Error al procesar la acción: ' + (err.message || err));
            }
        };

    } catch (error) {
        console.error('Error al cargar documentos para aprobar:', error);
        modalBody.innerHTML = "<p>Error al cargar documentos.</p>";
        modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
        document.getElementById("cerrarModalBtn").onclick = cerrarModal;
    }
};


    // Cargar reservas al iniciar
    cargarReservas();
});
