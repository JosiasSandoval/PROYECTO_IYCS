// ================== VARIABLES GLOBALES ==================
let politicas = [];
let politicasFiltradas = null;
let politicaEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Referencias a los modales
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;

// Ordenamiento
let ordenActual = { campo: null, ascendente: true };

// ================== FUNCIONES ==================
function renderTabla() {
  tabla.innerHTML = "";

  const lista = politicasFiltradas ?? politicas;

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
  const politicasPagina = lista.slice(inicio, fin);

  politicasPagina.forEach((politica, index) => {
    const esActiva = politica.estado === "activa";
    const botonColor = esActiva ? "btn-orange" : "btn-success";
    const rotacion = esActiva ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${politica.nombre}</td>
      <td class="col-descripcion">${politica.descripcion}</td>
      <td class="col-valorDias">${politica.duracion}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verPolitica(${politica.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarPolitica(${politica.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstado(${politica.id})" title="${esActiva ? 'Desactivar' : 'Activar'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarPolitica(${politica.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil((politicasFiltradas ?? politicas).length / elementosPorPagina);
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
  const totalPaginas = Math.ceil((politicasFiltradas ?? politicas).length / elementosPorPagina);
  if (pagina < 1 || pagina > totalPaginas) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarPolitica(nombre, descripcion, duracion) {
  politicas.push({
    id: Date.now(),
    nombre,
    descripcion,
    duracion,
    estado: "activa",
  });
  renderTabla();
}

function editarPolitica(id) {
  const politica = politicas.find((p) => p.id === id);
  if (!politica) return;
  abrirModalFormulario("editar", politica);
}

function eliminarPolitica(id) {
  const politica = politicas.find((p) => p.id === id);
  if (!politica) return;
  if (!confirm(`¿Seguro que deseas eliminar la política "${politica.nombre}"?`)) return;
  politicas = politicas.filter((p) => p.id !== id);
  renderTabla();
}

function cambiarEstado(id) {
  const politica = politicas.find((p) => p.id === id);
  if (!politica) return;
  politica.estado = politica.estado === "activa" ? "inactiva" : "activa";
  renderTabla();
}

function verPolitica(id) {
  const politica = politicas.find((p) => p.id === id);
  if (!politica) return;
  abrirModalFormulario("ver", politica);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle de Política</h5>
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
            <form id="formModalPolitica">

              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>

              <div class="mb-3">
                <label for="modalDescripcion" class="form-label">Descripción</label>
                <textarea id="modalDescripcion" class="form-control" required></textarea>
              </div>

              <div class="mb-3">
                <label for="modalDuracion" class="form-label">Duración (días)</label>
                <input type="number" id="modalDuracion" class="form-control" required>
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

function abrirModalFormulario(modo, politica = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const inputDescripcion = document.getElementById("modalDescripcion");
  const inputDuracion = document.getElementById("modalDuracion");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalPolitica");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  inputNombre.disabled = false;
  inputDescripcion.disabled = false;
  inputDuracion.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar Política";
    inputNombre.value = "";
    inputDescripcion.value = "";
    inputDuracion.value = "";

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarPolitica(inputNombre.value.trim(), inputDescripcion.value.trim(), inputDuracion.value.trim());
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && politica) {
    titulo.textContent = "Editar Política";
    inputNombre.value = politica.nombre;
    inputDescripcion.value = politica.descripcion;
    inputDuracion.value = politica.duracion;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      politica.nombre = inputNombre.value.trim();
      politica.descripcion = inputDescripcion.value.trim();
      politica.duracion = inputDuracion.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && politica) {
    titulo.textContent = "Detalle de Política";
    inputNombre.value = politica.nombre;
    inputDescripcion.value = politica.descripcion;
    inputDuracion.value = politica.duracion;
    inputNombre.disabled = true;
    inputDescripcion.disabled = true;
    inputDuracion.disabled = true;

    modalFooter.appendChild(botonGuardar);
    botonGuardar.onclick = () => cerrarModal("modalFormulario");
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputPolitica = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputPolitica.value.trim().toLowerCase();
  politicasFiltradas =
    termino === ""
      ? null
      : politicas.filter((p) => p.nombre.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
politicas = [
  { id: 1, nombre: "Política de Privacidad", descripcion: "Regula el uso de datos personales.", duracion: "365", estado: "activa" },
  { id: 2, nombre: "Política de Cancelación", descripcion: "Define los plazos y condiciones para cancelaciones.", duracion: "90", estado: "activa" },
  { id: 3, nombre: "Política de Seguridad", descripcion: "Establece medidas de protección de la información.", duracion: "180", estado: "activa" },
];

renderTabla();
