document.addEventListener('DOMContentLoaded', async function () {

    const contenedorFechas = document.querySelector('.fechas');
    const contenedorFechasHorarios = document.querySelector('.fechas-horarios');
    const filtrosSuperiores = document.getElementById('filtros-superiores');
    const filtrosHorarios = document.getElementById('filtros-horarios');
    const btnRegresar = document.getElementById('btn-regresar-mapa');
    const tabsSacerdote = document.getElementById('tabs-sacerdote');

    // === DATOS DESDE EL BODY ===
    const rol = document.body.dataset.rol?.toLowerCase();
    const idUsuario = document.body.dataset.id;
    let idParroquia = document.body.dataset.parroquia;

    // Si no hay idParroquia en la sesión, obtenerlo de sessionStorage (para feligres)
    if (!idParroquia && rol === 'feligres') {
        idParroquia = sessionStorage.getItem('idParroquiaSeleccionada');
        if (idParroquia) {
            // Guardar en la sesión del servidor
            fetch(`/cliente/calendario?idParroquia=${idParroquia}`, { method: 'GET' });
        }
    }

    console.log("ROL:", rol, "ID:", idUsuario, "PARROQUIA:", idParroquia);

    // Mostrar tabs solo para sacerdote
    if (rol === 'sacerdote' && tabsSacerdote) {
        tabsSacerdote.style.display = 'flex';
    }

    // Ocultar botón regresar para sacerdote y secretaria
    if (rol === 'sacerdote' || rol === 'secretaria') {
        if (btnRegresar) btnRegresar.style.display = 'none';
    } else {
        if (btnRegresar) btnRegresar.style.display = 'block';
    }

    // Variables globales para calendarios
    let calendar = null;
    let calendarHorarios = null;
    let datosEjemplo = [];
    let datosFiltrados = [];
    let horariosEjemplo = [];
    let horariosFiltrados = [];

    // =====================================================
    // 1. CARGAR DATOS DESDE API (Reservas o Horarios)
    // =====================================================
    async function cargarDatosDesdeAPI() {
        try {
            // Secretaria: cargar horarios disponibles de actos litúrgicos
            if (rol === "secretaria" && idParroquia) {
                return await cargarHorariosDisponibles(idParroquia);
            }
            
            // Feligres y Sacerdote: cargar reservas
            let url = "";
            if (rol === "feligres") url = `/api/reserva/feligres/${idUsuario}`;
            else if (rol === "sacerdote") url = `/api/reserva/sacerdote/${idUsuario}`;

            if (!url) return [];

            const res = await fetch(url);
            const data = await res.json();
            console.log("DATA:", data);

            if (!data.success) return [];

            return data.datos.map(r => ({
                titulo: r.nombreActo || r.nombActo || r.acto || "Sin nombre",
                fecha: (r.fecha || r.f_reserva) ? (r.fecha || r.f_reserva).slice(0, 10) : null,
                hora: (r.hora || r.h_reserva) ? (r.hora || r.h_reserva).slice(0, 5) : "00:00",
                estado: r.estadoReserva || "SIN_ESTADO",
                participantes: r.participantes || "desconocido",
                descripcion: r.mencion || r.descripcion || "",
                idReserva: r.idReserva || null,
                costoBase: r.costoBase || null,
                parroquia: r.nombreParroquia || r.nombParroquia || "",
                tipo: 'reserva'
            }));

        } catch (error) {
            console.error("Error cargando API:", error);
            return [];
        }
    }

    // Cargar horarios disponibles para secretaria
    async function cargarHorariosDisponibles(idParroquia) {
        try {
            // Obtener todos los actos de la parroquia
            const resActos = await fetch(`/api/acto/${idParroquia}`);
            const dataActos = await resActos.json();
            
            if (!dataActos.success || !dataActos.datos) return [];

            const horarios = [];
            
            // Para cada acto, obtener sus horarios disponibles
            for (const acto of dataActos.datos) {
                const resDisponibilidad = await fetch(`/api/acto/disponibilidad/${idParroquia}/${acto.id}`);
                const dataDisponibilidad = await resDisponibilidad.json();
                
                if (dataDisponibilidad.success && dataDisponibilidad.datos) {
                    dataDisponibilidad.datos.forEach(horario => {
                        const diaSemana = horario.diaSemana;
                        const hora = horario.horaInicioActo;
                        
                        // Obtener próximas fechas para este día de la semana
                        const proximasFechas = obtenerProximasFechasPorDia(diaSemana, 12); // 12 semanas
                        
                        proximasFechas.forEach(fecha => {
                            horarios.push({
                                titulo: acto.acto,
                                fecha: fecha,
                                hora: hora,
                                estado: "DISPONIBLE",
                                participantes: "",
                                descripcion: "",
                                idReserva: null,
                                costoBase: acto.costoBase || 0,
                                parroquia: "",
                                idActo: acto.id,
                                idActoParroquia: horario.idActoParroquia,
                                diaSemana: diaSemana,
                                tipo: 'horario'
                            });
                        });
                    });
                }
            }
            
            return horarios;
        } catch (error) {
            console.error("Error cargando horarios parroquia:", error);
            return [];
        }
    }

    // Obtener próximas fechas para un día de la semana específico
    function obtenerProximasFechasPorDia(diaSemana, semanas = 12) {
        const diasMap = {
            'LUN': 1, 'MAR': 2, 'MIE': 3, 'JUE': 4, 'VIE': 5, 'SAB': 6, 'DOM': 0
        };
        
        const diaNum = diasMap[diaSemana.toUpperCase()];
        if (diaNum === undefined) return [];
        
        const fechas = [];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        
        // Encontrar el próximo día de la semana
        let fecha = new Date(hoy);
        const diaActual = fecha.getDay();
        let diasHastaProximo = (diaNum - diaActual + 7) % 7;
        if (diasHastaProximo === 0) diasHastaProximo = 7;
        
        fecha.setDate(fecha.getDate() + diasHastaProximo);
        
        // Generar fechas para las próximas semanas
        for (let i = 0; i < semanas; i++) {
            const fechaStr = fecha.toISOString().slice(0, 10);
            fechas.push(fechaStr);
            fecha.setDate(fecha.getDate() + 7);
        }
        
        return fechas;
    }

    // Cargar datos iniciales
    datosEjemplo = await cargarDatosDesdeAPI();
    
    // Filtrar por estado CONFIRMADO y ATENDIDO para feligres y sacerdote (no para secretaria)
    if (rol === 'feligres' || rol === 'sacerdote') {
        datosEjemplo = datosEjemplo.filter(r => 
            r.estado === 'CONFIRMADO' || r.estado === 'ATENDIDO'
        );
    }
    
    datosFiltrados = [...datosEjemplo];

    // Cargar horarios para sacerdote (tab gestión) y feligres (solo ver)
    if ((rol === 'sacerdote' || rol === 'feligres') && idParroquia) {
        horariosEjemplo = await cargarHorariosDisponibles(idParroquia);
        horariosFiltrados = [...horariosEjemplo];
    }

    // =====================================================
    // 2. FILTROS INICIALES (EN LA PARTE SUPERIOR)
    // =====================================================
    const actosLiturgicos = [...new Set(datosEjemplo.map(r => r.titulo))];

    if (rol === 'secretaria' || rol === 'sacerdote') {
        const filtroActoDiv = document.createElement('div');
        filtroActoDiv.style.display = 'flex';
        filtroActoDiv.style.alignItems = 'center';
        filtroActoDiv.style.gap = '10px';
        filtroActoDiv.innerHTML = `
            <label for="filtroActo" style="margin-bottom:0; font-weight:500; color:#1e3a8a;">Filtrar por acto:</label>
            <select id="filtroActo" class="form-select" style="max-width: 300px;">
                <option value="todos">Todos</option>
                ${actosLiturgicos.map(a => `<option value="${a}">${a}</option>`).join('')}
            </select>
        `;
        filtrosSuperiores.appendChild(filtroActoDiv);
    }

    // Filtro para horarios (sacerdote)
    if (rol === 'sacerdote' && horariosEjemplo.length > 0) {
        const actosHorarios = [...new Set(horariosEjemplo.map(h => h.titulo))];
        const filtroHorariosDiv = document.createElement('div');
        filtroHorariosDiv.style.display = 'flex';
        filtroHorariosDiv.style.alignItems = 'center';
        filtroHorariosDiv.style.gap = '10px';
        filtroHorariosDiv.innerHTML = `
            <label for="filtroActoHorarios" style="margin-bottom:0; font-weight:500; color:#1e3a8a;">Filtrar por acto:</label>
            <select id="filtroActoHorarios" class="form-select" style="max-width: 300px;">
                <option value="todos">Todos</option>
                ${actosHorarios.map(a => `<option value="${a}">${a}</option>`).join('')}
            </select>
        `;
        filtrosHorarios.appendChild(filtroHorariosDiv);
    }

    if (rol === 'feligres') {
        if (datosEjemplo.length > 0) {
            datosFiltrados = datosEjemplo.filter(r => r.participantes.includes(datosEjemplo[0]?.participantes.split(';')[0]));
        }
    }

    // =====================================================
    // 3. CREAR CALENDARIO DE RESERVAS
    // =====================================================
    const calendarEl = document.createElement('div');
    calendarEl.id = 'calendar';
    contenedorFechas.appendChild(calendarEl);

    // Determinar si es calendario de horarios (secretaria siempre, sacerdote solo en tab reservas)
    const esCalendarioHorarios = rol === 'secretaria';
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        height: 'auto',
        initialView: esCalendarioHorarios ? 'timeGridWeek' : 'dayGridMonth',
        selectable: rol === 'secretaria',
        slotDuration: '01:00:00',
        slotLabelInterval: '01:00',
        allDaySlot: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: esCalendarioHorarios ? 'timeGridWeek' : 'dayGridMonth,timeGridWeek'
        },
        events: datosFiltrados.map(r => {
            const esHorario = r.tipo === 'horario';
            const fechaHora = esHorario ? `${r.fecha}T${r.hora}:00` : r.fecha;
            
            return {
                title: r.titulo,
                start: fechaHora,
                color: r.estado === 'CONFIRMADO' ? '#4caf50' 
                    : r.estado === 'ATENDIDO' ? '#2196f3'
                    : r.estado === 'DISPONIBLE' ? '#10b981'
                    : r.estado === 'PENDIENTE_PAGO' ? '#fbc02d' 
                    : '#f44336',
                allDay: !esHorario,
                extendedProps: {
                    tipo: r.tipo || 'reserva',
                    idReserva: r.idReserva,
                    idActoParroquia: r.idActoParroquia,
                    idActo: r.idActo,
                    diaSemana: r.diaSemana,
                    hora: r.hora,
                    estado: r.estado
                }
            };
        }),
        dateClick: function(info) {
            if (rol === 'secretaria') {
                mostrarModalAgregarHorario(info.dateStr.slice(0, 10));
            } else {
                mostrarDatosDelDia(info.dateStr.slice(0, 10));
            }
        },
        eventClick: function(info) {
            if (rol === 'secretaria' && info.event.extendedProps.tipo === 'horario') {
                mostrarModalEliminarHorario(info.event);
            } else {
                mostrarDatosDelDia(info.event.startStr.slice(0,10));
            }
        }
    });

    calendar.render();

    // =====================================================
    // 4. CREAR CALENDARIO DE HORARIOS (SACERDOTE)
    // =====================================================
    if (rol === 'sacerdote' && contenedorFechasHorarios) {
        const calendarHorariosEl = document.createElement('div');
        calendarHorariosEl.id = 'calendar-horarios';
        contenedorFechasHorarios.appendChild(calendarHorariosEl);

        calendarHorarios = new FullCalendar.Calendar(calendarHorariosEl, {
            locale: 'es',
            height: 'auto',
            initialView: 'timeGridWeek',
            selectable: true,
            slotDuration: '01:00:00',
            slotLabelInterval: '01:00',
            allDaySlot: true,
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek'
            },
            events: horariosFiltrados.map(h => ({
                title: h.titulo,
                start: `${h.fecha}T${h.hora}:00`,
                color: '#10b981',
                allDay: false,
                extendedProps: {
                    tipo: 'horario',
                    idActoParroquia: h.idActoParroquia,
                    idActo: h.idActo,
                    diaSemana: h.diaSemana,
                    hora: h.hora,
                    estado: 'DISPONIBLE'
                }
            })),
            dateClick: function(info) {
                mostrarModalAgregarHorario(info.dateStr.slice(0, 10));
            },
            eventClick: function(info) {
                if (info.event.extendedProps.tipo === 'horario') {
                    mostrarModalEliminarHorario(info.event);
                }
            }
        });

        calendarHorarios.render();
    }

    // =====================================================
    // 5. FILTROS DINÁMICOS
    // =====================================================
    if (rol === 'secretaria' || rol === 'sacerdote') {
        const filtroActo = document.getElementById('filtroActo');
        if (filtroActo) {
            filtroActo.addEventListener('change', (e) => {
            const valor = e.target.value;
                let datosTemp = valor === 'todos'
                    ? datosEjemplo
                    : datosEjemplo.filter(r => r.titulo === valor);
                
                // Mantener filtro de estado para sacerdote
                if (rol === 'sacerdote') {
                    datosTemp = datosTemp.filter(r => 
                        r.estado === 'CONFIRMADO' || r.estado === 'ATENDIDO'
                    );
                }
                
                datosFiltrados = datosTemp;
            actualizarEventos();
        });
        }
    }

    // Filtro para horarios (sacerdote)
    if (rol === 'sacerdote') {
        const filtroActoHorarios = document.getElementById('filtroActoHorarios');
        if (filtroActoHorarios) {
            filtroActoHorarios.addEventListener('change', (e) => {
                const valor = e.target.value;
                horariosFiltrados = valor === 'todos'
                    ? horariosEjemplo
                    : horariosEjemplo.filter(h => h.titulo === valor);
                
                actualizarEventosHorarios();
            });
        }

        // Manejar cambio de tabs
        const tabReservas = document.getElementById('tab-reservas');
        const tabHorarios = document.getElementById('tab-horarios');
        
        if (tabReservas && tabHorarios) {
            tabReservas.addEventListener('click', () => {
                if (calendar) calendar.render();
            });
            
            tabHorarios.addEventListener('click', () => {
                if (calendarHorarios) calendarHorarios.render();
            });
        }
    }

