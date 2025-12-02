// =========================================================
// reserva_requisito.js - Lógica FINAL corregida
// =========================================================

// Variable global para mantener los archivos entre páginas
window.archivosSeleccionados = window.archivosSeleccionados || {};
let archivosSeleccionados = window.archivosSeleccionados;
let configuracionActo = null;

// ==============================
// AUXILIARES
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
        if (data.success && data.datos) configuracionActo = data.datos;
    } catch (err) {
        console.error("❌ Error config acto:", err);
    }
}

// ==============================
// FECHA LÍMITE DOCUMENTOS
// ==============================
function calcularFechaLimiteDocumentos(reservaData) {
    if (!reservaData?.fecha || !configuracionActo) return null;

    const tiempo = configuracionActo.tiempoCambioDocumentos || 48;
    const unidad = configuracionActo.unidadTiempoAcciones || "horas";

    const fechaActo = new Date(reservaData.fecha);
    const f = new Date(fechaActo);

    if (unidad === "horas") f.setHours(f.getHours() - tiempo);
    else f.setDate(f.getDate() - tiempo);

    return f.toISOString().split("T")[0];
}

// ==============================
// MANEJO ARCHIVOS
// ==============================
function manejarCambioArchivo(e) {
    const input = e.target;
    const id = input.dataset.idRequisito;
    const archivo = input.files[0];

    const msg = document.getElementById(`error-${id}`);
    msg?.remove();
    input.classList.remove("is-invalid");

    if (archivo) {
        const tipos = ["application/pdf", "image/jpeg", "image/jpg"];
        if (!tipos.includes(archivo.type)) {
            input.classList.add("is-invalid");
            const err = document.createElement("div");
            err.className = "invalid-feedback d-block";
            err.id = `error-${id}`;
            err.textContent = "⚠️ Solo PDF, JPG o JPEG.";
            input.parentNode.insertBefore(err, input.nextSibling);
            delete archivosSeleccionados[id];
            input.value = "";
            return;
        }
        archivosSeleccionados[id] = {
            file: archivo,
            tipo: archivo.type.split("/")[1].toUpperCase()
        };
    } else delete archivosSeleccionados[id];
}

// ==============================
// ESTADO FINAL DE RESERVA
// ==============================
function calcularEstadoReservaFinal(rol, requisitos) {

    const lista = Object.values(requisitos).filter(r => r.idActoRequisito);

    // ======================
    // CASO FELIGRES
    // ======================
    if (rol === "feligres") {

        const total = lista.length;
        const subidos = lista.filter(r => r.estadoCumplido === "CUMPLIDO").length;

        // Falta documentos
        if (subidos < total) return "PENDIENTE_DOCUMENTO";

        // Todo subido → pasa a revisión
        return "PENDIENTE_REVISION";
    }

    // ======================
    // CASO SECRETARIA / ADMIN
    // ======================
    const todosAprobados = lista.every(r => r.aprobado === true);

    return todosAprobados ? "PENDIENTE_PAGO" : "PENDIENTE_DOCUMENTO";
}

