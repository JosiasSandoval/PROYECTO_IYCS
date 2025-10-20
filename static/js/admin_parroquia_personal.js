// ================== VARIABLES GLOBALES ==================
let parroquiaPersonal = [];
let parroquiaPersonalFiltrada = null;

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

  const lista = parroquiaPersonalFiltrada ?? parroquiaPersonal;
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const datosPagina = lista.slice(inicio, fin);

  datosPagina.forEach((reg, index) => {
    const esActivo = reg.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-usuario">${reg.usuario}</td>
      <td class="col-cargo">${reg.cargo}</td>
      <td class="col-fechaInicio">${reg.fechaInicio}</td>
      <td class="col-fechaFin">${reg.fechaFin || "-"}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verRegistro(${reg.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarRegistro(${reg.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${reg.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarRegistro(${reg.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(parroquiaPersonal.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(parroquiaPersonal.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarRegistro(usuario, cargo, fechaInicio, fechaFin) {
  parroquiaPersonal.push({
    id: Date.now(),
    usuario,
    cargo,
    fechaInicio,
    fechaFin,
    estado: "activo",
  });
  renderTabla();
}

function editarRegistro(id) {
  const reg = parroquiaPersonal.find((r) => r.id === id);
  if (!reg) return;
  abrirModalFormulario("editar", reg);
}

function eliminarRegistro(id) {
  const reg = parroquiaPersonal.find((r) => r.id === id);
  if (!reg) return;
  if (!confirm(`¿Seguro que deseas eliminar el registro con ID ${reg.id}?`)) return;
  parroquiaPersonal = parroquiaPersonal.filter((r) => r.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const reg = parroquiaPersonal.find((r) => r.id === id);
  if (!reg) return;
  reg.estado = reg.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verRegistro(id) {
  const reg = parroquiaPersonal.find((r) => r.id === id);
  if (!reg) return;
  abrirModalFormulario("ver", reg);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Registro</h5>
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
            <form id="formModalRegistro">
              <div class="mb-3">
                <label for="modalUsuario" class="form-label">Usuario</label>
                <input type="text" id="modalUsuario" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalCargo" class="form-label">Cargo</label>
                <input type="text" id="modalCargo" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalFechaInicio" class="form-label">Fecha Inicio</label>
                <input type="date" id="modalFechaInicio" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalFechaFin" class="form-label">Fecha Fin</label>
                <input type="date" id="modalFechaFin" class="form-control">
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

function abrirModalFormulario(modo, reg = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputs = {
    usuario: document.getElementById("modalUsuario"),
    cargo: document.getElementById("modalCargo"),
    fechaInicio: document.getElementById("modalFechaInicio"),
    fechaFin: document.getElementById("modalFechaFin"),
  };
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalRegistro");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  Object.values(inputs).forEach((input) => (input.disabled = false));

  if (modo === "agregar") {
    titulo.textContent = "Agregar Registro";
    Object.values(inputs).forEach((input) => (input.value = ""));
    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarRegistro(
        inputs.usuario.value.trim(),
        inputs.cargo.value.trim(),
        inputs.fechaInicio.value.trim(),
        inputs.fechaFin.value.trim()
      );
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && reg) {
    titulo.textContent = "Editar Registro";
    inputs.usuario.value = reg.usuario;
    inputs.cargo.value = reg.cargo;
    inputs.fechaInicio.value = reg.fechaInicio;
    inputs.fechaFin.value = reg.fechaFin;
    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      reg.usuario = inputs.usuario.value.trim();
      reg.cargo = inputs.cargo.value.trim();
      reg.fechaInicio = inputs.fechaInicio.value.trim();
      reg.fechaFin = inputs.fechaFin.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && reg) {
    titulo.textContent = "Detalle del Registro";
    inputs.usuario.value = reg.usuario;
    inputs.cargo.value = reg.cargo;
    inputs.fechaInicio.value = reg.fechaInicio;
    inputs.fechaFin.value = reg.fechaFin;
    Object.values(inputs).forEach((input) => (input.disabled = true));
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
  parroquiaPersonalFiltrada =
    termino === "" ? null : parroquiaPersonal.filter((r) => r.id.toString().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
parroquiaPersonal = [
  { id: 1, usuario: "Jose Sandoval", cargo: "Cardenal", fechaInicio: "2025-01-01", fechaFin: "2025-12-31", estado: "activo" },
  { id: 2, usuario: "Juana Saavedra", cargo: "Secretaria", fechaInicio: "2025-02-01", fechaFin: "2025-11-30", estado: "activo" },
  { id: 3, usuario: "Pedro Ruiz", cargo: "Diacono", fechaInicio: "2025-03-15", fechaFin: null, estado: "inactivo" },
  { id: 4, usuario: "Susana Lopez", cargo: "Sacerdote", fechaInicio: "2025-04-01", fechaFin: "2025-10-31", estado: "activo" },
  { id: 5, usuario: "Juan Perez", cargo: "Asistente", fechaInicio: "2025-05-01", fechaFin: null, estado: "activo" },
];

renderTabla();
