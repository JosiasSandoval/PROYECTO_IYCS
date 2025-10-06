// ================== VARIABLES GLOBALES ==================
let actos = [];
let actosFiltrados = null;
let actoEditandoId = null;

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

  const lista = actosFiltrados ?? actos;

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
  const actosPagina = lista.slice(inicio, fin);

  actosPagina.forEach((acto, index) => {
    const esActivo = acto.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${acto.nombre}</td>
      <td class="col-precio">${acto.precio}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verActo(${acto.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarActo(${acto.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${acto.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarActo(${acto.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(actos.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(actos.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarActo(nombre, precio) {
  actos.push({
    id: Date.now(),
    nombre,
    precio,
    estado: "activo",
  });
  renderTabla();
}

function editarActo(id) {
  const acto = actos.find((a) => a.id === id);
  if (!acto) return;
  abrirModalFormulario("editar", acto);
}

function eliminarActo(id) {
  const acto = actos.find((a) => a.id === id);
  if (!acto) return;
  if (!confirm(`¿Seguro que deseas eliminar el acto litúrgico "${acto.nombre}"?`)) return;
  actos = actos.filter((a) => a.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const acto = actos.find((a) => a.id === id);
  if (!acto) return;
  acto.estado = acto.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verActo(id) {
  const acto = actos.find((a) => a.id === id);
  if (!acto) return;
  abrirModalFormulario("ver", acto);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del acto litúrgico</h5>
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
            <form id="formModalActo">

              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del acto litúrgico</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalPrecio" class="form-label">Precio</label>
                <input type="number" id="modalPrecio" class="form-control" required>
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

function abrirModalFormulario(modo, acto = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const inputPrecio = document.getElementById("modalPrecio");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalActo");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  inputNombre.disabled = false;
  inputPrecio.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar Acto Litúrgico";
    inputNombre.value = "";
    inputPrecio.value = "";

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarActo(inputNombre.value.trim(), inputPrecio.value.trim());
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && acto) {
    titulo.textContent = "Editar Acto Litúrgico";
    inputNombre.value = acto.nombre;
    inputPrecio.value = acto.precio;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      acto.nombre = inputNombre.value.trim();
      acto.precio = inputPrecio.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && acto) {
    titulo.textContent = "Detalle del Acto Litúrgico";
    inputNombre.value = acto.nombre;
    inputPrecio.value = acto.precio;
    inputNombre.disabled = true;
    inputPrecio.disabled = true;

    modalFooter.appendChild(botonGuardar);
    botonGuardar.onclick = () => cerrarModal("modalFormulario");
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputActo = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputActo.value.trim().toLowerCase();
  actosFiltrados =
    termino === ""
      ? null
      : actos.filter((a) => a.nombre.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
actos = [
  { id: 1, nombre: "Misa Dominical", precio: "50", estado: "activo" },
  { id: 2, nombre: "Bautizo", precio: "80", estado: "activo" },
  { id: 3, nombre: "Matrimonio", precio: "200", estado: "activo" },
];

renderTabla();
