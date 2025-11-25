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


    function mensajeLimite(tipo, fechaBase) {
        if (!configActos) return "No se encontró configuración de límites.";

        const unidad = configActos.unidadTiempoAcciones;
        let horasLimite = 0;

        switch (tipo) {
            case "aprobarRequisitos":
                horasLimite = configActos.tiempoAprobacionRequisitos;
                break;
            case "cambiarDocumento":
                horasLimite = configActos.tiempoCambioDocumentos;
                break;
            case "cancelar":
                horasLimite = configActos.tiempoMaxCancelacion;
                break;
            case "pagar":
                horasLimite = configActos.tiempoMaxPago;
                break;
            case "reprogramar":
                horasLimite = configActos.tiempoMaxReprogramacion;
                break;
            default:
                return "Acción fuera de tiempo permitido.";
        }

        const fecha = new Date(fechaBase);
        fecha.setHours(fecha.getHours() + horasLimite);

        const fechaStr = fecha.toLocaleString("es-PE", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });

        return `Solo puedes realizar esta acción hasta el ${fechaStr} (límite de ${horasLimite} ${unidad}).`;
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
        if (rolUsuario === 'secretaria') endpoint = `/api/reserva/secretaria/${idUsuarioSesion}`;
        else if (rolUsuario === 'feligres') endpoint = `/api/reserva/feligres/${idUsuarioSesion}`;
        else { console.error("Rol desconocido:", rolUsuario); return; }

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

        // Referencias a tablas
        const tablaConfirmadas = document.querySelector('#tabla-confirmadas tbody');
        const tablaPendientes = document.querySelector('#tabla-pendientes tbody');
        const tablaCanceladas = document.querySelector('#tabla-canceladas tbody');

        tablaPendientes.innerHTML = '';
        tablaConfirmadas.innerHTML = '';
        tablaCanceladas.innerHTML = '';

        reservasGlobal.forEach(dato => {
            const estado = (dato.estadoReserva || '').toUpperCase();
            const fila = document.createElement('tr');
            let accionesHTML = `<button class="btn-accion ver" onclick="verReserva(${dato.idReserva})">Ver</button>`;

            if (rolUsuario === 'secretaria') {
                // Tab Pendiente -> solo reservas PENDIENTE_REVISION
                if (estado === 'PENDIENTE_REVISION') {
                    accionesHTML += `
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
                    if (estado.includes('PENDIENTE_DOCUMENTO')) accionesHTML += `
                        <button class="btn-accion subir" onclick="subirDocumentos(${dato.idReserva})">Subir Documentos</button>
                        <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                    else if (estado.includes('PENDIENTE_REVISION')) accionesHTML += `
                        <button class="btn-accion modificar" onclick="modificarDocumentos(${dato.idReserva})">Modificar Documentos</button>
                        <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
                    else if (estado.includes('PENDIENTE_PAGO')) accionesHTML += `
                        <button class="btn-accion pagar" onclick="pagarReserva(${dato.idReserva})">Pagar</button>
                        <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;

                    fila.innerHTML = `
                        <td>${dato.nombreActo}</td>
                        <td>${dato.fecha || 'N/A'}</td>
                        <td>${dato.hora || 'N/A'}</td>
                        <td>${dato.nombreParroquia}</td>
                        <td>${dato.estadoReserva || 'N/A'}</td>
                        <td>${accionesHTML}</td>
                    `;
                    tablaPendientes.appendChild(fila);
                }
            }

            // Confirmadas
            if (estado.includes('CONFIRMADO')) {
                accionesHTML += `
                    <button class="btn-accion reprogramar" onclick="reprogramarReserva(${dato.idReserva})">Reprogramar</button>
                    <button class="btn-accion cancelar" onclick="cancelarReserva(${dato.idReserva})">Cancelar</button>`;
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
        });

        // Placeholder si no hay filas
        const placeholderColspan = rolUsuario === 'secretaria' ? 7 : 6;
        if (!tablaPendientes.rows.length) tablaPendientes.innerHTML = `<tr><td colspan="${placeholderColspan}" class="placeholder">No hay reservas pendientes</td></tr>`;
        if (!tablaConfirmadas.rows.length) tablaConfirmadas.innerHTML = `<tr><td colspan="${placeholderColspan}" class="placeholder">No hay reservas confirmadas</td></tr>`;
        if (!tablaCanceladas.rows.length) tablaCanceladas.innerHTML = `<tr><td colspan="${placeholderColspan}" class="placeholder">No hay reservas canceladas</td></tr>`;

    } catch (error) {
        console.error('❌ Fallo al obtener datos de la reserva', error);
    }
}


    async function uploadFileToServer(file, idDocumento, idReserva, idActoRequisito, estadoCumplimiento = 'CUMPLIDO') {
        try {
            if (!idDocumento) return { ok: false, mensaje: "Falta idDocumento" };
            if (!idReserva) return { ok: false, mensaje: "Falta idReserva" };
su
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

// ============================
// DESCARGAR ARCHIVO
// ============================
window.descargarArchivo = async function (idDocumento) {
    try {
        const response = await fetch(`/api/requisito/archivo/${idDocumento}`);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        // Recibe el archivo en binario
        const blob = await response.blob();
        const contentDisposition = response.headers.get("Content-Disposition");
        let nombreArchivo = "documento.pdf";

        // Obtiene un nombre si viene del backend
        if (contentDisposition) {
            const match = contentDisposition.match(/filename="?(.+)"?/);
            if (match) nombreArchivo = match[1];
        }

        // Crea descarga
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = nombreArchivo;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

    } catch (error) {
        console.error("❌ Error al descargar archivo:", error);
        alert("Error al descargar el archivo.");
    }
};


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

    const config = reserva?.configActo || {};
    const tiempoLimite = config?.tiempoCambioDocumentos;
    const unidad = config?.unidadTiempoAcciones || 'horas';

    if (reserva) alert(mensajeLimite(reserva, 'documento'));

    try {
        const response = await fetch(`/api/requisito/obtener_documento_faltante/${idReserva}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (!data.success || !Array.isArray(data.datos) || data.datos.length === 0) {
            modalBody.innerHTML = "<p>No hay documentos pendientes por subir.</p>";
            
            // ✅ Mostrar observación si existe
            if (reserva?.observacion) {
                modalBody.innerHTML += `<p style="margin-top:12px; font-style:italic; color:#555;"><strong>Observación:</strong> ${reserva.observacion}</p>`;
            }

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

        // ✅ Agregar observación debajo de la lista si existe
        if (reserva?.observacion) {
            html += `<p style="margin-top:12px; font-style:italic; color:#555;"><strong>Observación:</strong> ${reserva.observacion}</p>`;
        }

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

    // ❗ CORREGIDO: Eliminado configActo global inexistente
    const config = reserva?.configActo || {};
    const tiempoLimite = config?.tiempoCambioDocumentos;
    const unidad = config?.unidadTiempoAcciones || 'horas';

    if (reserva) alert(mensajeLimite(reserva, 'documento'));

    try {
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
                    <p><strong>${doc.nombRequisito || 'Requisito'}</strong> 
                        ${vigencia ? `<small>(vigencia: ${vigencia})</small>` : ''}
                    </p>

                    <a href="javascript:void(0);" onclick="descargarArchivo(${doc.idDocumento})">
                        Descargar archivo
                    </a>

                    <input type="file" 
                        id="file_mod_${idx}" 
                        data-id-documento="${doc.idDocumento}" 
                        data-id-acto-requisito="${idActo}" 
                        accept="application/pdf,image/*">

                    <button class="btn-accion btn-actualizar-item" data-idx="${idx}" style="margin-left:8px;">
                        Actualizar
                    </button>

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
        alert(mensajeLimite(reserva, 'cancelacion'));

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
        alert(mensajeLimite(reserva, 'pago'));

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


    cargarReservas();
});
