// ================== VARIABLES GLOBALES ==================
let cargos = [];
let cargosFiltrados = null;
let cargoEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Modales personalizados
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

// ================== FUNCIONES ==================

// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";

  const lista = cargosFiltrados ?? cargos;

  // Ordenar si corresponde
  if (ordenActual.campo) {
    lista.sort((a, b) => {
      const campo = ordenActual.campo;
      const valorA = a[campo]?.toString().toLowerCase() ?? "";
      const valorB = b[campo]?.toString().toLowerCase() ?? "";
      if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
      if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
      return 0;
    });
  }

  // Paginación
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const cargosPagina = lista.slice(inicio, fin);

  cargosPagina.forEach((cargo, index) => {
    const esActivo = cargo.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${cargo.nombre}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info" onclick="verCargo(${cargo.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning" onclick="editarCargo(${cargo.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor}" onclick="cambiarEstado(${cargo.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger" onclick="eliminarCargo(${cargo.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(cargos.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(cargos.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarCargo(nombre) {
  cargos.push({
    id: Date.now(),
    nombre,
    estado: "activo",
  });
  renderTabla();
}

function editarCargo(id) {
  const cargo = cargos.find((c) => c.id === id);
  if (!cargo) return;
  abrirModalFormulario("editar", cargo);
}

function eliminarCargo(id) {
  const cargo = cargos.find((c) => c.id === id);
  if (!cargo) return;
  if (!confirm(`¿Seguro que deseas eliminar el cargo "${cargo.nombre}"?`)) return;
  cargos = cargos.filter((c) => c.id !== id);
  renderTabla();
}

function cambiarEstado(id) {
  const cargo = cargos.find((c) => c.id === id);
  if (!cargo) return;
  cargo.estado = cargo.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verCargo(id) {
  const cargo = cargos.find((c) => c.id === id);
  if (!cargo) return;
  abrirModalFormulario("ver", cargo);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Cargo</h5>
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
            <form id="formModalCargo">

              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del Cargo</label>
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

function abrirModalFormulario(modo, cargo = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalCargo");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  inputNombre.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar Cargo";
    inputNombre.value = "";
    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarCargo(inputNombre.value.trim());
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && cargo) {
    titulo.textContent = "Editar Cargo";
    inputNombre.value = cargo.nombre;
    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      cargo.nombre = inputNombre.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && cargo) {
    titulo.textContent = "Detalle del Cargo";
    inputNombre.value = cargo.nombre;
    inputNombre.disabled = true;

    const btnCerrar = document.createElement("button");
    btnCerrar.textContent = "Cerrar";
    btnCerrar.className = "btn btn-modal btn-modal-secondary";
    btnCerrar.onclick = () => cerrarModal("modalFormulario");
    modalFooter.appendChild(btnCerrar);
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputCargo = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputCargo.value.trim().toLowerCase();
  cargosFiltrados =
    termino === ""
      ? null
      : cargos.filter((c) => c.nombre.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
cargos = [
  { id: 1, nombre: "Secretaria", estado: "activo" },
  { id: 2, nombre: "Parroco", estado: "activo" },
  { id: 3, nombre: "Feligres", estado: "activo" },
];

renderTabla();
