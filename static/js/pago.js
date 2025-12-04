
// ---------- UTILIDADES ----------
function onlyDigitsAndDot(str) {
    return str.replace(/[^\d.]/g, '');
}

function generarTxnIdTarjeta(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let out = '';
    for (let i = 0; i < length; i++) out += chars.charAt(Math.floor(Math.random() * chars.length));
    return out;
}

function validarTarjetaSimple(numero, nombre, exp, cvv) {
    const numClean = numero.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(numClean)) return { ok: false, msg: 'Número de tarjeta inválido' };
    if (!nombre || nombre.trim().length < 3) return { ok: false, msg: 'Nombre del titular inválido' };
    if (!/^\d{2}\/\d{2}$/.test(exp)) return { ok: false, msg: 'Expiración inválida (MM/AA)' };
    if (!/^\d{3,4}$/.test(cvv)) return { ok: false, msg: 'CVV inválido' };
    const [mm, yy] = exp.split('/').map(x => parseInt(x, 10));
    if (mm < 1 || mm > 12) return { ok: false, msg: 'Mes de expiración inválido' };
    return { ok: true };
}

// ---------- DATOS DEL BODY ----------
const ROL_USUARIO = document.body.getAttribute('data-rol');
const ID_USUARIO = document.body.getAttribute('data-id');

// ---------- REFERENCIAS DOM ----------
const listaReservas = document.getElementById('reservas-lista');
const totalReservasSpan = document.getElementById('total-reservas');
const resumenContSpan = document.getElementById('reservas-cont');
const subtotalServiciosSpan = document.getElementById('subtotal-servicios');
const totalPagarSpan = document.getElementById('total');
const idReservasInput = document.getElementById('idReservasSeleccionadas');
const btnSubmit = document.getElementById('btn-submit');
const metodosContainer = document.getElementById('metodos-container');
const formSections = document.querySelectorAll('.form-section');

// ---------- VARIABLES GLOBALES PARA FILTRO ----------
let todasLasReservas = []; // Almacena todas las reservas cargadas

// ---------- RENDERIZADO DE RESERVAS ----------
function renderizarReservas(reservas, mostrarTodas = false, checkboxesPreservar = null) {
    listaReservas.innerHTML = '';
    if (!reservas || reservas.length === 0) {
        const mensaje = ROL_USUARIO.toUpperCase() === 'SECRETARIA' 
            ? 'No se encontraron reservas con ese criterio de búsqueda.' 
            : 'No tienes reservas pendientes de pago.';
        listaReservas.innerHTML = `<div class="mensaje-info">${mensaje}</div>`;
        return;
    }

    reservas.forEach(reserva => {
        const montoNumerico = parseFloat(reserva.costoBase) || 0;
        const id = reserva.idReserva;
        const fecha = reserva.fecha;

        // Usamos acto > nombreActo > mencion > fallback
        const nombreServicio = reserva.acto?.trim() 
                                || reserva.nombreActo?.trim()
                                || reserva.mencion?.trim() 
                                || `Servicio #${id}`;

        // Formateo de fecha dd/mm/yyyy
        let fechaFormateada = fecha;
        const d = new Date(fecha);
        if (!isNaN(d)) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            fechaFormateada = `${day}/${month}/${year}`;
        }

        // Para secretaria, mostrar nombre del feligrés si está disponible
        let textoMostrar = `${nombreServicio} (${fechaFormateada})`;
        // Obtener nombre del feligrés (no de parroquia)
        let nombreFeligres = reserva.nombreFeligres || reserva.nombreSolicitante || '';
        // Si el nombre es igual al nombre de la parroquia, es una reserva de parroquia (no tiene feligrés)
        if (reserva.nombreParroquia && nombreFeligres === reserva.nombreParroquia) {
            nombreFeligres = ''; // No mostrar nombre de parroquia como si fuera feligrés
        }
        if (ROL_USUARIO.toUpperCase() === 'SECRETARIA' && nombreFeligres) {
            textoMostrar = `${nombreFeligres} - ${textoMostrar}`;
        }

        // Indicador de pago pendiente para secretaria
        let indicadorPago = '';
        let esPendiente = false;
        if (ROL_USUARIO.toUpperCase() === 'SECRETARIA' && reserva.tienePagoReserva && reserva.estadoPago === 'PENDIENTE') {
            indicadorPago = '<span class="badge-pendiente" style="color: orange; font-size: 0.85em; margin-left: 8px;">[Pago Pendiente]</span>';
            esPendiente = true;
        }

        // Si es secretaria y tiene pago pendiente, marcar el checkbox automáticamente
        // También preservar si estaba seleccionado antes del filtro
        let checkedAttr = '';
        if (ROL_USUARIO.toUpperCase() === 'SECRETARIA' && esPendiente) {
            checkedAttr = 'checked';
        } else if (checkboxesPreservar && checkboxesPreservar.has(id.toString())) {
            checkedAttr = 'checked';
        }
        
        // Obtener numParticipantes (1 = MISA, >1 = otros actos)
        const numParticipantes = reserva.numParticipantes || 0;
        const esMisa = numParticipantes === 1;
        
        const reservaHTML = `
            <div class="reserva-row" data-id="${id}" data-monto="${montoNumerico}" data-feligres="${nombreFeligres.toLowerCase()}" data-estado-pago="${reserva.estadoPago || 'SIN_PAGO'}" data-tiene-pago="${reserva.tienePagoReserva || false}" data-num-participantes="${numParticipantes}" data-es-misa="${esMisa}">
              <input type="checkbox" class="reserva-checkbox" id="check-${id}" ${esPendiente ? 'data-pendiente="true"' : ''} ${checkedAttr}>
              <label for="check-${id}">${textoMostrar}${indicadorPago}</label>
              <span class="reserva-monto">S/ ${montoNumerico.toFixed(2)}</span>
            </div>
        `;
        listaReservas.insertAdjacentHTML('beforeend', reservaHTML);
    });
}


