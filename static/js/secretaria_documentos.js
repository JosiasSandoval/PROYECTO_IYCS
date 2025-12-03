// ============================================================
// SECRETARIA DOCUMENTOS - Gestión de Documentos Físicos
// ============================================================

let reservaSeleccionada = null;
let requisitosActo = [];
let documentosRegistrados = [];
let paginaActual = 1;
const requisitosPorPagina = 8;

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const bodyElement = document.body;
    const rolUsuario = bodyElement.dataset.rol?.toLowerCase();
    const idUsuarioSesion = bodyElement.dataset.id;

    if (!idUsuarioSesion || rolUsuario !== 'secretaria') {
        window.location.href = '/principal';
        return;
    }

    configurarBuscador();
    configurarEventos();
});

// ============================================================
// CONFIGURAR BUSCADOR
// ============================================================
function configurarBuscador() {
    const btnBuscar = document.getElementById('btn_buscar');
    const inputBusqueda = document.getElementById('inputBusqueda');
    
    btnBuscar?.addEventListener('click', realizarBusqueda);
    
    inputBusqueda?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            realizarBusqueda();
        }
    });
}

// ============================================================
// BUSCAR RESERVAS
// ============================================================
async function realizarBusqueda() {
    const termino = document.getElementById('inputBusqueda').value.trim();
    
    if (!termino) {
        alert('Por favor ingrese un término de búsqueda');
        return;
    }
    
    try {
        const response = await fetch(`/api/documento_requisito/buscar?termino=${encodeURIComponent(termino)}`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success && data.datos && data.datos.length > 0) {
            mostrarResultadosBusqueda(data.datos);
        } else {
            alert('No se encontraron reservas con ese criterio');
            ocultarResultadosBusqueda();
        }
    } catch (error) {
        console.error('Error al buscar:', error);
        alert('Error al realizar la búsqueda: ' + error.message);
    }
}

// ============================================================
// MOSTRAR RESULTADOS DE BÚSQUEDA
// ============================================================
function mostrarResultadosBusqueda(reservas) {
    const container = document.getElementById('lista-reservas');
    const seccionResultados = document.getElementById('resultados-busqueda');
    
    container.innerHTML = '';
    
    reservas.forEach(reserva => {
        const card = document.createElement('div');
        card.className = 'reserva-card';
        card.onclick = () => seleccionarReserva(reserva);
        
        const badgeEstadoReserva = getBadgeClass(reserva.estadoReserva);
        
        const nombreCompleto = `${reserva.nombreSolicitante || ''} ${reserva.apellidoSolicitante || ''} ${reserva.apellidoMaternoSolicitante || ''}`.trim();
        
        card.innerHTML = `
            <div class="reserva-card-header">
                <h4>Reserva #${reserva.idReserva}</h4>
                <span class="badge ${badgeEstadoReserva}">${reserva.estadoReserva || 'N/A'}</span>
            </div>
            <div class="reserva-card-body">
                <p><strong>Solicitante:</strong> ${nombreCompleto || 'N/A'}</p>
                <p><strong>Acto:</strong> ${reserva.nombreActo || 'N/A'}</p>
                <p><strong>Fecha:</strong> ${formatearFecha(reserva.fecha)} ${reserva.hora || ''}</p>
                <p><strong>Parroquia:</strong> ${reserva.nombreParroquia || 'N/A'}</p>
                <p><strong>Documentos:</strong> ${reserva.documentosAprobados || 0}/${reserva.totalDocumentosRegistrados || 0} aprobados</p>
            </div>
        `;
        
        container.appendChild(card);
    });
    
    seccionResultados.style.display = 'block';
    ocultarDetalleReserva();
}

function ocultarResultadosBusqueda() {
    document.getElementById('resultados-busqueda').style.display = 'none';
}

