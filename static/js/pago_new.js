// ============================================================
// SISTEMA DE PAGOS - COMPLETO Y CORREGIDO
// ============================================================

// ---------- DATOS DEL USUARIO ----------
const ROL_USUARIO = document.body.getAttribute('data-rol')?.toLowerCase() || '';
const ID_USUARIO = document.body.getAttribute('data-id') || '';
const ID_PARROQUIA = document.body.getAttribute('data-parroquia') || '';

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

// ---------- VARIABLES GLOBALES ----------
let todasLasReservas = [];

// ============================================================
// INICIALIZACIÓN
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    if (!ID_USUARIO || !ROL_USUARIO) {
        alert('Error: Datos de sesión no disponibles');
        window.location.href = '/principal';
        return;
    }

    cargarReservas();
    configurarFiltro();
    configurarEventos();
    cambiarMetodoPago('tarjeta');
});

// ============================================================
// CARGAR RESERVAS SEGÚN ROL
// ============================================================
async function cargarReservas() {
    let url = '';
    
    if (ROL_USUARIO === 'feligres') {
        url = `/api/reserva/feligres/${ID_USUARIO}`;
    } else if (ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador') {
        url = `/api/reserva/secretaria/${ID_USUARIO}`;
    } else {
        listaReservas.innerHTML = '<div class="mensaje-error">Rol no autorizado</div>';
        return;
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.datos)) {
            let reservasFiltradas = [];
            
            if (ROL_USUARIO === 'feligres') {
                // FELIGRÉS: Solo reservas PENDIENTE_PAGO sin pago registrado
                reservasFiltradas = data.datos.filter(r => 
                    r.estadoReserva === 'PENDIENTE_PAGO' && !r.tienePagoReserva
                );
            } else {
                // SECRETARIA/ADMIN: PENDIENTE_PAGO sin pago O con pago PENDIENTE (efectivo)
                reservasFiltradas = data.datos.filter(r => 
                    r.estadoReserva === 'PENDIENTE_PAGO' && 
                    (!r.tienePagoReserva || r.estadoPago === 'PENDIENTE')
                );
            }
            
            todasLasReservas = reservasFiltradas;
            renderizarReservas(reservasFiltradas);
            
            setTimeout(() => actualizarResumenPago(), 100);
        } else {
            listaReservas.innerHTML = '<div class="mensaje-info">No hay reservas pendientes de pago</div>';
        }
    } catch (error) {
        console.error('Error al cargar reservas:', error);
        listaReservas.innerHTML = '<div class="mensaje-error">Error al cargar reservas</div>';
    }
}

