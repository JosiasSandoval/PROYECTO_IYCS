// ================== VARIABLES GLOBALES ==================
let disponibilidades = [];
let disponibilidadesFiltradas = null;

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

  const lista = disponibilidadesFiltradas ?? disponibilidades;

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const datosPagina = lista.slice(inicio, fin);

  datosPagina.forEach((dispo, index) => {
    const esActivo = dispo.estadoDisponibilidad === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-diaSemana">${dispo.diaSemana}</td>
      <td class="col-horaInicioDis">${dispo.horaInicioDis}</td>
      <td class="col-horaFinDis">${dispo.horaFinDis}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDisponibilidad(${dispo.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarDisponibilidad(${dispo.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${dispo.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarDisponibilidad(${dispo.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(disponibilidades.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(disponibilidades.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarDisponibilidad(diaSemana, horaInicioDis, horaFinDis) {
  disponibilidades.push({
    id: Date.now(),
    diaSemana,
    horaInicioDis,
    horaFinDis,
    estadoDisponibilidad: "activo",
  });
  renderTabla();
}

function editarDisponibilidad(id) {
  const dispo = disponibilidades.find((d) => d.id === id);
  if (!dispo) return;
  abrirModalFormulario("editar", dispo);
}

function eliminarDisponibilidad(id) {
  const dispo = disponibilidades.find((d) => d.id === id);
  if (!dispo) return;
  if (!confirm(`¿Seguro que deseas eliminar la disponibilidad con ID ${dispo.id}?`)) return;
  disponibilidades = disponibilidades.filter((d) => d.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const dispo = disponibilidades.find((d) => d.id === id);
  if (!dispo) return;
  dispo.estadoDisponibilidad = dispo.estadoDisponibilidad === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verDisponibilidad(id) {
  const dispo = disponibilidades.find((d) => d.id === id);
  if (!dispo) return;
  abrirModalFormulario("ver", dispo);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle de la Disponibilidad</h5>
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
            <form id="formModalDisponibilidad">
              <div class="mb-3">
                <label for="modalDiaSemana" class="form-label">Día de la Semana</label>
                <input type="text" id="modalDiaSemana" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalHoraInicio" class="form-label">Hora Inicio</label>
                <input type="time" id="modalHoraInicio" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalHoraFin" class="form-label">Hora Fin</label>
                <input type="time" id="modalHoraFin" class="form-control" required>
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

function abrirModalFormulario(modo, dispo = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputs = {
    diaSemana: document.getElementById("modalDiaSemana"),
    horaInicio: document.getElementById("modalHoraInicio"),
    horaFin: document.getElementById("modalHoraFin"),
  };
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalDisponibilidad");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  Object.values(inputs).forEach((input) => (input.disabled = false));

  if (modo === "agregar") {
    titulo.textContent = "Agregar Disponibilidad";
    Object.values(inputs).forEach((input) => (input.value = ""));
    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarDisponibilidad(
        inputs.diaSemana.value.trim(),
        inputs.horaInicio.value.trim(),
        inputs.horaFin.value.trim()
      );
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && dispo) {
    titulo.textContent = "Editar Disponibilidad";
    inputs.diaSemana.value = dispo.diaSemana;
    inputs.horaInicio.value = dispo.horaInicioDis;
    inputs.horaFin.value = dispo.horaFinDis;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      dispo.diaSemana = inputs.diaSemana.value.trim();
      dispo.horaInicioDis = inputs.horaInicio.value.trim();
      dispo.horaFinDis = inputs.horaFin.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && dispo) {
    titulo.textContent = "Detalle de la Disponibilidad";
    inputs.diaSemana.value = dispo.diaSemana;
    inputs.horaInicio.value = dispo.horaInicioDis;
    inputs.horaFin.value = dispo.horaFinDis;
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
  disponibilidadesFiltradas =
    termino === "" ? null : disponibilidades.filter((d) => d.id.toString().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
disponibilidades = [
  { id: 1, diaSemana: "Lunes", horaInicioDis: "08:00", horaFinDis: "12:00", estadoDisponibilidad: "activo" },
  { id: 2, diaSemana: "Martes", horaInicioDis: "09:00", horaFinDis: "13:00", estadoDisponibilidad: "activo" },
  { id: 3, diaSemana: "Miércoles", horaInicioDis: "10:00", horaFinDis: "14:00", estadoDisponibilidad: "inactivo" },
];

renderTabla();
