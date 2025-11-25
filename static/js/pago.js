
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

// ---------- RENDERIZADO DE RESERVAS ----------
function renderizarReservas(reservas) {
    listaReservas.innerHTML = '';
    if (!reservas || reservas.length === 0) {
        listaReservas.innerHTML = `<div class="mensaje-info">No tienes reservas pendientes de pago.</div>`;
        return;
    }

    reservas.forEach(reserva => {
        const montoNumerico = parseFloat(reserva.costoBase) || 0;
        const id = reserva.idReserva;
        const fecha = reserva.fecha;

        // Usamos acto > mencion > fallback
        const nombreServicio = reserva.acto?.trim() 
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

        // Combinar nombre y fecha entre paréntesis
        const textoMostrar = `${nombreServicio} (${fechaFormateada})`;

        const reservaHTML = `
            <div class="reserva-row" data-id="${id}" data-monto="${montoNumerico}">
              <input type="checkbox" class="reserva-checkbox" id="check-${id}">
              <label for="check-${id}">${textoMostrar}</label>
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
    if (rol === 'SECRETARIA') url = `/api/reserva/secretaria/${ID_USUARIO}`;
    else if (rol === 'FELIGRES') url = `/api/reserva/feligres/${ID_USUARIO}`;
    else return console.error("Rol no reconocido:", ROL_USUARIO);

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const data = await response.json();

        if (data.success && Array.isArray(data.datos)) {
            const reservasFiltradas = data.datos.filter(r => r.estadoReserva === 'PENDIENTE_PAGO');
            renderizarReservas(reservasFiltradas);
            actualizarResumenPago();
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

    const checkboxes = listaReservas.querySelectorAll('.reserva-checkbox');
    checkboxes.forEach(cb => {
        if (cb.checked) {
            const row = cb.closest('.reserva-row');
            const monto = parseFloat(row.dataset.monto) || 0;
            const idReserva = row.dataset.id;
            totalMonto += monto;
            contadorReservas++;
            idsSeleccionados.push(idReserva);
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
        const metodoActivo = document.querySelector('.metodo-card.active')?.dataset.metodo || 'tarjeta';
        actualizarBotonSubmit(metodoActivo, totalFormateado);
    }
}

function actualizarBotonSubmit(metodo, total) {
    btnSubmit.classList.remove('btn-tarjeta', 'btn-yape', 'btn-plin', 'btn-efectivo');
    const montoLimpio = total.replace('S/ ', '');
    switch (metodo) {
        case 'tarjeta': btnSubmit.textContent = `Pagar S/ ${montoLimpio} con Tarjeta`; btnSubmit.classList.add('btn-tarjeta'); break;
        case 'yape': btnSubmit.textContent = `Yapear S/ ${montoLimpio}`; btnSubmit.classList.add('btn-yape'); break;
        case 'plin': btnSubmit.textContent = `Pagar S/ ${montoLimpio} con Plin`; btnSubmit.classList.add('btn-plin'); break;
        case 'efectivo': btnSubmit.textContent = 'Confirmar Pago en Oficina'; btnSubmit.classList.add('btn-efectivo'); break;
        default: btnSubmit.textContent = 'Procesar Pago';
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

// ---------- EVENTOS INICIALES ----------
document.addEventListener('DOMContentLoaded', () => {
    cargarReservas();

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

    let estadoPago = '';
    let archivoComprobante = null;

    if (metodo === 'efectivo') estadoPago = 'PENDIENTE';
    else if (metodo === 'yape' || metodo === 'plin') {
        estadoPago = 'APROBADO';
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

        if (metodo !== 'efectivo') {
            for (const idRes of idReservas) {
                const respEstado = await fetch(`/api/reserva/cambiar_estado/${idRes}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ accion: 'continuar' })
                });
                const dataEstado = await respEstado.json();
                if (!respEstado.ok || !dataEstado.ok) return alert(dataEstado.mensaje || `No se pudo actualizar reserva ${idRes}.`);
            }
            alert('Pago realizado correctamente. Estado de las reservas actualizado.');
        } else {
            alert('Pago registrado como EFECTIVO. Completa el pago en oficina.');
        }

        window.location.href = '/cliente/mis_reservas';
    } catch (err) {
        console.error('Excepción en proceso de pago:', err);
        alert('Error interno al procesar el pago. Revisa la consola del navegador.');
    }
});
