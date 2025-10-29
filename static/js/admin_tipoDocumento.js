const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

const modalDetalle = crearModal();            // crea y añade modal detalle al DOM (igual diseño)
const modalFormulario = crearModalFormulario(); // crea y añade modal formulario al DOM (igual diseño)

let documentos = [];           // se llenará desde la API
let documentosFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

/* -------------------------
   Normalizar un documento (soporta distintos formatos de API)
   ------------------------- */
function normalizar(doc) {
  const id = doc.id ?? doc.idTipoDocumento ?? doc.id_tipo_documento ?? null;
  const nombre = doc.nombre ?? doc.nombDocumento ?? doc.nomb_documento ?? "";
  const abreviatura = doc.abreviatura ?? doc.abrev ?? "";

  let estado = false;

  // Detecta correctamente: 1, "1", true, "activo"
  if (doc.estado === 1 || doc.estado === "1" || doc.estado === true || doc.estado === "activo" || doc.estadoDocumento === true || doc.estadoDocumento === 1) {
    estado = true;
  }

  return { id, nombre, abreviatura, estado };
}

// Función genérica para manejar solicitudes a la API
const manejarSolicitud = async (url, opciones, mensajeError) => {
  try {
    const res = await fetch(url, opciones);
    if (!res.ok) throw new Error(mensajeError);
    return await res.json();
  } catch (err) {
    console.error(mensajeError, err);
    alert(mensajeError);
    throw err;
  }
};

/* ==========================
   CARGAR DOCUMENTOS DESDE API
   ========================== */
const cargarDocumentos = async () => {
  documentos = await manejarSolicitud(
    "/api/tipoDocumento/",
    {},
    "Error al obtener documentos"
  ).then((data) => (Array.isArray(data) ? data.map(normalizar) : []));
  documentosFiltrados = null;
  paginaActual = 1;
  renderTabla();
};

/* ==========================
   EXISTE DOCUMENTO (misma lógica que tenías)
   ========================== */
function existeDocumento(nombre, abreviatura, idIgnorar = null) {
  return documentos.some(doc =>
    ((doc.nombre.toLowerCase() === nombre.toLowerCase()) ||
     (doc.abreviatura.toLowerCase() === abreviatura.toLowerCase())) &&
    doc.id !== idIgnorar
  );
}

/* ==========================
   RENDER TABLA (IDÉNTICO VISUAL)
   ========================== */
function renderTabla() {
  tabla.innerHTML = "";

  const lista = documentosFiltrados ?? documentos;

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
  const documentosPagina = lista.slice(inicio, fin);

  documentosPagina.forEach((doc, index) => {
    const esActivo = doc.estado === true || doc.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${escapeHtml(doc.nombre)}</td>
      <td class="col-abreviatura">${escapeHtml(doc.abreviatura)}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDetalle(${doc.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarDocumento(${doc.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${doc.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
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

const escapeHtml = (text) => String(text || "").replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));

/* ==========================
   PAGINACIÓN (idéntica)
   ========================== */
const renderPaginacion = () => {
  paginacion.innerHTML = "";
  const total = (documentosFiltrados ?? documentos).length;
  const totalPaginas = Math.ceil(total / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";

  const crearItem = (numero, activo, disabled, texto) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${numero})">${texto || numero}</button>`;
    return li;
  };

  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));

  const range = [Math.max(1, paginaActual - 2), Math.min(totalPaginas, paginaActual + 2)];
  if (range[0] > 1) {
    ul.appendChild(crearItem(1, paginaActual === 1));
    if (range[0] > 2) ul.appendChild(crearItem(null, false, true, "..."));
  }

  for (let i = range[0]; i <= range[1]; i++) ul.appendChild(crearItem(i, paginaActual === i));

  if (range[1] < totalPaginas) {
    if (range[1] < totalPaginas - 1) ul.appendChild(crearItem(null, false, true, "..."));
    ul.appendChild(crearItem(totalPaginas, paginaActual === totalPaginas));
  }

  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
};

function cambiarPagina(pagina) {
  const total = Math.ceil((documentosFiltrados ?? documentos).length / elementosPorPagina);
  if (pagina < 1 || pagina > total) return;
  paginaActual = pagina;
  renderTabla();
}

/* ==========================
   ACCIONES: agregar, editar, eliminar, estado
   (llaman a la API y luego recargan)
   ========================== */
const agregarDocumento = (nombre, abreviatura) => manejarSolicitud(
  "/api/tipoDocumento/agregar",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, abreviatura }),
  },
  "Error al agregar documento"
).then(() => cargarDocumentos());

