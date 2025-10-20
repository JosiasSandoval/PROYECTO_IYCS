// ================== VARIABLES GLOBALES ==================
let excepciones = [];
let excepcionesFiltradas = null;
let excepcionEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Modales
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;

// ================== FUNCIONES ==================

// Renderizar tabla
function renderTabla() {
    tabla.innerHTML = "";

    const lista = excepcionesFiltradas ?? excepciones;
    const inicio = (paginaActual - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    const datosPagina = lista.slice(inicio, fin);

    datosPagina.forEach((ex, index) => {
        const esActivo = ex.estadoExcepcion === "activo";
        const botonColor = esActivo ? "btn-orange" : "btn-success";
        const rotacion = esActivo ? "" : "transform: rotate(180deg);";

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td class="col-id">${inicio + index + 1}</td>
            <td class="col-nombreExcepcion">${ex.nombreExcepcion}</td>
            <td class="col-fechaInicioExcepcion">${ex.fechaInicioExcepcion}</td>
            <td class="col-fechaFinExcepcion">${ex.fechaFinExcepcion || "-"}</td>
            <td class="col-acciones">
                <div class="d-flex justify-content-center flex-wrap gap-1">
                    <button class="btn btn-info btn-sm" onclick="verExcepcion(${ex.idExcepcion})" title="Ver">
                        <img src="/static/img/ojo.png" alt="ver">
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="editarExcepcion(${ex.idExcepcion})" title="Editar">
                        <img src="/static/img/lapiz.png" alt="editar">
                    </button>
                    <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${ex.idExcepcion})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
                        <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarExcepcion(${ex.idExcepcion})" title="Eliminar">
                        <img src="/static/img/x.png" alt="eliminar">
                    </button>
                </div>
            </td>
        `;
        tabla.appendChild(fila);
    });

    renderPaginacion();
}

// ================== PAGINACIÓN ==================
function renderPaginacion() {
    paginacion.innerHTML = "";
    const totalPaginas = Math.ceil(excepciones.length / elementosPorPagina);
    if (totalPaginas <= 1) return;

    const ul = document.createElement("ul");
    ul.className = "pagination";

    const crearItem = (numero, activo = false, disabled = false, texto = null) => {
        const li = document.createElement("li");
        li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
        li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${numero})">${texto || numero}</button>`;
        return li;
    };

    ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));

    const start = Math.max(1, paginaActual - 2);
    const end = Math.min(totalPaginas, paginaActual + 2);

    for (let i = start; i <= end; i++) {
        ul.appendChild(crearItem(i, paginaActual === i));
    }

    ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
    paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
    if (pagina < 1 || pagina > Math.ceil(excepciones.length / elementosPorPagina)) return;
    paginaActual = pagina;
    renderTabla();
}

// ================== CRUD ==================
function agregarExcepcion(nombreExcepcion, fechaInicio, fechaFin, motivo, tipo, idPersonal) {
    excepciones.push({
        idExcepcion: Date.now(),
        nombreExcepcion,
        fechaInicioExcepcion: fechaInicio,
        fechaFinExcepcion: fechaFin,
        motivoExcepcion: motivo,
        tipoExcepcion: tipo,
        estadoExcepcion: "activo",
        idPersonal
    });
    renderTabla();
}

function editarExcepcion(id) {
    const ex = excepciones.find((e) => e.idExcepcion === id);
    if (!ex) return;
    abrirModalFormulario("editar", ex);
}

function eliminarExcepcion(id) {
    const ex = excepciones.find((e) => e.idExcepcion === id);
    if (!ex) return;
    if (!confirm(`¿Seguro que deseas eliminar la excepción con ID ${ex.idExcepcion}?`)) return;
    excepciones = excepciones.filter((e) => e.idExcepcion !== id);
    renderTabla();
}

function darDeBaja(id) {
    const ex = excepciones.find((e) => e.idExcepcion === id);
    if (!ex) return;
    ex.estadoExcepcion = ex.estadoExcepcion === "activo" ? "inactivo" : "activo";
    renderTabla();
}

function verExcepcion(id) {
    const ex = excepciones.find((e) => e.idExcepcion === id);
    if (!ex) return;
    abrirModalFormulario("ver", ex);
}

// ================== MODALES ==================
function crearModal() {
    const modalHTML = document.createElement("div");
    modalHTML.innerHTML = `
        <div class="modal" id="modalDetalle">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalle de la Excepción</h5>
                        <button type="button" class="btn-cerrar" onclick="cerrarModal('modalDetalle')">&times;</button>
                    </div>
                    <div class="modal-body" id="modalDetalleContenido"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalHTML);
    return document.getElementById("modalDetalle");
}

function crearModalFormulario() {
    const modalHTML = document.createElement("div");
    modalHTML.innerHTML = `
        <div class="modal" id="modalFormulario">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalFormularioTitulo"></h5>
                        <button type="button" class="btn-cerrar" onclick="cerrarModal('modalFormulario')">&times;</button>
                    </div>
                    <div class="modal-body">
                        <form id="formModalExcepcion">
                            <div class="mb-3">
                                <label for="modalNombreExcepcion" class="form-label">Nombre de la Excepción</label>
                                <input type="text" id="modalNombreExcepcion" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="modalFechaInicio" class="form-label">Fecha Inicio</label>
                                <input type="date" id="modalFechaInicio" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="modalFechaFin" class="form-label">Fecha Fin</label>
                                <input type="date" id="modalFechaFin" class="form-control">
                            </div>
                            <div class="mb-3">
                                <label for="modalMotivo" class="form-label">Motivo</label>
                                <input type="text" id="modalMotivo" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="modalTipo" class="form-label">Tipo de Excepción</label>
                                <input type="text" id="modalTipo" class="form-control" required>
                            </div>
                            <div class="mb-3">
                                <label for="modalIdPersonal" class="form-label">ID Personal</label>
                                <input type="number" id="modalIdPersonal" class="form-control" required>
                            </div>
                            <div class="modal-footer">
                                <button type="submit" class="btn btn-modal btn-modal-primary" id="btnGuardar">Aceptar</button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalHTML);
    return document.getElementById("modalFormulario");
}