// ============================================================
// RENDERIZAR LISTA DE RESERVAS
// ============================================================
function renderizarReservas(reservas, checkboxesPreservar = null) {
    listaReservas.innerHTML = '';
    
    if (!reservas || reservas.length === 0) {
        const mensaje = ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador'
            ? 'No se encontraron reservas con ese criterio' 
            : 'No tienes reservas pendientes de pago';
        listaReservas.innerHTML = `<div class="mensaje-info">${mensaje}</div>`;
        return;
    }

    reservas.forEach(reserva => {
        const id = reserva.idReserva;
        const monto = parseFloat(reserva.costoBase) || 0;
        const fecha = reserva.fecha;
        const numParticipantes = reserva.numParticipantes || 0;
        const esMisa = numParticipantes === 1;
        
        // Nombre del servicio
        const nombreServicio = reserva.acto || reserva.nombreActo || `Servicio #${id}`;
        
        // Formatear fecha
        let fechaFormateada = fecha;
        const d = new Date(fecha);
        if (!isNaN(d)) {
            const day = String(d.getDate()).padStart(2, '0');
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const year = d.getFullYear();
            fechaFormateada = `${day}/${month}/${year}`;
        }

        let textoMostrar = `${nombreServicio} (${fechaFormateada})`;
        
        // Para secretaria, mostrar nombre del feligrés
        if ((ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador') && reserva.nombreFeligres) {
            textoMostrar = `${reserva.nombreFeligres} - ${textoMostrar}`;
        }
        
        // Indicador de pago pendiente (solo secretaria)
        let indicadorPago = '';
        let esPagoPendiente = false;
        if ((ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador') && 
            reserva.tienePagoReserva && reserva.estadoPago === 'PENDIENTE') {
            indicadorPago = '<span class="badge-pendiente" style="color: #f39c12; font-weight: bold; margin-left: 8px;">[EFECTIVO - Pendiente Confirmación]</span>';
            esPagoPendiente = true;
        }
        
        // Checkbox checked si es pago pendiente o estaba seleccionado
        let checkedAttr = '';
        if (esPagoPendiente) {
            checkedAttr = 'checked';
        } else if (checkboxesPreservar && checkboxesPreservar.has(id.toString())) {
            checkedAttr = 'checked';
        }
        
        const reservaHTML = `
            <div class="reserva-row" 
                 data-id="${id}" 
                 data-monto="${monto}" 
                 data-num-participantes="${numParticipantes}"
                 data-es-misa="${esMisa}"
                 data-feligres="${reserva.nombreFeligres ? reserva.nombreFeligres.toLowerCase() : ''}" 
                 data-estado-pago="${reserva.estadoPago || 'SIN_PAGO'}" 
                 data-tiene-pago="${reserva.tienePagoReserva || false}">
                <input type="checkbox" 
                       class="reserva-checkbox" 
                       id="check-${id}" 
                       ${esPagoPendiente ? 'data-pendiente="true"' : ''} 
                       ${checkedAttr}>
                <label for="check-${id}">${textoMostrar}${indicadorPago}</label>
                <span class="reserva-monto">S/ ${monto.toFixed(2)}</span>
            </div>
        `;
        
        listaReservas.insertAdjacentHTML('beforeend', reservaHTML);
    });
}

// ============================================================
// ACTUALIZAR RESUMEN DE PAGO
// ============================================================
function actualizarResumenPago() {
    let totalMonto = 0;
    let contadorReservas = 0;
    let idsSeleccionados = [];
    let estadosPago = new Set();

    const checkboxes = listaReservas.querySelectorAll('.reserva-checkbox');
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const row = cb.closest('.reserva-row');
            const monto = parseFloat(row.dataset.monto) || 0;
            const idReserva = row.dataset.id;
            const estadoPago = row.dataset.estadoPago || 'SIN_PAGO';
            const tienePago = row.dataset.tienePago === 'true';
            
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

    // VALIDACIÓN: No mezclar estados de pago diferentes
    if (estadosPago.size > 1) {
        alert('⚠️ No puedes seleccionar reservas con diferentes estados de pago.\n\nSolo puedes seleccionar:\n• Reservas sin pago, O\n• Reservas con pago PENDIENTE (para confirmar)');
        checkboxes.forEach(cb => { if (cb.checked) cb.checked = false; });
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

    // Verificar si hay pago pendiente seleccionado
    let hayPagoPendiente = false;
    if ((ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador') && contadorReservas > 0) {
        hayPagoPendiente = Array.from(checkboxes).some(cb => {
            if (!cb.checked) return false;
            const row = cb.closest('.reserva-row');
            return row && row.dataset.estadoPago === 'PENDIENTE' && row.dataset.tienePago === 'true';
        });
    }
    
    // Si hay pago pendiente, ocultar efectivo y mostrar solo opción de confirmar
    const metodoEfectivo = document.querySelector('.metodo-card[data-metodo="efectivo"]');
    const metodoYape = document.querySelector('.metodo-card[data-metodo="yape"]');
    const metodoPlin = document.querySelector('.metodo-card[data-metodo="plin"]');
    const metodoTarjeta = document.querySelector('.metodo-card[data-metodo="tarjeta"]');
    
    if (hayPagoPendiente) {
        // Ocultar todos los métodos, solo confirmar pago
        if (metodoEfectivo) metodoEfectivo.style.display = 'none';
        if (metodoYape) metodoYape.style.display = 'none';
        if (metodoPlin) metodoPlin.style.display = 'none';
        if (metodoTarjeta) metodoTarjeta.style.display = 'none';
    } else {
        // Mostrar todos los métodos
        if (metodoEfectivo) metodoEfectivo.style.display = '';
        if (metodoYape) metodoYape.style.display = '';
        if (metodoPlin) metodoPlin.style.display = '';
        if (metodoTarjeta) metodoTarjeta.style.display = '';
    }

    // Actualizar botón
    if (contadorReservas === 0) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Selecciona una Reserva';
    } else {
        btnSubmit.disabled = false;
        const metodoActivo = document.querySelector('.metodo-card.active')?.dataset.metodo || 'tarjeta';
        actualizarBotonSubmit(metodoActivo, totalFormateado, hayPagoPendiente);
    }
}

// ============================================================
// ACTUALIZAR TEXTO DEL BOTÓN DE SUBMIT
// ============================================================
function actualizarBotonSubmit(metodo, total, hayPagoPendiente = false) {
    btnSubmit.classList.remove('btn-tarjeta', 'btn-yape', 'btn-plin', 'btn-efectivo', 'btn-success');
    const montoLimpio = total.replace('S/ ', '');
    
    if (hayPagoPendiente) {
        btnSubmit.textContent = '✅ Confirmar Pago Recibido';
        btnSubmit.classList.add('btn-success');
    } else {
        switch (metodo) {
            case 'tarjeta':
                btnSubmit.textContent = `💳 Pagar S/ ${montoLimpio}`;
                btnSubmit.classList.add('btn-tarjeta');
                break;
            case 'yape':
                btnSubmit.textContent = `📱 Confirmar Pago S/ ${montoLimpio}`;
                btnSubmit.classList.add('btn-yape');
                break;
            case 'plin':
                btnSubmit.textContent = `🏦 Confirmar Pago S/ ${montoLimpio}`;
                btnSubmit.classList.add('btn-plin');
                break;
            case 'efectivo':
                btnSubmit.textContent = '💵 Registrar Pago en Efectivo';
                btnSubmit.classList.add('btn-efectivo');
                break;
            default:
                btnSubmit.textContent = 'Procesar Pago';
        }
    }
}

// ============================================================
// CAMBIAR MÉTODO DE PAGO
// ============================================================
function cambiarMetodoPago(metodoSeleccionado) {
    metodosContainer.querySelectorAll('.metodo-card').forEach(card => {
        card.classList.toggle('active', card.dataset.metodo === metodoSeleccionado);
    });
    
    formSections.forEach(section => {
        const dataMetodo = section.dataset.metodo === 'transferencia' ? 'plin' : section.dataset.metodo;
        section.classList.toggle('active', dataMetodo === metodoSeleccionado);
    });
    
    // Verificar si hay pagos pendientes
    const checkboxes = listaReservas.querySelectorAll('.reserva-checkbox:checked');
    let hayPagoPendiente = false;
    if (ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador') {
        hayPagoPendiente = Array.from(checkboxes).some(cb => {
            const row = cb.closest('.reserva-row');
            return row && row.dataset.estadoPago === 'PENDIENTE';
        });
    }
    
    actualizarBotonSubmit(metodoSeleccionado, totalPagarSpan.textContent, hayPagoPendiente);
}

// ============================================================
// CONFIGURAR FILTRO (SOLO SECRETARIA)
// ============================================================
function configurarFiltro() {
    const filtroContainer = document.getElementById('filtro-container');
    const filtroInput = document.getElementById('filtro-reservas');
    
    if (ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador') {
        if (filtroContainer) filtroContainer.style.display = 'block';
    } else {
        if (filtroContainer) filtroContainer.style.display = 'none';
        return;
    }
    
    if (!filtroInput) return;

    // Validar solo letras
    filtroInput.addEventListener('keypress', e => {
        const char = String.fromCharCode(e.which);
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]$/.test(char) && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();
        }
    });

    filtroInput.addEventListener('input', e => {
        e.target.value = e.target.value.replace(/[0-9]/g, '');
        const textoBusqueda = e.target.value.toLowerCase().trim();
        
        // Guardar checkboxes seleccionados
        const checkboxesSeleccionados = new Set();
        listaReservas.querySelectorAll('.reserva-checkbox:checked').forEach(cb => {
            const row = cb.closest('.reserva-row');
            if (row) checkboxesSeleccionados.add(row.dataset.id);
        });
        
        let reservasFiltradas = todasLasReservas;
        
        if (textoBusqueda) {
            const textoBusquedaNormalizado = textoBusqueda.replace(/\s+/g, ' ').trim();
            reservasFiltradas = todasLasReservas.filter(r => {
                const nombreFeligres = (r.nombreFeligres || '').toLowerCase().trim().replace(/\s+/g, ' ');
                if (!nombreFeligres) return false;
                
                const palabrasBusqueda = textoBusquedaNormalizado.split(' ').filter(p => p.length > 0);
                return palabrasBusqueda.every(palabra => nombreFeligres.includes(palabra));
            });
        }
        
        renderizarReservas(reservasFiltradas, checkboxesSeleccionados);
        setTimeout(() => actualizarResumenPago(), 50);
    });
}

// ============================================================
// CONFIGURAR EVENTOS
// ============================================================
function configurarEventos() {
    // Cambio en checkboxes
    listaReservas.addEventListener('change', e => {
        if (e.target.classList.contains('reserva-checkbox')) {
            actualizarResumenPago();
        }
    });

    // Click en métodos de pago
    metodosContainer.addEventListener('click', e => {
        const card = e.target.closest('.metodo-card');
        if (card) cambiarMetodoPago(card.dataset.metodo);
    });

    // Submit del formulario
    document.getElementById('form-pago').addEventListener('submit', procesarPago);
}

// ============================================================
// PROCESAR PAGO
// ============================================================
async function procesarPago(e) {
    e.preventDefault();

    const ids = idReservasInput.value.trim();
    if (!ids) {
        alert('⚠️ Selecciona al menos una reserva para pagar');
        return;
    }

    const idReservas = ids.split(',').map(id => id.trim());
    const total = parseFloat(totalPagarSpan.textContent.replace(/[^\d.]/g, '')) || 0;
    const metodo = document.querySelector('.metodo-card.active')?.dataset.metodo;

    // Verificar si hay pago pendiente (solo secretaria)
    let tienePagoPendiente = false;
    let idPagoPendiente = null;
    
    if (ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador') {
        for (const idRes of idReservas) {
            const row = document.querySelector(`.reserva-row[data-id="${idRes}"]`);
            if (row && row.dataset.estadoPago === 'PENDIENTE' && row.dataset.tienePago === 'true') {
                tienePagoPendiente = true;
                try {
                    const respPago = await fetch(`/api/pago/pago_por_reserva/${idRes}`);
                    const dataPago = await respPago.json();
                    if (dataPago.ok && dataPago.datos) {
                        idPagoPendiente = dataPago.datos.idPago;
                        break;
                    }
                } catch (error) {
                    console.error('Error obteniendo pago:', error);
                }
            }
        }
    }

    // CASO 1: Confirmar pago pendiente (efectivo ya registrado)
    if (tienePagoPendiente && idPagoPendiente) {
        if (!confirm('¿Confirmar que se recibió el pago en efectivo?')) return;
        
        try {
            const respuesta = await fetch(`/api/pago/actualizar_estado_pago/${idPagoPendiente}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ estadoPago: 'APROBADO' })
            });
            
            const data = await respuesta.json();
            
            if (!respuesta.ok || !data.ok) {
                alert('❌ Error: ' + (data.mensaje || 'Error al confirmar el pago'));
                return;
            }
            
            alert('✅ Pago confirmado exitosamente.\n\nLas reservas se actualizarán automáticamente:\n• Misas → CONFIRMADO\n• Otros actos → Se verificarán los documentos');
            
            if (typeof window.recargarCalendario === 'function') {
                window.recargarCalendario();
            }
            
            window.location.reload();
            return;
        } catch (error) {
            console.error('Error confirmando pago:', error);
            alert('❌ Error al confirmar el pago');
            return;
        }
    }

    // CASO 2: Nuevo pago
    let estadoPago = '';
    let numeroTransaccion = '';

    // TARJETA - Validar y aprobar inmediatamente
    if (metodo === 'tarjeta') {
        const numero = document.getElementById('numero').value || '';
        const nombre = document.getElementById('nombre-titular').value || '';
        const exp = document.getElementById('exp').value || '';
        const cvv = document.getElementById('cvv').value || '';
        
        const validacion = validarTarjeta(numero, nombre, exp, cvv);
        if (!validacion.ok) {
            alert('❌ ' + validacion.mensaje);
            return;
        }
        
        estadoPago = 'APROBADO';
        numeroTransaccion = generarNumeroTransaccion();
    }
    // YAPE - Requiere código (igual que tarjeta, aprobado directo)
    else if (metodo === 'yape') {
        const codigo = document.getElementById('yape-codigo').value.trim();
        if (!codigo || codigo.length < 6) {
            alert('❌ Ingresa el código de operación de Yape (mínimo 6 dígitos)');
            return;
        }
        
        estadoPago = 'APROBADO';
        numeroTransaccion = `YAPE-${codigo}`;
    }
    // PLIN - Requiere código (igual que tarjeta, aprobado directo)
    else if (metodo === 'plin') {
        const codigo = document.getElementById('plin-codigo').value.trim();
        if (!codigo || codigo.length < 6) {
            alert('❌ Ingresa el código de transacción de Plin (mínimo 6 dígitos)');
            return;
        }
        
        estadoPago = 'APROBADO';
        numeroTransaccion = `PLIN-${codigo}`;
    }
    // EFECTIVO - Solo secretaria puede registrar
    else if (metodo === 'efectivo') {
        if (ROL_USUARIO !== 'secretaria' && ROL_USUARIO !== 'administrador') {
            alert('❌ Solo la secretaria puede registrar pagos en efectivo');
            return;
        }
        
        if (!confirm('¿Confirmar registro de pago en efectivo?\n\nEl pago quedará PENDIENTE hasta que se confirme el pago.')) {
            return;
        }
        
        estadoPago = 'PENDIENTE';
        numeroTransaccion = `EFECTIVO-${Date.now()}`;
    }
    else {
        alert('❌ Método de pago no válido');
        return;
    }

    // Registrar el pago
    try {
        const formData = new FormData();
        formData.append('f_pago', new Date().toISOString().slice(0, 10));
        formData.append('montoTotal', total.toString());
        formData.append('metodoPago', (metodo || '').toUpperCase());
        formData.append('numeroTransaccion', numeroTransaccion);
        formData.append('estadoPago', estadoPago);

        const respPago = await fetch('/api/pago/registrar_pago', { 
            method: 'POST', 
            body: formData 
        });
        
        const dataPago = await respPago.json();
        
        if (!respPago.ok || !dataPago.ok) {
            alert('❌ Error al registrar el pago: ' + (dataPago.mensaje || 'Error desconocido'));
            return;
        }

        const idPago = dataPago.idPago;
        if (!idPago) {
            alert('❌ No se recibió el ID del pago');
            return;
        }

        // Asociar el pago a cada reserva
        for (const idRes of idReservas) {
            const row = document.querySelector(`.reserva-row[data-id="${idRes}"]`);
            const montoReserva = row ? parseFloat(row.dataset.monto) : 0;
            
            const fdDetalle = new FormData();
            fdDetalle.append('idPago', idPago);
            fdDetalle.append('idReserva', idRes);
            fdDetalle.append('monto', montoReserva.toString());
            fdDetalle.append('metodoPago', (metodo || '').toUpperCase());
            fdDetalle.append('estadoPago', estadoPago);

            const respDetalle = await fetch('/api/pago/registrar_pago_reserva', { 
                method: 'POST', 
                body: fdDetalle 
            });
            
            const dataDetalle = await respDetalle.json();
            
            if (!respDetalle.ok || !dataDetalle.ok) {
                alert(`❌ Error al asociar reserva ${idRes}: ` + (dataDetalle.mensaje || 'Error'));
                return;
            }
        }

        // Mostrar mensaje según el método
        mostrarMensajeExito(metodo, estadoPago);
        
        // Recargar calendario si está disponible
        if (typeof window.recargarCalendario === 'function') {
            window.recargarCalendario();
        }
        
        // Redirigir
        if (ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador') {
            window.location.reload();
        } else {
            window.location.href = '/cliente/mis_reservas';
        }
        
    } catch (error) {
        console.error('Error procesando pago:', error);
        alert('❌ Error interno al procesar el pago');
    }
}

// ============================================================
// MOSTRAR MENSAJE DE ÉXITO
// ============================================================
function mostrarMensajeExito(metodo, estadoPago) {
    let mensaje = '';
    
    if (metodo === 'tarjeta') {
        mensaje = '✅ Pago con tarjeta APROBADO exitosamente.\n\n' +
                  '📋 Tus reservas se actualizarán:\n' +
                  '• Misas → CONFIRMADO (listo para asistir)\n' +
                  '• Otros actos → Se verificarán documentos\n\n' +
                  'Revisa el estado en "Mis Reservas".';
    } else if (metodo === 'yape' || metodo === 'plin') {
        const metodoCap = metodo === 'yape' ? 'Yape' : 'Plin';
        mensaje = `✅ Pago con ${metodoCap} APROBADO exitosamente.\n\n` +
                  '📋 Tus reservas se actualizarán:\n' +
                  '• Misas → CONFIRMADO (listo para asistir)\n' +
                  '• Otros actos → Se verificarán documentos\n\n' +
                  'Revisa el estado en "Mis Reservas".';
    } else if (metodo === 'efectivo') {
        if (ROL_USUARIO === 'secretaria' || ROL_USUARIO === 'administrador') {
            mensaje = '💵 Pago en efectivo registrado.\n\n' +
                      'El pago quedará PENDIENTE hasta que se confirme.\n' +
                      'Aparecerá en la lista con el indicador [EFECTIVO - Pendiente].';
        }
    }
    
    alert(mensaje);
}

// ============================================================
// UTILIDADES
// ============================================================
function validarTarjeta(numero, nombre, exp, cvv) {
    const numClean = numero.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(numClean)) {
        return { ok: false, mensaje: 'Número de tarjeta inválido' };
    }
    if (!nombre || nombre.trim().length < 3) {
        return { ok: false, mensaje: 'Nombre del titular inválido' };
    }
    if (!/^\d{2}\/\d{2}$/.test(exp)) {
        return { ok: false, mensaje: 'Fecha de expiración inválida (MM/AA)' };
    }
    if (!/^\d{3,4}$/.test(cvv)) {
        return { ok: false, mensaje: 'CVV inválido' };
    }
    
    const [mm, yy] = exp.split('/').map(x => parseInt(x, 10));
    if (mm < 1 || mm > 12) {
        return { ok: false, mensaje: 'Mes de expiración inválido' };
    }
    
    return { ok: true };
}

function generarNumeroTransaccion() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'TXN-';
    for (let i = 0; i < 12; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
