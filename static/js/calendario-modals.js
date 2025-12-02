// =====================================================
// CALENDARIO - MÓDULO DE MODALES Y GESTIÓN DE HORARIOS
// Este archivo contiene todas las funciones relacionadas con:
// - Modales de información (mostrar datos del día)
// - Modales de agregar horarios (individual, específico, múltiple)
// - Modales de eliminar horarios
// - Funciones auxiliares de validación y actualización
// =====================================================

// Nota: Este archivo debe cargarse DESPUÉS de calendario-core.js
// ya que depende de variables globales definidas allí mediante window.calendarioState

// ================= FUNCIONES AUXILIARES ===================
function mostrarMensajeValidacion(mensaje) {
    const div = document.getElementById('mensajeValidacion');
    if (div) {
        div.textContent = mensaje;
        div.style.display = 'block';
    }
}

function obtenerNombreDiaSemana(fecha) {
    const fechaObj = new Date(fecha);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[fechaObj.getDay()];
}

function generarCheckboxesHoras() {
    let html = '';
    for (let hora = 0; hora < 24; hora++) {
        const horaStr = hora.toString().padStart(2, '0') + ':00';
        html += `
            <div class="form-check">
                <input class="form-check-input" type="checkbox" name="horasGrupales" id="hora${hora}" value="${horaStr}">
                <label class="form-check-label" for="hora${hora}">
                    ${horaStr}
                </label>
            </div>
        `;
    }
    return html;
}

// ================= MODAL MOSTRAR DATOS DEL DÍA ===================
function mostrarDatosDelDia(fecha) {
    const datosDelDia = window.calendarioState.datosFiltrados.filter(r => r.fecha === fecha);

    const modalTitulo = document.getElementById('modalTitulo');
    const modalCuerpo = document.getElementById('modalCuerpo');
    const modalFooter = document.querySelector('#infoModal .modal-footer');

    const rol = window.calendarioState.rol;
    
    modalTitulo.textContent = rol === 'secretaria' ? `Horarios del ${fecha}` : `Reservas del ${fecha}`;
    modalCuerpo.innerHTML = '';

    if (datosDelDia.length === 0) {
        modalCuerpo.innerHTML = `<p class="text-center">No hay ${rol === 'secretaria' ? 'horarios' : 'reservas'} para este día.</p>`;
    } else {
        datosDelDia.forEach((r, index) => {
            if (r.tipo === 'horario') {
                // Mostrar horarios disponibles
                modalCuerpo.innerHTML += `
                    <div class="reserva-item border rounded p-3 mb-3 shadow-sm">
                        <div class="d-flex justify-content-between align-items-center">
                            <div>
                                <i class="bi bi-clock-fill me-1 text-success"></i> 
                                <strong class="fs-5 text-success">${r.hora}</strong>
                                <span class="badge bg-success ms-2">DISPONIBLE</span>
                            </div>
                        </div>
                        <div class="mt-2">
                            <p class="mb-1"><strong>Acto:</strong> ${r.titulo}</p>
                            <p class="mb-1"><strong>Costo:</strong> S/ ${r.costoBase || 0}</p>
                        </div>
                    </div>
                `;
            } else {
                // Mostrar reservas
            let colorClase = '';
            switch(r.estado) {
                case 'CONFIRMADO': colorClase = 'bg-success'; break;
                    case 'ATENDIDO': colorClase = 'bg-info'; break;
                case 'PENDIENTE_PAGO': colorClase = 'bg-warning'; break;
                case 'CANCELADO': colorClase = 'bg-danger'; break;
                default: colorClase = 'bg-secondary';
            }

                const participantesHtml = r.participantes ? r.participantes.split(';').map(p => {
                    let [rolPart, nombre] = p.split(':').map(s => s.trim());
                    if(!rolPart || !nombre) return '';
                    if(rolPart.toLowerCase() === 'beneficiario_s_') rolPart = 'Beneficiario(s)';
                    else rolPart = rolPart.charAt(0).toUpperCase() + rolPart.slice(1);
                    return `<p class="mb-1"><span class="fw-bold">${rolPart}:</span> ${nombre}</p>`;
                }).join('') : '';

            const descripcionHtml = r.descripcion ? `<p class="mb-1 text-muted"><strong>Descripción:</strong> ${r.descripcion}</p>` : '';

            modalCuerpo.innerHTML += `
                <div class="reserva-item border rounded p-3 mb-3 shadow-sm">
                    <div class="d-flex justify-content-between align-items-center mb-2">
                        <div>
                            <i class="bi bi-clock-fill me-1 text-primary"></i> 
                            <strong class="fs-5 text-primary">${r.hora}</strong>
                            <span class="badge ${colorClase} ms-2">${r.estado}</span>
                        </div>
                        <button class="btn btn-sm btn-outline-primary btn-ver-detalles" data-index="${index}">▼</button>
                    </div>
                    <div class="info-reserva" style="display:none;">
                        <p class="mb-1"><strong>Acto:</strong> ${r.titulo}</p>
                        <p class="mb-1"><strong>Parroquia:</strong> ${r.parroquia}</p>
                        ${participantesHtml}
                        ${descripcionHtml}
                    </div>
                </div>
            `;
            }
        });
    }

    modalFooter.innerHTML = '';
    const cerrarBtn = document.createElement('button');
    cerrarBtn.className = 'btn btn-secondary';
    cerrarBtn.setAttribute('data-bs-dismiss','modal');
    cerrarBtn.textContent = 'Cerrar';
    modalFooter.appendChild(cerrarBtn);

    if (rol === 'feligres') {
    const nuevaReservaBtn = document.createElement('button');
    nuevaReservaBtn.className = 'btn btn-primary';
    nuevaReservaBtn.textContent = 'Nueva Reserva';
    nuevaReservaBtn.addEventListener('click', () => {
        window.location.href = '/cliente/reserva';
    });
    modalFooter.appendChild(nuevaReservaBtn);
    }

    try {
        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        modal.show();
    } catch(e) {
        console.error("Error al mostrar el modal:", e);
    }

    document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
        btn.addEventListener('click', () => {
            const infoDiv = btn.closest('.reserva-item').querySelector('.info-reserva');
            if(infoDiv.style.display === 'none'){
                infoDiv.style.display = 'block';
                btn.textContent = '▲';
            } else {
                infoDiv.style.display = 'none';
                btn.textContent = '▼';
            }
        });
    });
}

