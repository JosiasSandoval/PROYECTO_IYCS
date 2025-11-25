document.addEventListener('DOMContentLoaded', async function () {

    const contenedorFechas = document.querySelector('.fechas');

    // === DATOS DESDE EL BODY ===
    const rol = document.body.dataset.rol?.toLowerCase();
    const idUsuario = document.body.dataset.id;
    const idParroquia = document.body.dataset.parroquia;

    console.log("ROL:", rol, "ID:", idUsuario, "PARROQUIA:", idParroquia);

    // =====================================================
    // 1. CARGAR RESERVAS DESDE API
    // =====================================================
    async function cargarReservasDesdeAPI() {
        try {
            let url = "";
            if (rol === "feligres") url = `/api/reserva/feligres/${idUsuario}`;
            else if (rol === "secretaria") url = `/api/reserva/secretaria/${idUsuario}`;
            else if (rol === "sacerdote") url = `/api/reserva/sacerdote/${idParroquia}`;

            const res = await fetch(url);
            const data = await res.json();
            console.log("DATA:", data);

            if (!data.success) return [];

            return data.datos.map(r => ({
                titulo: r.acto || r.nombreActo || "Sin nombre",
                fecha: r.fecha ? r.fecha.slice(0, 10) : null,
                hora: r.hora ? r.hora.slice(0, 5) : "00:00",
                estado: r.estadoReserva || "SIN_ESTADO",
                participantes: r.participantes || "desconocido",
                descripcion: r.descripcion || "",
                idReserva: r.idReserva || null,
                costoBase: r.costoBase || null,
                parroquia: r.nombreParroquia || ""
            }));

        } catch (error) {
            console.error("Error cargando API:", error);
            return [];
        }
    }

    let reservasEjemplo = await cargarReservasDesdeAPI();
    let reservasFiltradas = [...reservasEjemplo];

    // =====================================================
    // 2. FILTROS INICIALES
    // =====================================================
    const actosLiturgicos = [...new Set(reservasEjemplo.map(r => r.titulo))];

    if (rol === 'secretaria' || rol === 'sacerdote') {
        const accionesDiv = document.querySelector('.acciones-calendario');
        const filtroDiv = document.createElement('div');
        filtroDiv.style.display = 'flex';
        filtroDiv.style.alignItems = 'center';
        filtroDiv.style.gap = '10px';
        filtroDiv.innerHTML = `
            <label for="filtroActo" style="margin-bottom:0; font-weight:500; color:#1e3a8a;">Filtrar por acto:</label>
            <select id="filtroActo" class="form-select">
                <option value="todos">Todos</option>
                ${actosLiturgicos.map(a => `<option value="${a}">${a}</option>`).join('')}
            </select>
        `;
        accionesDiv.insertBefore(filtroDiv, accionesDiv.firstChild);
    }

    if (rol === 'feligres') {
        // Asegurarse de que reservasEjemplo tenga al menos un elemento antes de acceder a sus propiedades
        if (reservasEjemplo.length > 0) {
            reservasFiltradas = reservasEjemplo.filter(r => r.participantes.includes(reservasEjemplo[0]?.participantes.split(';')[0]));
        }
    }

    // =====================================================
    // 3. CREAR CALENDARIO
    // =====================================================
    const calendarEl = document.createElement('div');
    calendarEl.id = 'calendar';
    contenedorFechas.appendChild(calendarEl);

    const calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        height: 'auto',
        initialView: rol === 'sacerdote' ? 'timeGridWeek' : 'dayGridMonth',
        selectable: rol !== 'sacerdote',
        slotDuration: '01:00:00',
        slotLabelInterval: '01:00',
        allDaySlot: true,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: rol === 'sacerdote' ? 'timeGridWeek' : 'dayGridMonth,timeGridWeek'
        },
        events: reservasFiltradas.map(r => ({
            title: rol === 'secretaria' ? `${r.titulo}` : r.titulo,
            start: r.fecha,
            // AQUI ESTÁ EL AJUSTE CLAVE: Incluir 'ATENDIDO' para que no caiga en el default rojo
            color: r.estado === 'CONFIRMADO' ? '#4caf50' 
                : r.estado === 'ATENDIDO' ? '#2196f3' // <-- Nuevo caso para ATENDIDO (azul/info)
                : r.estado === 'PENDIENTE_PAGO' ? '#fbc02d' 
                : '#f44336', // Default (CANCELADO)
            allDay: true
        })),
        dateClick: function(info) {
            mostrarReservasDelDia(info.dateStr.slice(0, 10));
        },
        eventClick: function(info) {
            mostrarReservasDelDia(info.event.startStr.slice(0,10));
        }
    });

    calendar.render();

    // =====================================================
    // 4. FILTROS DINÁMICOS
    // =====================================================
    if (rol === 'secretaria' || rol === 'sacerdote') {
        document.getElementById('filtroActo').addEventListener('change', (e) => {
            const valor = e.target.value;
            reservasFiltradas = valor === 'todos'
                ? reservasEjemplo
                : reservasEjemplo.filter(r => r.titulo === valor);
            actualizarEventos();
        });
    }

