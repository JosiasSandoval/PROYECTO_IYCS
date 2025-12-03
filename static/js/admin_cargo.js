const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputDocumento = document.getElementById("inputDocumento"); // Input de búsqueda

// Crear modales al inicio
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario(); 

let cargos = [];           // Todos los cargos
let cargosFiltrados = null; // Resultados de búsqueda
let paginaActual = 1;
const elementosPorPagina = 7;
let ordenActual = { campo: null, ascendente: true };

// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Configurar buscador predictivo
    configurarBuscadorPrincipal();
    
    // 2. Cargar datos
    cargarCargos();

    // 3. Eventos botones
    document.getElementById("btn_buscar").addEventListener("click", filtrarDatos);
    inputDocumento.addEventListener("keyup", (e) => { if(e.key === "Enter") filtrarDatos(); });

    document.getElementById("btn_guardar").addEventListener("click", (e) => {
        e.preventDefault(); 
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
   LÓGICA BUSCADOR PREDICTIVO (CORREGIDO: STARTSWITH)
   ------------------------- */
function configurarBuscadorPrincipal() {
    if (!inputDocumento) return;

    // Crear wrapper y lista dinámicamente
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
        
        if (!cargos || cargos.length === 0) return;

        let coincidencias;
        if (!texto) {
            coincidencias = cargos; // Mostrar todos si vacío
        } else {
            // CORRECCIÓN AQUÍ: Usamos startsWith en lugar de includes
            coincidencias = cargos.filter(doc => 
                doc.nombre.toLowerCase().startsWith(texto)
            );
        }

        if (coincidencias.length === 0) {
            lista.classList.remove("active");
        } else {
            // Mostrar máximo 8 resultados
            coincidencias.slice(0, 8).forEach(doc => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.textContent = doc.nombre;
                
                item.addEventListener("click", () => {
                    inputDocumento.value = doc.nombre; 
                    lista.classList.remove("active");  
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
        cargosFiltrados = null;
    } else {
        // CORRECCIÓN AQUÍ TAMBIÉN: Para que la tabla coincida con la búsqueda
        cargosFiltrados = cargos.filter(doc => 
            doc.nombre.toLowerCase().startsWith(termino)
        );
    }
    paginaActual = 1;
    renderTabla();
}

/* -------------------------
   NORMALIZACIÓN Y API
   ------------------------- */
function normalizar(doc) {
  const id = doc.id ?? doc.idCargo ?? doc.id_cargo ?? null;
  const nombre = doc.nombre ?? doc.nombCargo ?? doc.nomb_cargo ?? "";
  let estado = false;
  const valorEstado = doc.estadoCargo ?? doc.estado;
  if (valorEstado === 1 || valorEstado === true || valorEstado === "1" || valorEstado === "true") {
    estado = true;
  }
  return { id, nombre, estado };
}

const manejarSolicitud = async (url, opciones = {}, mensajeError = "Error") => {
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

const cargarCargos = async () => {
  try {
      const data = await manejarSolicitud("/api/cargo/", {}, "Error al obtener cargos");
      cargos = Array.isArray(data) ? data.map(normalizar) : [];
      cargosFiltrados = null;
      paginaActual = 1;
      renderTabla();
  } catch (e) { console.error(e); }
};

function existeCargo(nombre, idIgnorar = null) {
  return cargos.some(doc =>
    doc.nombre.toLowerCase() === nombre.toLowerCase() && doc.id !== idIgnorar
  );
}

/* -------------------------
   RENDERIZADO TABLA
   ------------------------- */
function renderTabla() {
  tabla.innerHTML = "";
  const lista = cargosFiltrados ?? cargos;

  if (lista.length === 0) {
      tabla.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay registros encontrados</td></tr>';
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
  const paginaItems = lista.slice(inicio, fin);

  paginaItems.forEach((doc, index) => {
    const esActivo = doc.estado;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const titleEstado = esActivo ? "Dar de baja" : "Dar de alta";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${escapeHtml(doc.nombre)}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDetalle(${doc.id})" title="Ver Detalle">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarCargo(${doc.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${doc.id})" title="${titleEstado}">
            <img src="/static/img/flecha-hacia-abajo.png" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarCargo(${doc.id})" title="Eliminar">
            <img src="/static/img/x.png" alt="eliminar">
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });

  renderPaginacion();
}

const escapeHtml = text => String(text || "").replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));

/* -------------------------
   PAGINACIÓN
   ------------------------- */
const renderPaginacion = () => {
  paginacion.innerHTML = "";
  const total = (cargosFiltrados ?? cargos).length;
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
  const total = Math.ceil((cargosFiltrados ?? cargos).length / elementosPorPagina);
  if (pagina < 1 || pagina > total) return;
  paginaActual = pagina;
  renderTabla();
}

/* -------------------------
   ACCIONES (API)
   ------------------------- */
const agregarCargo = nombre => manejarSolicitud(
  "/api/cargo/agregar",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombCargo: nombre }),
  },
  "Error al agregar cargo"
).then(() => cargarCargos());

const actualizarCargoAPI = (id, nombre) => manejarSolicitud(
  `/api/cargo/actualizar/${id}`,
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombCargo: nombre }),
  },
  "Error al actualizar cargo"
).then(() => cargarCargos());