// ---------- CARGA DE RESERVAS ----------
async function cargarReservas() {
    if (!ID_USUARIO || !ROL_USUARIO) {
        listaReservas.innerHTML = `<div class="mensaje-error">Error: Datos de usuario no disponibles.</div>`;
        return;
    }

    const rol = ROL_USUARIO.toUpperCase();
    let url = '';
    if (rol === 'SECRETARIA' || rol === 'ADMINISTRADOR') {
        // Secretaria y Administrador usan el mismo endpoint (reservas de parroquia)
        url = `/api/reserva/secretaria/${ID_USUARIO}`;
    } else if (rol === 'FELIGRES') {
        url = `/api/reserva/feligres/${ID_USUARIO}`;
    } else {
        return console.error("Rol no reconocido:", ROL_USUARIO);
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.datos)) {
            let reservasFiltradas = [];
            
            if (rol === 'FELIGRES') {
                // Feligrés: solo reservas sin pago_reserva (que no tienen pago registrado)
                reservasFiltradas = data.datos.filter(r => 
                    r.estadoReserva === 'PENDIENTE_PAGO' && 
                    !r.tienePagoReserva
                );
            } else if (rol === 'SECRETARIA' || rol === 'ADMINISTRADOR') {
                // Secretaria y Administrador: reservas sin pago Y reservas con pago PENDIENTE (efectivo)
                reservasFiltradas = data.datos.filter(r => 
                    r.estadoReserva === 'PENDIENTE_PAGO' && 
                    (!r.tienePagoReserva || r.estadoPago === 'PENDIENTE')
                );
            }
            
            // Guardar todas las reservas para el filtro
            todasLasReservas = reservasFiltradas;
            
            renderizarReservas(reservasFiltradas);
            // Pequeño delay para asegurar que los checkboxes estén en el DOM antes de actualizar
            setTimeout(() => {
                actualizarResumenPago();
            }, 100);
        } else {
            listaReservas.innerHTML = `<div class="mensaje-info">No se pudo cargar la lista de reservas.</div>`;
        }
    } catch (err) {
        console.error("Error al cargar reservas:", err);
        listaReservas.innerHTML = `<div class="mensaje-error">Error de conexión con el servidor.</div>`;
    }
}

