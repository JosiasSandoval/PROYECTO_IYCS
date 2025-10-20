// ================== VARIABLES GLOBALES ==================
let permisos = [
  { idPermiso: 1, nombAccion: "Crear", nombTabla: "Usuarios", estado: "activo" },
  { idPermiso: 2, nombAccion: "Editar", nombTabla: "Usuarios", estado: "activo" },
  { idPermiso: 3, nombAccion: "Eliminar", nombTabla: "Usuarios", estado: "inactivo" },
  { idPermiso: 4, nombAccion: "Ver", nombTabla: "Reprogramaciones", estado: "activo" },
  { idPermiso: 5, nombAccion: "Agregar", nombTabla: "Permisos", estado: "activo" },
  { idPermiso: 6, nombAccion: "Editar", nombTabla: "Permisos", estado: "inactivo" },
];

let permisosFiltrados = null;
let permisoEditandoId = null;

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

  const lista = permisosFiltrados ?? permisos;

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const datosPagina = lista.slice(inicio, fin);

  datosPagina.forEach((perm, index) => {
    const esActivo = perm.estado === "activo" || perm.estado === undefined;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-accion">${perm.nombAccion}</td>
      <td class="col-tabla">${perm.nombTabla}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verPermiso(${perm.idPermiso})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarPermiso(${perm.idPermiso})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${perm.idPermiso})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarPermiso(${perm.idPermiso})" title="Eliminar">
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
  const totalPaginas = Math.ceil(permisos.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(permisos.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarPermiso(nombAccion, nombTabla) {
  permisos.push({
    idPermiso: Date.now(),
    nombAccion,
    nombTabla,
    estado: "activo"
  });
  renderTabla();
}

function editarPermiso(id) {
  const perm = permisos.find((p) => p.idPermiso === id);
  if (!perm) return;
  abrirModalFormulario("editar", perm);
}

function eliminarPermiso(id) {
  const perm = permisos.find((p) => p.idPermiso === id);
  if (!perm) return;
  if (!confirm(`¿Seguro que deseas eliminar el permiso con ID ${perm.idPermiso}?`)) return;
  permisos = permisos.filter((p) => p.idPermiso !== id);
  renderTabla();
}

// ================== BOTÓN DAR DE BAJA ==================
function darDeBaja(id) {
  const perm = permisos.find((p) => p.idPermiso === id);
  if (!perm) return;
  perm.estado = perm.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verPermiso(id) {
  const perm = permisos.find((p) => p.idPermiso === id);
  if (!perm) return;
  abrirModalFormulario("ver", perm);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Permiso</h5>
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
            <form id="formModalPermiso">
              <div class="mb-3">
                <label for="modalAccion" class="form-label">Acción</label>
                <input type="text" id="modalAccion" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalTabla" class="form-label">Tabla</label>
                <input type="text" id="modalTabla" class="form-control" required>
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

function abrirModalFormulario(modo, perm = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputs = {
    accion: document.getElementById("modalAccion"),
    tabla: document.getElementById("modalTabla"),
  };
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalPermiso");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  Object.values(inputs).forEach((input) => (input.disabled = false));

  if (modo === "agregar") {
    titulo.textContent = "Agregar Permiso";
    Object.values(inputs).forEach((input) => (input.value = ""));
    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarPermiso(inputs.accion.value.trim(), inputs.tabla.value.trim());
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && perm) {
    titulo.textContent = "Editar Permiso";
    inputs.accion.value = perm.nombAccion;
    inputs.tabla.value = perm.nombTabla;
    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      perm.nombAccion = inputs.accion.value.trim();
      perm.nombTabla = inputs.tabla.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && perm) {
    titulo.textContent = "Detalle del Permiso";
    inputs.accion.value = perm.nombAccion;
    inputs.tabla.value = perm.nombTabla;
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
  permisosFiltrados =
    termino === "" ? null : permisos.filter((p) => p.idPermiso.toString().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== RENDER INICIAL ==================
renderTabla();
