// =========================================================
// reserva_requisito.js - Lógica con Roles (Feligres/Secretaria/Admin) CORREGIDO
// =========================================================

let archivosSeleccionados = {}; // Archivos temporales del Feligres
let configuracionActo = null;  // Configuración dinámica del acto

// ==============================
// FUNCIONES AUXILIARES
// ==============================
function obtenerRolUsuario() {
    return document.body.dataset.rol?.toLowerCase() || 'feligres';
}

function volverPasoAnterior() {
    guardarRequisitos();
    window.location.href = '/cliente/reserva_datos';
}

// ==============================
// CONFIGURACIÓN DEL ACTO
// ==============================
async function obtenerConfiguracionActo(idActo) {
    try {
        const resp = await fetch(`/api/acto/configuracion/${idActo}`);
        const data = await resp.json();
        if (data.success && data.datos) {
            configuracionActo = data.datos;
            console.log("✅ Configuración del acto cargada:", configuracionActo);
        } else {
            console.warn("⚠️ No se encontró configuración para este acto.");
        }
    } catch (error) {
        console.error("❌ Error al obtener configuración del acto:", error);
    }
}

// ==============================
// CALCULAR FECHA LÍMITE DOCUMENTOS
// ==============================
function calcularFechaLimiteDocumentos(reservaData) {
    if (!reservaData?.fecha || !configuracionActo) return null;

    const tiempoCambio = configuracionActo.tiempoCambioDocumentos || 48;
    const unidad = configuracionActo.unidadTiempoAcciones || "horas";
    const fechaActo = new Date(reservaData.fecha);
    const fechaLimite = new Date(fechaActo);

    if (unidad === "horas") fechaLimite.setHours(fechaLimite.getHours() - tiempoCambio);
    else fechaLimite.setDate(fechaLimite.getDate() - tiempoCambio);

    const year = fechaLimite.getFullYear();
    const month = String(fechaLimite.getMonth() + 1).padStart(2, '0');
    const day = String(fechaLimite.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ==============================
// MANEJO DE ARCHIVOS
// ==============================
function manejarCambioArchivo(event) {
    const input = event.target;
    const idRequisito = input.dataset.idRequisito;
    const archivo = input.files[0];
    const mensajeErrorEl = document.getElementById(`error-${idRequisito}`);

    mensajeErrorEl?.remove();
    input.classList.remove('is-invalid');

    if (archivo) {
        const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg'];
        if (!tiposPermitidos.includes(archivo.type)) {
            input.classList.add('is-invalid');
            const errorDiv = document.createElement('div');
            errorDiv.className = 'invalid-feedback d-block';
            errorDiv.id = `error-${idRequisito}`;
            errorDiv.textContent = '⚠️ Solo se permiten archivos PDF, JPG o JPEG.';
            input.parentNode.insertBefore(errorDiv, input.nextSibling);
            delete archivosSeleccionados[idRequisito];
            input.value = '';
            return;
        }
        archivosSeleccionados[idRequisito] = {
            file: archivo,
            tipo: archivo.type.split('/')[1].toUpperCase()
        };
        console.log(`✅ Archivo válido para requisito ${idRequisito}: ${archivo.name}`);
    } else {
        delete archivosSeleccionados[idRequisito];
        console.log(`❌ Archivo deseleccionado para requisito ${idRequisito}.`);
    }
}

// ==============================
// GUARDAR REQUISITOS
// ==============================
function guardarRequisitos() {
    const rol = obtenerRolUsuario();
    const requisitosContainer = document.getElementById('requisitos-lista');
    const reservaData = JSON.parse(sessionStorage.getItem('reserva') || '{}');
    reservaData.requisitos = reservaData.requisitos && typeof reservaData.requisitos === 'object' ? reservaData.requisitos : {};

    const requisitosGuardados = reservaData.requisitos;
    let datosRequisitosNuevos = {};
    const fechaHoy = new Date().toISOString().split('T')[0];

    const calcularVigenciaPlazo = () => {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 7);
        const y = fechaLimite.getFullYear();
        const m = String(fechaLimite.getMonth() + 1).padStart(2, '0');
        const d = String(fechaLimite.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    };
    const plazoSieteDias = calcularVigenciaPlazo();

    // ==========================
    // FELIGRES
    // ==========================
    if (rol === 'feligres') {
        requisitosContainer.querySelectorAll('input[type="file"]').forEach(input => {
            const id = input.dataset.idRequisito;
            const nombre = input.dataset.nombreRequisito;
            const archivoData = archivosSeleccionados[id];
            const meta = requisitosGuardados[id] || {};
            const idActoRequisito = meta.idActoRequisito || input.dataset.idActoRequisito || null;

            const archivoNuevo = !!archivoData?.file;
            const archivoPrevio = !!meta.rutaArchivo && meta.nombreArchivo !== 'NO CUMPLIDO';
            const archivoPresente = archivoNuevo || archivoPrevio;

            let f_subido = archivoPresente ? (archivoNuevo ? fechaHoy : meta.f_subido || null) : null;
            let nombreArchivo = archivoPresente ? (archivoNuevo ? archivoData.file.name : meta.nombreArchivo) : 'NO CUMPLIDO';
            let rutaArchivo = archivoPresente ? (archivoNuevo ? `/temporal/${id}_${archivoData.file.name}` : meta.rutaArchivo) : null;
            let tipoArchivo = archivoPresente ? (archivoNuevo ? archivoData.tipo : meta.tipoArchivo) : null;

            const fechaLimiteConfig = calcularFechaLimiteDocumentos(reservaData);

            datosRequisitosNuevos[id] = {
                idActoRequisito,
                nombre,
                nombreArchivo,
                archivoListo: archivoPresente,
                rutaArchivo,
                tipoArchivo,
                f_subido,
                vigenciaDocumento: fechaLimiteConfig || plazoSieteDias,
                aprobado: false,
                estadoCumplido: archivoPresente ? 'CUMPLIDO' : 'NO_CUMPLIDO'
            };
        });
    }
    // ==========================
    // SECRETARIA / ADMIN
    // ==========================
    else {
        requisitosContainer.querySelectorAll('input[type="checkbox"]').forEach(chk => {
            const id = chk.dataset.idRequisito;
            const nombre = chk.dataset.nombreRequisito;
            const idActoRequisito = chk.dataset.idActoRequisito || null;
            const meta = requisitosGuardados[id] || {};

            let nombreArchivo = meta.nombreArchivo || 'NO CUMPLIDO';
            let rutaArchivo = meta.rutaArchivo || null;
            let tipoArchivo = meta.tipoArchivo || null;
            let f_subido = null;
            let estadoCumplido;

            if (chk.checked) {
                estadoCumplido = 'CUMPLIDO';
                f_subido = fechaHoy;
                if (nombreArchivo === 'NO CUMPLIDO') nombreArchivo = 'ENTREGADO (Manual)';
            } else {
                estadoCumplido = 'NO_CUMPLIDO';
                nombreArchivo = 'NO CUMPLIDO';
                rutaArchivo = null;
                tipoArchivo = null;
                f_subido = null;
            }

            const fechaLimiteConfig = calcularFechaLimiteDocumentos(reservaData);

            datosRequisitosNuevos[id] = {
                idActoRequisito,
                nombre,
                nombreArchivo,
                archivoListo: !!rutaArchivo,
                rutaArchivo,
                tipoArchivo,
                f_subido,
                vigenciaDocumento: fechaLimiteConfig || plazoSieteDias,
                aprobado: false,
                entregado: chk.checked,
                estadoCumplido
            };
        });
    }

    // Fusionar datos nuevos
    Object.keys(datosRequisitosNuevos).forEach(id => {
        reservaData.requisitos[id] = { ...reservaData.requisitos[id], ...datosRequisitosNuevos[id] };
    });

    // Actualizar estado global de requisitos
    const tipoActoStr = (reservaData.tipoActo || reservaData.nombreActo || '').toLowerCase();
    if (tipoActoStr.includes('misa')) reservaData.requisitos.estado = "PENDIENTE_PAGO";
    else {
        const count = Object.keys(reservaData.requisitos).filter(k => k !== 'estado').length;
        const archivosSubidos = Object.values(reservaData.requisitos).filter(r => r.archivoListo).length;
        reservaData.requisitos.estado = count === 0 ? "PENDIENTE_DOCUMENTO" : (archivosSubidos > 0 ? "PENDIENTE_REVISION" : "PENDIENTE_DOCUMENTO");
    }

    sessionStorage.setItem('reserva', JSON.stringify(reservaData));
    console.log('📌 Requisitos guardados:', reservaData.requisitos);
}

// ==============================
// GUARDAR Y CONTINUAR
// ==============================
function guardarRequisitosYContinuar() {
    const rol = obtenerRolUsuario();
    const termsCheckbox = document.getElementById('terms-autorizacion');
    if (rol === 'feligres' && (!termsCheckbox || !termsCheckbox.checked)) {
        alert("⚠️ Debes aceptar los términos y condiciones antes de continuar.");
        return;
    }
    guardarRequisitos();
    window.location.href = '/cliente/reserva_resumen';
}

// ==============================
// GENERACIÓN DE UI
// ==============================
function generarUIRequisitos(lista, container, rol, reservaData) {
    if (!container) return;
    container.innerHTML = '';
    const requisitosGuardados = reservaData.requisitos || {};

    if (rol === 'feligres') {
        const fechaLimite = calcularFechaLimiteDocumentos(reservaData);
        const info = document.createElement('p');
        info.className = 'alert alert-info small mt-3';
        info.innerHTML = `<i class="fas fa-info-circle"></i> Debes entregar o cambiar los documentos antes del <strong>${fechaLimite || '...'}</strong>.`;
        container.appendChild(info);
    }

    if (!lista?.length) {
        container.innerHTML = '<p class="alert alert-success">✅ No se encontraron requisitos para este acto.</p>';
        return;
    }

    lista.forEach(r => {
        const id = r.id;
        const meta = requisitosGuardados[id] || {};
        const card = document.createElement('div');
        card.className = 'card mb-3 shadow-sm border-info';
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const titulo = document.createElement('h5');
        titulo.className = 'card-title';
        titulo.textContent = r.nombRequisito + (r.obligatorio ? ' *' : '');
        const descripcion = document.createElement('p');
        descripcion.className = 'card-text text-muted small';
        descripcion.textContent = r.descripcion;

        cardBody.appendChild(titulo);
        cardBody.appendChild(descripcion);

        if (rol === 'feligres') {
            const archivoYaCargado = !!meta.rutaArchivo || !!archivosSeleccionados[id];
            if (archivoYaCargado && meta.nombreArchivo && meta.nombreArchivo !== 'NO CUMPLIDO') {
                const infoExistente = document.createElement('p');
                infoExistente.className = 'text-success small font-weight-bold';
                infoExistente.innerHTML = `<i class="fas fa-check-circle"></i> Archivo previamente subido: <strong>${meta.nombreArchivo}</strong>`;
                cardBody.appendChild(infoExistente);
            }
            const input = document.createElement('input');
            input.type = 'file';
            input.className = 'form-control-file mt-2';
            input.id = `requisito-file-${id}`;
            input.dataset.idRequisito = id;
            input.dataset.idActoRequisito = r.idActoRequisito;
            input.dataset.nombreRequisito = r.nombRequisito;
            input.accept = ".pdf, .jpg, .jpeg";
            if (r.obligatorio && !archivoYaCargado) input.required = true;
            input.addEventListener('change', manejarCambioArchivo);
            cardBody.appendChild(input);
        } else {
            const entregado = meta.entregado === true;
            const pEstado = document.createElement('p');
            pEstado.className = entregado ? 'text-success' : 'text-danger';
            pEstado.innerHTML = `Estado: <strong>${entregado ? 'CUMPLIDO' : 'NO CUMPLIDO'}</strong>`;
            cardBody.appendChild(pEstado);

            const divChk = document.createElement('div');
            divChk.className = 'form-check mt-2';
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.className = 'form-check-input';
            chk.id = `requisito-check-${id}`;
            chk.checked = entregado;
            chk.dataset.idRequisito = id;
            chk.dataset.idActoRequisito = r.idActoRequisito;
            chk.dataset.nombreRequisito = r.nombRequisito;

            const labelChk = document.createElement('label');
            labelChk.className = 'form-check-label font-weight-bold';
            labelChk.htmlFor = chk.id;
            labelChk.textContent = 'Entregado';
            divChk.appendChild(chk);
            divChk.appendChild(labelChk);
            cardBody.appendChild(divChk);
        }

        card.appendChild(cardBody);
        container.appendChild(card);
    });
}

// ==============================
// INICIALIZACIÓN
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
    const rolUsuario = obtenerRolUsuario();
    const datosReservaString = sessionStorage.getItem('reserva');
    const container = document.getElementById('requisitos-lista');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnAtras = document.getElementById('btn-atras');
    if (!datosReservaString || !container) return;

    const reservaData = JSON.parse(datosReservaString);
    const idActo = reservaData.idActo;
    if (!idActo) {
        container.innerHTML = '<p class="text-warning">⚠️ No se ha seleccionado un acto. Vuelve al Paso 1.</p>';
        return;
    }

    await obtenerConfiguracionActo(idActo);

    const nombreActo = (configuracionActo?.nombreActo || reservaData.nombreActo || '').toLowerCase();
    if (nombreActo.includes('misa')) {
        container.innerHTML = `
            <div class="alert alert-success text-center p-4 rounded">
                <h5 class="mb-2">✅ No se encontraron requisitos para este acto.</h5>
                <p class="mb-0">Para este tipo de celebración no se solicitarán documentos adicionales.</p>
            </div>`;
        reservaData.requisitos = reservaData.requisitos || {};
        reservaData.requisitos.estado = "PENDIENTE_PAGO";
        sessionStorage.setItem('reserva', JSON.stringify(reservaData));
        console.log("✅ MISA detectada → estado PENDIENTE_PAGO.");

        btnSiguiente?.addEventListener('click', () => window.location.href = '/cliente/reserva_resumen');
        btnAtras?.addEventListener('click', volverPasoAnterior);
        return;
    }

    // Cargar requisitos normales
    try {
        const resp = await fetch(`/api/requisito/${idActo}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        generarUIRequisitos(data.datos || [], container, rolUsuario, reservaData);
    } catch (err) {
        console.error("❌ Error cargando requisitos:", err);
        container.innerHTML = `<p class="alert alert-danger">Error: ${err}</p>`;
    }

    btnSiguiente?.addEventListener('click', guardarRequisitosYContinuar);
    btnAtras?.addEventListener('click', volverPasoAnterior);
});