// ---------- RESUMEN DE PAGO ----------
function actualizarResumenPago() {
    let totalMonto = 0;
    let contadorReservas = 0;
    let idsSeleccionados = [];
    let estadosPago = new Set(); // Para validar que no se mezclen diferentes estados

    const checkboxes = listaReservas.querySelectorAll('.reserva-checkbox');
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const row = cb.closest('.reserva-row');
            const monto = parseFloat(row.dataset.monto) || 0;
            const idReserva = row.dataset.id;
            const estadoPago = row.dataset.estadoPago || 'SIN_PAGO';
            const tienePago = row.dataset.tienePago === 'true';
            
            // Agregar estado de pago al conjunto
            if (tienePago) {
                estadosPago.add(estadoPago);
            } else {
                estadosPago.add('SIN_PAGO');
            }
            
            totalMonto += monto;
            contadorReservas++;
            idsSeleccionados.push(idReserva);
        }
    });

    // VALIDACIÓN: No se pueden juntar reservas con diferentes estados de pago
    if (estadosPago.size > 1) {
        alert('⚠️ No puedes seleccionar reservas con diferentes estados de pago. Solo puedes seleccionar:\n- Reservas sin pago, O\n- Reservas con pago PENDIENTE (para aprobar)');
        // Desmarcar todas las seleccionadas
        checkboxes.forEach(cb => {
            if (cb.checked) cb.checked = false;
        });
        totalMonto = 0;
        contadorReservas = 0;
        idsSeleccionados = [];
    }

    const totalFormateado = `S/ ${totalMonto.toFixed(2)}`;
    totalReservasSpan.textContent = totalFormateado;
    resumenContSpan.textContent = contadorReservas;
    subtotalServiciosSpan.textContent = totalFormateado;
    totalPagarSpan.textContent = totalFormateado;
    idReservasInput.value = idsSeleccionados.join(',');

    // Verificar si hay pago pendiente seleccionado (solo secretaria)
    let hayPagoPendienteSeleccionado = false;
    if (ROL_USUARIO.toUpperCase() === 'SECRETARIA' && contadorReservas > 0) {
        hayPagoPendienteSeleccionado = Array.from(checkboxes).some(cb => {
            if (!cb.checked) return false;
            const row = cb.closest('.reserva-row');
            return row && row.dataset.estadoPago === 'PENDIENTE' && row.dataset.tienePago === 'true';
        });
    }
    
    // Si hay pago pendiente, ocultar método efectivo y seleccionar tarjeta
    if (hayPagoPendienteSeleccionado) {
        const metodoEfectivo = document.querySelector('.metodo-card[data-metodo="efectivo"]');
        if (metodoEfectivo) {
            metodoEfectivo.style.display = 'none';
        }
        // Si el método activo es efectivo, cambiar a tarjeta
        const metodoActivo = document.querySelector('.metodo-card.active')?.dataset.metodo;
        if (metodoActivo === 'efectivo') {
            cambiarMetodoPago('tarjeta');
        }
    } else {
        // Mostrar método efectivo si no hay pago pendiente
        const metodoEfectivo = document.querySelector('.metodo-card[data-metodo="efectivo"]');
        if (metodoEfectivo) {
            metodoEfectivo.style.display = '';
        }
    }

    if (contadorReservas === 0) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Selecciona una Reserva';
        // Mostrar método efectivo cuando no hay selección
        const metodoEfectivo = document.querySelector('.metodo-card[data-metodo="efectivo"]');
        if (metodoEfectivo) {
            metodoEfectivo.style.display = '';
        }
    } else {
        btnSubmit.disabled = false;
        const metodoActivo = document.querySelector('.metodo-card.active')?.dataset.metodo || 'tarjeta';
        actualizarBotonSubmit(metodoActivo, totalFormateado);
    }
}

