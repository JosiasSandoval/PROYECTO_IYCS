/**
 * pago.js (versión corregida)
 * - Adaptado a FormData para tus routes Flask.
 * - Registra pago -> registra pago_reserva -> cambia estado (si aplica).
 */

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
    // validaciones simples (no PCI)
    const numClean = numero.replace(/\s+/g, '');
    if (!/^\d{13,19}$/.test(numClean)) return { ok: false, msg: 'Número de tarjeta inválido' };
    if (!nombre || nombre.trim().length < 3) return { ok: false, msg: 'Nombre del titular inválido' };
    if (!/^\d{2}\/\d{2}$/.test(exp)) return { ok: false, msg: 'Expiración inválida (MM/AA)' };
    if (!/^\d{3,4}$/.test(cvv)) return { ok: false, msg: 'CVV inválido' };
    // comprobar mes
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

// ---------- RENDER Y CARGA ----------
function renderizarReservas(reservas) {
    listaReservas.innerHTML = '';
    if (!reservas || reservas.length === 0) {
        listaReservas.innerHTML = `<div class="mensaje-info">No tienes reservas pendientes de pago.</div>`;
        return;
    }

    reservas.forEach(reserva => {
        const montoReserva = reserva.costoBase;
        const id = reserva.idReserva;
        const fecha = reserva.fecha;
        const nombreServicio = reserva.mencion || reserva.nombreActo || `Servicio de Reserva #${id}`;
        const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES');
        const montoNumerico = parseFloat(montoReserva);
        const montoFormateado = isNaN(montoNumerico) ? '0.00' : montoNumerico.toFixed(2);

        const reservaHTML = `
            <div class="reserva-row" data-id="${id}" data-monto="${montoNumerico || 0.00}">
              <input type="checkbox" class="reserva-checkbox" id="check-${id}">
              <label for="check-${id}">
                Reserva - ${nombreServicio} (${fechaFormateada})
              </label>
              <span class="reserva-monto">S/ ${montoFormateado}</span>
            </div>
        `;
        listaReservas.insertAdjacentHTML('beforeend', reservaHTML);
    });
}

