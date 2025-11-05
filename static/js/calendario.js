document.addEventListener('DOMContentLoaded', function () { 
    const contenedorFechas = document.querySelector('.fechas');
    const rol = contenedorFechas.dataset.rol; // "usuario", "secretaria", "sacerdote"

    const usuarios = ['usuario1', 'usuario2', 'usuario3'];
    const actosLiturgicos = [...new Set(['Misa dominical', 'Bautizo', 'Misa especial', 'Confesión', 'Matrimonio'])];

    // =============================
    // Filtrado para secretaria
    // =============================
    if (rol === 'secretaria') {
        const accionesDiv = document.querySelector('.acciones-calendario');
        const filtroDiv = document.createElement('div');
        filtroDiv.style.display = 'flex';
        filtroDiv.style.alignItems = 'center';
        filtroDiv.style.gap = '5px';
        filtroDiv.innerHTML = `
            <label for="filtroUsuario" style="margin-bottom:0; font-weight:500; color:#1e3a8a;">Filtrar:</label>
            <select id="filtroUsuario" class="form-select">
                <option value="todos">Todos</option>
                ${usuarios.map(u => `<option value="${u}">${u}</option>`).join('')}
            </select>
        `;
        accionesDiv.insertBefore(filtroDiv, accionesDiv.firstChild);
    }

    // =============================
    // Filtrado para sacerdote
    // =============================
    if (rol === 'sacerdote') {
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

    // =============================
    // Reservas de ejemplo
    // =============================
    const reservasEjemplo = [
        { titulo: 'Misa dominical', fecha: '2025-11-03', hora: '09:00', estado: 'confirmado', info: 'Iglesia principal, traer Biblia', usuario: 'usuario1' },
        { titulo: 'Bautizo', fecha: '2025-11-03', hora: '17:00', estado: 'pendiente', info: 'Traer toalla y ropa blanca', usuario: 'usuario2' },
        { titulo: 'Misa especial', fecha: '2025-11-12', hora: '08:00', estado: 'confirmado', info: 'Iglesia secundaria, llegada 15 min antes', usuario: 'usuario2' },
        { titulo: 'Confesión', fecha: '2025-11-12', hora: '10:00', estado: 'pendiente', info: 'Solo adultos', usuario: 'usuario1' },
        { titulo: 'Matrimonio', fecha: '2025-11-15', hora: '16:00', estado: 'pendiente', info: 'Llegar 30 min antes', usuario: 'usuario3' },
    ];

    // =============================
    // Inicializar reservas filtradas
    // =============================
    let reservasFiltradas;
    if (rol === 'usuario') {
        reservasFiltradas = reservasEjemplo.filter(r => r.usuario === 'usuario1');
    } else {
        reservasFiltradas = reservasEjemplo;
    }

    // =============================
    // Crear calendario
    // =============================
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
        allDaySlot: false,   
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: rol === 'sacerdote' ? 'timeGridWeek' : 'dayGridMonth,timeGridWeek'
        },
        events: reservasFiltradas.map(r => ({
            title: rol === 'secretaria' ? `${r.titulo} (${r.usuario})` : r.titulo,
            start: `${r.fecha}T${r.hora}`,
            color: r.estado === 'confirmado' ? '#4caf50' : '#fbc02d'
        })),
        dateClick: function(info) {
            const fecha = info.dateStr;
            if (rol === 'secretaria' || rol === 'sacerdote') {
                mostrarReservasDelDia(fecha);
            } else if (rol === 'usuario') {
                if (info.view.type.startsWith('dayGrid')) {
                    mostrarHorarios(info.dateStr);
                } else {
                    const hora = info.dateStr.slice(11,16); 
                    mostrarConfirmacion(info.dateStr.slice(0,10), hora);
                }
            }
        },
        eventClick: function(info) {
            const fecha = info.event.startStr.slice(0,10);
            if (rol === 'secretaria' || rol === 'sacerdote') {
                mostrarReservasDelDia(fecha);
            } else {
                const hora = info.event.startStr.slice(11,16);
                if (info.view.type.startsWith('timeGrid')) {
                    mostrarConfirmacion(fecha, hora);
                } else {
                    mostrarDetallesReserva(info.event);
                }
            }
        }
    });

    calendar.render();

    // =============================
    // Filtros dinámicos
    // =============================
    if (rol === 'secretaria') {
        document.getElementById('filtroUsuario').addEventListener('change', (e) => {
            const valor = e.target.value;
            reservasFiltradas = valor === 'todos' 
                ? reservasEjemplo 
                : reservasEjemplo.filter(r => r.usuario === valor);

            actualizarEventos();
        });
    }

    if (rol === 'sacerdote') {
        document.getElementById('filtroActo').addEventListener('change', (e) => {
            const valor = e.target.value;
            reservasFiltradas = valor === 'todos' 
                ? reservasEjemplo 
                : reservasEjemplo.filter(r => r.titulo === valor);

            actualizarEventos();
        });
    }

    function actualizarEventos() {
        calendar.getEvents().forEach(ev => ev.remove());
        reservasFiltradas.forEach(r => {
            calendar.addEvent({
                title: rol === 'secretaria' ? `${r.titulo} (${r.usuario})` : r.titulo,
                start: `${r.fecha}T${r.hora}`,
                color: r.estado === 'confirmado' ? '#4caf50' : '#fbc02d'
            });
        });
    }

    // =============================
    // Mostrar reservas de un día (mejorada)
    // =============================
    function mostrarReservasDelDia(fecha) {
        const reservasDelDia = reservasFiltradas.filter(r => r.fecha === fecha);
        const modalTitulo = document.getElementById('modalTitulo');
        const modalCuerpo = document.getElementById('modalCuerpo');
        const modalFooter = document.querySelector('#infoModal .modal-footer');

        modalTitulo.textContent = `Reservas del ${fecha}`;
        modalCuerpo.innerHTML = reservasDelDia.length === 0
            ? `<p class="text-center">No hay reservas para este día.</p>`
            : reservasDelDia.map((r, index) => `
                <div class="reserva-item border rounded p-2 mb-2 shadow-sm">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${r.titulo}</strong> 
                            <span class="text-muted">(${r.usuario})</span> 
                            <span class="badge bg-${r.estado === 'confirmado' ? 'success' : 'warning'} ms-1">${r.estado}</span>
                            <div><small><i class="bi bi-clock"></i> ${r.hora}</small></div>
                        </div>
                        <button class="btn btn-sm btn-outline-primary btn-ver-detalles" data-index="${index}">▼</button>
                    </div>
                    <div class="detalles mt-2 ps-3" style="display:none;">
                        <p class="mb-1"><strong>Descripción:</strong> ${r.info}</p>
                    </div>
                </div>
            `).join('');

        modalFooter.innerHTML = '';
        const cerrarBtn = document.createElement('button');
        cerrarBtn.className = 'btn btn-secondary';
        cerrarBtn.setAttribute('data-bs-dismiss', 'modal');
        cerrarBtn.textContent = 'Cerrar';
        modalFooter.appendChild(cerrarBtn);

        if (rol !== 'sacerdote') {
            const agregarBtn = document.createElement('button');
            agregarBtn.className = 'btn btn-success';
            agregarBtn.textContent = 'Agregar reserva';
            agregarBtn.style.marginLeft = '10px';
            agregarBtn.addEventListener('click', () => mostrarHorarios(fecha));
            modalFooter.appendChild(agregarBtn);
        }

        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        modal.show();

        document.querySelectorAll('.btn-ver-detalles').forEach(btn => {
            btn.addEventListener('click', () => {
                const detalles = btn.closest('.reserva-item').querySelector('.detalles');
                detalles.style.display = detalles.style.display === 'block' ? 'none' : 'block';
                btn.textContent = detalles.style.display === 'block' ? '▲' : '▼';
            });
        });
    }

    // =============================
    // Mostrar horarios disponibles
    // =============================
    function mostrarHorarios(fecha) {
        if (rol === 'sacerdote') return;
        const horas = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00'];
        const horasBloqueadas = reservasFiltradas.filter(r => r.fecha === fecha).map(r => r.hora);

        const modalTitulo = document.getElementById('modalTitulo');
        const modalCuerpo = document.getElementById('modalCuerpo');
        const modalFooter = document.querySelector('#infoModal .modal-footer');

        modalTitulo.textContent = `Selecciona una hora para ${fecha}`;
        modalCuerpo.innerHTML = `
            <div class="titulo-horarios">Horas disponibles</div>
            <div class="grid-horas">
                ${horas.map(h => `
                    <button class="hora-btn ${horasBloqueadas.includes(h) ? 'bloqueada' : ''}" 
                        data-hora="${h}" ${horasBloqueadas.includes(h) ? 'disabled' : ''}>
                        ${h}
                    </button>
                `).join('')}
            </div>
        `;

        modalFooter.innerHTML = '';
        const cerrarBtn = document.createElement('button');
        cerrarBtn.className = 'btn btn-secondary';
        cerrarBtn.setAttribute('data-bs-dismiss', 'modal');
        cerrarBtn.textContent = 'Cerrar';
        modalFooter.appendChild(cerrarBtn);

        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        modal.show();

        document.querySelectorAll('.hora-btn:not(.bloqueada)').forEach(btn => {
            btn.addEventListener('click', () => mostrarConfirmacion(fecha, btn.dataset.hora));
        });
    }

    // =============================
    // Confirmación de reserva
    // =============================
    function mostrarConfirmacion(fecha, hora) {
        if (rol === 'sacerdote') return;

        const modalTitulo = document.getElementById('modalTitulo');
        const modalCuerpo = document.getElementById('modalCuerpo');
        const modalFooter = document.querySelector('#infoModal .modal-footer');

        modalTitulo.textContent = 'Confirmar reserva';
        modalCuerpo.innerHTML = `<p class="confirmacion-texto">¿Deseas realizar tu reserva el <strong>${fecha}</strong> a las <strong>${hora}</strong>?</p>`;

        modalFooter.innerHTML = '';
        const cerrarBtn = document.createElement('button');
        cerrarBtn.className = 'btn btn-secondary';
        cerrarBtn.setAttribute('data-bs-dismiss', 'modal');
        cerrarBtn.textContent = 'Cerrar';

        const confirmarBtn = document.createElement('button');
        confirmarBtn.className = 'btn btn-success';
        confirmarBtn.textContent = 'Sí, confirmar';
        confirmarBtn.style.marginLeft = '10px';

        modalFooter.appendChild(cerrarBtn);
        modalFooter.appendChild(confirmarBtn);

        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        modal.show();

        confirmarBtn.addEventListener('click', () => {
            registrarReservaDemo(fecha, hora);
            modal.hide();
        });
    }

    // =============================
    // Mostrar detalles de un evento
    // =============================
    function mostrarDetallesReserva(event) {
        const modalTitulo = document.getElementById('modalTitulo');
        const modalCuerpo = document.getElementById('modalCuerpo');
        const modalFooter = document.querySelector('#infoModal .modal-footer');

        modalTitulo.textContent = 'Detalles de la reserva';
        modalCuerpo.innerHTML = `
            <p><strong>Evento:</strong> ${event.title}</p>
            <p><strong>Fecha:</strong> ${event.start.toLocaleDateString()}</p>
            <p><strong>Hora:</strong> ${event.start.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</p>
        `;

        modalFooter.innerHTML = '';
        const cerrarBtn = document.createElement('button');
        cerrarBtn.className = 'btn btn-secondary';
        cerrarBtn.setAttribute('data-bs-dismiss', 'modal');
        cerrarBtn.textContent = 'Cerrar';
        modalFooter.appendChild(cerrarBtn);

        const modal = new bootstrap.Modal(document.getElementById('infoModal'));
        modal.show();
    }

    // =============================
    // Función registrarReservaDemo
    // =============================
    function registrarReservaDemo(fecha, hora) {
        if (rol === 'sacerdote') return;

        const nueva = {
            title: rol === 'secretaria' ? `Reserva nueva (usuario1)` : 'Reserva nueva',
            start: `${fecha}T${hora}`,
            color: '#fbc02d',
            usuario: 'usuario1'
        };

        reservasFiltradas.push({
            titulo: 'Reserva nueva',
            fecha,
            hora,
            estado: 'pendiente',
            info: 'Información adicional',
            usuario: 'usuario1'
        });

        calendar.addEvent(nueva);
    }
});
