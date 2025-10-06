// ================== VARIABLES GLOBALES ==================
let metodos = [];
let metodosFiltrados = null;
let metodoEditandoId = null;

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

  const lista = metodosFiltrados ?? metodos;

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
  const metodosPagina = lista.slice(inicio, fin);

  metodosPagina.forEach((metodo, index) => {
    const esActivo = metodo.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${metodo.nombre}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verMetodo(${metodo.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarMetodo(${metodo.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${metodo.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarMetodo(${metodo.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(metodos.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(metodos.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarMetodo(nombre) {
  metodos.push({
    id: Date.now(),
    nombre,
    estado: "activo",
  });
  renderTabla();
}

function editarMetodo(id) {
  const metodo = metodos.find((m) => m.id === id);
  if (!metodo) return;
  abrirModalFormulario("editar", metodo);
}

function eliminarMetodo(id) {
  const metodo = metodos.find((m) => m.id === id);
  if (!metodo) return;
  if (!confirm(`¿Seguro que deseas eliminar el método de pago "${metodo.nombre}"?`)) return;
  metodos = metodos.filter((m) => m.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const metodo = metodos.find((m) => m.id === id);
  if (!metodo) return;
  metodo.estado = metodo.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verMetodo(id) {
  const metodo = metodos.find((m) => m.id === id);
  if (!metodo) return;
  abrirModalFormulario("ver", metodo);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del método de pago</h5>
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
            <form id="formModalMetodo">

              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del método de pago</label>
                <input type="text" id="modalNombre" class="form-control" required>
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

function abrirModalFormulario(modo, metodo = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalMetodo");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  inputNombre.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar Método de Pago";
    inputNombre.value = "";

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarMetodo(inputNombre.value.trim());
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && metodo) {
    titulo.textContent = "Editar Método de Pago";
    inputNombre.value = metodo.nombre;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      metodo.nombre = inputNombre.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && metodo) {
    titulo.textContent = "Detalle del Método de Pago";
    inputNombre.value = metodo.nombre;
    inputNombre.disabled = true;

    modalFooter.appendChild(botonGuardar);
    botonGuardar.onclick = () => cerrarModal("modalFormulario");
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputMetodo = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputMetodo.value.trim().toLowerCase();
  metodosFiltrados =
    termino === ""
      ? null
      : metodos.filter((m) => m.nombre.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
metodos = [
  { id: 1, nombre: "Efectivo", estado: "activo" },
  { id: 2, nombre: "Tarjeta de Crédito", estado: "activo" },
  { id: 3, nombre: "Transferencia Bancaria", estado: "activo" },
  { id: 4, nombre: "Yape / Plin", estado: "activo" },
];

renderTabla();
