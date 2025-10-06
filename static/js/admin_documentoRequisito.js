// ================== VARIABLES GLOBALES ==================
let documentos = [];
let documentosFiltrados = null;
let documentoEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Referencias a los modales
const modalDetalle = crearModalDetalle();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;

// ================== FUNCIONES ==================

// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";
  const lista = documentosFiltrados ?? documentos;

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const pagina = lista.slice(inicio, fin);

  pagina.forEach((doc, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-ruta">${doc.rutaArchivo}</td>
      <td class="col-tipoArchivo">${doc.tipoArchivo}</td>
      <td class="col-fechaSubido">${doc.fechaRegistro}</td>
      <td class="col-reserva">${doc.idReserva}</td>
      <td class="col-requisito">${doc.requisito}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDocumento(${doc.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarDocumento(${doc.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarDocumento(${doc.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil(documentos.length / elementosPorPagina);
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
  if (pagina < 1 || pagina > Math.ceil(documentos.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarDocumento(data) {
  documentos.push({
    id: Date.now(),
    ...data,
  });
  renderTabla();
}

function editarDocumento(id) {
  const doc = documentos.find((d) => d.id === id);
  if (!doc) return;
  abrirModalFormulario("editar", doc);
}

function eliminarDocumento(id) {
  const doc = documentos.find((d) => d.id === id);
  if (!doc) return;
  if (!confirm(`¿Seguro que deseas eliminar el documento "${doc.rutaArchivo}"?`)) return;
  documentos = documentos.filter((d) => d.id !== id);
  renderTabla();
}

function verDocumento(id) {
  const doc = documentos.find((d) => d.id === id);
  if (!doc) return;
  abrirModalFormulario("ver", doc);
}

// ================== MODALES ==================
function crearModalDetalle() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Documento</h5>
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
            <form id="formModalDocumento">
              <div class="mb-3">
                <label for="modalRuta" class="form-label">Ruta del archivo</label>
                <input type="text" id="modalRuta" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalTipo" class="form-label">Tipo de archivo</label>
                <input type="text" id="modalTipo" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalFecha" class="form-label">Fecha de registro</label>
                <input type="date" id="modalFecha" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalReserva" class="form-label">ID de reserva</label>
                <input type="text" id="modalReserva" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalRequisito" class="form-label">Requisito</label>
                <input type="text" id="modalRequisito" class="form-control" required>
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

function abrirModalFormulario(modo, doc = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const form = document.getElementById("formModalDocumento");

  const ruta = document.getElementById("modalRuta");
  const tipo = document.getElementById("modalTipo");
  const fecha = document.getElementById("modalFecha");
  const reserva = document.getElementById("modalReserva");
  const requisito = document.getElementById("modalRequisito");

  [ruta, tipo, fecha, reserva, requisito].forEach((i) => (i.disabled = false));

  if (modo === "agregar") {
    titulo.textContent = "Agregar Documento";
    form.reset();
    form.onsubmit = (e) => {
      e.preventDefault();
      agregarDocumento({
        rutaArchivo: ruta.value.trim(),
        tipoArchivo: tipo.value.trim(),
        fechaRegistro: fecha.value,
        idReserva: reserva.value.trim(),
        requisito: requisito.value.trim(),
      });
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && doc) {
    titulo.textContent = "Editar Documento";
    ruta.value = doc.rutaArchivo;
    tipo.value = doc.tipoArchivo;
    fecha.value = doc.fechaRegistro;
    reserva.value = doc.idReserva;
    requisito.value = doc.requisito;

    form.onsubmit = (e) => {
      e.preventDefault();
      Object.assign(doc, {
        rutaArchivo: ruta.value.trim(),
        tipoArchivo: tipo.value.trim(),
        fechaRegistro: fecha.value,
        idReserva: reserva.value.trim(),
        requisito: requisito.value.trim(),
      });
      cerrarModal("modalFormulario");
      renderTabla();
    };
  } else if (modo === "ver" && doc) {
    titulo.textContent = "Detalle del Documento";
    ruta.value = doc.rutaArchivo;
    tipo.value = doc.tipoArchivo;
    fecha.value = doc.fechaRegistro;
    reserva.value = doc.idReserva;
    requisito.value = doc.requisito;
    [ruta, tipo, fecha, reserva, requisito].forEach((i) => (i.disabled = true));
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
  documentosFiltrados = termino === "" ? null : documentos.filter((d) => d.rutaArchivo.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
documentos = [
  {
    id: 1,
    rutaArchivo: "archivos/certificado_bautismo.pdf",
    tipoArchivo: "PDF",
    fechaRegistro: "2025-09-28",
    idReserva: "R001",
    requisito: "Certificado de Bautismo",
  },
  {
    id: 2,
    rutaArchivo: "archivos/constancia_matrimonio.docx",
    tipoArchivo: "DOCX",
    fechaRegistro: "2025-09-30",
    idReserva: "R002",
    requisito: "Constancia de Matrimonio",
  },
];

renderTabla();
