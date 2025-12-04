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
            // Filtrar solo reservas PENDIENTE_PAGO o PENDIENTE_DOCUMENTO
            const reservasFiltradas = data.datos.filter(r => 
                r.estadoReserva === 'PENDIENTE_PAGO' || r.estadoReserva === 'PENDIENTE_DOCUMENTO'
            );
            
            if (reservasFiltradas.length > 0) {
                mostrarResultadosBusqueda(reservasFiltradas);
            } else {
                alert('No se encontraron reservas pendientes de documentos o pago');
                ocultarResultadosBusqueda();
            }
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
    
    // Crear un contenedor temporal para construir el HTML completo
    let htmlCompleto = '';
    
    // Mostrar alerta de fecha límite si aplica
    if (reservaSeleccionada && reservaSeleccionada.fecha) {
        const fechaActo = new Date(reservaSeleccionada.fecha);
        const fechaLimite = new Date(fechaActo);
        fechaLimite.setDate(fechaLimite.getDate() - 7);
        const hoy = new Date();
        
        if (hoy > fechaLimite) {
            htmlCompleto += `
                <div class="fecha-limite-alerta">
                    <div class="icono">⚠️</div>
                    <div class="texto">
                        <strong>FECHA LÍMITE VENCIDA</strong>
                        <span>Los documentos debían presentarse antes del ${formatearFecha(fechaLimite)}</span>
                    </div>
                </div>
            `;
        }
    }
    
    if (requisitosActo.length === 0) {
        htmlCompleto += '<p class="text-muted">No hay requisitos configurados para este acto.</p>';
        container.innerHTML = htmlCompleto;
        return;
    }
    
    // Preparar array de requisitos con su estado
    const requisitosConEstado = requisitosActo.map(requisito => {
        // Buscar todos los documentos de este requisito (puede haber rechazados antiguos)
        const docsRequisito = documentosRegistrados.filter(
            d => d.idActoRequisito === requisito.idActoRequisito
        );
        
        // Prioridad: 1) cualquier PENDIENTE*, 2) CUMPLIDO, 3) NO_CUMPLIDO (para mostrar observación)
        // Buscar primero documentos PENDIENTE (para aprobar) - cualquier variante
        const estadosPendientes = ['PENDIENTE', 'PENDIENTE_REVISION', 'PENDIENTE_DOCUMENTO', 'PENDIENTE_PAGO'];
        let docActivo = docsRequisito.find(d => estadosPendientes.includes(d.estadoCumplimiento));
        
        // Si no hay PENDIENTE, buscar CUMPLIDO (ya aprobado)
        if (!docActivo) {
            docActivo = docsRequisito.find(d => d.estadoCumplimiento === 'CUMPLIDO');
        }
        
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
    
    // Renderizar requisitos de la página actual
    requisitosPagina.forEach(({ requisito, docActivo, ultimoRechazado }) => {
        const estadoCumplimiento = docActivo ? docActivo.estadoCumplimiento : 'NO_REGISTRADO';
        // Normalizar variantes de estados pendientes que puede devolver el backend
        const estadosPendientes = ['PENDIENTE', 'PENDIENTE_REVISION', 'PENDIENTE_DOCUMENTO', 'PENDIENTE_PAGO'];
        const esPendiente = estadosPendientes.includes(estadoCumplimiento);
        const aprobado = docActivo ? docActivo.aprobado : 0;
        const observacion = docActivo ? (docActivo.observacion || '') : '';
        const fechaRecepcion = docActivo && docActivo.f_subido ? formatearFecha(docActivo.f_subido) : null;
        
        // Debug: Log para cada requisito
        console.log(`📄 Requisito: ${requisito.nombreRequisito}, Estado: ${estadoCumplimiento}, DocActivo:`, docActivo ? docActivo.idDocumentoRequisito : 'N/A');
        
        let claseItem = 'requisito-item';
        if (estadoCumplimiento === 'CUMPLIDO') claseItem += ' documento-recibido';
        if (estadoCumplimiento === 'NO_CUMPLIDO') claseItem += ' documento-rechazado';
        
        htmlCompleto += `
            <div class="${claseItem}">
                <div class="requisito-header">
                    <div class="requisito-info">
                        <h5>${requisito.nombreRequisito || 'Requisito'}</h5>
                        ${requisito.descripcion ? `<p class="text-muted">${requisito.descripcion}</p>` : ''}
                    </div>
                    ${estadoCumplimiento === 'CUMPLIDO' ? 
                        '<span class="documento-estado estado-recibido">✓ APROBADO</span>' :
                        esPendiente && docActivo ?
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
                                       data-acto-requisito="${requisito.idActoRequisito}">
                                <label for="check_${requisito.idActoRequisito}">
                                    📥 Marcar como Recibido
                                </label>
                            </div>
                        </div>
                    ` : docActivo && docActivo.idDocumentoRequisito && estadoCumplimiento !== 'CUMPLIDO' ? `
                        <!-- Documento recibido, ahora aprobar o rechazar (independiente del estado mientras NO esté CUMPLIDO) -->
                        <div class="documento-control">
                            <button class="btn btn-success btn-sm" id="btn_aprobar_${docActivo.idDocumentoRequisito}">
                                ✅ Aprobar Documento
                            </button>
                            <button class="btn btn-danger btn-sm" id="btn_rechazar_${docActivo.idDocumentoRequisito}">
                                ❌ Rechazar Documento
                            </button>
                        </div>
                        <div class="observacion-wrapper" id="obs_${docActivo.idDocumentoRequisito}" style="display: none; margin-top: 10px; padding: 15px; background-color: #fff3cd; border: 1px solid #ffc107; border-radius: 6px;">
                            <label style="display: block; margin-bottom: 5px; font-weight: 600; color: #e74c3c;">
                                Motivo del Rechazo (el feligrés verá este mensaje):
                            </label>
                            <textarea placeholder="Ej: El documento está borroso, falta firma, documento vencido, etc." 
                                      id="textarea_${docActivo.idDocumentoRequisito}"
                                      style="width: 100%; min-height: 80px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; font-family: inherit; resize: vertical;"></textarea>
                            <div style="margin-top: 10px; display: flex; gap: 10px;">
                                <button class="btn btn-danger btn-sm" onclick="confirmarRechazo(${docActivo.idDocumentoRequisito})">
                                    Confirmar Rechazo
                                </button>
                                <button class="btn btn-secondary btn-sm" onclick="cancelarRechazo(${docActivo.idDocumentoRequisito})">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ` : estadoCumplimiento === 'CUMPLIDO' && docActivo ? `
                        <div style="color: #27ae60; font-weight: 600; padding: 10px; background-color: #e8f8f5; border-radius: 6px;">
                            ✓ Documento aprobado correctamente
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    });
    
    // Agregar controles de paginación si hay más de una página
    if (totalPaginas > 1) {
        htmlCompleto += '<div class="paginacion-requisitos">';
        
        // Botón anterior
        if (paginaActual > 1) {
            htmlCompleto += `<button class="btn btn-secondary btn-sm" onclick="cambiarPagina(${paginaActual - 1})">« Anterior</button>`;
        }
        
        // Números de página
        htmlCompleto += '<span class="info-pagina">Página ' + paginaActual + ' de ' + totalPaginas + '</span>';
        
        // Botón siguiente
        if (paginaActual < totalPaginas) {
            htmlCompleto += `<button class="btn btn-secondary btn-sm" onclick="cambiarPagina(${paginaActual + 1})">Siguiente »</button>`;
        }
        
        htmlCompleto += '</div>';
    }
    
    // Asignar todo el HTML de una vez para evitar problemas con event listeners
    container.innerHTML = htmlCompleto;
    
    // Asegurar que los event listeners estén configurados después de renderizar
    configurarEventosDocumentos();
    
    // Debug: Verificar que los botones y checkboxes estén disponibles
    const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="check_"]');
    const botonesAprobar = document.querySelectorAll('button[onclick^="aprobarDocumentoDirecto"], button[id^="btn_aprobar_"]');
    const botonesRechazar = document.querySelectorAll('button[onclick^="mostrarCampoRechazo"], button[id^="btn_rechazar_"]');
    
    console.log('✅ Requisitos renderizados:', requisitosPagina.length);
    console.log('✅ Checkboxes encontrados:', checkboxes.length);
    console.log('✅ Botones aprobar encontrados:', botonesAprobar.length);
    console.log('✅ Botones rechazar encontrados:', botonesRechazar.length);
    
    // Debug adicional: Listar todos los estados de los documentos
    requisitosPagina.forEach(({ requisito, docActivo }) => {
        if (docActivo) {
            console.log(`  - ${requisito.nombreRequisito}: ${docActivo.estadoCumplimiento} (ID: ${docActivo.idDocumentoRequisito})`);
        } else {
            console.log(`  - ${requisito.nombreRequisito}: NO_REGISTRADO`);
        }
    });
}

// ============================================================
// CAMBIAR PÁGINA DE REQUISITOS
// ============================================================
window.cambiarPagina = function(nuevaPagina) {
    paginaActual = nuevaPagina;
    renderizarListaRequisitos();
    
    // Scroll al inicio de la lista de requisitos
    document.getElementById('lista-requisitos').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ============================================================
// MARCAR DOCUMENTO COMO RECIBIDO (SOLO RECEPCIÓN)
// ============================================================
window.marcarDocumentoRecibido = async function(idActoRequisito, checked) {
    if (!checked || !reservaSeleccionada) {
        // Si se desmarca, no hacer nada
        return;
    }
    
    // Obtener el checkbox para poder desmarcarlo si es necesario
    const checkbox = document.getElementById(`check_${idActoRequisito}`);
    if (!checkbox) {
        console.error('Checkbox no encontrado:', `check_${idActoRequisito}`);
        return;
    }
    
    if (!confirm('¿Confirma que recibió este documento físicamente?')) {
        // Desmarcar el checkbox
        checkbox.checked = false;
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
            // Recargar la lista de requisitos para actualizar la vista
            await cargarRequisitosYDocumentos(reservaSeleccionada.idReserva, reservaSeleccionada.idActo);
        } else {
            alert('❌ Error al registrar documento: ' + (data.mensaje || 'Error desconocido'));
            // Desmarcar el checkbox
            checkbox.checked = false;
        }
        
    } catch (error) {
        console.error('Error al marcar documento:', error);
        alert('Error al procesar el documento');
        // Desmarcar el checkbox
        checkbox.checked = false;
    }
}

// ============================================================
// APROBAR DOCUMENTO DIRECTAMENTE
// ============================================================
window.aprobarDocumentoDirecto = async function(idDocumentoRequisito) {
    console.log('🔵 Intentando aprobar documento:', idDocumentoRequisito);
    
    if (!idDocumentoRequisito) {
        alert('❌ Error: No se proporcionó el ID del documento');
        return;
    }
    
    if (!confirm('¿Está seguro de aprobar este documento?')) return;
    
    try {
        console.log('📤 Enviando solicitud de aprobación...');
        const response = await fetch('/api/documento_requisito/aprobar', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                idDocumentoRequisito: idDocumentoRequisito,
                observacion: 'Aprobado'
            })
        });
        
        const data = await response.json();
        console.log('📥 Respuesta del servidor:', data);
        
        if (data.success) {
            // Mostrar mensaje según si se confirmó la reserva
            if (data.estadoReserva === 'CONFIRMADO') {
                alert('✅ ' + (data.mensaje || 'Documento aprobado. ¡Todos los documentos han sido aprobados! La reserva ha sido CONFIRMADA.'));
            } else {
                alert('✅ Documento aprobado exitosamente');
            }
            
            // Recargar requisitos y documentos para actualizar la vista
            console.log('🔄 Recargando requisitos y documentos...');
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
            
            // Auto-actualizar el calendario si está disponible
            if (typeof window.recargarCalendario === 'function') {
                window.recargarCalendario();
            }
            
            console.log('✅ Documento aprobado y vista actualizada');
        } else {
            alert('❌ Error: ' + (data.mensaje || 'Error desconocido'));
        }
        
    } catch (error) {
        console.error('❌ Error al aprobar documento:', error);
        alert('Error al aprobar el documento: ' + error.message);
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
window.mostrarCampoRechazo = function(idDocumentoRequisito) {
    const wrapper = document.getElementById(`obs_${idDocumentoRequisito}`);
    if (wrapper) {
        wrapper.style.display = 'block';
        const textarea = document.getElementById(`textarea_${idDocumentoRequisito}`);
        if (textarea) {
            textarea.focus();
        }
    }
}

// ============================================================
// CANCELAR RECHAZO
// ============================================================
window.cancelarRechazo = function(idDocumentoRequisito) {
    const wrapper = document.getElementById(`obs_${idDocumentoRequisito}`);
    const textarea = document.getElementById(`textarea_${idDocumentoRequisito}`);
    
    if (wrapper) wrapper.style.display = 'none';
    if (textarea) textarea.value = '';
}

// ============================================================
// CONFIRMAR RECHAZO CON OBSERVACIÓN
// ============================================================
window.confirmarRechazo = async function(idDocumentoRequisito) {
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
            
            // Auto-actualizar el calendario si está disponible
            if (typeof window.recargarCalendario === 'function') {
                window.recargarCalendario();
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
            
            // Auto-actualizar el calendario si está disponible
            if (typeof window.recargarCalendario === 'function') {
                window.recargarCalendario();
            }
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
    // Adjuntar listeners programáticos a todos los elementos dinámicos
    
    // Configurar checkboxes para marcar como recibido
    const checkboxes = document.querySelectorAll('input[type="checkbox"][id^="check_"]');
    checkboxes.forEach(checkbox => {
        if (!checkbox.hasAttribute('data-listener-attached')) {
            checkbox.setAttribute('data-listener-attached', 'true');
            checkbox.addEventListener('change', function(e) {
                const idActo = this.dataset.actoRequisito || this.id.replace('check_', '');
                marcarDocumentoRecibido(parseInt(idActo), this.checked);
            });
        }
    });
    
    // Configurar botones de aprobar
    const botonesAprobar = document.querySelectorAll('button[id^="btn_aprobar_"]');
    botonesAprobar.forEach(boton => {
        if (!boton.hasAttribute('data-listener-attached')) {
            boton.setAttribute('data-listener-attached', 'true');
            boton.addEventListener('click', function(e) {
                const idDoc = parseInt(this.id.replace('btn_aprobar_', ''));
                aprobarDocumentoDirecto(idDoc);
            });
        }
    });
    
    // Configurar botones de rechazar
    const botonesRechazar = document.querySelectorAll('button[id^="btn_rechazar_"]');
    botonesRechazar.forEach(boton => {
        if (!boton.hasAttribute('data-listener-attached')) {
            boton.setAttribute('data-listener-attached', 'true');
            boton.addEventListener('click', function(e) {
                const idDoc = parseInt(this.id.replace('btn_rechazar_', ''));
                mostrarCampoRechazo(idDoc);
            });
        }
    });
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
        'PENDIENTE_REVISION': 'badge-pendiente',
        'PENDIENTE_DOCUMENTO': 'badge-pendiente',
        'PENDIENTE_PAGO': 'badge-pendiente',
        'NO_REGISTRADO': 'badge-no-registrado'
    };
    return badges[estado] || 'badge-pendiente';
}
