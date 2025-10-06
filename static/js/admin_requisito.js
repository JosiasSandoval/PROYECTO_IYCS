// ================== VARIABLES GLOBALES ==================
let requisitos = [];
let requisitosFiltrados = null;
let requisitosEditandoId = null;

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

  const lista = requisitosFiltrados ?? requisitos;

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
  const requisitosPagina = lista.slice(inicio, fin);

  requisitosPagina.forEach((req, index) => {
    const esActivo = req.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${req.nombre}</td>
      <td class="col-fechaRegistro">${req.f_registro}</td>
      <td class="col-descripcion">${req.descripcion}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verRequisito(${req.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarRequisito(${req.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${req.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarRequisito(${req.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(requisitos.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(requisitos.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarRequisito(nombre, f_registro, descripcion) {
  requisitos.push({
    id: Date.now(),
    nombre,
    f_registro,
    descripcion,
    estado: "activo",
  });
  renderTabla();
}

function editarRequisito(id) {
  const req = requisitos.find((r) => r.id === id);
  if (!req) return;
  abrirModalFormulario("editar", req);
}

function eliminarRequisito(id) {
  const req = requisitos.find((r) => r.id === id);
  if (!req) return;
  if (!confirm(`¿Seguro que deseas eliminar el requisito "${req.nombre}"?`)) return;
  requisitos = requisitos.filter((r) => r.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const req = requisitos.find((r) => r.id === id);
  if (!req) return;
  req.estado = req.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verRequisito(id) {
  const req = requisitos.find((r) => r.id === id);
  if (!req) return;
  abrirModalFormulario("ver", req);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Requisito</h5>
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
            <form id="formModalRequisito">

              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del requisito</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalFechaRegistro" class="form-label">Fecha registro</label>
                <input type="date" id="modalFechaRegistro" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalDescripcion" class="form-label">Descripción</label>
                <input type="text" id="modalDescripcion" class="form-control" required>
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

function abrirModalFormulario(modo, req = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const inputFechaRegistro = document.getElementById("modalFechaRegistro");
  const inputDescripcion = document.getElementById("modalDescripcion");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalRequisito");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  inputNombre.disabled = false;
  inputFechaRegistro.disabled = false;
  inputDescripcion.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar requisito";
    inputNombre.value = "";
    inputFechaRegistro.value = "";
    inputDescripcion.value = "";

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarRequisito(inputNombre.value.trim(), inputFechaRegistro.value.trim(), inputDescripcion.value.trim());
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && req) {
    titulo.textContent = "Editar requisito";
    inputNombre.value = req.nombre;
    inputFechaRegistro.value = req.f_registro;
    inputDescripcion.value = req.descripcion;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      req.nombre = inputNombre.value.trim();
      req.f_registro = inputFechaRegistro.value.trim();
      req.descripcion = inputDescripcion.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && req) {
    titulo.textContent = "Detalle del requisito";
    inputNombre.value = req.nombre;
    inputFechaRegistro.value = req.f_registro;
    inputDescripcion.value = req.descripcion;
    inputNombre.disabled = true;
    inputFechaRegistro.disabled = true;
    inputDescripcion.disabled = true;

    modalFooter.appendChild(botonGuardar);
    botonGuardar.textContent = "Cerrar";
    botonGuardar.onclick = () => cerrarModal("modalFormulario");
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputRequisito = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputRequisito.value.trim().toLowerCase();
  requisitosFiltrados =
    termino === ""
      ? null
      : requisitos.filter((r) => r.nombre.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
requisitos = [
  { id: 1, nombre: "Partida de Nacimiento", f_registro: "2025-10-01", descripcion: "Documento legal de nacimiento", estado: "activo" },
  { id: 2, nombre: "Certificado de Bautismo", f_registro: "2025-10-02", descripcion: "Requisito para sacramentos", estado: "activo" },
  { id: 3, nombre: "DNI", f_registro: "2025-10-03", descripcion: "Documento nacional de identidad", estado: "activo" },
];

renderTabla();