// ================= MODAL AGREGAR HORARIO (SECRETARIA Y SACERDOTE) ===================
async function mostrarModalAgregarHorario(fecha) {
    console.log("🔧 mostrarModalAgregarHorario llamado con fecha:", fecha);
    
    const { rol, idParroquia } = window.calendarioState;
    
    if ((rol !== 'secretaria' && rol !== 'sacerdote') || !idParroquia) {
        console.log("⚠️ Permiso denegado");
        return;
    }
    
    try {
        console.log("📡 Cargando actos...");
        // Cargar actos de la parroquia
        const resActos = await fetch(`/api/acto/${idParroquia}`);
        const dataActos = await resActos.json();
        
        if (!dataActos.success || !dataActos.datos) {
            alert('No se pudieron cargar los actos litúrgicos');
            return;
        }
        
        const modalTitulo = document.getElementById('modalTitulo');
        const modalCuerpo = document.getElementById('modalCuerpo');
        const modalFooter = document.querySelector('#infoModal .modal-footer');
        
        // Obtener nombre del día de la semana
        const fechaObj = new Date(fecha + 'T00:00:00');
        const diasNombres = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const nombreDia = diasNombres[fechaObj.getDay()];
        
        console.log("📅 Día:", nombreDia);
        
        modalTitulo.textContent = `Agregar Horario - ${nombreDia}`;
        modalCuerpo.innerHTML = `
            <div class="mb-3">
                <label class="form-label">Tipo de horario:</label>
                <div>
                    <input type="radio" id="tipoIndividual" name="tipoHorario" value="individual" checked>
                    <label for="tipoIndividual" class="ms-2">Individual (todos los ${nombreDia} a una hora específica)</label>
                </div>
                <div>
                    <input type="radio" id="tipoGrupal" name="tipoHorario" value="grupal">
                    <label for="tipoGrupal" class="ms-2">Grupal (todos los ${nombreDia} a múltiples horas)</label>
                </div>
            </div>
            <div class="mb-3">
                <label for="selectActo" class="form-label">Acto Litúrgico:</label>
                <select id="selectActo" class="form-select">
                    <option value="">Seleccione un acto</option>
                    ${dataActos.datos.map(a => `<option value="${a.id}" data-costo="${a.costoBase || 0}">${a.acto}</option>`).join('')}
                </select>
            </div>
            <div class="mb-3" id="divHoraIndividual">
                <label for="inputHora" class="form-label">Hora:</label>
                <input type="time" id="inputHora" class="form-control" required>
            </div>
            <div class="mb-3" id="divHorasGrupales" style="display:none;">
                <label class="form-label">Horas (puede seleccionar múltiples):</label>
                <div id="contenedorHoras" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                    ${generarCheckboxesHoras()}
                </div>
            </div>
            <div class="mb-3">
                <label for="inputCosto" class="form-label">Costo Base:</label>
                <input type="number" id="inputCosto" class="form-control" step="0.01" min="0" value="0">
            </div>
            <div id="mensajeValidacion" class="alert alert-danger" style="display:none;"></div>
        `;
        
        // Manejar cambio entre individual y grupal
        document.querySelectorAll('input[name="tipoHorario"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                const esGrupal = e.target.value === 'grupal';
                document.getElementById('divHoraIndividual').style.display = esGrupal ? 'none' : 'block';
                document.getElementById('divHorasGrupales').style.display = esGrupal ? 'block' : 'none';
                if (esGrupal) {
                    document.getElementById('inputHora').required = false;
                } else {
                    document.getElementById('inputHora').required = true;
                }
            });
        });
        
        modalFooter.innerHTML = '';
        const cerrarBtn = document.createElement('button');
        cerrarBtn.className = 'btn btn-secondary';
        cerrarBtn.setAttribute('data-bs-dismiss','modal');
        cerrarBtn.textContent = 'Cancelar';
        modalFooter.appendChild(cerrarBtn);
        
        const agregarBtn = document.createElement('button');
        agregarBtn.className = 'btn btn-primary';
        agregarBtn.textContent = 'Agregar Horario(s)';
        agregarBtn.addEventListener('click', async () => {
            const idActo = document.getElementById('selectActo').value;
            const tipoHorario = document.querySelector('input[name="tipoHorario"]:checked').value;
            const costo = parseFloat(document.getElementById('inputCosto').value) || 0;
            
            if (!idActo) {
                mostrarMensajeValidacion('Por favor seleccione un acto litúrgico');
                return;
            }
            
            // Obtener día de la semana de la fecha
            const fechaObj = new Date(fecha);
            const diasSemana = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];
            const diaSemana = diasSemana[fechaObj.getDay()];
            
            try {
                if (tipoHorario === 'individual') {
                    const hora = document.getElementById('inputHora').value;
                    
                    if (!hora) {
                        mostrarMensajeValidacion('Por favor seleccione una hora');
                        return;
                    }
                    
                    const res = await fetch('/api/acto/horario/agregar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            idActo: parseInt(idActo),
                            idParroquia: parseInt(idParroquia),
                            diaSemana: diaSemana,
                            horaInicioActo: hora,
                            costoBase: costo
                        })
                    });
                    
                    const data = await res.json();
                    if (data.ok || data.success) {
                        alert('Horario agregado correctamente (todos los ' + obtenerNombreDiaSemana(fecha) + ' a las ' + hora + ')');
                        bootstrap.Modal.getInstance(document.getElementById('infoModal')).hide();
                        if (rol === 'sacerdote') {
                            await window.calendarioFunctions.recargarHorarios();
                        } else {
                            location.reload();
                        }
                    } else {
                        mostrarMensajeValidacion('Error: ' + (data.mensaje || 'No se pudo agregar el horario'));
                    }
                } else {
                    const horasSeleccionadas = Array.from(document.querySelectorAll('input[name="horasGrupales"]:checked'))
                        .map(cb => cb.value)
                        .sort();
                    
                    if (horasSeleccionadas.length === 0) {
                        mostrarMensajeValidacion('Por favor seleccione al menos una hora');
                        return;
                    }
                    
                    let agregados = 0;
                    let errores = [];
                    
                    for (const hora of horasSeleccionadas) {
                        const res = await fetch('/api/acto/horario/agregar', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                idActo: parseInt(idActo),
                                idParroquia: parseInt(idParroquia),
                                diaSemana: diaSemana,
                                horaInicioActo: hora,
                                costoBase: costo
                            })
                        });
                        
                        const data = await res.json();
                        if (data.ok || data.success) {
                            agregados++;
                        } else {
                            errores.push(hora + ': ' + (data.mensaje || 'Error al agregar'));
                        }
                    }
                    
                    if (agregados > 0) {
                        alert(`Se agregaron ${agregados} horario(s) para todos los ${obtenerNombreDiaSemana(fecha)}. ${errores.length > 0 ? 'Algunos no se pudieron agregar: ' + errores.join(', ') : ''}`);
                        bootstrap.Modal.getInstance(document.getElementById('infoModal')).hide();
                        if (rol === 'sacerdote') {
                            await window.calendarioFunctions.recargarHorarios();
                        } else {
                            location.reload();
                        }
                    } else {
                        mostrarMensajeValidacion('No se pudo agregar ningún horario. Errores: ' + errores.join(', '));
                    }
                }
            } catch (error) {
                console.error('Error agregando horario:', error);
                mostrarMensajeValidacion('Error al agregar el horario');
            }
        });
        modalFooter.appendChild(agregarBtn);
        
        // Actualizar costo cuando cambie el acto
        document.getElementById('selectActo').addEventListener('change', (e) => {
            const option = e.target.selectedOptions[0];
            if (option) {
                document.getElementById('inputCosto').value = option.dataset.costo || 0;
            }
        });
        
        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        modal.show();
    } catch (error) {
        console.error('Error mostrando modal agregar horario:', error);
        alert('Error al cargar el formulario');
    }
}