// ================= MODAL MOSTRAR DATOS DEL DÍA ===================
function mostrarDatosDelDia(fecha) {
    const datosDelDia = datosFiltrados.filter(r => r.fecha === fecha);

    const modalTitulo = document.getElementById('modalTitulo');
    const modalCuerpo = document.getElementById('modalCuerpo');
    const modalFooter = document.querySelector('#infoModal .modal-footer');

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
    if ((rol !== 'secretaria' && rol !== 'sacerdote') || !idParroquia) return;
    
    try {
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
        
        const nombreDia = obtenerNombreDiaSemana(fecha);
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
                    // Individual: un día de la semana a una hora específica (ej: todos los martes a las 8)
                    const hora = document.getElementById('inputHora').value;
                    
                    if (!hora) {
                        mostrarMensajeValidacion('Por favor seleccione una hora');
                        return;
                    }
                    
                    // Validar si ya existe este horario
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
                            horariosEjemplo = await cargarHorariosDisponibles(idParroquia);
                            horariosFiltrados = [...horariosEjemplo];
                            actualizarEventosHorarios();
                        } else {
                            location.reload();
                        }
                    } else {
                        mostrarMensajeValidacion('Error: ' + (data.mensaje || 'No se pudo agregar el horario'));
                    }
                } else {
                    // Grupal: múltiples horas en el mismo día de la semana (ej: miércoles a las 8, 9, 10)
                    const horasSeleccionadas = Array.from(document.querySelectorAll('input[name="horasGrupales"]:checked'))
                        .map(cb => cb.value)
                        .sort();
                    
                    if (horasSeleccionadas.length === 0) {
                        mostrarMensajeValidacion('Por favor seleccione al menos una hora');
                        return;
                    }
                    
                    let agregados = 0;
                    let errores = [];
                    
                    // Agregar cada hora individualmente (cada una se guarda como un registro separado)
                    for (const hora of horasSeleccionadas) {
                        // Validar si ya existe este horario
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
                            horariosEjemplo = await cargarHorariosDisponibles(idParroquia);
                            horariosFiltrados = [...horariosEjemplo];
                            actualizarEventosHorarios();
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

// Validar si hay reservas en un horario específico
async function validarReservasEnHorario(idParroquia, fecha, hora, esGrupal) {
    try {
        // Obtener reservas de la parroquia para esa fecha
        let url = '';
        if (rol === 'secretaria') {
            url = `/api/reserva/secretaria/${idUsuario}`;
        } else if (rol === 'sacerdote') {
            // Para sacerdote, usar la API de secretaria con su idUsuario
            // Esto funcionará si el sacerdote tiene acceso a la parroquia
            url = `/api/reserva/secretaria/${idUsuario}`;
        }
        
        if (!url) return { existe: false, mensaje: '' };
        
        const res = await fetch(url);
        const data = await res.json();
        
        if (!data.success) return { existe: false, mensaje: '' };
        
        // Filtrar solo reservas confirmadas y atendidas
        const reservasValidas = data.datos.filter(r => {
            const estado = r.estadoReserva || r.estado;
            return estado === 'CONFIRMADO' || estado === 'ATENDIDO';
        });
        
        // Buscar reservas en esa fecha y hora
        const reservasEnHorario = reservasValidas.filter(r => {
            const fechaReserva = (r.fecha || r.f_reserva) ? (r.fecha || r.f_reserva).slice(0, 10) : null;
            const horaReserva = (r.hora || r.h_reserva) ? (r.hora || r.h_reserva).slice(0, 5) : null;
            return fechaReserva === fecha && horaReserva === hora;
        });
        
        if (reservasEnHorario.length > 0) {
            const actos = reservasEnHorario.map(r => r.nombreActo || r.nombActo || r.acto || 'Acto').join(', ');
            return {
                existe: true,
                mensaje: `No se puede agregar el horario porque ya existe ${reservasEnHorario.length} reserva(s) confirmada(s) o atendida(s) a las ${hora} del ${fecha}. Acto(s): ${actos}`
            };
        }
        
        return { existe: false, mensaje: '' };
    } catch (error) {
        console.error('Error validando reservas:', error);
        return { existe: false, mensaje: '' };
    }
}

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

// Generar checkboxes para horas grupales
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

// ================= MODAL ELIMINAR HORARIO (SECRETARIA Y SACERDOTE) ===================
async function mostrarModalEliminarHorario(evento) {
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
                    // Recargar solo horarios
                    horariosEjemplo = await cargarHorariosDisponibles(idParroquia);
                    horariosFiltrados = [...horariosEjemplo];
                    actualizarEventosHorarios();
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

// ================= ACTUALIZAR EVENTOS ===================
function actualizarEventos() {
    if (!calendar) return;
    calendar.getEvents().forEach(ev => ev.remove());
    datosFiltrados.forEach(r => {
        let color = '';
        switch(r.estado){
            case 'CONFIRMADO': color = '#4caf50'; break;
            case 'ATENDIDO': color = '#2196f3'; break;
            case 'PENDIENTE_PAGO': color = '#fbc02d'; break;
            case 'CANCELADO': color = '#f44336'; break;
            default: color = '#9e9e9e';
        }

        calendar.addEvent({
            title: r.titulo,
            start: r.fecha,
            color: color,
            allDay: true,
            extendedProps: {
                tipo: 'reserva',
                idReserva: r.idReserva,
                hora: r.hora,
                estado: r.estado
            }
        });
    });
}

// ================= ACTUALIZAR EVENTOS HORARIOS ===================
function actualizarEventosHorarios() {
    if (!calendarHorarios) return;
    calendarHorarios.getEvents().forEach(ev => ev.remove());
    horariosFiltrados.forEach(h => {
        calendarHorarios.addEvent({
            title: h.titulo,
            start: `${h.fecha}T${h.hora}:00`,
            color: '#10b981',
            allDay: false,
            extendedProps: {
                tipo: 'horario',
                idActoParroquia: h.idActoParroquia,
                idActo: h.idActo,
                diaSemana: h.diaSemana,
                hora: h.hora,
                estado: 'DISPONIBLE'
            }
        });
    });
}

});
