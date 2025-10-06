// ================== VARIABLES GLOBALES ==================
let descuentos = [];
let descuentosFiltrados = null;
let descuentoEditandoId = null;

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

  const lista = descuentosFiltrados ?? descuentos;

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const descuentosPagina = lista.slice(inicio, fin);

  descuentosPagina.forEach((desc, index) => {
    const esActivo = desc.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-porcentaje">${desc.porcentaje}%</td>
      <td class="col-fechaInicio">${desc.fechaInicio}</td>
      <td class="col-fechaFin">${desc.fechaFin}</td>
      <td class="col-condicion">${desc.condicion}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDescuento(${desc.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarDescuento(${desc.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${desc.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarDescuento(${desc.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(descuentos.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(descuentos.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarDescuento(porcentaje, fechaInicio, fechaFin, condicion) {
  descuentos.push({
    id: Date.now(),
    porcentaje,
    fechaInicio,
    fechaFin,
    condicion,
    estado: "activo",
  });
  renderTabla();
}

function editarDescuento(id) {
  const desc = descuentos.find((d) => d.id === id);
  if (!desc) return;
  abrirModalFormulario("editar", desc);
}

function eliminarDescuento(id) {
  const desc = descuentos.find((d) => d.id === id);
  if (!desc) return;
  if (!confirm(`¿Seguro que deseas eliminar el descuento con ${desc.porcentaje}%?`)) return;
  descuentos = descuentos.filter((d) => d.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const desc = descuentos.find((d) => d.id === id);
  if (!desc) return;
  desc.estado = desc.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verDescuento(id) {
  const desc = descuentos.find((d) => d.id === id);
  if (!desc) return;
  abrirModalFormulario("ver", desc);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Descuento</h5>
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
            <form id="formModalDescuento">
              <div class="mb-3">
                <label for="modalPorcentaje" class="form-label">Porcentaje</label>
                <input type="number" id="modalPorcentaje" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalFechaInicio" class="form-label">Fecha Inicio</label>
                <input type="date" id="modalFechaInicio" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalFechaFin" class="form-label">Fecha Fin</label>
                <input type="date" id="modalFechaFin" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalCondicion" class="form-label">Condición</label>
                <input type="text" id="modalCondicion" class="form-control" required>
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

function abrirModalFormulario(modo, desc = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputPorcentaje = document.getElementById("modalPorcentaje");
  const inputInicio = document.getElementById("modalFechaInicio");
  const inputFin = document.getElementById("modalFechaFin");
  const inputCond = document.getElementById("modalCondicion");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalDescuento");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  inputPorcentaje.disabled = false;
  inputInicio.disabled = false;
  inputFin.disabled = false;
  inputCond.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar Descuento";
    inputPorcentaje.value = "";
    inputInicio.value = "";
    inputFin.value = "";
    inputCond.value = "";

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarDescuento(
        inputPorcentaje.value.trim(),
        inputInicio.value.trim(),
        inputFin.value.trim(),
        inputCond.value.trim()
      );
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && desc) {
    titulo.textContent = "Editar Descuento";
    inputPorcentaje.value = desc.porcentaje;
    inputInicio.value = desc.fechaInicio;
    inputFin.value = desc.fechaFin;
    inputCond.value = desc.condicion;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      desc.porcentaje = inputPorcentaje.value.trim();
      desc.fechaInicio = inputInicio.value.trim();
      desc.fechaFin = inputFin.value.trim();
      desc.condicion = inputCond.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && desc) {
    titulo.textContent = "Detalle del Descuento";
    inputPorcentaje.value = desc.porcentaje;
    inputInicio.value = desc.fechaInicio;
    inputFin.value = desc.fechaFin;
    inputCond.value = desc.condicion;
    inputPorcentaje.disabled = true;
    inputInicio.disabled = true;
    inputFin.disabled = true;
    inputCond.disabled = true;

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
  descuentosFiltrados =
    termino === ""
      ? null
      : descuentos.filter((d) => d.id.toString().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
descuentos = [
  { id: 1, porcentaje: 10, fechaInicio: "2025-10-01", fechaFin: "2025-10-10", condicion: "Clientes nuevos", estado: "activo" },
  { id: 2, porcentaje: 20, fechaInicio: "2025-10-05", fechaFin: "2025-10-15", condicion: "Compras mayores a $100", estado: "activo" },
  { id: 3, porcentaje: 15, fechaInicio: "2025-09-25", fechaFin: "2025-10-05", condicion: "Temporada", estado: "inactivo" },
];

renderTabla();