// ================= MODAL AGREGAR HORARIO ESPECÍFICO (CON HORA DEL CLIC) ===================
async function mostrarModalAgregarHorarioEspecifico(fecha, hora, diaSemana) {
    console.log("🔧 Abriendo modal para agregar horario:", {fecha, hora, diaSemana});
    
    const { rol, idParroquia, calendarHorarios } = window.calendarioState;
    
    if ((rol !== 'secretaria' && rol !== 'sacerdote') || !idParroquia) {
        console.log("⚠️ Permiso denegado para agregar horario");
        return;
    }
    
    try {
        console.log("📡 Cargando actos de la parroquia:", idParroquia);
        const resActos = await fetch(`/api/acto/${idParroquia}`);
        const dataActos = await resActos.json();
        
        if (!dataActos.success || !dataActos.datos) {
            alert('No se pudieron cargar los actos litúrgicos');
            return;
        }
        
        console.log("✅ Actos cargados:", dataActos.datos.length);
        
        const modalTitulo = document.getElementById('modalTitulo');
        const modalCuerpo = document.getElementById('modalCuerpo');
        const modalFooter = document.querySelector('#infoModal .modal-footer');
        
        const diasNombres = {
            'DOM': 'Domingo', 'LUN': 'Lunes', 'MAR': 'Martes',
            'MIÉ': 'Miércoles', 'JUE': 'Jueves', 'VIE': 'Viernes', 'SÁB': 'Sábado'
        };
        
        const nombreDia = diasNombres[diaSemana] || diaSemana;
        
        modalTitulo.textContent = `Agregar Horario - ${nombreDia}`;
        modalCuerpo.innerHTML = `
            <div class="alert alert-info">
                Se agregará un horario para <strong>todos los ${nombreDia}</strong> a las <strong>${hora}</strong>
            </div>
            <div class="mb-3">
                <label for="selectActoEsp" class="form-label">Acto Litúrgico:</label>
                <select id="selectActoEsp" class="form-select">
                    <option value="">Seleccione un acto</option>
                    ${dataActos.datos.map(a => `<option value="${a.id}" data-costo="${a.costoBase || 0}">${a.acto}</option>`).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label for="inputCostoEsp" class="form-label">Costo Base:</label>
                <input type="number" id="inputCostoEsp" class="form-control" step="0.01" min="0" value="0">
            </div>
            <div id="mensajeValidacionEsp" class="alert alert-danger" style="display:none;"></div>
        `;
        
        document.getElementById('selectActoEsp').addEventListener('change', (e) => {
            const option = e.target.selectedOptions[0];
            document.getElementById('inputCostoEsp').value = option.dataset.costo || 0;
        });
        
        modalFooter.innerHTML = '';
        const cerrarBtn = document.createElement('button');
        cerrarBtn.className = 'btn btn-secondary';
        cerrarBtn.setAttribute('data-bs-dismiss','modal');
        cerrarBtn.textContent = 'Cancelar';
        cerrarBtn.addEventListener('click', () => {
            console.log("❌ Modal cancelado - limpiando...");
            try {
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('infoModal'));
                if (modalInstance) modalInstance.hide();
                setTimeout(() => {
                    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }, 100);
                if (calendarHorarios) calendarHorarios.unselect();
            } catch (e) {
                console.error("Error al cerrar modal:", e);
            }
        });
        modalFooter.appendChild(cerrarBtn);
        
        const agregarBtn = document.createElement('button');
        agregarBtn.className = 'btn btn-primary';
        agregarBtn.textContent = 'Agregar Horario';
        agregarBtn.addEventListener('click', async () => {
            const idActo = document.getElementById('selectActoEsp').value;
            const costo = parseFloat(document.getElementById('inputCostoEsp').value) || 0;
            
            if (!idActo) {
                document.getElementById('mensajeValidacionEsp').textContent = 'Por favor seleccione un acto litúrgico';
                document.getElementById('mensajeValidacionEsp').style.display = 'block';
                return;
            }
            
            agregarBtn.disabled = true;
            agregarBtn.textContent = 'Agregando...';
            
            try {
                const res = await fetch('/api/acto/horario/agregar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        idActo: parseInt(idActo),
                        idParroquia: parseInt(idParroquia),
                        diaSemana: diaSemana,
                        horaInicioActo: hora,
                        costoBase: costo
                    })
                });
                
                const data = await res.json();
                
                if (data.ok || data.success) {
                    alert(`✅ Horario agregado: Todos los ${diaSemana} a las ${hora}`);
                    bootstrap.Modal.getInstance(document.getElementById('infoModal')).hide();
                    if (calendarHorarios) calendarHorarios.unselect();
                    await window.calendarioFunctions.recargarHorarios();
                } else {
                    document.getElementById('mensajeValidacionEsp').textContent = data.mensaje || 'Error al agregar el horario';
                    document.getElementById('mensajeValidacionEsp').style.display = 'block';
                    if (calendarHorarios) calendarHorarios.unselect();
                }
            } catch (error) {
                console.error('Error:', error);
                document.getElementById('mensajeValidacionEsp').textContent = 'Error al agregar el horario';
                document.getElementById('mensajeValidacionEsp').style.display = 'block';
                if (calendarHorarios) calendarHorarios.unselect();
            } finally {
                agregarBtn.disabled = false;
                agregarBtn.textContent = 'Agregar Horario';
            }
        });
        modalFooter.appendChild(agregarBtn);
        
        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        
        const modalElement = document.getElementById('infoModal');
        modalElement.addEventListener('hidden.bs.modal', function handler() {
            console.log("🧹 Limpiando después de cerrar modal...");
            if (calendarHorarios) calendarHorarios.unselect();
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            modalElement.removeEventListener('hidden.bs.modal', handler);
        });
        
        modal.show();
    } catch (error) {
        console.error('❌ Error en mostrarModalAgregarHorarioEspecifico:', error);
        alert('Error al cargar los datos: ' + error.message);
        if (window.calendarioState.calendarHorarios) {
            window.calendarioState.calendarHorarios.unselect();
        }
    }
}

