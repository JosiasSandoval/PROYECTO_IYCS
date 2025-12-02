const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputDocumento = document.getElementById("inputDocumento"); // Referencia global al input

// Crear modales en el DOM al iniciar
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario(); 

let documentos = [];           // Todos los documentos (memoria)
let documentosFiltrados = null; // Resultados de búsqueda
let paginaActual = 1;
const elementosPorPagina = 7;
let ordenActual = { campo: null, ascendente: true };

// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Configurar buscador predictivo
    configurarBuscadorPrincipal();
    
    // 2. Cargar datos
    cargarDocumentos();

    // 3. Eventos botones buscar/guardar
    document.getElementById("btn_buscar").addEventListener("click", filtrarDatos);
    inputDocumento.addEventListener("keyup", (e) => { if(e.key === "Enter") filtrarDatos(); });

    document.getElementById("btn_guardar").addEventListener("click", () => {
        abrirModalFormulario("agregar");
    });

    // 4. Cerrar sugerencias al hacer clic fuera
    document.addEventListener("click", (e) => {
        const lista = document.getElementById("listaBusquedaPrincipal");
        const wrapper = document.querySelector(".search-container");
        if (lista && wrapper && !wrapper.contains(e.target)) {
            lista.classList.remove("active");
        }
    });
});

/* -------------------------
   LÓGICA BUSCADOR PREDICTIVO (MODIFICADO: SOLO RELLENA)
   ------------------------- */
function configurarBuscadorPrincipal() {
    if (!inputDocumento) return;

    // Crear wrapper y lista dinámicamente para no tocar HTML manual
    const wrapper = document.createElement("div");
    wrapper.className = "search-container";
    
    inputDocumento.parentNode.insertBefore(wrapper, inputDocumento);
    wrapper.appendChild(inputDocumento);

    const lista = document.createElement("div");
    lista.id = "listaBusquedaPrincipal";
    lista.className = "dropdown-list";
    wrapper.appendChild(lista);

    const actualizarLista = () => {
        const texto = inputDocumento.value.toLowerCase().trim();
        lista.innerHTML = "";
        
        if (!documentos || documentos.length === 0) return;

        // Buscar coincidencias en memoria
        let coincidencias;
        if (!texto) {
            coincidencias = documentos; // Mostrar todos si vacío
        } else {
            coincidencias = documentos.filter(doc => 
                doc.nombre.toLowerCase().includes(texto) || 
                doc.abreviatura.toLowerCase().includes(texto)
            );
        }

        if (coincidencias.length === 0) {
            lista.classList.remove("active");
        } else {
            // Mostrar máximo 8 resultados visualmente
            coincidencias.slice(0, 8).forEach(doc => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.innerHTML = `<strong>${doc.nombre}</strong> <small class="text-muted">(${doc.abreviatura})</small>`;
                
                // --- AQUÍ ESTÁ EL CAMBIO SOLICITADO ---
                item.addEventListener("click", () => {
                    inputDocumento.value = doc.nombre; // Solo rellena el input
                    lista.classList.remove("active");  // Cierra la lista
                    // NO llamamos a filtrarDatos() aquí. El usuario debe dar clic en Buscar.
                });
                
                lista.appendChild(item);
            });
            lista.classList.add("active");
        }
    };

    inputDocumento.addEventListener("input", actualizarLista);
    inputDocumento.addEventListener("focus", actualizarLista);
}

// Función de filtrado usada por el botón LUPA y ENTER
function filtrarDatos() {
    const termino = inputDocumento.value.trim().toLowerCase();
    if (!termino) {
        documentosFiltrados = null;
    } else {
        documentosFiltrados = documentos.filter(doc => 
            doc.nombre.toLowerCase().includes(termino) ||
            doc.abreviatura.toLowerCase().includes(termino)
        );
    }
    paginaActual = 1;
    renderTabla();
}

/* -------------------------
   NORMALIZACIÓN Y API
   ------------------------- */
function normalizar(doc) {
  const id = doc.id ?? doc.idTipoDocumento ?? null;
  const nombre = doc.nombre ?? doc.nombDocumento ?? "";
  const abreviatura = doc.abreviatura ?? doc.abrev ?? "";
  let estado = false;
  if (doc.estado === 1 || doc.estado === true || doc.estado === "activo" || doc.estadoDocumento === true) {
    estado = true;
  }
  return { id, nombre, abreviatura, estado };
}

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

const cargarDocumentos = async () => {
  // Obtenemos TODOS los documentos y filtramos en cliente
  documentos = await manejarSolicitud("/api/tipoDocumento/", {}, "Error al obtener documentos")
    .then((data) => (Array.isArray(data) ? data.map(normalizar) : []));
  documentosFiltrados = null;
  paginaActual = 1;
  renderTabla();
};

function existeDocumento(nombre, abreviatura, idIgnorar = null) {
  return documentos.some(doc =>
    ((doc.nombre.toLowerCase() === nombre.toLowerCase()) ||
     (doc.abreviatura.toLowerCase() === abreviatura.toLowerCase())) &&
    doc.id !== idIgnorar
  );
}

/* -------------------------
   RENDERIZADO TABLA
   ------------------------- */
