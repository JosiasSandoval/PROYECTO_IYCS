// =====================================================
// CALENDARIO - MÓDULO PRINCIPAL (CORE)
// Este archivo contiene la inicialización y renderizado de calendarios
// Las funciones de modales están en calendario-modals.js
// =====================================================

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

    console.log("📋 Datos iniciales del body:");
    console.log("  - rol:", rol);
    console.log("  - idUsuario:", idUsuario);
    console.log("  - idParroquia (inicial):", idParroquia);

    // Si no hay idParroquia, obtenerlo desde la API según el rol
    if ((!idParroquia || idParroquia === '') && rol === 'secretaria') {
        console.log("🔍 Secretaria sin idParroquia, consultando API...");
        try {
            const res = await fetch(`/api/parroquia/secretaria/${idUsuario}`);
            const data = await res.json();
            if (data.success && data.idParroquia) {
                idParroquia = data.idParroquia;
                console.log("✅ idParroquia obtenido de API:", idParroquia);
            } else {
                console.error("❌ No se pudo obtener idParroquia para secretaria:", data);
            }
        } catch (error) {
            console.error("❌ Error obteniendo idParroquia:", error);
        }
    }
    
    // Para sacerdote, obtener idParroquia desde perfil o usar una parroquia por defecto
    if ((!idParroquia || idParroquia === '') && rol === 'sacerdote') {
        console.log("🔍 Sacerdote sin idParroquia, intentando obtener desde perfil...");
        idParroquia = '1'; // TODO: Cambiar por lógica real
        console.log("⚠️ Usando idParroquia por defecto:", idParroquia);
    }

    // Si no hay idParroquia en la sesión, obtenerlo de sessionStorage (para feligres)
    if ((!idParroquia || idParroquia === '') && rol === 'feligres') {
        idParroquia = sessionStorage.getItem('idParroquiaSeleccionada');
        console.log("🔍 Feligrés: idParroquia desde sessionStorage:", idParroquia);
        if (idParroquia) {
            fetch(`/cliente/calendario?idParroquia=${idParroquia}`, { method: 'GET' });
        }
    }

    console.log("🎯 idParroquia final:", idParroquia);

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

    // Exportar estado global para calendario-modals.js
    window.calendarioState = {
        rol, idUsuario, idParroquia,
        calendar, calendarHorarios,
        datosEjemplo, datosFiltrados,
        horariosEjemplo, horariosFiltrados
    };

    // =====================================================
    // 1. CARGAR DATOS DESDE API (Reservas o Horarios)
    // =====================================================
    async function cargarDatosDesdeAPI() {
        try {
            console.log("📡 cargarDatosDesdeAPI() ejecutándose...");
            
            // 🔥 Si estamos en mis_reservas, esperar a que window.reservasParaCalendario exista
            const esPaginaMisReservas = window.location.pathname.includes('mis_reservas');
            if (esPaginaMisReservas) {
                console.log("⏳ Detectada página mis_reservas, esperando reservas...");
                
                // Esperar máximo 3 segundos a que las reservas se carguen
                let intentos = 0;
                while (!window.reservasParaCalendario && intentos < 30) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                    intentos++;
                }
                
                if (window.reservasParaCalendario) {
                    console.log("✅ Reservas encontradas después de", intentos * 100, "ms");
                } else {
                    console.log("⚠️ Timeout: No se cargaron reservas en 3 segundos");
                }
            }
            
            console.log("🔍 window.reservasParaCalendario existe?", !!window.reservasParaCalendario);
            console.log("🔍 Cantidad de reservas:", window.reservasParaCalendario?.length);
            
            // Si estamos en la página de mis_reservas y hay reservas disponibles
            if (window.reservasParaCalendario && window.reservasParaCalendario.length > 0) {
                console.log("📊 ✅ Usando reservas desde mis_reservas.js:", window.reservasParaCalendario.length);
                
                // Mapear las reservas al formato esperado por el calendario
                const reservasMapeadas = window.reservasParaCalendario.map(r => ({
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
                
                console.log("✅ Reservas mapeadas para calendario:", reservasMapeadas.length);
                return reservasMapeadas;
            }
            
            console.log("⚠️ NO hay reservasParaCalendario, continuando con lógica normal...");
            
            // Secretaria: cargar horarios disponibles de actos litúrgicos
            if (rol === "secretaria" && idParroquia) {
                console.log("👩‍💼 Secretaria detectada, cargando horarios...");
                return await cargarHorariosDisponibles(idParroquia);
            }
            
            // Feligres y Sacerdote: cargar reservas
            let url = "";
            if (rol === "feligres") {
                url = `/api/reserva/feligres/${idUsuario}`;
                console.log("🙏 Feligrés detectado, cargando reservas desde:", url);
            } else if (rol === "sacerdote") {
                url = `/api/reserva/sacerdote/${idUsuario}`;
                console.log("✝️ Sacerdote detectado, cargando reservas desde:", url);
            }

            if (!url) {
                console.warn("⚠️ No se pudo determinar la URL para cargar datos");
                return [];
            }

            const res = await fetch(url);
            const data = await res.json();
            console.log("📦 DATA recibida:", data);

            if (!data.success) {
                console.warn("⚠️ API respondió con success=false");
                return [];
            }

            const reservasMapeadas = data.datos.map(r => ({
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
            
            console.log("✅ Reservas mapeadas:", reservasMapeadas.length);
            return reservasMapeadas;

        } catch (error) {
            console.error("❌ Error cargando API:", error);
            return [];
        }
    }

    // Cargar horarios disponibles para secretaria y sacerdote
    async function cargarHorariosDisponibles(idParroquia) {
        try {
            console.log(`🔄 Cargando horarios para parroquia ${idParroquia}...`);
            
            // Usar la API consolidada que trae actos con sus horarios
            const res = await fetch(`/api/acto/parroquia/${idParroquia}/actos-horarios`);
            const data = await res.json();
            
            console.log("📦 Respuesta de actos-horarios:", data);
            
            if (!data.success || !data.datos || data.datos.length === 0) {
                console.warn("⚠️ No hay actos con horarios para esta parroquia");
                return [];
            }

            const horarios = [];
            
            // Para cada acto con sus horarios
            data.datos.forEach(acto => {
                console.log(`📋 Procesando acto: ${acto.acto} con ${acto.horarios?.length || 0} horarios`);
                
                if (!acto.horarios || acto.horarios.length === 0) {
                    console.warn(`⚠️ Acto ${acto.acto} sin horarios`);
                    return;
                }
                
                acto.horarios.forEach(horario => {
                    const diaSemana = horario.diaSemana;
                    let hora = horario.horaInicioActo;
                    
                    // Normalizar formato de hora a HH:MM
                    if (hora) {
                        // Si la hora viene como "9:00:00" o "9:00", convertir a "09:00"
                        const partesHora = hora.split(':');
                        if (partesHora.length >= 2) {
                            const horas = partesHora[0].padStart(2, '0');
                            const minutos = partesHora[1].padStart(2, '0');
                            hora = `${horas}:${minutos}`;
                        }
                    }
                    
                    // Obtener próximas fechas para este día de la semana
                    const proximasFechas = obtenerProximasFechasPorDia(diaSemana, 12); // 12 semanas
                    
                    console.log(`  📅 Día ${diaSemana} a las ${hora} → ${proximasFechas.length} fechas generadas`);
                    
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
            });
            
            console.log(`✅ Total de horarios generados: ${horarios.length}`);
            return horarios;
            
        } catch (error) {
            console.error("❌ Error cargando horarios parroquia:", error);
            return [];
        }
    }

    // Obtener próximas fechas para un día de la semana específico
    function obtenerProximasFechasPorDia(diaSemana, semanas = 12) {
        const diasMap = {
            'LUN': 1, 'MAR': 2, 'MIE': 3, 'MIÉ': 3, 'JUE': 4, 'VIE': 5, 'SAB': 6, 'SÁB': 6, 'DOM': 0,
            'LUNES': 1, 'MARTES': 2, 'MIÉRCOLES': 3, 'MIERCOLES': 3, 'JUEVES': 4, 'VIERNES': 5, 'SÁBADO': 6, 'SABADO': 6, 'DOMINGO': 0
        };
        
        const diaKey = diaSemana?.toUpperCase().trim();
        const diaNum = diasMap[diaKey];
        
        if (diaNum === undefined) {
            console.warn(`⚠️ Día de semana no reconocido: "${diaSemana}" (normalizado: "${diaKey}")`);
            return [];
        }
        
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
    console.log("🚀 Iniciando carga de datos...");
    console.log("  👤 Rol:", rol);
    console.log("  🆔 Usuario:", idUsuario);
    console.log("  ⛪ Parroquia:", idParroquia);
    
    datosEjemplo = await cargarDatosDesdeAPI();
    console.log("📊 Datos cargados desde API:", datosEjemplo.length);
    console.log("📋 Primeras 2 reservas:", datosEjemplo.slice(0, 2));
    
    // Filtrar SOLO reservas NO canceladas (mostrar todas menos CANCELADA)
    if (rol === 'feligres' || rol === 'sacerdote') {
        const antesFilter = datosEjemplo.length;
        datosEjemplo = datosEjemplo.filter(r => 
            r.estado !== 'CANCELADA' && r.estado !== 'CANCELADO'
        );
        console.log(`🔍 Filtrado excluyendo canceladas: ${antesFilter} → ${datosEjemplo.length}`);
        console.log(`📊 Estados presentes:`, [...new Set(datosEjemplo.map(r => r.estado))]);
    }
    
    datosFiltrados = [...datosEjemplo];
    console.log("✅ datosFiltrados final:", datosFiltrados.length);
    console.log("📋 Datos que irán al calendario:", datosFiltrados);

    // Cargar horarios para sacerdote (tab gestión) y feligres (solo ver)
    if ((rol === 'sacerdote' || rol === 'feligres') && idParroquia) {
        console.log("⏰ Cargando horarios disponibles...");
        console.log("  📍 idParroquia para cargar:", idParroquia);
        horariosEjemplo = await cargarHorariosDisponibles(idParroquia);
        console.log("✅ Horarios cargados:", horariosEjemplo.length);
        console.log("📦 Primeros 3 horarios:", horariosEjemplo.slice(0, 3));
        horariosFiltrados = [...horariosEjemplo];
    } else {
        console.warn("⚠️ NO se cargarán horarios porque:");
        console.warn("  - rol:", rol);
        console.warn("  - idParroquia:", idParroquia);
        console.warn("  - condición cumplida:", (rol === 'sacerdote' || rol === 'feligres') && idParroquia);
    }

    // =====================================================
    // 2. FILTROS INICIALES (EN LA PARTE SUPERIOR)
    // =====================================================
    const actosLiturgicos = [...new Set(datosEjemplo.map(r => r.titulo))];

    // Solo agregar filtros si existe el contenedor
    if ((rol === 'secretaria' || rol === 'sacerdote') && filtrosSuperiores) {
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
    if (rol === 'sacerdote' && horariosEjemplo.length > 0 && filtrosHorarios) {
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
    
    if (!contenedorFechas) {
        console.error("❌ No se encontró el contenedor .fechas");
        return;
    }
    
    contenedorFechas.appendChild(calendarEl);

    // Determinar la vista inicial según la página y el rol
    // En mis_reservas.html siempre es dayGridMonth
    // En calendario.html, secretaria usa timeGridWeek solo si está gestionando horarios
    const esPaginaMisReservas = window.location.pathname.includes('mis_reservas');
    const vistaInicial = esPaginaMisReservas ? 'dayGridMonth' : (rol === 'secretaria' ? 'timeGridWeek' : 'dayGridMonth');
    const opcionesVista = esPaginaMisReservas ? 'dayGridMonth,timeGridWeek' : (rol === 'secretaria' ? 'timeGridWeek' : 'dayGridMonth,timeGridWeek');
    
    calendar = new FullCalendar.Calendar(calendarEl, {
        locale: 'es',
        height: 'auto',
        initialView: vistaInicial,
        selectable: rol === 'secretaria' && !esPaginaMisReservas,
        slotDuration: '01:00:00',
        slotLabelInterval: '01:00',
        allDaySlot: false,
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: opcionesVista
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
                allDay: false,
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
            // Para sacerdote: solo responder si estamos en el tab de "Mis Reservas"
            if (rol === 'sacerdote') {
                const tabReservas = document.getElementById('tab-reservas');
                if (!tabReservas || !tabReservas.classList.contains('active')) {
                    console.log("⚠️ Click ignorado - no estás en el tab de Reservas");
                    return;
                }
            }
            
            // En mis_reservas.html: mostrar datos del día para todos
            // En calendario.html: secretaria agrega horarios, otros ven datos
            if (esPaginaMisReservas) {
                window.mostrarDatosDelDia(info.dateStr.slice(0, 10));
            } else if (rol === 'secretaria') {
                window.mostrarModalAgregarHorario(info.dateStr.slice(0, 10));
            } else {
                window.mostrarDatosDelDia(info.dateStr.slice(0, 10));
            }
        },
        eventClick: function(info) {
            // Para sacerdote: solo responder si estamos en el tab de "Mis Reservas"
            if (rol === 'sacerdote') {
                const tabReservas = document.getElementById('tab-reservas');
                if (!tabReservas || !tabReservas.classList.contains('active')) {
                    console.log("⚠️ Click en evento ignorado - no estás en el tab de Reservas");
                    return;
                }
            }
            
            if (rol === 'secretaria' && info.event.extendedProps.tipo === 'horario') {
                window.mostrarModalEliminarHorario(info.event);
            } else {
                window.mostrarDatosDelDia(info.event.startStr.slice(0,10));
            }
        }
    });

    calendar.render();

    // =====================================================
    // 4. CREAR CALENDARIO DE HORARIOS (SACERDOTE)
    // =====================================================
    if (rol === 'sacerdote') {
        console.log("📅 Verificando contenedor de horarios...");
        console.log("  📦 contenedorFechasHorarios existe?", !!contenedorFechasHorarios);
        console.log("  📦 contenedorFechasHorarios:", contenedorFechasHorarios);
        
        if (contenedorFechasHorarios) {
            console.log("  ✅ Contenedor encontrado, creando calendario...");
            console.log("  📊 horariosFiltrados.length:", horariosFiltrados.length);
            console.log("  📋 Primeros 3 horarios:", horariosFiltrados.slice(0, 3));
            
            const calendarHorariosEl = document.createElement('div');
            calendarHorariosEl.id = 'calendar-horarios';
            contenedorFechasHorarios.appendChild(calendarHorariosEl);

        calendarHorarios = new FullCalendar.Calendar(calendarHorariosEl, {
            locale: 'es',
            height: 'auto',
            initialView: 'timeGridWeek',
            selectable: true,
            selectMirror: true,
            slotDuration: '01:00:00',
            slotLabelInterval: '01:00',
            allDaySlot: false,
            slotMinTime: '06:00:00',
            slotMaxTime: '22:00:00',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek'
            },
            events: horariosFiltrados.map(h => {
                // Asegurar formato correcto de fecha y hora
                const fechaStr = h.fecha; // YYYY-MM-DD
                const horaStr = h.hora; // HH:MM
                const fechaHoraCompleta = `${fechaStr}T${horaStr}:00`; // YYYY-MM-DDTHH:MM:00
                
                const evento = {
                    title: h.titulo,
                    start: fechaHoraCompleta,
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
                };
                console.log("🎯 Evento creado:", evento.title, evento.start);
                return evento;
            }),
            dateClick: function(info) {
                console.log("🖱️ Click en horario:", info.dateStr);
                // Solo permitir agregar si es secretaria o sacerdote
                if (rol !== 'secretaria' && rol !== 'sacerdote') {
                    return;
                }
                
                try {
                    // Extraer fecha y hora del clic
                    const fechaHora = info.date;
                    const fecha = fechaHora.toISOString().slice(0, 10);
                    const hora = fechaHora.getHours().toString().padStart(2, '0') + ':' + 
                               fechaHora.getMinutes().toString().padStart(2, '0');
                    const diasSemana = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
                    const diaSemana = diasSemana[fechaHora.getDay()];
                    
                    console.log("📅 Datos del clic - Fecha:", fecha, "Hora:", hora, "Día:", diaSemana);
                    window.mostrarModalAgregarHorarioEspecifico(fecha, hora, diaSemana);
                } catch (error) {
                    console.error("❌ Error en dateClick:", error);
                    if (calendarHorarios) calendarHorarios.unselect();
                }
            },
            select: function(selectInfo) {
                // Cuando se seleccionan múltiples celdas arrastrando
                window.mostrarModalAgregarHorariosMultiples(selectInfo);
            },
            eventClick: function(info) {
                if (info.event.extendedProps.tipo === 'horario') {
                    window.mostrarModalEliminarHorario(info.event);
                }
            }
        });

        console.log("🎨 Renderizando calendario de horarios...");
        calendarHorarios.render();
        console.log("✅ Calendario de horarios renderizado");
        console.log("📊 Total eventos en calendario:", calendarHorarios.getEvents().length);
        } else {
            console.error("❌ No se encontró el contenedor .fechas-horarios");
        }
    } else {
        console.log("⚠️ No se creará calendario de horarios:");
        console.log("  - rol:", rol);
        console.log("  - contenedorFechasHorarios existe?", !!contenedorFechasHorarios);
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
                
                // Mantener filtro excluyendo canceladas para sacerdote
                if (rol === 'sacerdote') {
                    datosTemp = datosTemp.filter(r => 
                        r.estado !== 'CANCELADA' && r.estado !== 'CANCELADO'
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

        // Manejar cambio de tabs - IMPORTANTE: re-renderizar cuando se muestra el tab
        const tabReservas = document.getElementById('tab-reservas');
        const tabHorarios = document.getElementById('tab-horarios');
        
        if (tabReservas && tabHorarios) {
            tabReservas.addEventListener('shown.bs.tab', () => {
                console.log("📌 Tab Reservas activado");
                if (calendar) {
                    setTimeout(() => {
                        calendar.render();
                        calendar.updateSize();
                    }, 100);
                }
            });
            
            tabHorarios.addEventListener('shown.bs.tab', () => {
                console.log("📌 Tab Horarios activado");
                if (calendarHorarios) {
                    console.log("  🔄 Re-renderizando calendario de horarios...");
                    setTimeout(() => {
                        calendarHorarios.render();
                        calendarHorarios.updateSize();
                        console.log("  ✅ Calendario actualizado. Eventos:", calendarHorarios.getEvents().length);
                    }, 100);
                }
            });
        }
    }

    // ================= ACTUALIZAR ESTADO GLOBAL ===================
    function actualizarEstadoGlobal() {
        window.calendarioState = {
            ...window.calendarioState,
            calendar,
            calendarHorarios,
            datosEjemplo,
            datosFiltrados,
            horariosEjemplo,
            horariosFiltrados
        };
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
        actualizarEstadoGlobal();
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
        actualizarEstadoGlobal();
    }

    // ================= RECARGAR HORARIOS ===================
    async function recargarHorarios() {
        horariosEjemplo = await cargarHorariosDisponibles(idParroquia);
        horariosFiltrados = [...horariosEjemplo];
        actualizarEventosHorarios();
    }

    // Exportar funciones para que calendario-modals.js pueda usarlas
    window.calendarioFunctions = {
        actualizarEventos,
        actualizarEventosHorarios,
        recargarHorarios,
        cargarHorariosDisponibles
    };

    // 🔥 Función de inicialización exportada para mis_reservas.js
    window.inicializarCalendario = actualizarEstadoGlobal;

    // Inicializar calendario SIEMPRE (mis_reservas.js también puede llamarlo si necesita)
    actualizarEstadoGlobal();

});