// ================= MODAL AGREGAR HORARIOS MÚLTIPLES (ARRASTRE) ===================
async function mostrarModalAgregarHorariosMultiples(selectInfo) {
    const { rol, idParroquia, calendarHorarios } = window.calendarioState;
    
    if ((rol !== 'secretaria' && rol !== 'sacerdote') || !idParroquia) {
        calendarHorarios.unselect();
        return;
    }
    
    try {
        const inicio = new Date(selectInfo.start);
        const fin = new Date(selectInfo.end);
        const horasSeleccionadas = [];
        
        let horaActual = new Date(inicio);
        while (horaActual < fin) {
            const diasSemana = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
            horasSeleccionadas.push({
                fecha: horaActual.toISOString().slice(0, 10),
                hora: horaActual.toTimeString().slice(0, 5),
                diaSemana: diasSemana[horaActual.getDay()]
            });
            horaActual.setHours(horaActual.getHours() + 1);
        }
        
        if (horasSeleccionadas.length === 0) {
            calendarHorarios.unselect();
            return;
        }
        
        const resActos = await fetch(`/api/acto/${idParroquia}`);
        const dataActos = await resActos.json();
        
        if (!dataActos.success || !dataActos.datos) {
            alert('No se pudieron cargar los actos litúrgicos');
            calendarHorarios.unselect();
            return;
        }
        
        const modalTitulo = document.getElementById('modalTitulo');
        const modalCuerpo = document.getElementById('modalCuerpo');
        const modalFooter = document.querySelector('#infoModal .modal-footer');
        
        modalTitulo.textContent = `Agregar Horarios (${horasSeleccionadas.length} seleccionados)`;
        modalCuerpo.innerHTML = `
            <div class="alert alert-info">
                <strong>Se agregarán ${horasSeleccionadas.length} horarios:</strong>
                <div style="max-height: 150px; overflow-y: auto; margin-top: 10px;">
                    ${horasSeleccionadas.map(h => `<div>• ${h.diaSemana} a las ${h.hora}</div>`).join('')}
                </div>
            </div>
            <div class="mb-3">
                <label for="selectActoMulti" class="form-label">Acto Litúrgico:</label>
                <select id="selectActoMulti" class="form-select">
                    <option value="">Seleccione un acto</option>
                    ${dataActos.datos.map(a => `<option value="${a.id}" data-costo="${a.costoBase || 0}">${a.acto}</option>`).join('')}
                </select>
            </div>
            <div class="mb-3">
                <label for="inputCostoMulti" class="form-label">Costo Base:</label>
                <input type="number" id="inputCostoMulti" class="form-control" step="0.01" min="0" value="0">
            </div>
            <div id="mensajeValidacionMulti" class="alert alert-danger" style="display:none;"></div>
        `;
        
        document.getElementById('selectActoMulti').addEventListener('change', (e) => {
            const option = e.target.selectedOptions[0];
            document.getElementById('inputCostoMulti').value = option.dataset.costo || 0;
        });
        
        modalFooter.innerHTML = '';
        const cerrarBtn = document.createElement('button');
        cerrarBtn.className = 'btn btn-secondary';
        cerrarBtn.setAttribute('data-bs-dismiss','modal');
        cerrarBtn.textContent = 'Cancelar';
        cerrarBtn.addEventListener('click', () => {
            console.log("❌ Modal múltiple cancelado - limpiando...");
            try {
                const modalInstance = bootstrap.Modal.getInstance(document.getElementById('infoModal'));
                if (modalInstance) modalInstance.hide();
                setTimeout(() => {
                    document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
                    document.body.classList.remove('modal-open');
                    document.body.style.overflow = '';
                    document.body.style.paddingRight = '';
                }, 100);
                calendarHorarios.unselect();
            } catch (e) {
                console.error("Error al cerrar modal múltiple:", e);
            }
        });
        modalFooter.appendChild(cerrarBtn);
        
        const agregarBtn = document.createElement('button');
        agregarBtn.className = 'btn btn-primary';
        agregarBtn.textContent = `Agregar ${horasSeleccionadas.length} Horarios`;
        agregarBtn.addEventListener('click', async () => {
            const idActo = document.getElementById('selectActoMulti').value;
            const costo = parseFloat(document.getElementById('inputCostoMulti').value) || 0;
            
            if (!idActo) {
                document.getElementById('mensajeValidacionMulti').textContent = 'Por favor seleccione un acto litúrgico';
                document.getElementById('mensajeValidacionMulti').style.display = 'block';
                return;
            }
            
            agregarBtn.disabled = true;
            agregarBtn.textContent = 'Agregando...';
            
            let exitosos = 0;
            let errores = 0;
            
            for (const horario of horasSeleccionadas) {
                try {
                    const res = await fetch('/api/acto/horario/agregar', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            idActo: parseInt(idActo),
                            idParroquia: parseInt(idParroquia),
                            diaSemana: horario.diaSemana,
                            horaInicioActo: horario.hora,
                            costoBase: costo
                        })
                    });
                    
                    const data = await res.json();
                    if (data.ok || data.success) {
                        exitosos++;
                    } else {
                        errores++;
                    }
                } catch (error) {
                    errores++;
                }
            }
            
            alert(`✅ ${exitosos} horarios agregados correctamente${errores > 0 ? `\n⚠️ ${errores} horarios con error (posiblemente ya existen)` : ''}`);
            bootstrap.Modal.getInstance(document.getElementById('infoModal')).hide();
            calendarHorarios.unselect();
            
            await window.calendarioFunctions.recargarHorarios();
        });
        modalFooter.appendChild(agregarBtn);
        
        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        
        const modalElement = document.getElementById('infoModal');
        modalElement.addEventListener('hidden.bs.modal', function handler() {
            console.log("🧹 Limpiando después de cerrar modal múltiple...");
            calendarHorarios.unselect();
            document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());
            document.body.classList.remove('modal-open');
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            modalElement.removeEventListener('hidden.bs.modal', handler);
        });
        
        modal.show();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los datos');
        calendarHorarios.unselect();
    }
}