function actualizarBotonSubmit(metodo, total) {
    btnSubmit.classList.remove('btn-tarjeta', 'btn-yape', 'btn-plin', 'btn-efectivo');
    const montoLimpio = total.replace('S/ ', '');
    
    // Verificar si hay reservas con pago PENDIENTE seleccionadas (solo secretaria)
    let hayPagoPendiente = false;
    if (ROL_USUARIO.toUpperCase() === 'SECRETARIA') {
        const checkboxes = listaReservas.querySelectorAll('.reserva-checkbox:checked');
        hayPagoPendiente = Array.from(checkboxes).some(cb => {
            const row = cb.closest('.reserva-row');
            return row && row.dataset.estadoPago === 'PENDIENTE' && row.dataset.tienePago === 'true';
        });
    }
    
    if (hayPagoPendiente) {
        // Si hay pago pendiente, mostrar botón de aprobar
        btnSubmit.textContent = '✅ Aprobar Pago Pendiente';
        btnSubmit.classList.add('btn-success');
    } else {
        // Botones normales según método
        switch (metodo) {
            case 'tarjeta': btnSubmit.textContent = `Pagar S/ ${montoLimpio} con Tarjeta`; btnSubmit.classList.add('btn-tarjeta'); break;
            case 'yape': btnSubmit.textContent = `Yapear S/ ${montoLimpio}`; btnSubmit.classList.add('btn-yape'); break;
            case 'plin': btnSubmit.textContent = `Pagar S/ ${montoLimpio} con Plin`; btnSubmit.classList.add('btn-plin'); break;
            case 'efectivo': btnSubmit.textContent = 'Confirmar Pago en Oficina'; btnSubmit.classList.add('btn-efectivo'); break;
            default: btnSubmit.textContent = 'Procesar Pago';
        }
    }
}

function cambiarMetodoPago(metodoSeleccionado) {
    metodosContainer.querySelectorAll('.metodo-card').forEach(card => {
        card.classList.toggle('active', card.dataset.metodo === metodoSeleccionado);
    });
    formSections.forEach(section => {
        const dataMetodo = section.dataset.metodo === 'transferencia' ? 'plin' : section.dataset.metodo;
        section.classList.toggle('active', dataMetodo === metodoSeleccionado);
    });
    actualizarBotonSubmit(metodoSeleccionado, totalPagarSpan.textContent);
}

