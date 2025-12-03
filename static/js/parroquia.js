// ============================================================
// PARROQUIA.JS - DETALLE DE PARROQUIA (API objeto + color dinámico + fecha formateada)
// ============================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Obtenemos el ID de la parroquia desde sessionStorage
    const idParroquia = sessionStorage.getItem('idParroquiaSeleccionada');

    if (!idParroquia) {
        console.error('❌ No se encontró ID de parroquia en sessionStorage.');
        document.body.innerHTML = '<p style="color:red;">No se encontró ID de parroquia.</p>';
        return;
    }

    // Función para formatear fecha en español usando UTC
    function formatearFechaUTC(fechaStr) {
        if (!fechaStr) return '';
        const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

        const fecha = new Date(fechaStr);

        const diaSemana = dias[fecha.getUTCDay()];
        const dia = fecha.getUTCDate();
        const mes = meses[fecha.getUTCMonth()];
        const anio = fecha.getUTCFullYear();

        return `${diaSemana} ${dia} de ${mes} de ${anio}`;
    }

    try {
        // Petición al API para obtener información de la parroquia
        const response = await fetch(`/api/parroquia/informacion/${idParroquia}`);
        if (!response.ok) throw new Error("Error al obtener la información de la parroquia");

        const data = await response.json();
        console.log("Datos recibidos:", data);

        const p = data.datos; // objeto directamente

        if (!p) {
            document.body.innerHTML = '<p style="color:red;">No se encontró información de la parroquia.</p>';
            return;
        }

        // Función auxiliar para asignar texto de manera segura
        function setText(id, text) {
            const el = document.getElementById(id);
            if (el) el.textContent = text || '';
        }

        // Campos principales
        setText('nombre', p.nombParroquia);
        setText('historia', p.historiaParroquia);
        setText('ruc', p.ruc);
        setText('ubicacion', p.direccion);
        setText('contacto', p.telefonoContacto);
        setText('email', p.email);
        setText('info', p.infoAdicional);
        setText('fecha', formatearFechaUTC(p.f_creacion)); // fecha formateada correctamente
        setText('horario', `${p.horaAtencionInicial || ''} - ${p.horaAtencionFinal || ''}`);

        // Imagen de la parroquia
        const imagenEl = document.getElementById('imagen');
        if (imagenEl) {
            imagenEl.src = p.imagenParroquia || '/static/img/default_parroquia.png';
            imagenEl.alt = p.nombParroquia || 'Imagen de la parroquia';
        }

        // Color dinámico de la parroquia
        const detalleEl = document.querySelector('.detalle');
        if (detalleEl && p.color) {
            detalleEl.style.borderLeft = `8px solid ${p.color}`;
            detalleEl.style.boxShadow = `0 8px 20px ${p.color}33`; // sombra ligera con transparencia
        }

        // Lista de sacerdotes
        const listaSacerdotes = document.getElementById('lista-sacerdotes');
        if (listaSacerdotes) {
            listaSacerdotes.innerHTML = '';
            if (p.sacerdotes && p.sacerdotes.length > 0) {
                p.sacerdotes.forEach(s => {
                    const li = document.createElement('li');
                    li.textContent = s.nombre || '';
                    listaSacerdotes.appendChild(li);
                });
            } else {
                const li = document.createElement('li');
                li.textContent = 'No hay sacerdotes registrados.';
                listaSacerdotes.appendChild(li);
            }
        }

        // Lista de actos litúrgicos - Cargará dinámicamente desde el API de horarios
        const listaActos = document.getElementById('lista-actos');
        if (listaActos) {
            listaActos.innerHTML = '<li class="cargando-actos">⏳ Cargando actos litúrgicos...</li>';
        }

        // Botón "Ver calendario" - guardar idParroquia en sesión y redirigir
        const btnVerCalendario = document.getElementById('btn-ver-calendario');
        if (btnVerCalendario) {
            btnVerCalendario.addEventListener('click', (e) => {
                e.preventDefault();
                // Guardar idParroquia en la sesión del servidor
                fetch(`/cliente/calendario?idParroquia=${idParroquia}`, {
                    method: 'GET'
                }).then(() => {
                    window.location.href = '/cliente/calendario';
                }).catch(err => {
                    console.error('Error al guardar idParroquia:', err);
                    // Redirigir de todas formas
                    window.location.href = '/cliente/calendario';
                });
            });
        }

    } catch (e) {
        console.error("❌ Error al cargar la información de la parroquia:", e);
        document.body.innerHTML = '<p style="color:red;">Error al cargar la información de la parroquia.</p>';
    }

    // ============================================================
    // CALENDARIO DE HORARIOS DISPONIBLES
    // ============================================================
    let calendarioHorarios = null;
    let horariosData = [];
    let horariosFiltrados = [];

    // Función para cargar y mostrar actos litúrgicos de forma atractiva
    async function cargarActosLiturgicos() {
        try {
            console.log(`🎭 Cargando actos litúrgicos para parroquia ID: ${idParroquia}`);
            const response = await fetch(`/api/acto/parroquia/${idParroquia}/actos-horarios`);
            if (!response.ok) {
                console.error(`❌ Error HTTP: ${response.status}`);
                return;
            }

            const data = await response.json();
            const listaActos = document.getElementById('lista-actos');
            
            if (!listaActos) return;

            if (data.datos && Array.isArray(data.datos) && data.datos.length > 0) {
                listaActos.innerHTML = '';
                
                // Obtener nombres únicos de actos
                const actosUnicos = [...new Set(data.datos.map(item => item.acto))];
                
                actosUnicos.forEach(nombreActo => {
                    const li = document.createElement('li');
                    li.className = 'acto-item';
                    li.textContent = nombreActo;
                    listaActos.appendChild(li);
                });
                
                console.log(`✅ ${actosUnicos.length} actos litúrgicos únicos cargados`);
            } else {
                listaActos.innerHTML = '<li class="no-actos">No hay actos registrados.</li>';
            }

        } catch (error) {
            console.error('❌ Error al cargar actos litúrgicos:', error);
            const listaActos = document.getElementById('lista-actos');
            if (listaActos) {
                listaActos.innerHTML = '<li class="error-actos">Error al cargar actos</li>';
            }
        }
    }

    // Cargar actos litúrgicos al inicio
    cargarActosLiturgicos();

    // Función para obtener el nombre del día de la semana
    function obtenerNombreDiaSemana(diaSemana) {
        const dias = {
            'domingo': 0, 'dom': 0,
            'lunes': 1, 'lun': 1,
            'martes': 2, 'mar': 2,
            'miércoles': 3, 'miercoles': 3, 'mié': 3, 'mie': 3,
            'jueves': 4, 'jue': 4,
            'viernes': 5, 'vie': 5,
            'sábado': 6, 'sabado': 6, 'sáb': 6, 'sab': 6
        };
        return dias[diaSemana?.toLowerCase()] ?? null;
    }

    // Función para generar las próximas fechas de un día de la semana
    function obtenerProximasFechasPorDia(diaSemana, cantidadSemanas = 12) {
        const numeroDia = obtenerNombreDiaSemana(diaSemana);
        if (numeroDia === null) return [];

        const fechas = [];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        for (let i = 0; i < cantidadSemanas * 7; i++) {
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() + i);
            if (fecha.getDay() === numeroDia) {
                fechas.push(new Date(fecha));
            }
        }
        return fechas;
    }

    // Función para normalizar hora al formato HH:MM:SS
    function normalizarHora(hora) {
        if (!hora) return null;
        const partes = hora.split(':');
        if (partes.length === 2) {
            return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}:00`;
        }
        if (partes.length === 3) {
            return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}:${partes[2].padStart(2, '0')}`;
        }
        return hora;
    }

    // Función para cargar horarios disponibles desde la API
    async function cargarHorariosDisponibles() {
        try {
            console.log(`📅 Cargando horarios para parroquia ID: ${idParroquia}`);
            const response = await fetch(`/api/acto/parroquia/${idParroquia}/actos-horarios`);
            if (!response.ok) {
                console.error(`❌ Error HTTP: ${response.status}`);
                return;
            }

            const data = await response.json();
            console.log('📅 Respuesta del API:', data);

            horariosData = [];
            if (data.datos && Array.isArray(data.datos)) {
                data.datos.forEach(item => {
                    console.log(`📋 Procesando acto: ${item.acto}`, item.horarios);
                    if (item.horarios && Array.isArray(item.horarios)) {
                        item.horarios.forEach(h => {
                            horariosData.push({
                                acto: item.acto,
                                diaSemana: h.diaSemana,
                                horaInicioActo: normalizarHora(h.horaInicioActo),
                                color: item.color || '#007bff'
                            });
                        });
                    }
                });
            }

            console.log(`✅ Se cargaron ${horariosData.length} horarios:`, horariosData);

            // Inicializar filtro con todos los horarios
            horariosFiltrados = [...horariosData];
            
            // Poblar dropdown de filtro
            poblarFiltroActos();
            
            // Actualizar eventos del calendario
            if (calendarioHorarios) {
                actualizarEventosCalendario();
            }

        } catch (error) {
            console.error('❌ Error al cargar horarios:', error);
        }
    }

    // Función para poblar el dropdown de filtro con actos únicos
    function poblarFiltroActos() {
        const filtroSelect = document.getElementById('filtroActoDetalle');
        if (!filtroSelect) {
            console.error('❌ No se encontró el dropdown de filtro');
            return;
        }

        // Obtener actos únicos
        const actosUnicos = [...new Set(horariosData.map(h => h.acto))];
        
        console.log(`📋 Actos únicos encontrados: ${actosUnicos.length}`, actosUnicos);

        // Limpiar opciones existentes (excepto "Todos")
        filtroSelect.innerHTML = '<option value="todos">Todos los actos litúrgicos</option>';
        
        // Agregar opciones de actos
        actosUnicos.forEach(acto => {
            const option = document.createElement('option');
            option.value = acto;
            option.textContent = acto;
            filtroSelect.appendChild(option);
        });

        // Listener para cambio de filtro (solo agregar una vez)
        filtroSelect.removeEventListener('change', handleFiltroChange);
        filtroSelect.addEventListener('change', handleFiltroChange);
    }

    // Handler para el cambio de filtro (definido fuera para evitar duplicados)
    function handleFiltroChange(e) {
        const valorSeleccionado = e.target.value;
        console.log(`🔍 Filtrando por: ${valorSeleccionado}`);
        if (valorSeleccionado === 'todos') {
            horariosFiltrados = [...horariosData];
        } else {
            horariosFiltrados = horariosData.filter(h => h.acto === valorSeleccionado);
        }
        console.log(`📊 Horarios filtrados: ${horariosFiltrados.length}`);
        actualizarEventosCalendario();
    }

    // Función para actualizar eventos del calendario
    function actualizarEventosCalendario() {
        if (!calendarioHorarios) {
            console.warn('⚠️ El calendario no está inicializado');
            return;
        }

        console.log(`🔄 Actualizando eventos del calendario con ${horariosFiltrados.length} horarios`);

        // Remover todos los eventos existentes
        const eventosAnteriores = calendarioHorarios.getEvents();
        eventosAnteriores.forEach(event => event.remove());

        // Generar eventos para las próximas 12 semanas
        let eventosAgregados = 0;
        horariosFiltrados.forEach(horario => {
            const fechas = obtenerProximasFechasPorDia(horario.diaSemana, 12);
            console.log(`📆 Generando ${fechas.length} fechas para ${horario.acto} los ${horario.diaSemana}`);
            
            fechas.forEach(fecha => {
                if (horario.horaInicioActo) {
                    const [horas, minutos] = horario.horaInicioActo.split(':');
                    const fechaEvento = new Date(fecha);
                    fechaEvento.setHours(parseInt(horas), parseInt(minutos), 0, 0);

                    calendarioHorarios.addEvent({
                        title: horario.acto,
                        start: fechaEvento,
                        backgroundColor: horario.color,
                        borderColor: horario.color,
                        extendedProps: {
                            acto: horario.acto,
                            diaSemana: horario.diaSemana
                        }
                    });
                    eventosAgregados++;
                }
            });
        });

        console.log(`✅ ${eventosAgregados} eventos agregados al calendario`);
    }

    // Función para inicializar el calendario
    function inicializarCalendarioHorarios() {
        const contenedorCalendario = document.getElementById('calendario-horarios-detalle');
        if (!contenedorCalendario) {
            console.error('❌ No se encontró el contenedor del calendario');
            return;
        }

        console.log('🎨 Inicializando calendario FullCalendar...');

        calendarioHorarios = new FullCalendar.Calendar(contenedorCalendario, {
            initialView: 'timeGridWeek',
            locale: 'es',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridWeek,timeGridDay'
            },
            slotMinTime: '06:00:00',
            slotMaxTime: '21:00:00',
            allDaySlot: false,
            height: 'auto',
            contentHeight: 'auto',
            expandRows: false,
            nowIndicator: true,
            eventDisplay: 'block',
            eventTimeFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            slotLabelFormat: {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
            },
            buttonText: {
                today: 'Hoy',
                week: 'Semana',
                day: 'Día'
            },
            // Deshabilitar interacciones (solo lectura)
            selectable: false,
            editable: false,
            eventClick: function(info) {
                // Mostrar información del horario
                const horaFormateada = info.event.start.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
                const fechaFormateada = info.event.start.toLocaleDateString('es-ES', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'});
                alert(`📅 ${info.event.title}\n🕐 ${horaFormateada}\n📆 ${fechaFormateada}`);
            }
        });

        calendarioHorarios.render();
        console.log('✅ Calendario de horarios renderizado');
    }

    // Listener para cuando se muestra la pestaña de horarios
    const tabHorarios = document.getElementById('tab-horarios');
    if (tabHorarios) {
        tabHorarios.addEventListener('shown.bs.tab', async function() {
            console.log('📅 Mostrando pestaña de horarios...');
            
            // Si el calendario no está inicializado, inicializarlo
            if (!calendarioHorarios) {
                inicializarCalendarioHorarios();
                await cargarHorariosDisponibles();
            } else {
                // Si ya existe, solo actualizar el tamaño
                calendarioHorarios.updateSize();
                console.log('🔄 Tamaño del calendario actualizado');
            }
        });
    } else {
        console.error('❌ No se encontró el botón de la pestaña de horarios');
    }
});
