// =========================================================
// reserva_requisito.js - Lógica con Roles (Feligres/Secretaria/Admin) CORREGIDO FINAL
// =========================================================

let archivosSeleccionados = {}; // Archivos temporales del Feligres
let configuracionActo = null;  // Configuración dinámica del acto (se cargará desde la API)

// ==============================
// FUNCIONES AUXILIARES
// ==============================
function obtenerRolUsuario() {
    return document.body.dataset.rol ? document.body.dataset.rol.toLowerCase() : 'feligres';
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
// CALCULAR FECHA LÍMITE DOCUMENTOS (manteniendo formato YYYY-MM-DD)
// ==============================
function calcularFechaLimiteDocumentos(reservaData) {
    if (!reservaData?.fecha) return null;
    if (!configuracionActo) return null;

    const tiempoCambio = configuracionActo.tiempoCambioDocumentos || 48;
    const unidad = configuracionActo.unidadTiempoAcciones || "horas";
    const fechaActo = new Date(reservaData.fecha);
    const fechaLimite = new Date(fechaActo);

    if (unidad === "horas") {
        fechaLimite.setHours(fechaLimite.getHours() - tiempoCambio);
    } else {
        fechaLimite.setDate(fechaLimite.getDate() - tiempoCambio);
    }

    // 🔹 Mantiene el formato YYYY-MM-DD (válido para MySQL)
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

    if (mensajeErrorEl) mensajeErrorEl.remove();
    input.classList.remove('is-invalid');

    if (archivo) {
        const tipoArchivo = archivo.type;
        const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg'];

        if (!tiposPermitidos.includes(tipoArchivo)) {
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
            tipo: tipoArchivo.split('/')[1].toUpperCase()
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

    // Asegurar que requisitos sea un objeto y no tocar otros campos (ej. solicitante)
    reservaData.requisitos = reservaData.requisitos && typeof reservaData.requisitos === 'object'
        ? reservaData.requisitos
        : {};

    const requisitosGuardados = reservaData.requisitos;
    let datosRequisitosNuevos = {};

    const fechaHoy = new Date().toISOString().split('T')[0];

    // 🔹 Función auxiliar para calcular vigencia por defecto (7 días)
    const calcularVigenciaPlazo = () => {
        const fechaLimite = new Date();
        fechaLimite.setDate(fechaLimite.getDate() + 7);
        const year = fechaLimite.getFullYear();
        const month = String(fechaLimite.getMonth() + 1).padStart(2, '0');
        const day = String(fechaLimite.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const plazoSieteDias = calcularVigenciaPlazo();
    let totalArchivosSubidos = 0;

    // ==========================
    // ROL FELIGRES
    // ==========================
    if (rol === 'feligres') {
        const inputFiles = requisitosContainer.querySelectorAll('input[type="file"]');
        inputFiles.forEach(input => {
            const idRequisito = input.dataset.idRequisito;
            const nombreRequisito = input.dataset.nombreRequisito;
            const archivoData = archivosSeleccionados[idRequisito];
            const metaDataPrevia = requisitosGuardados[idRequisito] || {};
            const idActoRequisito = metaDataPrevia.idActoRequisito || input.dataset.idActoRequisito || null;

            const archivoNuevo = !!archivoData?.file;
            const archivoPreviamenteGuardado = !!metaDataPrevia.rutaArchivo && metaDataPrevia.nombreArchivo !== 'NO CUMPLIDO';
            const archivoPresente = archivoNuevo || archivoPreviamenteGuardado;

            if (archivoPresente) totalArchivosSubidos++;

            let fSubidoFinal = null;
            let nombreArchivoFinal = "NO CUMPLIDO";
            let rutaArchivoFinal = null;
            let tipoArchivoFinal = null;

            if (archivoPresente) {
                fSubidoFinal = fechaHoy;
                nombreArchivoFinal = archivoNuevo ? archivoData.file.name : metaDataPrevia.nombreArchivo;
                rutaArchivoFinal = archivoNuevo ? `/temporal/${idRequisito}_${archivoData.file.name}` : metaDataPrevia.rutaArchivo;
                tipoArchivoFinal = archivoNuevo ? archivoData.tipo : metaDataPrevia.tipoArchivo;
            }

            const fechaLimiteConfig = calcularFechaLimiteDocumentos(reservaData);

            datosRequisitosNuevos[idRequisito] = {
                idActoRequisito,
                nombre: nombreRequisito,
                nombreArchivo: nombreArchivoFinal,
                archivoListo: !!archivoPresente,
                rutaArchivo: rutaArchivoFinal,
                tipoArchivo: tipoArchivoFinal,
                f_subido: fSubidoFinal,
                vigenciaDocumento: fechaLimiteConfig || plazoSieteDias,
                aprobado: false,
                estadoCumplido: archivoPresente ? 'CUMPLIDO' : 'NO_CUMPLIDO'
            };
        });
    }
    // ==========================
    // ROL SECRETARIA / ADMINISTRADOR
    // ==========================
    else if (rol === 'secretaria' || rol === 'administrador') {
        const checkboxes = requisitosContainer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            const idRequisito = checkbox.dataset.idRequisito;
            const nombreRequisito = checkbox.dataset.nombreRequisito;
            const idActoRequisito = checkbox.dataset.idActoRequisito || null;
            const metaDataPrevia = requisitosGuardados[idRequisito] || {};

            let nombreArchivo = metaDataPrevia.nombreArchivo || 'NO CUMPLIDO';
            let rutaArchivo = metaDataPrevia.rutaArchivo || null;
            let tipoArchivo = metaDataPrevia.tipoArchivo || null;
            let fechaSubidaFinal = null;
            let estadoCumplidoFinal;

            if (checkbox.checked) {
                estadoCumplidoFinal = 'CUMPLIDO';
                fechaSubidaFinal = fechaHoy;
                if (nombreArchivo === 'NO CUMPLIDO') nombreArchivo = 'ENTREGADO (Manual)';
            } else {
                estadoCumplidoFinal = 'NO_CUMPLIDO';
                nombreArchivo = 'NO CUMPLIDO';
                rutaArchivo = null;
                tipoArchivo = null;
                fechaSubidaFinal = null;
            }

            const fechaLimiteConfig = calcularFechaLimiteDocumentos(reservaData);

            datosRequisitosNuevos[idRequisito] = {
                idActoRequisito,
                nombre: nombreRequisito,
                nombreArchivo,
                archivoListo: !!rutaArchivo,
                rutaArchivo,
                tipoArchivo,
                f_subido: fechaSubidaFinal,
                vigenciaDocumento: fechaLimiteConfig || plazoSieteDias,
                aprobado: false,
                entregado: checkbox.checked,
                estadoCumplido: estadoCumplidoFinal
            };
        });
    }

    // Fusionar los datos nuevos en reservaData.requisitos (sin tocar solicitante)
    Object.keys(datosRequisitosNuevos).forEach(id => {
        reservaData.requisitos[id] = {
            ...reservaData.requisitos[id],
            ...datosRequisitosNuevos[id]
        };
    });

    // Asignar estado dentro de reservaData.requisitos (no en solicitante ni en otro lado)
    // Si el tipo de acto contiene "misa" lo dejamos en PENDIENTE_PAGO (este caso normalmente ya se manejó
    // en la inicialización, pero lo dejamos por seguridad)
    const tipoActoStr = (reservaData.tipoActo || reservaData.nombreActo || '').toString().toLowerCase();

    if (tipoActoStr.includes('misa')) {
        reservaData.requisitos.estado = "PENDIENTE_PAGO";
    } else {
        // Si no hay requisitos (objeto vacío aparte de estado), marcamos PENDIENTE_DOCUMENTO
        const requisitosCount = Object.keys(reservaData.requisitos).filter(k => k !== 'estado').length;
        if (requisitosCount === 0) {
            // No hay inputs de requisitos - dejamos el objeto vacío y estado como PENDIENTE_DOCUMENTO
            reservaData.requisitos.estado = "PENDIENTE_DOCUMENTO";
        } else {
            // Si hay requisitos y al menos un archivo subido => PENDIENTE_REVISION, si no => PENDIENTE_DOCUMENTO
            const totalArchivosSubidos = Object.keys(reservaData.requisitos).reduce((acc, k) => {
                if (k === 'estado') return acc;
                return acc + (reservaData.requisitos[k].archivoListo ? 1 : 0);
            }, 0);

            reservaData.requisitos.estado = totalArchivosSubidos > 0 ? "PENDIENTE_REVISION" : "PENDIENTE_DOCUMENTO";
        }
    }

    sessionStorage.setItem('reserva', JSON.stringify(reservaData));
    console.log('📌 Requisitos guardados (solo en reservaData.requisitos):', reservaData.requisitos);
}

// ==============================
// GUARDAR Y CONTINUAR
// ==============================
function guardarRequisitosYContinuar() {
    const rol = obtenerRolUsuario();
    const termsCheckbox = document.getElementById('terms-autorizacion');

    if (rol === 'feligres') {
        if (!termsCheckbox || !termsCheckbox.checked) {
            alert("⚠️ Debes aceptar los términos y condiciones antes de continuar.");
            return;
        }
    }

    guardarRequisitos();
    window.location.href = '/cliente/reserva_resumen';
}

// ==============================
// GENERACIÓN DE UI
// ==============================
function generarUIRequisitos(listaRequisitos, container, rol, reservaData) {
    if (!container) return;
    container.innerHTML = '';
    const requisitosGuardados = reservaData.requisitos || {};

    if (rol === 'feligres') {
        const fechaLimite = calcularFechaLimiteDocumentos(reservaData);
        const info = document.createElement('p');
        info.className = 'alert alert-info small mt-3';
        info.innerHTML = `<i class="fas fa-info-circle"></i> Nota: Debes entregar o cambiar los documentos antes del <strong>${fechaLimite || '...'}</strong>.`;
        container.appendChild(info);
    }

    if (!listaRequisitos || listaRequisitos.length === 0) {
        // Mostrar mensaje amigable y NO modificar solicitante ni otros campos.
        container.innerHTML = '<p class="alert alert-success">✅ No se encontraron requisitos para este acto.</p>';
        return;
    }

    listaRequisitos.forEach(requisito => {
        const idRequisito = requisito.id;
        const metaDataPrevia = requisitosGuardados[idRequisito] || {};
        const card = document.createElement('div');
        card.className = 'card mb-3 shadow-sm border-info';
        const cardBody = document.createElement('div');
        cardBody.className = 'card-body';

        const titulo = document.createElement('h5');
        titulo.className = 'card-title';
        titulo.textContent = requisito.nombRequisito + (requisito.obligatorio ? ' *' : '');
        const descripcion = document.createElement('p');
        descripcion.className = 'card-text text-muted small';
        descripcion.textContent = requisito.descripcion;

        cardBody.appendChild(titulo);
        cardBody.appendChild(descripcion);

        if (rol === 'feligres') {
            const archivoYaCargado = !!metaDataPrevia.rutaArchivo || !!archivosSeleccionados[idRequisito];
            if (archivoYaCargado && metaDataPrevia.nombreArchivo && metaDataPrevia.nombreArchivo !== 'NO CUMPLIDO') {
                const infoExistente = document.createElement('p');
                infoExistente.className = 'text-success small font-weight-bold';
                infoExistente.innerHTML = `<i class="fas fa-check-circle"></i> Archivo previamente subido: <strong>${metaDataPrevia.nombreArchivo}</strong>`;
                cardBody.appendChild(infoExistente);
            }
            const input = document.createElement('input');
            input.type = 'file';
            input.className = 'form-control-file mt-2';
            input.id = `requisito-file-${idRequisito}`;
            input.dataset.idRequisito = idRequisito;
            input.dataset.idActoRequisito = requisito.idActoRequisito;
            input.dataset.nombreRequisito = requisito.nombRequisito;
            input.accept = ".pdf, .jpg, .jpeg";
            if (requisito.obligatorio && !archivoYaCargado) input.required = true;
            input.addEventListener('change', manejarCambioArchivo);
            cardBody.appendChild(input);
        } else if (rol === 'secretaria' || rol === 'administrador') {
            const entregado = metaDataPrevia.entregado === true;
            const archivoInfo = document.createElement('p');
            archivoInfo.className = entregado ? 'text-success' : 'text-danger';
            archivoInfo.innerHTML = `Estado: <strong>${entregado ? 'CUMPLIDO' : 'NO CUMPLIDO'}</strong>`;
            cardBody.appendChild(archivoInfo);
            const checkDiv = document.createElement('div');
            checkDiv.className = 'form-check mt-2';
            const inputCheck = document.createElement('input');
            inputCheck.type = 'checkbox';
            inputCheck.className = 'form-check-input';
            inputCheck.id = `requisito-check-${idRequisito}`;
            inputCheck.checked = entregado;
            inputCheck.dataset.idRequisito = idRequisito;
            inputCheck.dataset.idActoRequisito = requisito.idActoRequisito;
            inputCheck.dataset.nombreRequisito = requisito.nombRequisito;
            const labelCheck = document.createElement('label');
            labelCheck.className = 'form-check-label font-weight-bold';
            labelCheck.htmlFor = inputCheck.id;
            labelCheck.textContent = 'Entregado';
            checkDiv.appendChild(inputCheck);
            checkDiv.appendChild(labelCheck);
            cardBody.appendChild(checkDiv);
        }

        card.appendChild(cardBody);
        container.appendChild(card);
    });
}

// ==============================
// INICIALIZACIÓN (CON CONTROL DE MISA --> estado guardado EN reservaData.requisitos)
// ==============================
document.addEventListener('DOMContentLoaded', async () => {
    const rolUsuario = obtenerRolUsuario();
    const datosReservaString = sessionStorage.getItem('reserva');
    const requisitosContainer = document.getElementById('requisitos-lista');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnAtras = document.getElementById('btn-atras');

    if (!datosReservaString || !requisitosContainer) return;

    let reservaData = JSON.parse(datosReservaString);
    const idActo = reservaData.idActo;

    if (!idActo) {
        requisitosContainer.innerHTML = '<p class="text-warning">⚠️ No se ha seleccionado un acto. Vuelve al Paso 1.</p>';
        return;
    }

    await obtenerConfiguracionActo(idActo);

    // 🔹 Detectar si el acto es una MISA (se compara nombre del acto en configuración o reserva)
    const nombreActo = (configuracionActo?.nombreActo || reservaData.nombreActo || '').toString().toLowerCase();

    if (nombreActo.includes('misa')) {
        requisitosContainer.innerHTML = `
            <div class="alert alert-success text-center p-4 rounded">
                <h5 class="mb-2">✅ No se encontraron requisitos para este acto.</h5>
                <p class="mb-0">Para este tipo de celebración no se solicitarán documentos adicionales.</p>
            </div>
        `;

        // Guardar estado en reservaData.requisitos (¡no tocamos solicitante!)
        reservaData.requisitos = reservaData.requisitos && typeof reservaData.requisitos === 'object'
            ? reservaData.requisitos
            : {};
        reservaData.requisitos.estado = "PENDIENTE_PAGO";

        sessionStorage.setItem('reserva', JSON.stringify(reservaData));
        console.log("✅ Acto litúrgico de MISA detectado → sin requisitos, guardado EN reservaData.requisitos.estado = PENDIENTE_PAGO.");

        if (btnSiguiente) btnSiguiente.addEventListener('click', () => {
            window.location.href = '/cliente/reserva_resumen';
        });
        if (btnAtras) btnAtras.addEventListener('click', volverPasoAnterior);
        return;
    }

    // 🔹 Caso normal: cargar requisitos desde API
    fetch(`/api/requisito/${idActo}`)
        .then(resp => resp.ok ? resp.json() : Promise.reject(`HTTP ${resp.status}`))
        .then(data => {
            const requisitos = data.datos;
            generarUIRequisitos(requisitos, requisitosContainer, rolUsuario, reservaData);
        })
        .catch(err => {
            console.error("❌ Error cargando requisitos:", err);
            requisitosContainer.innerHTML = `<p class="alert alert-danger">Error: ${err}</p>`;
        });

    if (btnSiguiente) btnSiguiente.addEventListener('click', guardarRequisitosYContinuar);
    if (btnAtras) btnAtras.addEventListener('click', volverPasoAnterior);
});