// ---------- FILTRO DE BÚSQUEDA (SOLO SECRETARIA) ----------
function aplicarFiltroBusqueda() {
    const filtroContainer = document.getElementById('filtro-container');
    const filtroInput = document.getElementById('filtro-reservas');
    
    // Mostrar el filtro solo para secretaria
    if (ROL_USUARIO.toUpperCase() === 'SECRETARIA' && filtroContainer) {
        filtroContainer.style.display = 'block';
    } else if (filtroContainer) {
        filtroContainer.style.display = 'none';
    }
    
    if (!filtroInput) return;

    // Validar que solo se ingresen letras y espacios (no números)
    filtroInput.addEventListener('keypress', e => {
        const char = String.fromCharCode(e.which);
        // Permitir letras (incluyendo acentos), espacios y teclas especiales (backspace, delete, etc.)
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]$/.test(char) && !e.ctrlKey && !e.metaKey && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
            e.preventDefault();
        }
    });

    // También validar al pegar texto
    filtroInput.addEventListener('paste', e => {
        e.preventDefault();
        const texto = (e.clipboardData || window.clipboardData).getData('text');
        // Filtrar solo letras, espacios y caracteres especiales del español
        const textoLimpio = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
        filtroInput.value = textoLimpio;
        // Disparar evento input para que se ejecute el filtro
        filtroInput.dispatchEvent(new Event('input'));
    });

    filtroInput.addEventListener('input', e => {
        // Limpiar cualquier número que se haya ingresado
        e.target.value = e.target.value.replace(/[0-9]/g, '');
        const textoBusqueda = e.target.value.toLowerCase().trim();
        
        if (ROL_USUARIO.toUpperCase() === 'SECRETARIA') {
            // Guardar los checkboxes seleccionados antes de filtrar
            const checkboxesSeleccionados = new Set();
            listaReservas.querySelectorAll('.reserva-checkbox:checked').forEach(cb => {
                const row = cb.closest('.reserva-row');
                if (row) {
                    checkboxesSeleccionados.add(row.dataset.id);
                }
            });
            
            let reservasFiltradas = todasLasReservas;
            
            if (textoBusqueda) {
                // Filtrar SOLO por nombre de feligrés (quien hace la reserva)
                // Normalizar: eliminar espacios múltiples y convertir a minúsculas
                const textoBusquedaNormalizado = textoBusqueda.replace(/\s+/g, ' ').trim().toLowerCase();
                
                reservasFiltradas = todasLasReservas.filter(r => {
                    // Obtener nombre del feligrés (puede venir como nombreFeligres o nombreSolicitante)
                    let nombreFeligres = (r.nombreFeligres || r.nombreSolicitante || '').trim();
                    
                    // Si no hay nombre, saltar
                    if (!nombreFeligres) {
                        return false;
                    }
                    
                    // Si el nombre es el nombre de la parroquia, no buscar (reservas de parroquia no tienen feligrés)
                    if (r.nombreParroquia && nombreFeligres.toLowerCase() === r.nombreParroquia.toLowerCase()) {
                        return false; // Saltar reservas de parroquia en la búsqueda por feligrés
                    }
                    
                    // Normalizar el nombre: eliminar espacios múltiples y convertir a minúsculas
                    nombreFeligres = nombreFeligres.replace(/\s+/g, ' ').toLowerCase().trim();
                    
                    // Buscar si el texto de búsqueda está incluido en el nombre
                    // También buscar por palabras individuales para mayor flexibilidad
                    const palabrasBusqueda = textoBusquedaNormalizado.split(' ').filter(p => p.length > 0);
                    if (palabrasBusqueda.length === 0) return false;
                    
                    // Buscar coincidencia: todas las palabras deben estar en el nombre
                    const todasLasPalabrasCoinciden = palabrasBusqueda.every(palabra => 
                        nombreFeligres.includes(palabra)
                    );
                    
                    return todasLasPalabrasCoinciden;
                });
            }
            
            // Si no hay texto de búsqueda, mostrar todas las reservas
            if (!textoBusqueda) {
                reservasFiltradas = todasLasReservas;
            }
            
            // Renderizar con los checkboxes a preservar
            renderizarReservas(reservasFiltradas, false, checkboxesSeleccionados);
            
            // Actualizar resumen después de renderizar
            setTimeout(() => {
                actualizarResumenPago();
            }, 50);
        }
    });
}

// ---------- EVENTOS INICIALES ----------
document.addEventListener('DOMContentLoaded', () => {
    cargarReservas();
    aplicarFiltroBusqueda();

    listaReservas.addEventListener('change', e => {
        if (e.target.classList.contains('reserva-checkbox')) actualizarResumenPago();
    });

    metodosContainer.addEventListener('click', e => {
        const card = e.target.closest('.metodo-card');
        if (card) cambiarMetodoPago(card.dataset.metodo);
    });

    cambiarMetodoPago('tarjeta');
});