// ================= MODAL ELIMINAR HORARIO ===================
async function mostrarModalEliminarHorario(evento) {
    const { rol, idParroquia } = window.calendarioState;
    
    if (rol !== 'secretaria' && rol !== 'sacerdote') return;
    
    const idActoParroquia = evento.extendedProps.idActoParroquia;
    if (!idActoParroquia) return;
    
    const modalTitulo = document.getElementById('modalTitulo');
    const modalCuerpo = document.getElementById('modalCuerpo');
    const modalFooter = document.querySelector('#infoModal .modal-footer');
    
    modalTitulo.textContent = 'Eliminar Horario';
    modalCuerpo.innerHTML = `
        <p>¿Está seguro de eliminar el horario <strong>${evento.title}</strong> del ${evento.startStr.slice(0, 10)} a las ${evento.extendedProps.hora}?</p>
        <p class="text-muted">Esta acción eliminará el horario para todos los ${obtenerNombreDiaSemana(evento.startStr)} futuros.</p>
    `;
    
    modalFooter.innerHTML = '';
    const cancelarBtn = document.createElement('button');
    cancelarBtn.className = 'btn btn-secondary';
    cancelarBtn.setAttribute('data-bs-dismiss','modal');
    cancelarBtn.textContent = 'Cancelar';
    modalFooter.appendChild(cancelarBtn);
    
    const eliminarBtn = document.createElement('button');
    eliminarBtn.className = 'btn btn-danger';
    eliminarBtn.textContent = 'Eliminar';
    eliminarBtn.addEventListener('click', async () => {
        try {
            const res = await fetch(`/api/acto/horario/eliminar/${idActoParroquia}`, {
                method: 'DELETE'
            });
            
            const data = await res.json();
            if (data.ok || data.success) {
                alert('Horario eliminado correctamente');
                bootstrap.Modal.getInstance(document.getElementById('infoModal')).hide();
                if (rol === 'sacerdote') {
                    await window.calendarioFunctions.recargarHorarios();
                } else {
                    location.reload();
                }
            } else {
                alert('Error: ' + (data.mensaje || 'No se pudo eliminar el horario'));
            }
        } catch (error) {
            console.error('Error eliminando horario:', error);
            alert('Error al eliminar el horario');
        }
    });
    modalFooter.appendChild(eliminarBtn);
    
    const modal = new bootstrap.Modal(document.getElementById('infoModal'));
    modal.show();
}

console.log("✅ Módulo calendario-modals.js cargado correctamente");