function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("activo");
}

function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("activo");
}

function abrirModalFormulario(modo, ex = null) {
    const titulo = document.getElementById("modalFormularioTitulo");
    const inputs = {
        nombreExcepcion: document.getElementById("modalNombreExcepcion"),
        fechaInicio: document.getElementById("modalFechaInicio"),
        fechaFin: document.getElementById("modalFechaFin"),
        motivo: document.getElementById("modalMotivo"),
        tipo: document.getElementById("modalTipo"),
        idPersonal: document.getElementById("modalIdPersonal")
    };
    const botonGuardar = document.getElementById("btnGuardar");
    const form = document.getElementById("formModalExcepcion");
    const modalFooter = document.querySelector("#modalFormulario .modal-footer");

    modalFooter.innerHTML = "";
    Object.values(inputs).forEach(input => input.disabled = false);

    if (modo === "agregar") {
        titulo.textContent = "Agregar Excepción";
        Object.values(inputs).forEach(input => input.value = "");
        modalFooter.appendChild(botonGuardar);

        form.onsubmit = (e) => {
            e.preventDefault();
            agregarExcepcion(
                inputs.nombreExcepcion.value.trim(),
                inputs.fechaInicio.value.trim(),
                inputs.fechaFin.value.trim(),
                inputs.motivo.value.trim(),
                inputs.tipo.value.trim(),
                parseInt(inputs.idPersonal.value.trim())
            );
            cerrarModal("modalFormulario");
        };
    } else if (modo === "editar" && ex) {
        titulo.textContent = "Editar Excepción";
        inputs.nombreExcepcion.value = ex.nombreExcepcion;
        inputs.fechaInicio.value = ex.fechaInicioExcepcion;
        inputs.fechaFin.value = ex.fechaFinExcepcion;
        inputs.motivo.value = ex.motivoExcepcion;
        inputs.tipo.value = ex.tipoExcepcion;
        inputs.idPersonal.value = ex.idPersonal;

        modalFooter.appendChild(botonGuardar);

        form.onsubmit = (e) => {
            e.preventDefault();
            ex.nombreExcepcion = inputs.nombreExcepcion.value.trim();
            ex.fechaInicioExcepcion = inputs.fechaInicio.value.trim();
            ex.fechaFinExcepcion = inputs.fechaFin.value.trim();
            ex.motivoExcepcion = inputs.motivo.value.trim();
            ex.tipoExcepcion = inputs.tipo.value.trim();
            ex.idPersonal = parseInt(inputs.idPersonal.value.trim());
            cerrarModal("modalFormulario");
            renderTabla();
        };
    } else if (modo === "ver" && ex) {
        titulo.textContent = "Detalle de la Excepción";
        inputs.nombreExcepcion.value = ex.nombreExcepcion;
        inputs.fechaInicio.value = ex.fechaInicioExcepcion;
        inputs.fechaFin.value = ex.fechaFinExcepcion;
        inputs.motivo.value = ex.motivoExcepcion;
        inputs.tipo.value = ex.tipoExcepcion;
        inputs.idPersonal.value = ex.idPersonal;
        Object.values(inputs).forEach(input => input.disabled = true);

        modalFooter.appendChild(botonGuardar);
        botonGuardar.onclick = () => cerrarModal("modalFormulario");
    }

    abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputBuscar = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
    const termino = inputBuscar.value.trim().toLowerCase();
    excepcionesFiltradas =
        termino === "" ? null : excepciones.filter(e => e.idExcepcion.toString().includes(termino));
    paginaActual = 1;
    renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
    e.preventDefault();
    abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
excepciones = [
    { idExcepcion: 1, nombreExcepcion: "Permiso Médico", fechaInicioExcepcion: "2025-10-01", fechaFinExcepcion: "2025-10-03", motivoExcepcion: "Consulta médica", tipoExcepcion: "Temporal", estadoExcepcion: "activo", idPersonal: 101 },
    { idExcepcion: 2, nombreExcepcion: "Capacitación", fechaInicioExcepcion: "2025-10-05", fechaFinExcepcion: "2025-10-06", motivoExcepcion: "Capacitación obligatoria", tipoExcepcion: "Temporal", estadoExcepcion: "activo", idPersonal: 102 },
    { idExcepcion: 3, nombreExcepcion: "Viaje Oficial", fechaInicioExcepcion: "2025-10-10", fechaFinExcepcion: "2025-10-12", motivoExcepcion: "Reunión en Lima", tipoExcepcion: "Temporal", estadoExcepcion: "inactivo", idPersonal: 103 }
];

renderTabla();
