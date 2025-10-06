// ================== VARIABLES GLOBALES ==================
let reprogramaciones = [];
let reprogramacionesFiltradas = null;
let reprogramacionEditandoId = null;

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

  const lista = reprogramacionesFiltradas ?? reprogramaciones;

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const datosPagina = lista.slice(inicio, fin);

  datosPagina.forEach((rep, index) => {
    const esActivo = rep.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-fechaAnterior">${rep.fechaAnterior}</td>
      <td class="col-horaAnterior">${rep.horaAnterior}</td>
      <td class="col-fechaNueva">${rep.fechaNueva}</td>
      <td class="col-horaNueva">${rep.horaNueva}</td>
      <td class="col-motivo">${rep.motivo}</td>
      <td class="col-usuarioReprogramo">${rep.usuarioReprogramo}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verReprogramacion(${rep.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarReprogramacion(${rep.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${rep.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarReprogramacion(${rep.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(reprogramaciones.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(reprogramaciones.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarReprogramacion(fechaAnterior, horaAnterior, fechaNueva, horaNueva, motivo, usuarioReprogramo) {
  reprogramaciones.push({
    id: Date.now(),
    fechaAnterior,
    horaAnterior,
    fechaNueva,
    horaNueva,
    motivo,
    usuarioReprogramo,
    estado: "activo",
  });
  renderTabla();
}

function editarReprogramacion(id) {
  const rep = reprogramaciones.find((r) => r.id === id);
  if (!rep) return;
  abrirModalFormulario("editar", rep);
}

function eliminarReprogramacion(id) {
  const rep = reprogramaciones.find((r) => r.id === id);
  if (!rep) return;
  if (!confirm(`¿Seguro que deseas eliminar la reprogramación con ID ${rep.id}?`)) return;
  reprogramaciones = reprogramaciones.filter((r) => r.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const rep = reprogramaciones.find((r) => r.id === id);
  if (!rep) return;
  rep.estado = rep.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verReprogramacion(id) {
  const rep = reprogramaciones.find((r) => r.id === id);
  if (!rep) return;
  abrirModalFormulario("ver", rep);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle de la Reprogramación</h5>
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
            <form id="formModalReprogramacion">
              <div class="mb-3">
                <label for="modalFechaAnterior" class="form-label">Fecha anterior</label>
                <input type="date" id="modalFechaAnterior" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalHoraAnterior" class="form-label">Hora anterior</label>
                <input type="time" id="modalHoraAnterior" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalFechaNueva" class="form-label">Fecha nueva</label>
                <input type="date" id="modalFechaNueva" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalHoraNueva" class="form-label">Hora nueva</label>
                <input type="time" id="modalHoraNueva" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalMotivo" class="form-label">Motivo</label>
                <input type="text" id="modalMotivo" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalUsuario" class="form-label">Usuario que reprogramó</label>
                <input type="text" id="modalUsuario" class="form-control" required>
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

function abrirModalFormulario(modo, rep = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputs = {
    fechaAnterior: document.getElementById("modalFechaAnterior"),
    horaAnterior: document.getElementById("modalHoraAnterior"),
    fechaNueva: document.getElementById("modalFechaNueva"),
    horaNueva: document.getElementById("modalHoraNueva"),
    motivo: document.getElementById("modalMotivo"),
    usuario: document.getElementById("modalUsuario"),
  };
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalReprogramacion");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  Object.values(inputs).forEach((input) => (input.disabled = false));

  if (modo === "agregar") {
    titulo.textContent = "Agregar Reprogramación";
    Object.values(inputs).forEach((input) => (input.value = ""));
    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarReprogramacion(
        inputs.fechaAnterior.value.trim(),
        inputs.horaAnterior.value.trim(),
        inputs.fechaNueva.value.trim(),
        inputs.horaNueva.value.trim(),
        inputs.motivo.value.trim(),
        inputs.usuario.value.trim()
      );
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && rep) {
    titulo.textContent = "Editar Reprogramación";
    inputs.fechaAnterior.value = rep.fechaAnterior;
    inputs.horaAnterior.value = rep.horaAnterior;
    inputs.fechaNueva.value = rep.fechaNueva;
    inputs.horaNueva.value = rep.horaNueva;
    inputs.motivo.value = rep.motivo;
    inputs.usuario.value = rep.usuarioReprogramo;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      rep.fechaAnterior = inputs.fechaAnterior.value.trim();
      rep.horaAnterior = inputs.horaAnterior.value.trim();
      rep.fechaNueva = inputs.fechaNueva.value.trim();
      rep.horaNueva = inputs.horaNueva.value.trim();
      rep.motivo = inputs.motivo.value.trim();
      rep.usuarioReprogramo = inputs.usuario.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && rep) {
    titulo.textContent = "Detalle de la Reprogramación";
    inputs.fechaAnterior.value = rep.fechaAnterior;
    inputs.horaAnterior.value = rep.horaAnterior;
    inputs.fechaNueva.value = rep.fechaNueva;
    inputs.horaNueva.value = rep.horaNueva;
    inputs.motivo.value = rep.motivo;
    inputs.usuario.value = rep.usuarioReprogramo;
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
  reprogramacionesFiltradas =
    termino === "" ? null : reprogramaciones.filter((r) => r.id.toString().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
reprogramaciones = [
  { id: 1, fechaAnterior: "2025-09-10", horaAnterior: "10:00", fechaNueva: "2025-09-12", horaNueva: "11:00", motivo: "Fallo técnico", usuarioReprogramo: "Cardenal", estado: "activo" },
  { id: 2, fechaAnterior: "2025-09-15", horaAnterior: "09:00", fechaNueva: "2025-09-16", horaNueva: "09:30", motivo: "Solicitud del cliente", usuarioReprogramo: "Parroco", estado: "activo" },
  { id: 3, fechaAnterior: "2025-09-20", horaAnterior: "14:00", fechaNueva: "2025-09-21", horaNueva: "13:00", motivo: "Cambio de sala", usuarioReprogramo: "Secretaria", estado: "inactivo" },
];

renderTabla();
