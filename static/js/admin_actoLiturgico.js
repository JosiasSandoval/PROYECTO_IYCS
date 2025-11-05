// ================== VARIABLES GLOBALES ==================
let actos = [];
let actosFiltrados = null;
let paginaActual = 1;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const elementosPorPagina = 5;
// Referencias a los modales sin Bootstrap
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

// Variable de ordenamiento
let ordenActual = { campo: null, ascendente: true };

// ================== FUNCIONES ==================
function normalizarActo(item) {
  return {
    idActo: item.idActo ?? item.id ?? null,
    nombActo: item.nombActo ?? item.nombre ?? "",
    descripcion: item.descripcion ?? "",
    costoBase: item.costoBase ?? item.precio ?? 0,
    estadoActo:
      item.estadoActo === true ||
      item.estadoActo === 1 ||
      item.estadoActo === "activo" ||
      item.estado === true ||
      item.estado === 1,
    imgActo: item.imgActo ?? item.imagen ?? ""
  };
}

// ================== RENDERIZAR TABLA ==================
function renderTabla() {
  tabla.innerHTML = "";
  const lista = actosFiltrados ?? actos;

  if (ordenActual.campo) {
    lista.sort((a, b) => {
      const campo = ordenActual.campo;
      const valorA = (a[campo] || "").toString().toLowerCase();
      const valorB = (b[campo] || "").toString().toLowerCase();
      if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
      if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
      return 0;
    });
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const actosPagina = lista.slice(inicio, fin);

  actosPagina.forEach((acto, index) => {
    const esActivo = acto.estadoActo === true;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${acto.nombActo}</td>
      <td class="col-descripcion">${acto.descripcion || "-"}</td>
      <td class="col-precio">${acto.costoBase}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verActo(${acto.idActo})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarActo(${acto.idActo})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${acto.idActo})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarActo(${acto.idActo})" title="Eliminar">
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
function agregarActo(nombre, precio, descripcion, imagen) {
  actos.push({
    id: Date.now(),
    nombActo: nombre,
    costoBase: precio,
    descripcion: descripcion,
    imgActo: imagen,
    estadoActo: true
  });
  renderTabla();
}

function editarActo(id) {
  const acto = actos.find((a) => a.idActo === id);
  if (!acto) return;
  abrirModalFormulario("editar", acto);
}

function eliminarActo(id) {
  const acto = actos.find((a) => a.idActo === id);
  if (!acto) return;
  if (!confirm(`¿Seguro que deseas eliminar el acto litúrgico "${acto.nombActo}"?`)) return;
  actos = actos.filter((a) => a.idActo !== id);
  renderTabla();
}

function darDeBaja(id) {
  const acto = actos.find((a) => a.idActo === id);
  if (!acto) return;
  acto.estadoActo = !acto.estadoActo;
  renderTabla();
}

function verActo(id) {
  const acto = actos.find((a) => a.idActo === id);
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
                <label for="modalDescripcion" class="form-label">Descripción</label>
                <textarea id="modalDescripcion" class="form-control" rows="3" required></textarea>
              </div>

              <div class="mb-3">
                <label for="modalImagen" class="form-label">URL de la imagen</label>
                <input type="text" id="modalImagen" class="form-control" placeholder="https://..." required>
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
  const inputDescripcion = document.getElementById("modalDescripcion");
  const inputImagen = document.getElementById("modalImagen");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalActo");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  modalFooter.innerHTML = "";
  inputNombre.disabled = false;
  inputPrecio.disabled = false;
  inputDescripcion.disabled = false;
  inputImagen.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar Acto Litúrgico";
    inputNombre.value = "";
    inputPrecio.value = "";
    inputDescripcion.value = "";
    inputImagen.value = "";

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarActo(inputNombre.value.trim(), parseFloat(inputPrecio.value), inputDescripcion.value.trim(), inputImagen.value.trim());
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && acto) {
    titulo.textContent = "Editar Acto Litúrgico";
    inputNombre.value = acto.nombActo;
    inputPrecio.value = acto.costoBase;
    inputDescripcion.value = acto.descripcion;
    inputImagen.value = acto.imgActo;

    modalFooter.appendChild(botonGuardar);
    form.onsubmit = (e) => {
      e.preventDefault();
      acto.nombActo = inputNombre.value.trim();
      acto.costoBase = parseFloat(inputPrecio.value);
      acto.descripcion = inputDescripcion.value.trim();
      acto.imgActo = inputImagen.value.trim();
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && acto) {
    titulo.textContent = "Detalle del Acto Litúrgico";
    inputNombre.value = acto.nombActo;
    inputPrecio.value = acto.costoBase;
    inputDescripcion.value = acto.descripcion;
    inputImagen.value = acto.imgActo;

    inputNombre.disabled = true;
    inputPrecio.disabled = true;
    inputDescripcion.disabled = true;
    inputImagen.disabled = true;

    modalFooter.appendChild(botonGuardar);
    botonGuardar.textContent = "Cerrar";
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
      : actos.filter((a) => a.nombActo.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== CARGAR ACTOS DESDE BD ==================
async function cargarActosDesdeBD() {
  try {
    const respuesta = await fetch("/api/acto_liturgico/actos");
    const data = await respuesta.json();
    if (data.success && Array.isArray(data.datos)) {
      actos = data.datos.map(normalizarActo);
      actosFiltrados = null;
      paginaActual = 1;
      renderTabla();
    } else {
      actos = [];
      renderTabla();
    }
  } catch (err) {
    console.error("Error cargando actos:", err);
  }
}
cargarActosDesdeBD();

// ================== AUTOCOMPLETADO DE BÚSQUEDA ==================
const inputBusqueda = document.getElementById("inputDocumento");
const contenedorSugerencias = document.createElement("div");
contenedorSugerencias.id = "sugerenciasContainer";
contenedorSugerencias.style.position = "absolute";
contenedorSugerencias.style.backgroundColor = "#fff";
contenedorSugerencias.style.border = "1px solid #ccc";
contenedorSugerencias.style.borderRadius = "6px";
contenedorSugerencias.style.boxShadow = "0 2px 8px rgba(0,0,0,0.15)";
contenedorSugerencias.style.zIndex = "9999";
contenedorSugerencias.style.display = "none";
contenedorSugerencias.style.maxHeight = "200px";
contenedorSugerencias.style.overflowY = "auto";
document.body.appendChild(contenedorSugerencias);

function posicionarSugerencias() {
  const rect = inputBusqueda.getBoundingClientRect();
  contenedorSugerencias.style.left = `${rect.left + window.scrollX}px`;
  contenedorSugerencias.style.top = `${rect.bottom + window.scrollY}px`;
  contenedorSugerencias.style.width = `${rect.width}px`;
}

inputBusqueda.addEventListener("input", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  contenedorSugerencias.innerHTML = "";

  if (termino.length === 0) {
    contenedorSugerencias.style.display = "none";
    return;
  }

  const sugerencias = actos.filter(a => a.nombActo.toLowerCase().startsWith(termino));

  if (sugerencias.length === 0) {
    contenedorSugerencias.style.display = "none";
    return;
  }

  sugerencias.forEach(acto => {
    const item = document.createElement("div");
    item.textContent = acto.nombActo;
    item.style.padding = "8px 10px";
    item.style.cursor = "pointer";
    item.addEventListener("mouseenter", () => item.style.background = "#f1f1f1");
    item.addEventListener("mouseleave", () => item.style.background = "#fff");
    item.addEventListener("click", () => {
      inputBusqueda.value = acto.nombActo;
      contenedorSugerencias.style.display = "none";
    });
    contenedorSugerencias.appendChild(item);
  });

  contenedorSugerencias.style.display = "block";
  posicionarSugerencias();
});

document.addEventListener("click", (e) => {
  if (!contenedorSugerencias.contains(e.target) && e.target !== inputBusqueda) {
    contenedorSugerencias.style.display = "none";
  }
});

window.addEventListener("resize", posicionarSugerencias);
window.addEventListener("scroll", posicionarSugerencias);

renderTabla();
