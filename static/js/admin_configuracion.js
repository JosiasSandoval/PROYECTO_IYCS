// ================== VARIABLES GLOBALES ==================
let configuraciones = [];
let configuracionesFiltradas = null;
let configuracionEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Modales
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;

// ================== FUNCIONES ==================

// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";
  const lista = configuracionesFiltradas ?? configuraciones;

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const datosPagina = lista.slice(inicio, fin);

  datosPagina.forEach((config, index) => {
    const esActivo = config.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombClave">${config.nombClave}</td>
      <td class="col-unidad">${config.unidad}</td>
      <td class="col-valor">${config.valor}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-warning btn-sm" onclick="editarConfiguracion(${config.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${config.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarConfiguracion(${config.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(configuraciones.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(configuraciones.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarConfiguracion(nombClave, unidad, valor) {
  configuraciones.push({
    id: Date.now(),
    nombClave,
    unidad,
    valor,
    estado: "activo",
  });
  renderTabla();
}

function editarConfiguracion(id) {
  const config = configuraciones.find((c) => c.id === id);
  if (!config) return;
  abrirModalFormulario("editar", config);
}

function eliminarConfiguracion(id) {
  const config = configuraciones.find((c) => c.id === id);
  if (!config) return;
  if (!confirm(`¿Seguro que deseas eliminar la configuración con ID ${config.id}?`)) return;
  configuraciones = configuraciones.filter((c) => c.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const config = configuraciones.find((c) => c.id === id);
  if (!config) return;
  config.estado = config.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

// ================== MODALES ==================
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
            <form id="formModalConfiguracion">
              <div class="mb-3">
                <label for="modalNombClave" class="form-label">Nombre Clave</label>
                <input type="text" id="modalNombClave" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalUnidad" class="form-label">Unidad</label>
                <input type="text" id="modalUnidad" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalValor" class="form-label">Valor</label>
                <input type="text" id="modalValor" class="form-control" required>
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

function abrirModalFormulario(modo, config = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputs = {
    nombClave: document.getElementById("modalNombClave"),
    unidad: document.getElementById("modalUnidad"),
    valor: document.getElementById("modalValor"),
  };
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalConfiguracion");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  Object.values(inputs).forEach((input) => (input.disabled = false));

  if (modo === "agregar") {
    titulo.textContent = "Agregar Configuración";
    Object.values(inputs).forEach((input) => (input.value = ""));
    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarConfiguracion(
        inputs.nombClave.value.trim(),
        inputs.unidad.value.trim(),
        inputs.valor.value.trim()
      );
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && config) {
    titulo.textContent = "Editar Configuración";
    inputs.nombClave.value = config.nombClave;
    inputs.unidad.value = config.unidad;
    inputs.valor.value = config.valor;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      config.nombClave = inputs.nombClave.value.trim();
      config.unidad = inputs.unidad.value.trim();
      config.valor = inputs.valor.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
const inputBuscar = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputBuscar.value.trim().toLowerCase();
  configuracionesFiltradas =
    termino === "" ? null : configuraciones.filter((c) => c.id.toString().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
configuraciones = [
  { id: 1, nombClave: "Duracion Misa", unidad: "minutos", valor: "60", estado: "activo" },
  { id: 2, nombClave: "Capacidad Salon", unidad: "personas", valor: "150", estado: "activo" },
  { id: 3, nombClave: "Horas Confesion", unidad: "horas", valor: "2", estado: "inactivo" },
  { id: 4, nombClave: "Duracion Bautizo", unidad: "minutos", valor: "45", estado: "activo" },
  { id: 5, nombClave: "Duracion Matrimonio", unidad: "minutos", valor: "90", estado: "activo" },
  { id: 6, nombClave: "Capacidad Capilla", unidad: "personas", valor: "80", estado: "inactivo" },
  { id: 7, nombClave: "Tiempo Catequesis", unidad: "horas", valor: "1", estado: "activo" },
  { id: 8, nombClave: "Duracion Confesion", unidad: "minutos", valor: "30", estado: "activo" },
  { id: 9, nombClave: "Capacidad Patio", unidad: "personas", valor: "200", estado: "activo" },
  { id: 10, nombClave: "Tiempo Reuniones", unidad: "horas", valor: "2", estado: "inactivo" },
  { id: 11, nombClave: "Duracion Eucaristia", unidad: "minutos", valor: "75", estado: "activo" },
  { id: 12, nombClave: "Capacidad Auditorio", unidad: "personas", valor: "300", estado: "activo" },
  { id: 13, nombClave: "Horas Oficina", unidad: "horas", valor: "8", estado: "activo" },
  { id: 14, nombClave: "Tiempo Vigilia", unidad: "horas", valor: "3", estado: "inactivo" },
  { id: 15, nombClave: "Duracion Vigilia", unidad: "minutos", valor: "180", estado: "activo" },
];

renderTabla();
