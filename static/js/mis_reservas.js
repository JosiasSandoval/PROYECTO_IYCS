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
                    
                    if (estado.includes('PENDIENTE_PAGO')) {
                        accionesHTML = accionesHTML + `
                            <button class="btn-accion pagar" onclick="pagarReserva(${dato.idReserva})">Pagar</button>
                            <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                        // Mensaje informativo sobre documentos físicos
                        mensajeInfo = `<div class="mensaje-info-pago" style="font-size: 0.9rem; color: #856404; background-color: #fff3cd; padding: 8px; border-radius: 4px; margin-bottom: 5px; border: 1px solid #ffc107;">
                            <strong>ℹ️ Información:</strong> Los documentos de los requisitos se entregan 100% en físico en la parroquia.
                        </div>`;
                    } else if (estado.includes('PENDIENTE_DOCUMENTO')) {
                        // PENDIENTE_DOCUMENTO: solo Ver y Cancelar (documentos se entregan físicamente)
                        accionesHTML = accionesHTML + `
                            <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                        mensajeInfo = `<div class="mensaje-info-pago" style="font-size: 0.9rem; color: #856404; background-color: #fff3cd; padding: 8px; border-radius: 4px; margin-bottom: 5px; border: 1px solid #ffc107;">
                            <strong>ℹ️ Información:</strong> Entregue los documentos físicamente en la parroquia para completar su reserva.
                        </div>`;
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

    window.reprogramarReserva = async (idReserva) => {
        const reserva = reservasGlobal.find(r => r.idReserva == idReserva);
        if (!reserva) { alert("Reserva no encontrada"); return; }

        // 1. Obtener Configuración y Validar Tiempo Límite
        const config = reserva.configActo || {};
        const tiempoLimite = config.tiempoMaxReprogramacion; 
        const unidad = config.unidadTiempoAcciones || 'horas';
        
        // Si existe un límite configurado, validamos vigencia
        if (tiempoLimite !== null && tiempoLimite !== undefined) {
            const fechaHoraBase = `${reserva.fecha}T${reserva.hora}`;
            const fechaLimite = calcularFechaLimite(fechaHoraBase, tiempoLimite, unidad);

            if (new Date() > fechaLimite) {
                alert(`Ya no es posible reprogramar. La fecha límite fue: ${fechaLimite.toLocaleString()}`);
                return;
            }
        }

        // 2. Preparar el Modal
        const modal = document.getElementById("modalReserva");
        const modalBody = document.getElementById("modal-body");
        const modalTitle = document.getElementById("modal-title");
        const modalFooter = document.getElementById("modal-footer");

        modalTitle.textContent = "Reprogramar Reserva";

        // 3. Renderizar Formulario
        modalBody.innerHTML = `
            <div class="form-reprogramar">
                <p class="info-text">Reserva actual: <strong>${reserva.fecha}</strong> a las <strong>${reserva.hora}</strong></p>
                <p class="info-text">Acto: ${reserva.nombreActo}</p>
                <hr>
                
                <div class="form-group">
                    <label for="nuevaFecha">Nueva Fecha:</label>
                    <input type="date" id="nuevaFecha" class="input-form" min="${new Date().toISOString().split('T')[0]}">
                </div>

                <div class="form-group">
                    <label for="nuevaHora">Nueva Hora:</label>
                    <input type="time" id="nuevaHora" class="input-form">
                </div>

                <div class="form-group">
                    <label for="motivoReprogramacion">Motivo del cambio:</label>
                    <textarea id="motivoReprogramacion" class="input-form" rows="3" placeholder="Indique la razón del cambio..."></textarea>
                </div>
                
                <div id="mensaje-error" class="mensaje-error"></div>
            </div>
        `;

        // 4. Configurar Botones
        modalFooter.innerHTML = `
            <button class="btn-accion cancelar" id="btnCancelarRep">Cancelar</button>
            <button class="btn-accion guardar" id="btnGuardarRep">Guardar Cambios</button>
        `;

        // Eventos
        document.getElementById("btnCancelarRep").onclick = cerrarModal;
        
        document.getElementById("btnGuardarRep").onclick = async () => {
            const nuevaFecha = document.getElementById("nuevaFecha").value;
            const nuevaHora = document.getElementById("nuevaHora").value;
            const motivo = document.getElementById("motivoReprogramacion").value.trim();
            const errorDiv = document.getElementById("mensaje-error");

            // Validaciones básicas
            if (!nuevaFecha || !nuevaHora) {
                errorDiv.textContent = "Por favor, seleccione fecha y hora.";
                return;
            }
            if (!motivo) {
                errorDiv.textContent = "Debe indicar un motivo para la reprogramación.";
                return;
            }

            // Llamada a la API
            try {
                const btn = document.getElementById("btnGuardarRep");
                btn.disabled = true;
                btn.textContent = "Procesando...";

                const response = await fetch('/api/reserva/reprogramar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idReserva: idReserva,
                        fecha: nuevaFecha,
                        hora: nuevaHora,
                        observaciones: motivo
                    })
                });

                const data = await response.json();

                if (data.ok) {
                    alert("✅ Reserva reprogramada exitosamente.");
                    cerrarModal();
                    cargarReservas(); // Recargar tabla
                } else {
                    errorDiv.textContent = `Error: ${data.mensaje}`;
                }
            } catch (error) {
                console.error("Error al reprogramar:", error);
                errorDiv.textContent = "Error de conexión con el servidor.";
            } finally {
                document.getElementById("btnGuardarRep").disabled = false;
                document.getElementById("btnGuardarRep").textContent = "Guardar Cambios";
            }
        };

        modal.style.display = "block";
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
