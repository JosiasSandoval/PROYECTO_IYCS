// ================== VARIABLES GLOBALES ==================
let tiposUsuario = [];
let tiposFiltrados = null;
let tipoEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Referencias a los modales
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;

// ================== FUNCIONES ==================

// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";
  const lista = tiposFiltrados ?? tiposUsuario;

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const pagina = lista.slice(inicio, fin);

  pagina.forEach((tipo, index) => {
    const esActivo = tipo.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${tipo.nombre}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verTipo(${tipo.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarTipo(${tipo.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${tipo.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarTipo(${tipo.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(tiposUsuario.length / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";

  const crearItem = (num, activo = false, disabled = false, texto = null) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${num})">${texto || num}</button>`;
    return li;
  };

  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));

  for (let i = 1; i <= totalPaginas; i++) {
    ul.appendChild(crearItem(i, paginaActual === i));
  }

  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));

  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  if (pagina < 1 || pagina > Math.ceil(tiposUsuario.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarTipo(nombre) {
  tiposUsuario.push({
    id: Date.now(),
    nombre,
    estado: "activo",
  });
  renderTabla();
}

function editarTipo(id) {
  const tipo = tiposUsuario.find((t) => t.id === id);
  if (!tipo) return;
  abrirModalFormulario("editar", tipo);
}

function eliminarTipo(id) {
  const tipo = tiposUsuario.find((t) => t.id === id);
  if (!tipo) return;
  if (!confirm(`¿Seguro que deseas eliminar el tipo de usuario "${tipo.nombre}"?`)) return;
  tiposUsuario = tiposUsuario.filter((t) => t.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const tipo = tiposUsuario.find((t) => t.id === id);
  if (!tipo) return;
  tipo.estado = tipo.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verTipo(id) {
  const tipo = tiposUsuario.find((t) => t.id === id);
  if (!tipo) return;
  abrirModalFormulario("ver", tipo);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del tipo de usuario</h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalDetalle')">&times;</button>
          </div>
          <div class="modal-body" id="modalDetalleContenido"></div>
        </div>
      </div>
    </div>`;
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
            <form id="formModalTipo">
              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del tipo de usuario</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-modal btn-modal-primary" id="btnGuardar">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>`;
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

function abrirModalFormulario(modo, tipo = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const form = document.getElementById("formModalTipo");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  inputNombre.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar Tipo de Usuario";
    inputNombre.value = "";
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarTipo(inputNombre.value.trim());
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && tipo) {
    titulo.textContent = "Editar Tipo de Usuario";
    inputNombre.value = tipo.nombre;
    form.onsubmit = (e) => {
      e.preventDefault();
      tipo.nombre = inputNombre.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && tipo) {
    titulo.textContent = "Detalle del Tipo de Usuario";
    inputNombre.value = tipo.nombre;
    inputNombre.disabled = true;
    form.onsubmit = (e) => {
      e.preventDefault();
      cerrarModal("modalFormulario");
    };
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
document.getElementById("btn_buscar").addEventListener("click", () => {
  const termino = document.getElementById("inputDocumento").value.trim().toLowerCase();
  tiposFiltrados = termino === "" ? null : tiposUsuario.filter((t) => t.nombre.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
tiposUsuario = [
  { id: 1, nombre: "Administrador", estado: "activo" },
  { id: 2, nombre: "Usuario Regular", estado: "activo" },
];

renderTabla();