async function cargarReservasPendientes() {
    if (!ID_USUARIO || !ROL_USUARIO) {
        console.error("ID de Usuario o Rol no definidos en el body.");
        listaReservas.innerHTML = `<div class="mensaje-error">Error: Datos de usuario no disponibles.</div>`;
        return;
    }

    const url = `/api/reserva/reserva_usuario/${ID_USUARIO}/${ROL_USUARIO}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const data = await response.json();

        if (data.ok && data.datos) {
            const reservasFiltradas = data.datos.filter(r => r.estadoReserva === 'PENDIENTE_PAGO');
            renderizarReservas(reservasFiltradas);
            actualizarResumenPago();
        } else {
            listaReservas.innerHTML = `<div class="mensaje-info">No se pudo cargar la lista de reservas.</div>`;
            console.error("API response error:", data.mensaje);
        }
    } catch (err) {
        console.error("Error al cargar reservas:", err);
        listaReservas.innerHTML = `<div class="mensaje-error">Error de conexión con el servidor.</div>`;
    }
}

// ---------- RESUMEN Y BOTÓN ----------
function actualizarResumenPago() {
    let totalMonto = 0;
    let contadorReservas = 0;
    let idsSeleccionados = [];

    const checkboxes = listaReservas.querySelectorAll('.reserva-checkbox');
    checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
            const row = checkbox.closest('.reserva-row');
            const montoStr = row.getAttribute('data-monto');
            const idReserva = row.getAttribute('data-id');
            const monto = parseFloat(montoStr);
            if (!isNaN(monto)) {
                totalMonto += monto;
                contadorReservas++;
                idsSeleccionados.push(idReserva);
            }
        }
    });

    const totalFormateado = `S/ ${totalMonto.toFixed(2)}`;
    totalReservasSpan.textContent = totalFormateado;
    resumenContSpan.textContent = contadorReservas;
    subtotalServiciosSpan.textContent = totalFormateado;
    totalPagarSpan.textContent = totalFormateado;
    idReservasInput.value = idsSeleccionados.join(',');

    if (contadorReservas === 0) {
        btnSubmit.disabled = true;
        btnSubmit.textContent = 'Selecciona una Reserva';
    } else {
        btnSubmit.disabled = false;
        const metodoActivo = document.querySelector('.metodo-card.active')?.getAttribute('data-metodo') || 'tarjeta';
        actualizarBotonSubmit(metodoActivo, totalFormateado);
    }
}

function actualizarBotonSubmit(metodo, total) {
    btnSubmit.classList.remove('btn-tarjeta', 'btn-yape', 'btn-plin', 'btn-efectivo');
    const montoLimpio = total.slice(3);
    switch (metodo) {
        case 'tarjeta':
            btnSubmit.textContent = `Pagar S/ ${montoLimpio} con Tarjeta`;
            btnSubmit.classList.add('btn-tarjeta'); break;
        case 'yape':
            btnSubmit.textContent = `Yapear S/ ${montoLimpio}`; btnSubmit.classList.add('btn-yape'); break;
        case 'plin':
            btnSubmit.textContent = `Pagar S/ ${montoLimpio} con Plin`; btnSubmit.classList.add('btn-plin'); break;
        case 'efectivo':
            btnSubmit.textContent = 'Confirmar Pago en Oficina'; btnSubmit.classList.add('btn-efectivo'); break;
        default:
            btnSubmit.textContent = 'Procesar Pago';
    }
}

function cambiarMetodoPago(metodoSeleccionado) {
    const tarjetas = metodosContainer.querySelectorAll('.metodo-card');
    tarjetas.forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-metodo') === metodoSeleccionado) card.classList.add('active');
    });

    formSections.forEach(section => {
        section.classList.remove('active');
        const dataMetodo = section.getAttribute('data-metodo') === 'transferencia' ? 'plin' : section.getAttribute('data-metodo');
        if (dataMetodo === metodoSeleccionado) section.classList.add('active');
    });

    const totalActual = totalPagarSpan.textContent;
    actualizarBotonSubmit(metodoSeleccionado, totalActual);
}

// ---------- EVENTOS INICIALES ----------
document.addEventListener('DOMContentLoaded', () => {
    cargarReservasPendientes();

    listaReservas.addEventListener('change', (e) => {
        if (e.target.classList.contains('reserva-checkbox')) actualizarResumenPago();
    });

    metodosContainer.addEventListener('click', (e) => {
        const metodoCard = e.target.closest('.metodo-card');
        if (metodoCard) {
            const metodo = metodoCard.getAttribute('data-metodo');
            cambiarMetodoPago(metodo);
        }
    });

    cambiarMetodoPago('tarjeta');
});

// ---------- PARTE 4: PROCESAR PAGO ----------
btnSubmit.addEventListener('click', async (e) => {
    e.preventDefault();

    const metodo = document.querySelector('.metodo-card.active')?.dataset.metodo;
    const ids = idReservasInput.value.trim();

    if (!ids) {
        alert("Selecciona al menos una reserva para pagar.");
        return;
    }

    const idReservas = ids.split(',').map(id => id.trim());
    // limpiar S/ y espacios
    const totalStr = totalPagarSpan.textContent.replace(/[^\d.]/g, '');
    const total = parseFloat(totalStr) || 0;

    // determinar estadoPago correcto para el ENUM en BD
    // DB acepta: 'PENDIENTE', 'APROBADO', 'CANCELADO'
    let estadoPago = '';
    let archivoComprobante = null;

    if (metodo === 'efectivo') {
        estadoPago = 'PENDIENTE';
    } else if (metodo === 'yape' || metodo === 'plin') {
        estadoPago = 'APROBADO';

        archivoComprobante = document.getElementById('file-comprobante')?.files[0];
        // Además validar que exista el código si aplica
        const codigoYape = document.getElementById('yape-codigo')?.value?.trim();
        const codigoPlin = document.getElementById('plin-codigo')?.value?.trim();

        if (!archivoComprobante && !codigoYape && !codigoPlin) {
            alert('Debes subir un comprobante o ingresar código para Yape/Plin.');
            return;
        }
    } else if (metodo === 'tarjeta') {
        estadoPago = 'APROBADO';

        // validar inputs de tarjeta (ids: numero, nombre-titular, exp, cvv)
        const numero = document.getElementById('numero')?.value || '';
        const nombre = document.getElementById('nombre-titular')?.value || '';
        const exp = document.getElementById('exp')?.value || '';
        const cvv = document.getElementById('cvv')?.value || '';

        const validCard = validarTarjetaSimple(numero, nombre, exp, cvv);
        if (!validCard.ok) {
            alert(validCard.msg);
            return;
        }
    } else {
        alert('Método de pago no válido.');
        return;
    }

    // número de transacción:
    let numeroTransaccion = 'PAGO-' + Date.now();
    if (metodo === 'tarjeta') numeroTransaccion = generarTxnIdTarjeta(8);

    // -----------------------
    // 1) Registrar PAGO (FormData)
    // -----------------------
    try {
        const formData = new FormData();
        formData.append('f_pago', new Date().toISOString().slice(0, 10));
        formData.append('montoTotal', total.toString());
        formData.append('metodoPago', (metodo || '').toUpperCase());
        formData.append('numeroTransaccion', numeroTransaccion);
        formData.append('estadoPago', estadoPago);

        if (archivoComprobante) formData.append('file', archivoComprobante);

        const respPago = await fetch('/api/pago/registrar_pago', {
            method: 'POST',
            body: formData
        });

        const dataPago = await respPago.json();
        if (!respPago.ok || !dataPago.ok) {
            console.error('Error al registrar pago:', dataPago);
            alert(dataPago.mensaje || 'Error al registrar el pago.');
            return;
        }

        const idPago = dataPago.idPago;
        if (!idPago) {
            alert('No se devolvió idPago desde el servidor.');
            return;
        }

        // -----------------------
        // 2) Registrar pago_reserva por cada reserva (FormData)
        // -----------------------
        for (const idRes of idReservas) {
            const montoReserva = document.querySelector(`.reserva-row[data-id="${idRes}"]`)?.dataset?.monto;
            const fdDetalle = new FormData();
            fdDetalle.append('idPago', idPago);
            fdDetalle.append('idReserva', idRes);
            fdDetalle.append('monto', parseFloat(montoReserva || 0).toString());

            const respDetalle = await fetch('/api/pago/registrar_pago_reserva', {
                method: 'POST',
                body: fdDetalle
            });

            const dataDetalle = await respDetalle.json();
            if (!respDetalle.ok || !dataDetalle.ok) {
                console.error('Error al registrar pago_reserva:', dataDetalle);
                alert(dataDetalle.mensaje || `Error al asociar reserva ${idRes}.`);
                return;
            }
        }

        // -----------------------
        // 3) Cambiar estado de reservas (solo si no es efectivo)
        // -----------------------
        if (metodo !== 'efectivo') {
            for (const idRes of idReservas) {
                const respEstado = await fetch(`/api/reserva/cambiar_estado/${idRes}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accion: 'continuar' })
                });

                const dataEstado = await respEstado.json();
                if (!respEstado.ok || !dataEstado.ok) {
                    console.error('Error al cambiar estado reserva:', idRes, dataEstado);
                    alert(dataEstado.mensaje || `No se pudo actualizar reserva ${idRes}.`);
                    return;
                }
            }
            alert('Pago realizado correctamente. Estado de las reservas actualizado.');
        } else {
            alert('Pago registrado como EFECTIVO. Completa el pago en oficina.');
        }

        // -----------------------
        // 4) Redirección final
        // -----------------------
        window.location.href = '/cliente/mis_reservas';
    } catch (err) {
        console.error('Excepción en proceso de pago:', err);
        alert('Error interno al procesar el pago. Revisa la consola del navegador.');
    }
});