// ==============================
// GUARDAR REQUISITOS
// ==============================
function guardarRequisitos() {
    const rol = obtenerRolUsuario();
    const cont = document.getElementById("requisitos-lista");
    const reservaData = JSON.parse(sessionStorage.getItem("reserva") || "{}");

    reservaData.requisitos = reservaData.requisitos || {};

    const prev = reservaData.requisitos;
    let nuevos = {};

    const hoy = new Date().toISOString().split("T")[0];

    const fLimite = calcularFechaLimiteDocumentos(reservaData);

    cont.querySelectorAll(rol === "feligres" ? "input[type='file']" : "input[type='checkbox']")
        .forEach(c => {

            const id = c.dataset.idRequisito;
            const nombre = c.dataset.nombreRequisito;
            const idActoReq = c.dataset.idActoRequisito;
            const meta = prev[id] || {};

            let nombreArchivo = meta.nombreArchivo || null;
            let ruta = meta.rutaArchivo || null;
            let tipo = meta.tipoArchivo || null;
            let estado = "NO_CUMPLIDO";
            let aprobado = false;
            let f_subido = meta.f_subido || null;
            let archivoNuevo = false; // Inicializar fuera del bloque para que esté disponible

            // -------- FELIGRES --------
            if (rol === "feligres") {

                const dataFile = archivosSeleccionados[id];
                archivoNuevo = !!dataFile?.file;
                const archivoPrevio = !!meta.rutaArchivo;

                const tieneArchivo = archivoNuevo || archivoPrevio;

                if (tieneArchivo) {
                    estado = "CUMPLIDO";
                    aprobado = false;
                    if (archivoNuevo) {
                        nombreArchivo = dataFile.file.name;
                        ruta = "/temporal/" + nombreArchivo;
                        tipo = dataFile.tipo;
                        f_subido = hoy;
                    }
                } else {
                    // Si no tiene archivo, puede subirlo después, mantener estado NO_CUMPLIDO
                    nombreArchivo = "NO_CUMPLIDO";
                    ruta = null;
                    tipo = null;
                    f_subido = null;
                }

            }

            // -------- SECRETARIA / ADMIN --------
            else {
                if (c.checked) {
                    estado = "CUMPLIDO";
                    aprobado = true;
                    f_subido = hoy;
                    nombreArchivo = nombreArchivo === "NO_CUMPLIDO" ? "ENTREGADO (Manual)" : nombreArchivo;
                } else {
                    estado = "NO_CUMPLIDO";
                    aprobado = false;
                    nombreArchivo = "NO_CUMPLIDO";
                    ruta = null;
                    tipo = null;
                    f_subido = null;
                }
            }

            nuevos[id] = {
                idActoRequisito: idActoReq,
                nombre,
                nombreArchivo,
                rutaArchivo: ruta,
                tipoArchivo: tipo,
                archivoListo: estado === "CUMPLIDO",
                f_subido,
                aprobado,
                estadoCumplido: estado,
                estadoCumplimiento: estado, // Guardar también como estadoCumplimiento para compatibilidad
                vigenciaDocumento: fLimite,
                entregado: aprobado,
                // Guardar referencia al archivo para que esté disponible en resumen.js
                tieneArchivoNuevo: archivoNuevo,
                idRequisito: id // Para poder recuperar el archivo en resumen.js
            };
        });

    // Mezclar todo
    reservaData.requisitos = { ...prev, ...nuevos };

    // Calcular estadoReserva
    const estadoCalculado = calcularEstadoReservaFinal(rol, reservaData.requisitos);
    reservaData.requisitos.estado = estadoCalculado;
    
    // IMPORTANTE: Guardar también estadoReserva directamente en reservaData
    reservaData.estadoReserva = estadoCalculado;

    sessionStorage.setItem("reserva", JSON.stringify(reservaData));
}

// ==============================
// GUARDAR Y CONTINUAR
// ==============================
function guardarRequisitosYContinuar() {
    const rol = obtenerRolUsuario();
    const terms = document.getElementById("terms-autorizacion");

    if (rol === "feligres" && (!terms || !terms.checked)) {
        alert("Debes aceptar los términos.");
        return;
    }

    guardarRequisitos();
    window.location.href = "/cliente/reserva_resumen";
}