function renderTabla() {
  tabla.innerHTML = "";
  const lista = documentosFiltrados ?? documentos;

  if (lista.length === 0) {
      tabla.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay registros encontrados</td></tr>';
      paginacion.innerHTML = "";
      return;
  }

  // Ordenamiento
  if (ordenActual.campo) {
    lista.sort((a, b) => {
      const valorA = (a[ordenActual.campo] || "").toString().toLowerCase();
      const valorB = (b[ordenActual.campo] || "").toString().toLowerCase();
      if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
      if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
      return 0;
    });
  }

  // Paginación
  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const documentosPagina = lista.slice(inicio, fin);

  documentosPagina.forEach((doc, index) => {
    const esActivo = doc.estado;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const titleEstado = esActivo ? "Dar de baja" : "Dar de alta";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${escapeHtml(doc.nombre)}</td>
      <td class="col-abreviatura">${escapeHtml(doc.abreviatura)}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <!-- BOTÓN VER (AZUL) -->
          <button class="btn btn-info" onclick="verDetalle(${doc.id})" title="Ver Detalle">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning" onclick="editarDocumento(${doc.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor}" onclick="darDeBaja(${doc.id})" title="${titleEstado}">
            <img src="/static/img/flecha-hacia-abajo.png" style="${rotacion}">
          </button>
          <button class="btn btn-danger" onclick="eliminarDocumento(${doc.id})" title="Eliminar">
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

/* -------------------------
   PAGINACIÓN
   ------------------------- */
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

/* -------------------------
   ACCIONES (API)
   ------------------------- */
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
      alert(data.error || "Error al eliminar");
      return;
    }
    alert(data.mensaje || "Eliminado correctamente");
    cargarDocumentos();
  } catch (err) {
    console.error(err);
    alert("Error inesperado");
  }
};

async function darDeBaja(id) {
  try {
    const doc = documentos.find(d => d.id === id);
    if (!doc) return;
    const nuevoEstado = !doc.estado;

    const res = await fetch(`/api/tipoDocumento/cambiar_estado/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) throw new Error("Error al cambiar estado");
    
    // Actualización optimista: cambiamos en local y renderizamos
    doc.estado = nuevoEstado;
    renderTabla();

  } catch (err) {
    console.error(err);
    alert("Error al actualizar estado");
  }
}

/* -------------------------
   MODALES (HTML)
   ------------------------- */
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
          <div class="modal-body" id="modalDetalleContenido">
             <!-- Se rellena dinámicamente -->
             <div class="mb-3">
                <label class="form-label">Nombre del documento</label>
                <input type="text" id="verNombre" class="form-control" disabled>
             </div>
             <div class="mb-3">
                <label class="form-label">Abreviatura</label>
                <input type="text" id="verAbreviatura" class="form-control" disabled>
             </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn-modal btn-modal-secondary" onclick="cerrarModal('modalDetalle')">Cerrar</button>
          </div>
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
            <form id="formModalDocumento" autocomplete="off">
              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del documento <span class="text-danger">*</span></label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalAbreviatura" class="form-label">Abreviatura <span class="text-danger">*</span></label>
                <input type="text" id="modalAbreviatura" class="form-control" required>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn-modal btn-modal-secondary" onclick="cerrarModal('modalFormulario')">Cancelar</button>
                <button type="submit" class="btn-modal btn-modal-primary" id="btnGuardarModal">Guardar</button>
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

// Función unificada para manejar Agregar y Editar
function abrirModalFormulario(modo, doc = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const inputAbreviatura = document.getElementById("modalAbreviatura");
  const form = document.getElementById("formModalDocumento");

  // Resetear eventos anteriores
  form.onsubmit = null;
  form.reset();

  if (modo === "agregar") {
      titulo.textContent = "Agregar Documento";
      form.onsubmit = (e) => {
          e.preventDefault();
          const nom = inputNombre.value.trim();
          const abr = inputAbreviatura.value.trim();
          if (existeDocumento(nom, abr)) return alert("Ya existe un documento con esos datos");
          agregarDocumento(nom, abr).then(() => cerrarModal("modalFormulario"));
      };
  } else if (modo === "editar" && doc) {
      titulo.textContent = "Editar Documento";
      inputNombre.value = doc.nombre;
      inputAbreviatura.value = doc.abreviatura;
      
      form.onsubmit = (e) => {
          e.preventDefault();
          const nom = inputNombre.value.trim();
          const abr = inputAbreviatura.value.trim();
          if (existeDocumento(nom, abr, doc.id)) return alert("Ya existe otro documento con esos datos");
          actualizarDocumentoAPI(doc.id, nom, abr).then(() => cerrarModal("modalFormulario"));
      };
  }

  abrirModal("modalFormulario");
}

/* -------------------------
   HELPERS GLOBALES (Onclick en HTML)
   ------------------------- */
window.editarDocumento = function(id) {
  const doc = documentos.find(d => d.id === id);
  if (doc) abrirModalFormulario("editar", doc);
};

window.verDetalle = function(id) {
  const doc = documentos.find(d => d.id === id);
  if (doc) {
      // Usar modal específico de detalle para evitar conflictos
      document.getElementById('verNombre').value = doc.nombre;
      document.getElementById('verAbreviatura').value = doc.abreviatura;
      abrirModal("modalDetalle");
  }
};

window.darDeBaja = darDeBaja;
window.eliminarDocumento = eliminarDocumento;
window.cerrarModal = cerrarModal;

/* ==========================
   ORDENAMIENTO
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