/* Reserva - Ver + Subir / Modificar documentos (completo) */
document.addEventListener('DOMContentLoaded', async () => {
    const bodyElement = document.body;
    const rolUsuario = bodyElement.dataset.rol?.toLowerCase();
    const idUsuarioSesion = bodyElement.dataset.id;

    if (!idUsuarioSesion || !rolUsuario) {
        window.location.href = '/principal';
        return;
    }

    let configActo = null; // Variable global, pero la lógica ahora usará la adjunta a cada reserva

    // ============================
    // FUNCIONES DE CARGA Y TIEMPO
    // ============================

    async function cargarConfiguracion(idActo) {
        try {
            const res = await fetch(`/api/acto/configuracion/${idActo}`);
            if (!res.ok) throw new Error('Error al cargar configuración');
            const data = await res.json();
            if (data.success && data.datos) return data.datos;
        } catch (e) {
            console.error('Error en cargarConfiguracion:', e);
        }
        return null;
    }

    // ============================
    // VARIABLES GLOBALES
    // ============================
    let reservasGlobal = [];

    // 💡 CORRECCIÓN DE VIGENCIA: Ahora resta el tiempo de la acción a la fecha base (evento).
    function calcularFechaLimite(fechaBase, tiempoAccion, unidad) {
        const fecha = new Date(fechaBase);

        // Convertir a negativo para RESTAR y asegurar que el límite es ANTES del evento.
        const tiempo = -Math.abs(tiempoAccion); 
        
        if (unidad.toLowerCase().startsWith('hora')) {
            fecha.setHours(fecha.getHours() + tiempo);
        } else if (unidad.toLowerCase().startsWith('dia')) {
            fecha.setDate(fecha.getDate() + tiempo);
        } else {
            console.warn('Unidad desconocida, se usará horas por defecto');
            fecha.setHours(fecha.getHours() + tiempo);
        }
        return fecha;
    }

    function mensajeFechaLimite(reserva, tipo) {
        // Usa configActo adjunto a la reserva o, si no existe, la variable global.
        const config = reserva.configActo || configActo || {}; 
        let tiempo;
        let accion = "realizar esta acción";

        switch(tipo) {
            case 'documento': 
                tiempo = config?.tiempoCambioDocumentos;
                accion = "subir/modificar documentos";
                break;
            case 'pago': 
                tiempo = config?.tiempoMaxPago; 
                accion = "realizar el pago";
                break;
            case 'reprogramacion': 
                tiempo = config?.tiempoMaxReprogramacion; 
                accion = "reprogramar";
                break;
            case 'cancelacion': 
                tiempo = config?.tiempoMaxCancelacion; 
                accion = "cancelar la reserva";
                break;
            default: 
                tiempo = 12; 
        }
        const unidad = config?.unidadTiempoAcciones || 'horas';

        const fechaReserva = new Date(`${reserva.fecha}T${reserva.hora}`);
        if (isNaN(fechaReserva.getTime())) return "Fecha de reserva inválida";
        
        if (tiempo === null || tiempo === undefined) {
             return "No se ha configurado un tiempo límite para esta acción.";
        }

        const fechaLimite = calcularFechaLimite(fechaReserva, tiempo, unidad);
        
        return `Debes ${accion} a más tardar el ${fechaLimite.toLocaleString()}`;
    }


    // ============================
    // FUNCION CERRAR MODAL
    // ============================
    function cerrarModal() {
        const modal = document.getElementById("modalReserva");
        if (modal) modal.style.display = "none";
    }
    const closeBtn = document.querySelector(".modal .close");
    if (closeBtn) closeBtn.addEventListener("click", cerrarModal);

    /**
     * Calcula la hora de finalización de un evento.
     * @param {string} horaInicio - Hora en formato 'HH:MM:SS'.
     * @param {string} fechaReserva - Fecha en formato 'YYYY-MM-DD'.
     * @param {number} duracionMinutos - Duración del evento en minutos.
     * @returns {string} La hora final en formato 'HH:MM:SS' o 'N/A'.
     */
    function calcularHoraFinal(horaInicio, fechaReserva, duracionMinutos) {
        const duracion = parseInt(duracionMinutos);
        if (isNaN(duracion) || !horaInicio || !fechaReserva) {
            return 'N/A';
        }

        try {
            const fechaHoraInicio = new Date(`${fechaReserva}T${horaInicio}`);
            const fechaHoraFinal = new Date(fechaHoraInicio.getTime() + duracion * 60000);

            return fechaHoraFinal.toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
        } catch (e) {
            return 'Inválida';
        }
    }
    // ============================
    // CARGAR RESERVAS (Se modifica para cargar la config y asegurar la vigencia)
    // ============================
    async function cargarReservas() {
        try {
            const response = await fetch(`/api/reserva/reserva_usuario/${idUsuarioSesion}/${rolUsuario}`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const data = await response.json();
            
            if (data.ok && data.datos) {
                // Adjuntar la configuración a cada reserva para los cálculos de vigencia.
                reservasGlobal = await Promise.all(data.datos.map(async dato => {
                    if (dato.idActo) {
                        dato.configActo = await cargarConfiguracion(dato.idActo);
                    }
                    return dato;
                }));
            } else {
                reservasGlobal = [];
            }

            const tablaPendientes = document.querySelector('#tabla-pendientes tbody');
            const tablaConfirmadas = document.querySelector('#tabla-confirmadas tbody');
            const tablaCanceladas = document.querySelector('#tabla-canceladas tbody');

            tablaPendientes.innerHTML = '';
            tablaConfirmadas.innerHTML = '';
            tablaCanceladas.innerHTML = '';

            reservasGlobal.forEach(dato => {
                const fila = document.createElement('tr');
                const estado = (dato.estadoReserva || '').toUpperCase();

                let accionesHTML = `<button class="btn-accion ver" onclick="verReserva(${dato.idReserva})">Ver</button>`;

                if (estado.includes('PENDIENTE_DOCUMENTO')) {
                    accionesHTML += `
                        <button class="btn-accion subir" onclick="subirDocumentos(${dato.idReserva})">Subir Documentos</button>
                        <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>
                    `;
                } else if (estado.includes('PENDIENTE_REVISION')) {
                    accionesHTML += `
                        <button class="btn-accion modificar" onclick="modificarDocumentos(${dato.idReserva})">Modificar Documentos</button>
                        <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>
                    `;
                } else if (estado.includes('PENDIENTE_PAGO')) {
                   accionesHTML += `
                    <button class="btn-accion pagar" onclick="pagarReserva('${dato.idReserva}')">Pagar</button>
                    <button class="btn-accion cancelar" onclick="cancelarReserva('${dato.idReserva}')">Cancelar</button>
                `;
                } else if (estado.includes('CONFIRMADO')) {
                    accionesHTML += `
                        <button class="btn-accion reprogramar" onclick="reprogramarReserva(${dato.idReserva})">Reprogramar</button>
                        <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>
                    `;
                }

                fila.innerHTML = `
                    <td>${dato.nombreActo || ''}</td>
                    <td>${dato.fecha || ''}</td>
                    <td>${dato.hora || ''}</td>
                    <td>${dato.nombreParroquia || ''}</td>
                    <td>${dato.estadoReserva || ''}</td>
                    <td>${accionesHTML}</td>
                `;

                if (estado.includes('PENDIENTE')) tablaPendientes.appendChild(fila);
                else if (estado.includes('CONFIRMADO')) tablaConfirmadas.appendChild(fila);
                else if (estado.includes('CANCELADO')) tablaCanceladas.appendChild(fila);
            });

        } catch (error) {
            console.error('❌ Fallo al obtener datos de la reserva', error);
        }
    }


    async function uploadFileToServer(file, idDocumento, idReserva, idActoRequisito, estadoCumplimiento = 'CUMPLIDO') {
        try {
            if (!idDocumento) return { ok: false, mensaje: "Falta idDocumento" };
            if (!idReserva) return { ok: false, mensaje: "Falta idReserva" };
            if (!idActoRequisito) return { ok: false, mensaje: "Falta idActoRequisito" };

            const fechaISO = new Date().toISOString().split('T')[0];

            const formData = new FormData();
            formData.append('file', file);
            formData.append('estadoCumplimiento', estadoCumplimiento);
            formData.append('f_subido', fechaISO);
            formData.append('idReserva', idReserva);
            formData.append('idActoRequisito', idActoRequisito);

            console.log("📤 Enviando archivo a modificar_documento_requisito:", {
                idDocumento,
                idReserva,
                idActoRequisito,
                fileName: file.name
            });

            const resp = await fetch(`/api/requisito/modificar_documento_requisito/${idDocumento}`, {
                method: 'PUT',
                body: formData
            });

            if (!resp.ok) {
                const text = await resp.text();
                return { ok: false, mensaje: `HTTP ${resp.status}: ${text}` };
            }
            
            const json = await resp.json();
            return json;

        } catch (e) {
            console.error("🔥 Error en uploadFileToServer:", e);
            return { ok: false, mensaje: e.message || e.toString() };
        }
    }

    async function actualizarDocumentoEnBD(idDocumento, ruta, tipoArchivo, fechaISO, estadoCumplimiento) {
        try {
            const formData = new FormData();
            formData.append("ruta", ruta);
            formData.append("tipoArchivo", tipoArchivo);
            formData.append("fecha", fechaISO);
            formData.append("estadoCumplimiento", estadoCumplimiento);

            const resp = await fetch(`/api/requisito/modificar_documento_requisito/${idDocumento}`, {
                method: 'PUT',
                body: formData
            });

            if (!resp.ok) {
                const text = await resp.text();
                return { ok: false, mensaje: `HTTP ${resp.status}: ${text}` };
            }

            return await resp.json();

        } catch (e) {
            return { ok: false, mensaje: e.message || e.toString() };
        }
    }

    async function cambiarEstadoDocumento(idDocumento, estadoActual) {
        try {
            const resp = await fetch(`/api/requisito/cambiar_estado_documento`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idDocumento: idDocumento,
                    estadoCumplimiento: estadoActual
                })
            });

            if (!resp.ok) {
                const text = await resp.text();
                console.error(`Error HTTP ${resp.status}: ${text}`);
                return { ok: false, mensaje: text };
            }

            const json = await resp.json();
            return json;
        } catch (e) {
            console.error("Error al cambiar estado del documento:", e);
            return { ok: false, mensaje: e.message || e.toString() };
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

    window.verArchivoActual = async (idDocumento) => {
        const modal = document.getElementById("modalArchivo");
        const body = document.getElementById("modal-archivo-body");

        modal.style.display = "block";
        body.innerHTML = "<p>Cargando archivo...</p>";

        const cerrarBtn = document.getElementById("cerrarModalArchivo");
        if (cerrarBtn) cerrarBtn.onclick = () => modal.style.display = "none";

        try {
            const res = await fetch(`/api/requisito/archivo/${idDocumento}`);
            if (!res.ok) throw new Error('Archivo no encontrado');

            const blob = await res.blob();
            let url = URL.createObjectURL(blob);
            body.innerHTML = '';

            const contentDisposition = res.headers.get('Content-Disposition') || '';
            let fileName = contentDisposition.split('filename=')[1] || '';
            fileName = fileName.replace(/['"]/g, '');
            const ext = fileName.split('.').pop().toLowerCase();

            if (blob.type.startsWith('image/') || ['jpg','jpeg','png','gif','bmp'].includes(ext)) {
                const img = document.createElement('img');
                img.src = url;
                img.style.maxWidth = "100%";
                img.style.borderRadius = "6px";
                body.appendChild(img);
            } else if (blob.type === 'application/pdf' || ext === 'pdf') {
                const iframe = document.createElement('iframe');
                iframe.src = url;
                iframe.style.width = "100%";
                iframe.style.height = "500px";
                iframe.style.border = "none";
                body.appendChild(iframe);
            } else {
                body.innerHTML = `
                    <p>Tipo de archivo no soportado para previsualización. 
                    <a href="${url}" target="_blank">Abrir en nueva pestaña</a></p>
                `;
            }

        } catch (e) {
            console.error(e);
            body.innerHTML = "<p>Error al cargar archivo.</p>";
        }
    };

    async function cancelarReservaPorVigencia(idReserva) {
        try {
            const resp = await fetch(`/api/reserva/cambiar_estado/${idReserva}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'cancelar' })
            });
            if (!resp.ok) return false;
            const j = await resp.json();
            return !!j.ok;
        } catch (e) {
            return false;
        }
    }

    window.subirDocumentos = async (idReserva) => {
        const modal = document.getElementById("modalReserva");
        const modalBody = document.getElementById("modal-body");
        const modalTitle = document.getElementById("modal-title");
        const modalFooter = document.getElementById("modal-footer");

        modalTitle.textContent = "Subir Documentos Pendientes";
        modalBody.innerHTML = "<p>Cargando requisitos...</p>";
        modalFooter.innerHTML = "";
        modal.style.display = "block";

        const reserva = reservasGlobal.find(r => r.idReserva == idReserva);
        const config = reserva?.configActo || configActo || {};
        const tiempoLimite = config?.tiempoCambioDocumentos;
        const unidad = config?.unidadTiempoAcciones || 'horas';

        if (reserva) alert(mensajeFechaLimite(reserva, 'documento'));

        try {
            // Se elimina la lógica de cancelación automática. El frontend solo informa.
            
            const response = await fetch(`/api/requisito/obtener_documento_faltante/${idReserva}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (!data.success || !Array.isArray(data.datos) || data.datos.length === 0) {
                modalBody.innerHTML = "<p>No hay documentos pendientes por subir.</p>";
                modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
                document.getElementById("cerrarModalBtn").onclick = cerrarModal;
                return;
            }

            let html = `<div class="lista-requisitos">`;
            data.datos.forEach((req, idx) => {
                const vigencia = req.vigencia || req.vigenciaDocumento || req.vigencia_documento || null;
                html += `
                    <div class="req-item" data-id-documento="${req.idDocumento}" data-id-acto-requisito="${req.idActoRequisito}">
                        <p><strong>${req.nombRequisito || 'Requisito'}</strong> ${vigencia ? `<small>(vigencia: ${vigencia})</small>` : ''}</p>
                        <input type="file" id="file_${idx}" data-id-documento="${req.idDocumento}" data-id-acto-requisito="${req.idActoRequisito}" accept="application/pdf,image/*">
                        <button class="btn-accion btn-subir-item" data-idx="${idx}" style="margin-left:8px;">Subir</button>
                        <span class="status-msg" id="status_${idx}" style="margin-left:10px;"></span>
                    </div>
                    <hr>
                `;
            });
            html += `</div>`;
            modalBody.innerHTML = html;

            modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
            document.getElementById("cerrarModalBtn").onclick = cerrarModal;

            document.querySelectorAll('.btn-subir-item').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = btn.dataset.idx;
                    const input = document.getElementById(`file_${idx}`);
                    const statusEl = document.getElementById(`status_${idx}`);
                    statusEl.textContent = '';

                    if (!input || !input.files || input.files.length === 0) {
                        alert('Seleccione un archivo primero.');
                        return;
                    }

                    const file = input.files[0];
                    const idDocumento = input.dataset.idDocumento;
                    const idActoRequisito = input.dataset.idActoRequisito;

                    if (!reserva || !reserva.fecha || !reserva.hora) {
                        alert("Error: la reserva no tiene fecha u hora válidas.");
                        return;
                    }

                    // Se elimina la lógica de cancelación automática.

                    statusEl.textContent = 'Subiendo...';
                    const uploadResult = await uploadFileToServer(file, idDocumento, idReserva, idActoRequisito);

                    let rutaFinal = uploadResult.ok && uploadResult.ruta ? uploadResult.ruta : `/temporal/${idActoRequisito || idDocumento}_${file.name}`;
                    const tipoArchivo = file.type.split('/')[1]?.toUpperCase() || 'BIN';
                    const fechaISO = new Date().toISOString().split('T')[0];

                    const resUpdate = await actualizarDocumentoEnBD(idDocumento, rutaFinal, tipoArchivo, fechaISO, 'CUMPLIDO');

                    if (resUpdate && resUpdate.ok) {
                        await cambiarEstadoDocumento(idDocumento, 'NO_CUMPLIDO');

                        statusEl.textContent = '✔ Subido';
                        input.remove();
                        btn.remove();

                        const remainingFiles = document.querySelectorAll('input[type="file"]');
                        if (remainingFiles.length === 0) {
                            const estadoCambiado = await cambiarEstadoReservaAPendienteRevision(idReserva);
                            if (estadoCambiado) {
                                alert('Todos los documentos subidos. Estado de reserva actualizado a PENDIENTE_REVISION.');
                                cerrarModal();
                                cargarReservas();
                            }
                        }
                    } else {
                        statusEl.textContent = `Error: ${resUpdate?.mensaje || 'Desconocido'}`;
                        alert(`Error al subir documento: ${resUpdate?.mensaje || 'Desconocido'}`);
                    }
                });
            });

        } catch (e) {
            console.error(e);
            modalBody.innerHTML = "<p>Error al cargar requisitos.</p>";
            modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
            document.getElementById("cerrarModalBtn").onclick = cerrarModal;
        }
    };

    // ============================
    // MODIFICAR DOCUMENTOS
    // ============================
    window.modificarDocumentos = async (idReserva) => {
        const modal = document.getElementById("modalReserva");
        const modalBody = document.getElementById("modal-body");
        const modalTitle = document.getElementById("modal-title");
        const modalFooter = document.getElementById("modal-footer");

        modalTitle.textContent = "Modificar Documentos";
        modalBody.innerHTML = "<p>Cargando documentos...</p>";
        modalFooter.innerHTML = "";
        modal.style.display = "block";

        const reserva = reservasGlobal.find(r => r.idReserva == idReserva);
        const config = reserva?.configActo || configActo || {};
        const tiempoLimite = config?.tiempoCambioDocumentos;
        const unidad = config?.unidadTiempoAcciones || 'horas';

        if (reserva) alert(mensajeFechaLimite(reserva, 'documento'));

        try {
            // Se elimina la lógica de cancelación automática. El frontend solo informa.

            const response = await fetch(`/api/requisito/obtener_documentos_reserva/${idReserva}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (!data.success || !Array.isArray(data.datos) || data.datos.length === 0) {
                modalBody.innerHTML = "<p>No hay documentos para modificar.</p>";
                modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
                document.getElementById("cerrarModalBtn").onclick = () => modal.style.display = "none";
                return;
            }

            let html = `<div class="lista-requisitos">`;
            data.datos.forEach((doc, idx) => {
                const idActo = doc.idActoRequisito || '';
                const vigencia = doc.vigencia || doc.vigenciaDocumento || doc.vigencia_documento || null;

                html += `
                    <div class="req-item" data-id-documento="${doc.idDocumento}" data-id-acto-requisito="${idActo}">
                        <p><strong>${doc.nombRequisito || 'Requisito'}</strong> ${vigencia ? `<small>(vigencia: ${vigencia})</small>` : ''}</p>
                        <a href="javascript:void(0);" onclick="verArchivoActual(${doc.idDocumento})">Ver archivo actual</a>
                        <input type="file" id="file_mod_${idx}" data-id-documento="${doc.idDocumento}" data-id-acto-requisito="${idActo}" accept="application/pdf,image/*">
                        <button class="btn-accion btn-actualizar-item" data-idx="${idx}" style="margin-left:8px;">Actualizar</button>
                        <span class="status-msg" id="status_mod_${idx}" style="margin-left:10px;"></span>
                    </div>
                    <hr>
                `;
            });
            html += `</div>`;
            modalBody.innerHTML = html;

            modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
            document.getElementById("cerrarModalBtn").onclick = () => modal.style.display = "none";

            document.querySelectorAll('.btn-actualizar-item').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const idx = btn.dataset.idx;
                    const input = document.getElementById(`file_mod_${idx}`);
                    const statusEl = document.getElementById(`status_mod_${idx}`);
                    statusEl.textContent = '';

                    if (!input || !input.files || input.files.length === 0) {
                        alert('Seleccione un archivo primero.');
                        return;
                    }

                    const file = input.files[0];
                    const idDocumento = input.dataset.idDocumento;
                    const idActoRequisito = input.dataset.idActoRequisito || null;
                    
                    // Se elimina la lógica de cancelación automática.
                    statusEl.textContent = 'Subiendo...';
                    btn.disabled = true;

                    try {
                        const formData = new FormData();
                        formData.append('file', file);
                        formData.append('idReserva', idReserva);
                        if (idActoRequisito) formData.append('idActoRequisito', idActoRequisito);

                        const res = await fetch(`/api/requisito/modificar_documento_requisito/${idDocumento}`, {
                            method: 'PUT',
                            body: formData
                        });

                        if (!res.ok) {
                            const text = await res.text();
                            throw new Error(`HTTP ${res.status}: ${text}`);
                        }

                        const result = await res.json();
                        if (result.ok) {
                            statusEl.textContent = '✔ Archivo actualizado';
                            input.remove();
                            btn.remove();
                        } else {
                            statusEl.textContent = `❌ Error: ${result.mensaje || 'No se pudo actualizar'}`;
                        }

                    } catch (err) {
                        console.error('Error al actualizar documento:', err);
                        statusEl.textContent = '❌ Error al subir archivo';
                    } finally {
                        btn.disabled = false;
                    }
                });
            });

        } catch (e) {
            console.error(e);
            modalBody.innerHTML = "<p>Error al cargar documentos.</p>";
            modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
            document.getElementById("cerrarModalBtn").onclick = () => modal.style.display = "none";
        }
    };

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

        // CORRECCIÓN: Usar la configuración adjunta a la reserva
        const config = reserva.configActo || {};
        const ahora = new Date();

        alert(mensajeFechaLimite(reserva, 'cancelacion'));
        // 2. Confirmación al usuario
        if (!window.confirm("¿Estás seguro de cancelar esta reserva?")) return;

        // 3. Llamada al backend
        try {
            const response = await fetch(`/api/reserva/cambiar_estado/${idReserva}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ accion: 'cancelar' })
            });
            const data = await response.json();
            if (data.ok) {
                alert(`Reserva cancelada correctamente. Nuevo estado: ${data.nuevo_estado}`);
                cargarReservas();
            } else {
                alert(`No se pudo cancelar: ${data.mensaje || 'Error'}`);
            }
        } catch (error) {
            alert("Error al intentar comunicarse con el servidor para cancelar la reserva.");
            console.error("Error de cancelación:", error);
        }
    };

    // ------------------------------------------------------------
    // ============================
    // PAGAR RESERVA
    // ============================
    // ------------------------------------------------------------
    window.pagarReserva = (idReserva) => {
        const reserva = reservasGlobal.find(r => r.idReserva == idReserva);

        if (!reserva) {
            alert("Reserva no encontrada");
            return;
        }

        // Muestra el mensaje con la fecha límite para el pago.
        alert(mensajeFechaLimite(reserva, 'pago'));

        sessionStorage.setItem('reservaPago', JSON.stringify({
            idReserva: reserva.idReserva,
        }));

        // Redirección a la página de pago
        window.location.href = '/cliente/pago';
    };


    // ============================
    // PESTAÑAS
    // ============================
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
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
    // INYECTAR MODAL DEL ARCHIVO
    // ============================
    if (!document.getElementById('modalArchivo')) {
        const modalHtml = `
            <div id="modalArchivo" class="modal" style="display: none; position: fixed; z-index: 1; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgba(0,0,0,0.4);">
                <div class="modal-content" style="background-color: #fefefe; margin: 15% auto; padding: 20px; border: 1px solid #888; width: 80%;">
                    <div class="modal-header">
                        <span class="close" id="cerrarModalArchivo" style="color: #aaa; float: right; font-size: 28px; font-weight: bold;">&times;</span>
                        <h2 id="modal-archivo-title">Documento Adjunto</h2>
                    </div>
                    <div id="modal-archivo-body" class="modal-body" style="padding: 2px 16px;">
                        <p>Contenido del archivo.</p>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // iniciar
    cargarReservas();
});