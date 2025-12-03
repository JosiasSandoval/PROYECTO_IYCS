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
        const reservaActual = reservasGlobal.find(r => r.idReserva == idReserva);
        if (!reservaActual) {
            alert("Reserva no encontrada");
            return;
        }

        // Mostrar mensaje de fecha límite al presionar el botón
        const mensajeLimite = await obtenerMensajeLimite(reservaActual, 'cambiarDocumento');
        if (mensajeLimite) {
            alert(mensajeLimite);
        }
    const modal = document.getElementById("modalReserva");
    const modalBody = document.getElementById("modal-body");
    const modalTitle = document.getElementById("modal-title");
    const modalFooter = document.getElementById("modal-footer");

    modalTitle.textContent = "Subir Documentos Pendientes";
    modalBody.innerHTML = "<p>Cargando requisitos...</p>";
    modalFooter.innerHTML = "";
    modal.style.display = "block";

    if (!reservaActual) {
        modalBody.innerHTML = "<p>Error: Reserva no encontrada.</p>";
        modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
        document.getElementById("cerrarModalBtn").onclick = cerrarModal;
        return;
    }

    try {
        const response = await fetch(`/api/requisito/obtener_documento_faltante/${idReserva}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        // Filtrar solo documentos con estado NO_CUMPLIDO
        const documentosFaltantes = (data.datos || []).filter(doc => 
            doc.estadoCumplimiento === 'NO_CUMPLIDO' || 
            !doc.estadoCumplimiento || 
            doc.estadoCumplimiento === 'SIN_ESTADO_DEFINIDO'
        );

        if (documentosFaltantes.length === 0) {
            modalBody.innerHTML = "<p>No hay documentos pendientes por subir.</p>";
            
            if (reservaActual?.observacion) {
                modalBody.innerHTML += `<p style="margin-top:12px; font-style:italic; color:#555;"><strong>Observación:</strong> ${reservaActual.observacion}</p>`;
            }

            modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
            document.getElementById("cerrarModalBtn").onclick = cerrarModal;
            return;
        }

        let html = `<div class="lista-requisitos">`;
        documentosFaltantes.forEach((req, idx) => {
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

        if (reservaActual?.observacion) {
            html += `<p style="margin-top:12px; font-style:italic; color:#555;"><strong>Observación:</strong> ${reservaActual.observacion}</p>`;
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
                    statusEl.textContent = '⚠ Seleccione un archivo primero.';
                    statusEl.style.color = '#e74c3c';
                    return;
                }

                const file = input.files[0];
                const idDocumento = input.dataset.idDocumento;
                const idActoRequisito = input.dataset.idActoRequisito;

                statusEl.textContent = 'Subiendo...';
                statusEl.style.color = '#3498db';
                btn.disabled = true;

                try {
                    // Actualizar documento existente: solo rutaArchivo, tipoArchivo y estadoCumplimiento
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('idReserva', idReserva);
                    formData.append('idActoRequisito', idActoRequisito);
                    formData.append('estadoCumplimiento', 'CUMPLIDO');

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
                        statusEl.textContent = '✔ Subido correctamente';
                        statusEl.style.color = '#27ae60';
                        input.remove();
                        btn.remove();

                        // Verificar si quedan más documentos por subir
                        const remainingFiles = document.querySelectorAll('input[type="file"]');
                        if (remainingFiles.length === 0) {
                            // Verificar que todos los documentos estén CUMPLIDO antes de cambiar estado
                            // El backend ya verifica esto, pero hacemos una verificación adicional aquí
                            const resVerificar = await fetch(`/api/requisito/obtener_documento_faltante/${idReserva}`);
                            if (resVerificar.ok) {
                                const dataVerificar = await resVerificar.json();
                                const documentosFaltantes = dataVerificar.datos || [];
                                
                                // Si no hay documentos faltantes, cambiar estado a PENDIENTE_REVISION
                                if (documentosFaltantes.length === 0) {
                                    // Esperar un momento para que el backend actualice el estadoCumplimiento
                                    await new Promise(resolve => setTimeout(resolve, 500));
                                    
                                    const estadoCambiado = await cambiarEstadoReservaAPendienteRevision(idReserva);
                                    if (estadoCambiado) {
                                        // Mostrar alert cuando se sube el último documento
                                        alert('✔ Todos los documentos subidos correctamente. El estado de la reserva ha sido actualizado a PENDIENTE_REVISION.');
                                        cerrarModal();
                                        cargarReservas();
                                    } else {
                                        alert('⚠ Documentos subidos pero error al actualizar estado');
                                    }
                                } else {
                                    statusEl.textContent = `⚠ Aún hay ${documentosFaltantes.length} documento(s) pendiente(s)`;
                                    statusEl.style.color = '#f39c12';
                                }
                            } else {
                                // Si no se puede verificar, intentar cambiar estado de todas formas
                                // El backend verificará que todos estén CUMPLIDO
                                await new Promise(resolve => setTimeout(resolve, 500));
                                const estadoCambiado = await cambiarEstadoReservaAPendienteRevision(idReserva);
                                if (estadoCambiado) {
                                    // Mostrar alert cuando se sube el último documento
                                    alert('✔ Todos los documentos subidos correctamente. El estado de la reserva ha sido actualizado a PENDIENTE_REVISION.');
                                    cerrarModal();
                                    cargarReservas();
                                }
                            }
                        }
                    } else {
                        statusEl.textContent = `❌ Error: ${result.mensaje || 'Desconocido'}`;
                        statusEl.style.color = '#e74c3c';
                        btn.disabled = false;
                    }
                } catch (err) {
                    console.error('Error al subir documento:', err);
                    statusEl.textContent = `❌ Error al subir archivo`;
                    statusEl.style.color = '#e74c3c';
                    btn.disabled = false;
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
    const reservaModificar = reservasGlobal.find(r => r.idReserva == idReserva);
    if (!reservaModificar) {
        alert("Reserva no encontrada");
        return;
    }

    // Mostrar mensaje de fecha límite al presionar el botón
    const mensajeLimiteModificar = await obtenerMensajeLimite(reservaModificar, 'cambiarDocumento');
    if (mensajeLimiteModificar) {
        alert(mensajeLimiteModificar);
    }

    const modalModificar = document.getElementById("modalReserva");
    const modalBodyModificar = document.getElementById("modal-body");
    const modalTitleModificar = document.getElementById("modal-title");
    const modalFooterModificar = document.getElementById("modal-footer");

    modalTitleModificar.textContent = "Modificar Documentos";
    modalBodyModificar.innerHTML = "<p>Cargando documentos...</p>";
    modalFooterModificar.innerHTML = "";
    modalModificar.style.display = "block";

    try {
        const response = await fetch(`/api/requisito/obtener_documentos_reserva/${idReserva}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();

        if (!data.success || !Array.isArray(data.datos) || data.datos.length === 0) {
            modalBodyModificar.innerHTML = "<p>No hay documentos para modificar.</p>";
            modalFooterModificar.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
            document.getElementById("cerrarModalBtn").onclick = cerrarModal;
            return;
        }

        let html = `<div class="lista-requisitos">`;
        data.datos.forEach((doc, idx) => {
            const idActo = doc.idActoRequisito || '';
            const vigencia = doc.vigencia || doc.vigenciaDocumento || doc.vigencia_documento || null;
            const rutaArchivo = doc.rutaArchivo || '';

            html += `
                <div class="req-item" data-id-documento="${doc.idDocumento}" data-id-acto-requisito="${idActo}">
                    <p><strong>${doc.nombRequisito || 'Requisito'}</strong> 
                        ${vigencia ? `<small>(vigencia: ${vigencia})</small>` : ''}
                    </p>

                    ${rutaArchivo ? `
                        <a href="javascript:void(0);" onclick="descargarArchivo(${doc.idDocumento})" style="display:inline-block; margin-bottom:8px;">
                            📥 Descargar archivo actual
                        </a>
                    ` : '<p style="color:#999; font-size:0.9rem;">No hay archivo actual</p>'}

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
        modalBodyModificar.innerHTML = html;

        modalFooterModificar.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
        document.getElementById("cerrarModalBtn").onclick = cerrarModal;

        document.querySelectorAll('.btn-actualizar-item').forEach(btn => {
            btn.addEventListener('click', async () => {
                const idx = btn.dataset.idx;
                const input = document.getElementById(`file_mod_${idx}`);
                const statusEl = document.getElementById(`status_mod_${idx}`);
                statusEl.textContent = '';

                if (!input || !input.files || input.files.length === 0) {
                    statusEl.textContent = '⚠ Seleccione un archivo primero.';
                    statusEl.style.color = '#e74c3c';
                    return;
                }

                const file = input.files[0];
                const idDocumento = input.dataset.idDocumento;
                const idActoRequisito = input.dataset.idActoRequisito || null;

                statusEl.textContent = 'Subiendo...';
                statusEl.style.color = '#3498db';
                btn.disabled = true;

                try {
                    // Solo actualizar rutaArchivo y tipoArchivo
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
                        statusEl.textContent = '✔ Archivo actualizado correctamente';
                        statusEl.style.color = '#27ae60';
                        input.value = ''; // Limpiar input pero no removerlo
                        setTimeout(() => {
                            statusEl.textContent = '';
                        }, 2000);
                    } else {
                        statusEl.textContent = `❌ Error: ${result.mensaje || 'No se pudo actualizar'}`;
                        statusEl.style.color = '#e74c3c';
                    }

                } catch (err) {
                    console.error('Error al actualizar documento:', err);
                    statusEl.textContent = '❌ Error al subir archivo';
                    statusEl.style.color = '#e74c3c';
                } finally {
                    btn.disabled = false;
                }
            });
        });

    } catch (e) {
        console.error(e);
        modalBody.innerHTML = "<p>Error al cargar documentos.</p>";
        modalFooter.innerHTML = `<button class="btn-accion cancelar" id="cerrarModalBtn">Cerrar</button>`;
        document.getElementById("cerrarModalBtn").onclick = cerrarModal;
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