// ================= MODAL ===================
function mostrarReservasDelDia(fecha) {
    const reservasDelDia = reservasFiltradas.filter(r => r.fecha === fecha);

    const modalTitulo = document.getElementById('modalTitulo');
    const modalCuerpo = document.getElementById('modalCuerpo');
    const modalFooter = document.querySelector('#infoModal .modal-footer');

    modalTitulo.textContent = `Reservas del ${fecha}`;
    modalCuerpo.innerHTML = '';

    if (reservasDelDia.length === 0) {
        modalCuerpo.innerHTML = `<p class="text-center">No hay reservas para este día.</p>`;
    } else {
        reservasDelDia.forEach((r, index) => {
            // Definir color según estado
            let colorClase = '';
            switch(r.estado) {
                case 'CONFIRMADO': colorClase = 'bg-success'; break;
                case 'ATENDIDO': colorClase = 'bg-info'; break; // Ya tienes 'bg-info' para ATENDIDO en el modal
                case 'PENDIENTE_PAGO': colorClase = 'bg-warning'; break;
                case 'CANCELADO': colorClase = 'bg-danger'; break;
                default: colorClase = 'bg-secondary';
            }

            // Formato agradable de participantes
            const participantesHtml = r.participantes.split(';').map(p => {
                let [rol, nombre] = p.split(':').map(s => s.trim());
                if(!rol || !nombre) return '';
                if(rol.toLowerCase() === 'beneficiario_s_') rol = 'Beneficiario(s)';
                else rol = rol.charAt(0).toUpperCase() + rol.slice(1);
                return `<p class="mb-1"><span class="fw-bold">${rol}:</span> ${nombre}</p>`;
            }).join('');

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
        });
    }

    modalFooter.innerHTML = '';
    const cerrarBtn = document.createElement('button');
    cerrarBtn.className = 'btn btn-secondary';
    cerrarBtn.setAttribute('data-bs-dismiss','modal');
    cerrarBtn.textContent = 'Cerrar';
    modalFooter.appendChild(cerrarBtn);

    const nuevaReservaBtn = document.createElement('button');
    nuevaReservaBtn.className = 'btn btn-primary';
    nuevaReservaBtn.textContent = 'Nueva Reserva';
    nuevaReservaBtn.addEventListener('click', () => {
        window.location.href = '/cliente/reserva';
    });
    modalFooter.appendChild(nuevaReservaBtn);

    // Asegurarse de que 'infoModal' y 'bootstrap' estén definidos
    // Este código asume que tienes el modal HTML y la librería Bootstrap cargados
    try {
        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        modal.show();
    } catch(e) {
        console.error("Error al mostrar el modal. Asegúrate de que Bootstrap y el elemento #infoModal estén cargados.", e);
    }


    // Flechas ▲▼ para mostrar/ocultar detalles
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

// ================= COLOR EVENTOS ===================
function actualizarEventos() {
    calendar.getEvents().forEach(ev => ev.remove());
    reservasFiltradas.forEach(r => {
        let color = '';
        switch(r.estado){
            case 'CONFIRMADO': color = '#4caf50'; break; // Verde
            case 'ATENDIDO': color = '#2196f3'; break; // Azul
            case 'PENDIENTE_PAGO': color = '#fbc02d'; break; // Amarillo/Naranja
            case 'CANCELADO': color = '#f44336'; break; // Rojo
            default: color = '#9e9e9e'; // Gris
        }

        calendar.addEvent({
            title: rol === 'secretaria' ? `${r.titulo}` : r.titulo,
            start: r.fecha,
            color: color,
            allDay: true
        });
    });
}


});