const eliminarCargo = async id => {
  if (!confirm("¿Está seguro de eliminar este cargo?")) return;
  try {
    const res = await fetch(`/api/cargo/eliminar/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Error al eliminar el cargo");
    else alert(data.mensaje || "Cargo eliminado correctamente");
    cargarCargos();
  } catch (err) {
    console.error("Error al eliminar cargo", err);
    alert("Error inesperado al eliminar el cargo");
  }
};

async function darDeBaja(id) {
  try {
    const doc = cargos.find(d => d.id === id);
    if (!doc) return alert("Cargo no encontrado");
    
    const nuevoEstado = !doc.estado;
    const res = await fetch(`/api/cargo/cambiar_estado/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });

    if (!res.ok) throw new Error("Error al cambiar estado");
    
    // Actualización optimista
    doc.estado = nuevoEstado;
    renderTabla();

  } catch (err) {
    console.error(err);
    alert("Error al actualizar estado");
  }
}

/* -------------------------
   MODALES (HTML + Lógica)
   ------------------------- */
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
          <div class="modal-body" id="modalDetalleContenido">
             <div class="mb-3">
                <label class="form-label">Nombre del cargo</label>
                <input type="text" id="verNombre" class="form-control" disabled>
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
                <label for="modalNombre" class="form-label">Nombre del cargo <span class="text-danger">*</span></label>
                <input type="text" id="modalNombre" class="form-control" required>
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

// Función unificada para manejar Agregar, Editar y Ver
function abrirModalFormulario(modo, doc = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const botonGuardar = document.getElementById("btnGuardarModal");
  const form = document.getElementById("formModalDocumento");

  // Resetear
  form.onsubmit = null;
  form.reset();
  
  // Configurar estado inputs
  const esLectura = (modo === "ver");
  inputNombre.disabled = esLectura;

  if (esLectura) {
      botonGuardar.style.display = "none";
      titulo.textContent = "Detalle del Cargo";
      if (doc) inputNombre.value = doc.nombre;
  } else {
      botonGuardar.style.display = "inline-block";
      botonGuardar.textContent = "Guardar";
      
      if (modo === "agregar") {
          titulo.textContent = "Agregar Cargo";
          form.onsubmit = (e) => {
              e.preventDefault();
              const nom = inputNombre.value.trim();
              if (!nom) return alert("Complete el nombre");
              if (existeCargo(nom)) return alert("Ya existe un cargo con ese nombre");
              agregarCargo(nom).then(() => cerrarModal("modalFormulario"));
          };
      } else if (modo === "editar" && doc) {
          titulo.textContent = "Editar Cargo";
          inputNombre.value = doc.nombre;
          
          form.onsubmit = (e) => {
              e.preventDefault();
              const nom = inputNombre.value.trim();
              if (!nom) return alert("Complete el nombre");
              if (existeCargo(nom, doc.id)) return alert("Ya existe otro cargo con ese nombre");
              actualizarCargoAPI(doc.id, nom).then(() => cerrarModal("modalFormulario"));
          };
      }
  }

  abrirModal("modalFormulario");
}

/* -------------------------
   HELPERS GLOBALES (Onclick en HTML)
   ------------------------- */
window.editarCargo = function(id) {
  const doc = cargos.find(d => d.id === id);
  if (doc) abrirModalFormulario("editar", doc);
};

window.verDetalle = function(id) {
  const doc = cargos.find(d => d.id === id);
  if (doc) abrirModalFormulario("ver", doc);
};

window.darDeBaja = darDeBaja;
window.eliminarCargo = eliminarCargo;
window.cerrarModal = cerrarModal;

/* ==========================
   ORDENAMIENTO
   ========================== */
document.querySelectorAll("#tablaDocumentos thead th").forEach((th, index) => {
  th.style.cursor = "pointer";
  th.addEventListener("click", () => {
    let campo;
    if (index === 1) campo = "nombre";
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