// ============================================================
// SELECCIONAR RESERVA Y CARGAR REQUISITOS
// ============================================================
async function seleccionarReserva(reserva) {
    reservaSeleccionada = reserva;
    
    const nombreCompleto = `${reserva.nombreSolicitante || ''} ${reserva.apellidoSolicitante || ''} ${reserva.apellidoMaternoSolicitante || ''}`.trim();
    
    // Mostrar información de la reserva
    document.getElementById('info-num-reserva').textContent = reserva.idReserva;
    document.getElementById('info-solicitante').textContent = nombreCompleto || 'N/A';
    document.getElementById('info-acto').textContent = reserva.nombreActo || 'N/A';
    document.getElementById('info-fecha-acto').textContent = `${formatearFecha(reserva.fecha)} ${reserva.hora || ''}`;
    
    // Calcular fecha límite (7 días antes del acto)
    const fechaActo = new Date(reserva.fecha);
    const fechaLimite = new Date(fechaActo);
    fechaLimite.setDate(fechaLimite.getDate() - 7);
    document.getElementById('info-fecha-limite').textContent = formatearFecha(fechaLimite);
    
    const badgeEstadoReserva = getBadgeClass(reserva.estadoReserva);
    
    const elementoReserva = document.getElementById('info-estado-reserva');
    elementoReserva.textContent = reserva.estadoReserva || 'N/A';
    elementoReserva.className = `value badge ${badgeEstadoReserva}`;
    
    // Cargar requisitos y documentos
    await cargarRequisitosYDocumentos(reserva.idReserva, reserva.idActo);
    
    // Mostrar sección de detalle
    document.getElementById('detalle-reserva').style.display = 'block';
    ocultarResultadosBusqueda();
}

function ocultarDetalleReserva() {
    document.getElementById('detalle-reserva').style.display = 'none';
}

// ============================================================
// CARGAR DOCUMENTOS Y REQUISITOS
// ============================================================
async function cargarRequisitosYDocumentos(idReserva, idActo) {
    try {
        // Resetear paginación al cargar nueva reserva
        paginaActual = 1;
        
        // Cargar requisitos del acto si existe idActo
        if (idActo) {
            const responseRequisitos = await fetch(`/api/documento_requisito/requisitos/${idActo}`);
            const dataRequisitos = await responseRequisitos.json();
            requisitosActo = dataRequisitos.success ? dataRequisitos.datos : [];
        } else {
            requisitosActo = [];
        }
        
        // Cargar documentos registrados
        const responseDocumentos = await fetch(`/api/documento_requisito/listar/${idReserva}`);
        const dataDocumentos = await responseDocumentos.json();
        documentosRegistrados = dataDocumentos.success ? dataDocumentos.datos : [];
        
        // Renderizar lista combinada
        renderizarListaRequisitos();
        
    } catch (error) {
        console.error('Error al cargar documentos y requisitos:', error);
        alert('Error al cargar los datos');
    }
}

