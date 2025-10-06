// ================== VARIABLES GLOBALES ==================
let horarios = [];
let horariosFiltrados = null;
let horarioEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Referencias a los modales sin Bootstrap
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;

// Variable de ordenamiento
let ordenActual = { campo: null, ascendente: true };

// ================== FUNCIONES ==================

// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";

  const lista = horariosFiltrados ?? horarios;

  if (ordenActual.campo) {
    lista.sort((a, b) => {
      const campo = ordenActual.campo;
      const valorA = a[campo] ? a[campo].toString().toLowerCase() : "";
      const valorB = b[campo] ? b[campo].toString().toLowerCase() : "";
      if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
      if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
      return 0;
    });
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const horariosPagina = lista.slice(inicio, fin);

  horariosPagina.forEach((h, index) => {
    const esActivo = h.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-fechaInicio">${h.fechaInicio}</td>
      <td class="col-fechaFin">${h.fechaFin}</td>
      <td class="col-nombreServicio">${h.nombreServicio}</td>
      <td class="col-parroquia">${h.parroquia}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verHorario(${h.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarHorario(${h.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${h.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarHorario(${h.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(horarios.length / elementosPorPagina);
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

  if (start > 1) {
    ul.appendChild(crearItem(1, paginaActual === 1));
    if (start > 2) ul.appendChild(crearItem(null, false, true, "..."));
  }

  for (let i = start; i <= end; i++) {
    ul.appendChild(crearItem(i, paginaActual === i));
  }

  if (end < totalPaginas) {
    if (end < totalPaginas - 1) ul.appendChild(crearItem(null, false, true, "..."));
    ul.appendChild(crearItem(totalPaginas, paginaActual === totalPaginas));
  }

  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  if (pagina < 1 || pagina > Math.ceil(horarios.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarHorario(fechaInicio, fechaFin, nombreServicio, parroquia) {
  horarios.push({
    id: Date.now(),
    fechaInicio,
    fechaFin,
    nombreServicio,
    parroquia,
    estado: "activo",
  });
  renderTabla();
}

function editarHorario(id) {
  const h = horarios.find((a) => a.id === id);
  if (!h) return;
  abrirModalFormulario("editar", h);
}

function eliminarHorario(id) {
  const h = horarios.find((a) => a.id === id);
  if (!h) return;
  if (!confirm(`¿Seguro que deseas eliminar el horario de "${h.nombreServicio}"?`)) return;
  horarios = horarios.filter((a) => a.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const h = horarios.find((a) => a.id === id);
  if (!h) return;
  h.estado = h.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verHorario(id) {
  const h = horarios.find((a) => a.id === id);
  if (!h) return;
  abrirModalFormulario("ver", h);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Horario</h5>
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
            <form id="formModalHorario">

              <div class="mb-3">
                <label for="modalFechaInicio" class="form-label">Fecha de inicio</label>
                <input type="date" id="modalFechaInicio" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalFechaFin" class="form-label">Fecha de fin</label>
                <input type="date" id="modalFechaFin" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalNombreServicio" class="form-label">Nombre del servicio</label>
                <input type="text" id="modalNombreServicio" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalParroquia" class="form-label">Parroquia</label>
                <input type="text" id="modalParroquia" class="form-control" required>
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

function abrirModalFormulario(modo, h = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputFechaInicio = document.getElementById("modalFechaInicio");
  const inputFechaFin = document.getElementById("modalFechaFin");
  const inputNombreServicio = document.getElementById("modalNombreServicio");
  const inputParroquia = document.getElementById("modalParroquia");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalHorario");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  inputFechaInicio.disabled = false;
  inputFechaFin.disabled = false;
  inputNombreServicio.disabled = false;
  inputParroquia.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar Horario";
    inputFechaInicio.value = "";
    inputFechaFin.value = "";
    inputNombreServicio.value = "";
    inputParroquia.value = "";

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarHorario(
        inputFechaInicio.value,
        inputFechaFin.value,
        inputNombreServicio.value.trim(),
        inputParroquia.value.trim()
      );
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && h) {
    titulo.textContent = "Editar Horario";
    inputFechaInicio.value = h.fechaInicio;
    inputFechaFin.value = h.fechaFin;
    inputNombreServicio.value = h.nombreServicio;
    inputParroquia.value = h.parroquia;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      h.fechaInicio = inputFechaInicio.value;
      h.fechaFin = inputFechaFin.value;
      h.nombreServicio = inputNombreServicio.value.trim();
      h.parroquia = inputParroquia.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && h) {
    titulo.textContent = "Detalle del Horario";
    inputFechaInicio.value = h.fechaInicio;
    inputFechaFin.value = h.fechaFin;
    inputNombreServicio.value = h.nombreServicio;
    inputParroquia.value = h.parroquia;
    inputFechaInicio.disabled = true;
    inputFechaFin.disabled = true;
    inputNombreServicio.disabled = true;
    inputParroquia.disabled = true;

    modalFooter.appendChild(botonGuardar);
    botonGuardar.onclick = () => cerrarModal("modalFormulario");
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputBusqueda = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  horariosFiltrados =
    termino === ""
      ? null
      : horarios.filter((h) =>
          h.nombreServicio.toLowerCase().includes(termino)
        );
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
horarios = [
  {
    id: 1,
    fechaInicio: "2025-10-05",
    fechaFin: "2025-10-06",
    nombreServicio: "Boda",
    parroquia: "Catedral de chiclayo",
    estado: "activo",
  },
  {
    id: 2,
    fechaInicio: "2025-10-10",
    fechaFin: "2025-10-15",
    nombreServicio: "Misa",
    parroquia: "Parroquia San jose Obrero",
    estado: "activo",
  },
];

renderTabla();