const actualizarDocumentoAPI = (id, nombre, abreviatura) => manejarSolicitud(
  `/api/tipoDocumento/actualizar/${id}`,
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, abreviatura }),
  },
  "Error al actualizar documento"
).then(() => cargarDocumentos());

const eliminarDocumento = async (id) => {
  if (!confirm("¿Está seguro de eliminar este documento?")) return;
  try {
    const res = await fetch(`/api/tipoDocumento/eliminar/${id}`, { method: "DELETE" });
    const data = await res.json();

    if (!res.ok) {
      // Mostrar mensaje de error específico del servidor
      alert(data.error || "Error al eliminar el documento");
      return;
    }

    alert(data.mensaje || "Documento eliminado correctamente");
    cargarDocumentos();
  } catch (err) {
    console.error("Error al eliminar documento", err);
    alert("Error inesperado al eliminar el documento");
  }
};

/* ==========================
   CAMBIO DE ESTADO (optimizado)
   ========================== */
async function darDeBaja(id) {
  try {
    // Buscar el documento actual
    const doc = documentos.find(d => d.id === id);
    if (!doc) return alert("Documento no encontrado");

    // Determinar el nuevo estado (toggle)
    const nuevoEstado = doc.estado === true || doc.estado === "activo" ? false : true;

    // Llamar a la API
    const res = await fetch(`/api/tipoDocumento/cambiar_estado/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) throw new Error("Error al cambiar estado");
    const data = await res.json();

    // Actualizar estado local
    doc.estado = data.nuevo_estado === true || nuevoEstado === true;

    // Actualizar visualmente la fila sin recargar toda la tabla
    const fila = [...tabla.querySelectorAll("tr")].find(tr => tr.innerText.includes(doc.nombre));
    if (fila) {
      const btn = fila.querySelector(".btn-orange, .btn-success");
      const img = btn.querySelector("img");

      if (doc.estado) {
        btn.classList.remove("btn-success");
        btn.classList.add("btn-orange");
        btn.title = "Dar de baja";
        img.style.transform = "";
      } else {
        btn.classList.remove("btn-orange");
        btn.classList.add("btn-success");
        btn.title = "Dar de alta";
        img.style.transform = "rotate(180deg)";
      }
    }

  } catch (err) {
    console.error(err);
    alert("Error al actualizar estado");
  }
}

/* ==========================
   BÚSQUEDA
   ========================== */
const inputDocumento = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");
btnBuscar.addEventListener("click", async () => {
  const termino = inputDocumento.value.trim();
  if (termino === "") {
    documentosFiltrados = null;
    paginaActual = 1;
    renderTabla();
    return;
  }
  try {
    const res = await fetch(`/api/tipoDocumento/busqueda_documento/${encodeURIComponent(termino)}`);
    if (res.status === 404) {
      documentosFiltrados = [];
      renderTabla();
      return;
    }
    if (!res.ok) throw new Error("Error en búsqueda");
    const data = await res.json();
    documentosFiltrados = Array.isArray(data) ? data.map(normalizar) : [normalizar(data)];
    paginaActual = 1;
    renderTabla();
  } catch (err) {
    console.error(err);
    alert("Error al buscar documento");
  }
});

/* ==========================
   MODALES: crearModal() y crearModalFormulario()
   (USAN EXACTAMENTE TU MARKUP ORIGINAL)
   ========================== */
function crearModal() {
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
            <form id="formModalDocumento">
              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del documento</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalAbreviatura" class="form-label">Abreviatura</label>
                <input type="text" id="modalAbreviatura" class="form-control" required>
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

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('activo');
}

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('activo');
}

/* ==========================
   abrirModalFormulario: maneja modos agregar/editar/ver (igual UI)
   ========================== */
function abrirModalFormulario(modo, doc = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const inputAbreviatura = document.getElementById("modalAbreviatura");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalDocumento");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  // --- INICIO DE LA SOLUCIÓN ---
// 1. Limpia cualquier evento de envío que el formulario tuviera antes.
form.onsubmit = null;

// 2. Limpia cualquier evento de clic que el botón tuviera antes.
botonGuardar.onclick = null;
// --- FIN DE LA SOLUCIÓN ---

  // reset footer (mantener boton)
  modalFooter.innerHTML = "";
  botonGuardar.textContent = "Aceptar";
  botonGuardar.type = "submit";
  botonGuardar.classList.remove("d-none");
  modalFooter.appendChild(botonGuardar);

  inputNombre.disabled = false;
  inputAbreviatura.disabled = false;

if (modo === "agregar") {
  titulo.textContent = "Agregar Documento";
  inputNombre.value = "";
  inputAbreviatura.value = "";

  form.onsubmit = function (e) {
    e.preventDefault();
    const nombre = inputNombre.value.trim();
    const abreviatura = inputAbreviatura.value.trim();
    if (!nombre || !abreviatura) return alert("Complete todos los campos");
    if (existeDocumento(nombre, abreviatura)) return alert("Ya existe un documento con ese nombre o abreviatura");
    agregarDocumento(nombre, abreviatura)
      .then(() => cerrarModal("modalFormulario"));
  };

  // 👉 Esta línea faltaba
  abrirModal("modalFormulario");
} else if (modo === "editar" && doc) {
    titulo.textContent = "Editar Documento";
    inputNombre.value = doc.nombre;
    inputAbreviatura.value = doc.abreviatura;

    form.onsubmit = function (e) {
      e.preventDefault();
      const nombre = inputNombre.value.trim();
      const abreviatura = inputAbreviatura.value.trim();
      if (!nombre || !abreviatura) return alert("Complete todos los campos");
      if (existeDocumento(nombre, abreviatura, doc.id)) return alert("Ya existe un documento con ese nombre o abreviatura");

      actualizarDocumentoAPI(doc.id, nombre, abreviatura)
        .then(() => cerrarModal("modalFormulario"));
    };
  } else  if (modo === "ver" && doc) {
    titulo.textContent = "Detalle del Documento";
    inputNombre.value = doc.nombre;
    inputAbreviatura.value = doc.abreviatura;
    inputNombre.disabled = true;
    inputAbreviatura.disabled = true;

    // Asegúrate de que el botón "Aceptar" solo cierre el modal
    botonGuardar.onclick = function (e) {
      e.preventDefault(); // Evitar cualquier acción predeterminada
      cerrarModal("modalFormulario");
    };
  }

  abrirModal("modalFormulario");
}

/* ==========================
   funciones usadas por botones (mantengo nombres)
   ========================== */
function editarDocumento(id) {
  const doc = documentos.find(d => d.id === id);
  if (!doc) return;
  abrirModalFormulario("editar", doc);
}

function verDetalle(id) {
  const doc = documentos.find(d => d.id === id);
  if (!doc) return;
  abrirModalFormulario("ver", doc);
  renderTabla();
}

/* ==========================
   ORDENAMIENTO (igual)
   ========================== */
document.querySelectorAll("#tablaDocumentos thead th").forEach((th, index) => {
  th.style.cursor = "pointer";
  th.addEventListener("click", () => {
    let campo;
    if (index === 1) campo = "nombre";
    else if (index === 2) campo = "abreviatura";
    else return;

    if (ordenActual.campo === campo) {
      ordenActual.ascendente = !ordenActual.ascendente;
    } else {
      ordenActual.campo = campo;
      ordenActual.ascendente = true;
    }
    renderTabla();
  });
});

/* ==========================
   INICIALIZAR
   ========================== */
cargarDocumentos();

document.getElementById("btn_guardar").addEventListener("click", () => {
  abrirModalFormulario("agregar");
});