// ============================================================
// RENDERIZAR LISTA DE REQUISITOS CON PAGINACIÓN
// ============================================================
function renderizarListaRequisitos() {
    const container = document.getElementById('lista-requisitos');
    if (!container) return;
    
    // Limpiar contenedor completamente
    container.innerHTML = '';
    
    // Mostrar alerta de fecha límite si aplica
    if (reservaSeleccionada && reservaSeleccionada.fecha) {
        const fechaActo = new Date(reservaSeleccionada.fecha);
        const fechaLimite = new Date(fechaActo);
        fechaLimite.setDate(fechaLimite.getDate() - 7);
        const hoy = new Date();
        
        if (hoy > fechaLimite) {
            const alertaHTML = `
                <div class="fecha-limite-alerta">
                    <div class="icono">⚠️</div>
                    <div class="texto">
                        <strong>FECHA LÍMITE VENCIDA</strong>
                        <span>Los documentos debían presentarse antes del ${formatearFecha(fechaLimite)}</span>
                    </div>
                </div>
            `;
            container.innerHTML = alertaHTML;
        }
    }
    
    if (requisitosActo.length === 0) {
        container.innerHTML += '<p class="text-muted">No hay requisitos configurados para este acto.</p>';
        return;
    }
    
    // Preparar array de requisitos con su estado
    const requisitosConEstado = requisitosActo.map(requisito => {
        // Buscar todos los documentos de este requisito (puede haber rechazados antiguos)
        const docsRequisito = documentosRegistrados.filter(
            d => d.idActoRequisito === requisito.idActoRequisito
        );
        
        // Buscar el documento más reciente que NO esté rechazado
        let docActivo = docsRequisito.find(d => d.estadoCumplimiento !== 'NO_CUMPLIDO');
        
        // Si no hay documento activo, buscar el último rechazado para mostrar la observación
        let ultimoRechazado = null;
        if (!docActivo) {
            ultimoRechazado = docsRequisito
                .filter(d => d.estadoCumplimiento === 'NO_CUMPLIDO')
                .sort((a, b) => new Date(b.f_subido) - new Date(a.f_subido))[0];
        }
        
        return {
            requisito,
            docActivo,
            ultimoRechazado
        };
    });
    
    // Paginación
    const totalRequisitos = requisitosConEstado.length;
    const totalPaginas = Math.ceil(totalRequisitos / requisitosPorPagina);
    const inicio = (paginaActual - 1) * requisitosPorPagina;
    const fin = inicio + requisitosPorPagina;
    const requisitosPagina = requisitosConEstado.slice(inicio, fin);
    
    let html = '';
    
    // Renderizar requisitos de la página actual
    requisitosPagina.forEach(({ requisito, docActivo, ultimoRechazado }) => {
        const estadoCumplimiento = docActivo ? docActivo.estadoCumplimiento : 'NO_REGISTRADO';
        const aprobado = docActivo ? docActivo.aprobado : 0;
        const observacion = docActivo ? (docActivo.observacion || '') : '';
        const fechaRecepcion = docActivo && docActivo.f_subido ? formatearFecha(docActivo.f_subido) : null;
        
        let claseItem = 'requisito-item';
        if (estadoCumplimiento === 'CUMPLIDO') claseItem += ' documento-recibido';
        if (estadoCumplimiento === 'NO_CUMPLIDO') claseItem += ' documento-rechazado';
        
        html += `
            <div class="${claseItem}">
                <div class="requisito-header">
                    <div class="requisito-info">
                        <h5>${requisito.nombreRequisito || 'Requisito'}</h5>
                        ${requisito.descripcion ? `<p class="text-muted">${requisito.descripcion}</p>` : ''}
                    </div>
                    ${estadoCumplimiento === 'CUMPLIDO' ? 
                        '<span class="documento-estado estado-recibido">✓ APROBADO</span>' :
                        estadoCumplimiento === 'PENDIENTE' ?
                        '<span class="documento-estado estado-recibido">⏳ RECIBIDO - PENDIENTE REVISIÓN</span>' :
                        '<span class="documento-estado estado-pendiente">○ PENDIENTE ENTREGA</span>'
                    }
                </div>
                
                ${fechaRecepcion ? `
                    <div style="font-size: 13px; color: #7f8c8d; margin: 10px 0;">
                        📅 Recibido el: ${fechaRecepcion}
                    </div>
                ` : ''}
                
                ${ultimoRechazado ? `
                    <div class="documento-registrado-info" style="background-color: #fadbd8; border-left-color: #e74c3c; margin-bottom: 10px;">
                        <p style="margin: 0; color: #721c24; font-weight: bold;">
                            ⚠️ DOCUMENTO ANTERIOR RECHAZADO
                        </p>
                        <p style="margin: 5px 0 0 0; color: #721c24;">
                            <strong>Motivo:</strong> ${ultimoRechazado.observacion || 'No especificado'}
                        </p>
                        <p style="margin: 5px 0 0 0; color: #856404; font-size: 12px;">
                            💡 El feligrés debe entregar un nuevo documento
                        </p>
                    </div>
                ` : ''}
                
                ${observacion && estadoCumplimiento !== 'CUMPLIDO' ? `
                    <div class="documento-registrado-info" style="background-color: #fff3cd; border-left-color: #ffc107;">
                        <p><strong>📝 Nota:</strong> ${observacion}</p>
                    </div>
                ` : ''}
                
                <div class="requisito-acciones">
                    ${!docActivo || estadoCumplimiento === 'NO_REGISTRADO' ? `
                        <!-- Checkbox para marcar como recibido -->
                        <div class="documento-control">
                            <div class="checkbox-wrapper">
                                <input type="checkbox" 
                                       id="check_${requisito.idActoRequisito}" 
                                       onchange="marcarDocumentoRecibido(${requisito.idActoRequisito}, this.checked)">
                                <label for="check_${requisito.idActoRequisito}">
                                    📥 Marcar como Recibido
                                </label>
                            </div>
                        </div>
                    ` : estadoCumplimiento === 'PENDIENTE' ? `
                        <!-- Documento recibido, ahora aprobar o rechazar -->
                        <div class="documento-control">
                            <button class="btn btn-success btn-sm" onclick="aprobarDocumentoDirecto(${docActivo.idDocumentoRequisito})">
                                ✅ Aprobar Documento
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="mostrarCampoRechazo(${docActivo.idDocumentoRequisito})">
                                ❌ Rechazar Documento
                            </button>
                        </div>
                        <div class="observacion-wrapper" id="obs_${docActivo.idDocumentoRequisito}">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #e74c3c;">
                                Motivo del Rechazo (el feligrés verá este mensaje):
                            </label>
                            <textarea placeholder="Ej: El documento está borroso, falta firma, documento vencido, etc." 
                                      id="textarea_${docActivo.idDocumentoRequisito}"></textarea>
                            <div style="margin-top: 10px;">
                                <button class="btn btn-danger btn-sm" onclick="confirmarRechazo(${docActivo.idDocumentoRequisito})">
                                    Confirmar Rechazo
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="cancelarRechazo(${docActivo.idDocumentoRequisito})">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ` : estadoCumplimiento === 'CUMPLIDO' ? `
                        <div style="color: #27ae60; font-weight: 600; padding: 10px; background-color: #e8f8f5; border-radius: 6px;">
                            ✓ Documento aprobado correctamente
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    // Agregar el HTML de los requisitos
    container.innerHTML += html;
    
    // Agregar controles de paginación si hay más de una página
    if (totalPaginas > 1) {
        let paginacionHTML = '<div class="paginacion-requisitos">';
        
        // Botón anterior
        if (paginaActual > 1) {
            paginacionHTML += `<button class="btn btn-secondary btn-sm" onclick="cambiarPagina(${paginaActual - 1})">« Anterior</button>`;
        }
        
        // Números de página
        paginacionHTML += '<span class="info-pagina">Página ' + paginaActual + ' de ' + totalPaginas + '</span>';
        
        // Botón siguiente
        if (paginaActual < totalPaginas) {
            paginacionHTML += `<button class="btn btn-secondary btn-sm" onclick="cambiarPagina(${paginaActual + 1})">Siguiente »</button>`;
        }
        
        paginacionHTML += '</div>';
        container.innerHTML += paginacionHTML;
    }
    
    // Asegurar que los event listeners estén configurados después de renderizar
    configurarEventosDocumentos();
}

// ============================================================
// CAMBIAR PÁGINA DE REQUISITOS
// ============================================================
function cambiarPagina(nuevaPagina) {
    paginaActual = nuevaPagina;
    renderizarListaRequisitos();
    
    // Scroll al inicio de la lista de requisitos
    document.getElementById('lista-requisitos').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// MARCAR DOCUMENTO COMO RECIBIDO (SOLO RECEPCIÓN)
// ============================================================
async function marcarDocumentoRecibido(idActoRequisito, checked) {
    if (!checked || !reservaSeleccionada) return;
    
    if (!confirm('¿Confirma que recibió este documento físicamente?')) {
        // Desmarcar el checkbox
        document.getElementById(`check_${idActoRequisito}`).checked = false;
        return;
    }
    
    try {
        // Solo registrar el documento como recibido (NO aprobar)
        const response = await fetch('/api/documento_requisito/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idReserva: reservaSeleccionada.idReserva,
                idActoRequisito: idActoRequisito,
                observacion: 'Documento físico recibido'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Documento registrado como RECIBIDO. Ahora debe aprobarlo o rechazarlo.');
            await cargarRequisitosYDocumentos(reservaSeleccionada.idReserva, reservaSeleccionada.idActo);
        } else {
            alert('❌ Error al registrar documento: ' + (data.mensaje || 'Error desconocido'));
            // Desmarcar el checkbox
            document.getElementById(`check_${idActoRequisito}`).checked = false;
        }
        
    } catch (error) {
        console.error('Error al marcar documento:', error);
        alert('Error al procesar el documento');
        // Desmarcar el checkbox
        document.getElementById(`check_${idActoRequisito}`).checked = false;
    }
}

// ============================================================
// APROBAR DOCUMENTO DIRECTAMENTE
// ============================================================
async function aprobarDocumentoDirecto(idDocumentoRequisito) {
    if (!confirm('¿Está seguro de aprobar este documento?')) return;
    
    try {
        const response = await fetch('/api/documento_requisito/aprobar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idDocumentoRequisito: idDocumentoRequisito,
                observacion: 'Aprobado'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Mostrar mensaje según si se confirmó la reserva
            if (data.estadoReserva === 'CONFIRMADO') {
                alert('✅ ' + (data.mensaje || 'Documento aprobado. ¡Todos los documentos han sido aprobados! La reserva ha sido CONFIRMADA.'));
            } else {
                alert('✅ Documento aprobado exitosamente');
            }
            
            // Recargar requisitos y documentos para actualizar la vista
            await cargarRequisitosYDocumentos(reservaSeleccionada.idReserva, reservaSeleccionada.idActo);
            
            // Recargar información completa de la reserva para obtener el estado actualizado
            if (reservaSeleccionada && reservaSeleccionada.idReserva) {
                await recargarInformacionReserva(reservaSeleccionada.idReserva);
            }
            
            // Actualizar el estado de la reserva en la información mostrada
            // Si el backend retornó el estado, usarlo; si no, usar el de la reserva recargada
            const estadoFinal = data.estadoReserva || (reservaSeleccionada ? reservaSeleccionada.estadoReserva : null);
            if (estadoFinal) {
                if (reservaSeleccionada) {
                    reservaSeleccionada.estadoReserva = estadoFinal;
                }
                actualizarEstadoReservaEnUI(estadoFinal);
            }
        } else {
            alert('❌ Error: ' + (data.mensaje || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('Error al aprobar documento:', error);
        alert('Error al aprobar el documento');
    }
}

// ============================================================
// RECARGAR INFORMACIÓN COMPLETA DE LA RESERVA
// ============================================================
async function recargarInformacionReserva(idReserva) {
    try {
        // Buscar la reserva por su ID para obtener la información actualizada
        const response = await fetch(`/api/documento_requisito/buscar?termino=${idReserva}`);
        const data = await response.json();
        
        if (data.success && data.datos && data.datos.length > 0) {
            // Encontrar la reserva correcta (puede haber múltiples resultados, buscar por ID exacto)
            const reservaActualizada = data.datos.find(r => r.idReserva == idReserva);
            
            if (reservaActualizada) {
                // Actualizar el objeto reservaSeleccionada con la información nueva
                reservaSeleccionada = {
                    ...reservaSeleccionada,
                    ...reservaActualizada
                };
                
                // Actualizar la UI con el nuevo estado
                actualizarEstadoReservaEnUI(reservaActualizada.estadoReserva);
                
                // Actualizar también la información mostrada en el detalle
                const nombreCompleto = `${reservaActualizada.nombreSolicitante || ''} ${reservaActualizada.apellidoSolicitante || ''} ${reservaActualizada.apellidoMaternoSolicitante || ''}`.trim();
                if (document.getElementById('info-solicitante')) {
                    document.getElementById('info-solicitante').textContent = nombreCompleto || 'N/A';
                }
                if (document.getElementById('info-acto')) {
                    document.getElementById('info-acto').textContent = reservaActualizada.nombreActo || 'N/A';
                }
                
                console.log('✅ Información de reserva recargada:', reservaActualizada.estadoReserva);
            } else {
                console.warn('⚠️ No se encontró la reserva actualizada en los resultados');
            }
        } else {
            console.warn('⚠️ No se pudo recargar la información de la reserva');
        }
    } catch (error) {
        console.error('Error al recargar información de reserva:', error);
    }
}

// ============================================================
// ACTUALIZAR ESTADO DE RESERVA EN LA UI
// ============================================================
function actualizarEstadoReservaEnUI(estadoReserva) {
    const elementoReserva = document.getElementById('info-estado-reserva');
    if (elementoReserva) {
        elementoReserva.textContent = estadoReserva || 'N/A';
        const badgeClass = getBadgeClass(estadoReserva);
        elementoReserva.className = `value badge ${badgeClass}`;
        console.log('✅ Estado de reserva actualizado en UI:', estadoReserva);
    }
}

// ============================================================
// MOSTRAR CAMPO DE RECHAZO
// ============================================================
function mostrarCampoRechazo(idDocumentoRequisito) {
    const wrapper = document.getElementById(`obs_${idDocumentoRequisito}`);
    if (wrapper) {
        wrapper.classList.add('visible');
        document.getElementById(`textarea_${idDocumentoRequisito}`).focus();
    }
}

// ============================================================
// CANCELAR RECHAZO
// ============================================================
function cancelarRechazo(idDocumentoRequisito) {
    const wrapper = document.getElementById(`obs_${idDocumentoRequisito}`);
    const textarea = document.getElementById(`textarea_${idDocumentoRequisito}`);
    
    if (wrapper) wrapper.classList.remove('visible');
    if (textarea) textarea.value = '';
}

// ============================================================
// CONFIRMAR RECHAZO CON OBSERVACIÓN
// ============================================================
async function confirmarRechazo(idDocumentoRequisito) {
    const observacion = document.getElementById(`textarea_${idDocumentoRequisito}`).value.trim();
    
    if (!observacion) {
        alert('⚠️ Debe especificar el motivo del rechazo');
        return;
    }
    
    if (!confirm('¿Está seguro de rechazar este documento? El feligrés verá esta observación.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/documento_requisito/rechazar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idDocumentoRequisito: idDocumentoRequisito,
                observacion: observacion
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('❌ Documento rechazado. El feligrés deberá entregar uno nuevo.');
            await cargarRequisitosYDocumentos(reservaSeleccionada.idReserva, reservaSeleccionada.idActo);
        } else {
            alert('❌ Error: ' + (data.mensaje || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('Error al rechazar documento:', error);
        alert('Error al rechazar el documento');
    }
}

// ============================================================
// REGISTRAR DOCUMENTO FÍSICO (función anterior simplificada)
// ============================================================
async function registrarDocumento(idActoRequisito) {
    if (!reservaSeleccionada) return;
    
    const observacion = prompt('Observación (opcional):');
    if (observacion === null) return; // Usuario canceló
    
    try {
        const response = await fetch('/api/documento_requisito/registrar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idReserva: reservaSeleccionada.idReserva,
                idActoRequisito: idActoRequisito,
                observacion: observacion || ''
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('✅ Documento registrado exitosamente');
            await cargarRequisitosYDocumentos(reservaSeleccionada.idReserva, reservaSeleccionada.idActo);
        } else {
            alert('❌ Error: ' + (data.mensaje || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('Error al registrar documento:', error);
        alert('Error al registrar el documento');
    }
}

// ============================================================
// APROBAR DOCUMENTO INDIVIDUAL
// ============================================================
async function aprobarDocumentoIndividual(idDocumentoRequisito) {
    if (!confirm('¿Está seguro de aprobar este documento?')) return;
    
    try {
        const response = await fetch('/api/documento_requisito/aprobar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idDocumentoRequisito: idDocumentoRequisito,
                observacion: 'Aprobado'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Mostrar mensaje según si se confirmó la reserva
            if (data.estadoReserva === 'CONFIRMADO') {
                alert('✅ ' + (data.mensaje || 'Documento aprobado. ¡Todos los documentos han sido aprobados! La reserva ha sido CONFIRMADA.'));
            } else {
                alert('✅ Documento aprobado exitosamente');
            }
            
            // Recargar requisitos y documentos para actualizar la vista
            await cargarRequisitosYDocumentos(reservaSeleccionada.idReserva, reservaSeleccionada.idActo);
            
            // Recargar información completa de la reserva para obtener el estado actualizado
            if (reservaSeleccionada && reservaSeleccionada.idReserva) {
                await recargarInformacionReserva(reservaSeleccionada.idReserva);
            }
            
            // Actualizar el estado de la reserva en la información mostrada
            // Si el backend retornó el estado, usarlo; si no, usar el de la reserva recargada
            const estadoFinal = data.estadoReserva || (reservaSeleccionada ? reservaSeleccionada.estadoReserva : null);
            if (estadoFinal) {
                if (reservaSeleccionada) {
                    reservaSeleccionada.estadoReserva = estadoFinal;
                }
                actualizarEstadoReservaEnUI(estadoFinal);
            }
        } else {
            alert('❌ Error: ' + (data.mensaje || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('Error al aprobar documento:', error);
        alert('Error al aprobar el documento');
    }
}

// ============================================================
// RECHAZAR DOCUMENTO
// ============================================================
async function rechazarDocumento(idDocumentoRequisito) {
    const observacion = prompt('Motivo del rechazo (OBLIGATORIO):');
    
    if (!observacion || observacion.trim() === '') {
        alert('Debe especificar el motivo del rechazo');
        return;
    }
    
    if (!confirm('¿Está seguro de rechazar este documento?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/documento_requisito/rechazar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idDocumentoRequisito: idDocumentoRequisito,
                observacion: observacion
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('❌ Documento rechazado');
            await cargarRequisitosYDocumentos(reservaSeleccionada.idReserva, reservaSeleccionada.idActo);
        } else {
            alert('❌ Error: ' + (data.mensaje || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('Error al rechazar documento:', error);
        alert('Error al rechazar el documento');
    }
}


// ============================================================
// CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    document.getElementById('btn-volver-busqueda')?.addEventListener('click', volverABusqueda);
}

// ============================================================
// CONFIGURAR EVENTOS DE DOCUMENTOS (después de renderizar)
// ============================================================
function configurarEventosDocumentos() {
    // Esta función se llama después de renderizar para asegurar que los elementos existan
    // Los event listeners se configuran mediante onclick en el HTML generado
}

function volverABusqueda() {
    ocultarDetalleReserva();
    reservaSeleccionada = null;
    document.getElementById('inputBusqueda').value = '';
    ocultarResultadosBusqueda();
}

// ============================================================
// UTILIDADES
// ============================================================
function formatearFecha(fecha) {
    if (!fecha) return '-';
    try {
        const date = new Date(fecha);
        return date.toLocaleDateString('es-PE', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    } catch {
        return fecha;
    }
}

function getBadgeClass(estado) {
    const badges = {
        'PENDIENTE_DOCUMENTO': 'badge-pendiente',
        'PENDIENTE_REVISION': 'badge-pendiente-revision',
        'PENDIENTE_PAGO': 'badge-pendiente',
        'CONFIRMADO': 'badge-confirmado',
        'RECHAZADO': 'badge-rechazado',
        'CANCELADO': 'badge-rechazado'
    };
    return badges[estado] || 'badge-pendiente';
}

function getBadgeClassDocumento(estado) {
    const badges = {
        'NO_CUMPLIDO': 'badge-rechazado',
        'CUMPLIDO': 'badge-confirmado',
        'PENDIENTE': 'badge-pendiente',
        'NO_REGISTRADO': 'badge-no-registrado'
    };
    return badges[estado] || 'badge-pendiente';
}