// ==============================
// UI REQUISITOS
// ==============================
function generarUIRequisitos(lista, cont, rol, reservaData) {
    if (!cont) return;
    cont.innerHTML = "";

    const prev = reservaData.requisitos || {};

    if (!lista.length) {
        cont.innerHTML = `<p class="alert alert-success">No se encontraron requisitos.</p>`;
        return;
    }

    if (rol === "feligres") {
        const f = calcularFechaLimiteDocumentos(reservaData);
        cont.innerHTML = `
            <p class="alert alert-info small mt-3">
                Entregar documentos antes del <b>${f}</b>.
            </p>`;
    }

    lista.forEach(r => {
        const id = r.id;
        const meta = prev[id] || {};

        const card = document.createElement("div");
        card.className = "card mb-3 shadow-sm border-info";

        const body = document.createElement("div");
        body.className = "card-body";

        body.innerHTML = `
            <h5 class="card-title">${r.nombRequisito}${r.obligatorio ? " *" : ""}</h5>
            <p class="text-muted small">${r.descripcion}</p>
        `;

        // FELIGRES
        if (rol === "feligres") {
            if (meta.nombreArchivo && meta.nombreArchivo !== "NO_CUMPLIDO") {
                body.innerHTML += `
                    <p class="text-success small">
                        <i class="fas fa-check-circle"></i> Archivo existente: <b>${meta.nombreArchivo}</b>
                    </p>`;
            }

            const input = document.createElement("input");
            input.type = "file";
            input.className = "form-control-file mt-2";
            input.accept = ".pdf,.jpg,.jpeg";
            input.dataset.idRequisito = id;
            input.dataset.idActoRequisito = r.idActoRequisito;
            input.dataset.nombreRequisito = r.nombRequisito;
            input.addEventListener("change", manejarCambioArchivo);

            if (r.obligatorio && (!meta.rutaArchivo && !archivosSeleccionados[id]))
                input.required = true;

            body.appendChild(input);
        }

        // SECRETARIA / ADMIN
        else {
            const divChk = document.createElement("div");
            divChk.className = "form-check mt-2";

            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.className = "form-check-input";
            chk.dataset.idRequisito = id;
            chk.dataset.idActoRequisito = r.idActoRequisito;
            chk.dataset.nombreRequisito = r.nombRequisito;
            chk.checked = meta.aprobado === true;
            
            // Guardar automáticamente cuando cambia el checkbox (secretaria/admin)
            chk.addEventListener("change", () => {
                guardarRequisitos();
            });

            const lbl = document.createElement("label");
            lbl.className = "form-check-label";
            lbl.textContent = "Entregado";

            divChk.appendChild(chk);
            divChk.appendChild(lbl);
            body.appendChild(divChk);
        }

        card.appendChild(body);
        cont.appendChild(card);
    });
}

// ==============================
// INICIALIZACIÓN
// ==============================
document.addEventListener("DOMContentLoaded", async () => {
    const rol = obtenerRolUsuario();
    const cont = document.getElementById("requisitos-lista");
    const btnSig = document.getElementById("btn-siguiente");
    const btnAtr = document.getElementById("btn-atras");

    const reservaData = JSON.parse(sessionStorage.getItem('reserva') || "{}");

    if (!reservaData.idActo) {
        cont.innerHTML = `<p class="text-warning">No se ha seleccionado un acto.</p>`;
        return;
    }

    await obtenerConfiguracionActo(reservaData.idActo);

    // Cargar requisitos ------------------
    try {
        const resp = await fetch(`/api/requisito/${reservaData.idActo}`);
        const data = await resp.json();
        const listaRequisitos = data.datos || [];
        
        // CASO MISA: Si no hay requisitos, es misa → PENDIENTE_PAGO
        if (listaRequisitos.length === 0) {
            reservaData.requisitos = reservaData.requisitos || {};
            reservaData.requisitos.estado = "PENDIENTE_PAGO";
            // IMPORTANTE: Guardar también estadoReserva directamente en reservaData
            reservaData.estadoReserva = "PENDIENTE_PAGO";
            sessionStorage.setItem("reserva", JSON.stringify(reservaData));

            cont.innerHTML = `
                <div class="alert alert-success text-center p-4">
                    <h5>No se requieren documentos.</h5>
                </div>`;

            btnSig?.addEventListener("click", () =>
                window.location.href = "/cliente/reserva_resumen"
            );

            btnAtr?.addEventListener("click", volverPasoAnterior);
            return;
        }
        
        // Hay requisitos: mostrar UI normal
        generarUIRequisitos(listaRequisitos, cont, rol, reservaData);
    } catch (err) {
        cont.innerHTML = `<p class="alert alert-danger">${err}</p>`;
    }

    btnSig?.addEventListener("click", guardarRequisitosYContinuar);
    btnAtr?.addEventListener("click", volverPasoAnterior);
});