// ---------- PROCESAR PAGO ----------
btnSubmit.addEventListener('click', async e => {
    e.preventDefault();

    const metodo = document.querySelector('.metodo-card.active')?.dataset.metodo;
    const ids = idReservasInput.value.trim();
    if (!ids) return alert("Selecciona al menos una reserva para pagar.");

    const idReservas = ids.split(',').map(id => id.trim());
    const total = parseFloat(totalPagarSpan.textContent.replace(/[^\d.]/g, '')) || 0;

    // Verificar si alguna reserva tiene pago PENDIENTE (solo para secretaria)
    let tienePagoPendiente = false;
    let idPagoPendiente = null;
    
    if (ROL_USUARIO.toUpperCase() === 'SECRETARIA') {
        for (const idRes of idReservas) {
            const row = document.querySelector(`.reserva-row[data-id="${idRes}"]`);
            if (row && row.dataset.estadoPago === 'PENDIENTE' && row.dataset.tienePago === 'true') {
                tienePagoPendiente = true;
                // Obtener idPago de la reserva
                try {
                    const respPago = await fetch(`/api/pago/pago_por_reserva/${idRes}`);
                    const dataPago = await respPago.json();
                    if (dataPago.ok && dataPago.datos) {
                        idPagoPendiente = dataPago.datos.idPago;
                        break; // Solo necesitamos uno, todas deben tener el mismo estado
                    }
                } catch (error) {
                    console.error('Error obteniendo pago:', error);
                }
            }
        }
    }

    // Si hay pago pendiente, solo aprobar (no crear nuevo pago)
    if (tienePagoPendiente && idPagoPendiente) {
        try {
            const respAprobar = await fetch(`/api/pago/actualizar_estado_pago/${idPagoPendiente}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estadoPago: 'APROBADO' })
            });
            const dataAprobar = await respAprobar.json();
            if (!respAprobar.ok || !dataAprobar.ok) {
                return alert(dataAprobar.mensaje || 'Error al aprobar el pago.');
            }
            
            // Mensaje según tipo de acto
            alert('✅ Pago aprobado correctamente.\n\n' +
                  '📋 Estado actualizado:\n' +
                  '• Misas Individuales → CONFIRMADO\n' +
                  '• Otros Actos → PENDIENTE_DOCUMENTO (si falta documentos)\n' +
                  '• Otros Actos → CONFIRMADO (si documentos ya aprobados)');
            
            // Auto-actualizar el calendario si está disponible
            if (typeof window.recargarCalendario === 'function') {
                window.recargarCalendario();
            }
            
            window.location.reload();
            return;
        } catch (error) {
            console.error('Error aprobando pago:', error);
            return alert('Error al aprobar el pago.');
        }
    }

    // Si no hay pago pendiente, crear nuevo pago
    let estadoPago = '';
    let archivoComprobante = null;

    if (metodo === 'efectivo') estadoPago = 'PENDIENTE';
    else if (metodo === 'yape' || metodo === 'plin') {
        estadoPago = 'PENDIENTE';
        archivoComprobante = document.getElementById('file-comprobante')?.files[0];
        const codigoYape = document.getElementById('yape-codigo')?.value?.trim();
        const codigoPlin = document.getElementById('plin-codigo')?.value?.trim();
        if (!archivoComprobante && !codigoYape && !codigoPlin) return alert('Debes subir un comprobante o ingresar código para Yape/Plin.');
    } else if (metodo === 'tarjeta') {
        estadoPago = 'APROBADO';
        const numero = document.getElementById('numero')?.value || '';
        const nombre = document.getElementById('nombre-titular')?.value || '';
        const exp = document.getElementById('exp')?.value || '';
        const cvv = document.getElementById('cvv')?.value || '';
        const validCard = validarTarjetaSimple(numero, nombre, exp, cvv);
        if (!validCard.ok) return alert(validCard.msg);
    } else return alert('Método de pago no válido.');

    let numeroTransaccion = metodo === 'tarjeta' ? generarTxnIdTarjeta(8) : 'PAGO-' + Date.now();

    try {
        const formData = new FormData();
        formData.append('f_pago', new Date().toISOString().slice(0, 10));
        formData.append('montoTotal', total.toString());
        formData.append('metodoPago', (metodo || '').toUpperCase());
        formData.append('numeroTransaccion', numeroTransaccion);
        formData.append('estadoPago', estadoPago);
        if (archivoComprobante) formData.append('file', archivoComprobante);

        const respPago = await fetch('/api/pago/registrar_pago', { method: 'POST', body: formData });
        const dataPago = await respPago.json();
        if (!respPago.ok || !dataPago.ok) return alert(dataPago.mensaje || 'Error al registrar el pago.');

        const idPago = dataPago.idPago;
        if (!idPago) return alert('No se devolvió idPago desde el servidor.');

        for (const idRes of idReservas) {
            const montoReserva = parseFloat(document.querySelector(`.reserva-row[data-id="${idRes}"]`)?.dataset?.monto || 0);
            const fdDetalle = new FormData();
            fdDetalle.append('idPago', idPago);
            fdDetalle.append('idReserva', idRes);
            fdDetalle.append('monto', montoReserva.toString());

            const respDetalle = await fetch('/api/pago/registrar_pago_reserva', { method: 'POST', body: fdDetalle });
            const dataDetalle = await respDetalle.json();
            if (!respDetalle.ok || !dataDetalle.ok) return alert(dataDetalle.mensaje || `Error al asociar reserva ${idRes}.`);
        }

        // El estado de la reserva se actualiza automáticamente en el backend después de registrar el pago_reserva
        // Según las reglas:
        // - TARJETA (APROBADO): MISA = CONFIRMADO, OTROS = Verifica documentos (PENDIENTE_DOCUMENTO si faltan, CONFIRMADO si están aprobados)
        // - YAPE/PLIN (PENDIENTE): Queda PENDIENTE_PAGO hasta que secretaria apruebe
        // - EFECTIVO (PENDIENTE): Queda PENDIENTE_PAGO hasta pago en oficina
        
        if (metodo === 'tarjeta') {
            // Verificar qué tipos de actos se están pagando
            let tieneMisas = false;
            let tieneOtrosActos = false;
            
            for (const idRes of idReservas) {
                const row = document.querySelector(`.reserva-row[data-id="${idRes}"]`);
                if (row) {
                    const esMisa = row.dataset.esMisa === 'true';
                    if (esMisa) tieneMisas = true;
                    else tieneOtrosActos = true;
                }
            }
            
            let mensaje = '✅ Pago con tarjeta APROBADO exitosamente.\n\n📋 Estado de tus reservas:\n\n';
            
            if (tieneMisas && !tieneOtrosActos) {
                // Solo misas
                mensaje += '🎉 MISAS → Estado: CONFIRMADO\n' +
                          '✓ Ya puedes asistir en la fecha programada.';
            } else if (!tieneMisas && tieneOtrosActos) {
                // Solo otros actos
                mensaje += '📄 OTROS ACTOS:\n' +
                          '• Si YA subiste documentos aprobados → CONFIRMADO\n' +
                          '• Si AÚN faltan documentos → PENDIENTE_DOCUMENTO\n\n' +
                          'Verifica el estado en "Mis Reservas".';
            } else {
                // Ambos tipos
                mensaje += '🎉 MISAS → CONFIRMADO (listas)\n\n' +
                          '📄 OTROS ACTOS:\n' +
                          '• Con documentos OK → CONFIRMADO\n' +
                          '• Sin documentos → PENDIENTE_DOCUMENTO\n\n' +
                          'Revisa cada reserva en "Mis Reservas".';
            }
            
            alert(mensaje);
        } else if (metodo === 'yape' || metodo === 'plin') {
            alert('📤 Comprobante enviado correctamente.\n\n' +
                  '⏳ Tu pago está PENDIENTE de aprobación por la secretaría.\n\n' +
                  'Recibirás una notificación cuando sea aprobado.\n' +
                  'Puedes revisar el estado en "Mis Reservas".');
        } else if (metodo === 'efectivo') {
            // Efectivo: el pago queda PENDIENTE, no se cambia el estado de la reserva
            // Para feligrés: desaparece de la lista (ya está filtrado)
            // Para secretaria: aparece con badge [Pago Pendiente]
            if (ROL_USUARIO.toUpperCase() === 'FELIGRES') {
                alert('💵 Pago registrado como EFECTIVO (PENDIENTE).\n\n' +
                      '📍 Debes completar el pago en oficina antes de la fecha del servicio.\n\n' +
                      'Dirección: Av. Principal 123, Chiclayo\n' +
                      'Horario: Lun-Vie 9:00 AM - 6:00 PM');
                window.location.href = '/cliente/mis_reservas';
            } else {
                alert('💵 Pago EFECTIVO registrado correctamente.\n\n' +
                      'Aparecerá en la lista con el indicador [Pago Pendiente] para aprobación cuando se complete el pago.');
                window.location.reload(); // Recargar para mostrar el badge
            }
            return;
        }

        // Redirigir según el rol
        if (ROL_USUARIO.toUpperCase() === 'SECRETARIA' || ROL_USUARIO.toUpperCase() === 'ADMINISTRADOR') {
            window.location.reload(); // Recargar para actualizar la lista
        } else {
            window.location.href = '/cliente/mis_reservas';
        }
    } catch (err) {
        console.error('Excepción en proceso de pago:', err);
        alert('Error interno al procesar el pago. Revisa la consola del navegador.');
    }
});
