const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputDocumento = document.getElementById("inputDocumento"); // Input de búsqueda

// Crear UN SOLO MODAL para todo (Agregar, Editar, Ver)
const modalFormulario = crearModalFormulario(); 

let parroquias = [];           
let parroquiasFiltradas = null; 
let paginaActual = 1;
const elementosPorPagina = 7;
let ordenActual = { campo: null, ascendente: true };

// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    configurarBuscadorPrincipal();
    cargarParroquias();

    document.getElementById("btn_buscar").addEventListener("click", filtrarDatos);
    inputDocumento.addEventListener("keyup", (e) => { if(e.key === "Enter") filtrarDatos(); });

    document.getElementById("btn_guardar").addEventListener("click", (e) => {
        e.preventDefault(); 
        abrirModalFormulario("agregar");
    });

    document.addEventListener("click", (e) => {
        const lista = document.getElementById("listaBusquedaPrincipal");
        const wrapper = document.querySelector(".search-container");
        if (lista && wrapper && !wrapper.contains(e.target)) {
            lista.classList.remove("active");
        }
    });
});

/* -------------------------------------------------------
   LÓGICA BUSCADOR PREDICTIVO
   ------------------------------------------------------- */
function configurarBuscadorPrincipal() {
    if (!inputDocumento) return;

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
        
        if (!parroquias || parroquias.length === 0) return;

        let coincidencias;
        if (!texto) {
            coincidencias = parroquias; 
        } else {
            coincidencias = parroquias.filter(p => 
                p.nombre.toLowerCase().startsWith(texto) || 
                (p.ruc && p.ruc.startsWith(texto))
            );
        }

        if (coincidencias.length === 0) {
            lista.classList.remove("active");
        } else {
            coincidencias.slice(0, 8).forEach(p => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.innerHTML = `${p.nombre} <small class="text-muted" style="color:#888">(${p.ruc || 'S/R'})</small>`;
                item.addEventListener("click", () => {
                    inputDocumento.value = p.nombre; 
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

function filtrarDatos() {
    const termino = inputDocumento.value.trim().toLowerCase();
    if (!termino) {
        parroquiasFiltradas = null;
    } else {
        parroquiasFiltradas = parroquias.filter(p => 
            p.nombre.toLowerCase().startsWith(termino) || 
            (p.ruc && p.ruc.startsWith(termino))
        );
    }
    paginaActual = 1;
    renderTabla();
}

/* -------------------------
   NORMALIZACIÓN Y API
   ------------------------- */
function normalizar(p) {
  // Mapeo robusto de campos de la BD a variables JS
  const id = p.id ?? p.idParroquia ?? null;
  const nombre = p.nombre ?? p.nombParroquia ?? "";
  const ruc = p.ruc ?? "";
  const direccion = p.direccion ?? "";
  const email = p.email ?? "";
  const telefono = p.telefono ?? p.telefonoContacto ?? "";
  const fecha = p.f_creacion ?? "";
  
  // Campos adicionales de la tabla completa
  const historia = p.historia ?? p.historiaParroquia ?? "";
  const descripcion = p.descripcion ?? p.descripcionBreve ?? "";
  const color = p.color ?? "#ffffff";
  const lat = p.lat ?? p.latParroquia ?? "";
  const log = p.log ?? p.logParroquia ?? "";

  let estado = false;
  if (p.estado === 1 || p.estado === true || p.estadoParroquia === true || p.estadoParroquia === 1) {
    estado = true;
  }
  // Retornamos objeto plano con TODAS las propiedades
  return { id, nombre, ruc, direccion, email, telefono, fecha, historia, descripcion, color, lat, log, estado }; 
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

const cargarParroquias = async () => {
  try {
      const data = await manejarSolicitud("/api/parroquia/", {}, "Error al obtener parroquias");
      const items = data.datos || data; 
      parroquias = Array.isArray(items) ? items.map(normalizar) : [];
      parroquiasFiltrados = null;
      paginaActual = 1;
      renderTabla();
  } catch (e) { console.error(e); }
};

/* -------------------------
   RENDERIZADO TABLA
   ------------------------- */
function renderTabla() {
  tabla.innerHTML = "";
  const lista = parroquiasFiltradas ?? parroquias;

  if (lista.length === 0) {
      tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay registros encontrados</td></tr>';
      paginacion.innerHTML = "";
      return;
  }

  if (ordenActual.campo) {
    lista.sort((a, b) => {
      const valorA = (a[ordenActual.campo] || "").toString().toLowerCase();
      const valorB = (b[ordenActual.campo] || "").toString().toLowerCase();
      if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
      if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
      return 0;
    });
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const itemsPagina = lista.slice(inicio, fin);

  itemsPagina.forEach((p, index) => {
    const esActivo = p.estado;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const titleEstado = esActivo ? "Dar de baja" : "Dar de alta";

    const fila = document.createElement("tr");
    // La tabla muestra solo lo esencial
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${p.nombre}</td>
      <td class="col-direccion">${p.direccion}</td>
      <td class="col-ruc">${p.ruc}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDetalle(${p.id})" title="Ver Detalle">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarParroquia(${p.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstado(${p.id})" title="${titleEstado}">
            <img src="/static/img/flecha-hacia-abajo.png" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarParroquia(${p.id})" title="Eliminar">
            <img src="/static/img/x.png" alt="eliminar">
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });

  renderPaginacion(lista.length);
}

const renderPaginacion = (total) => {
  paginacion.innerHTML = "";
  const totalPaginas = Math.ceil(total / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";
  const crearItem = (texto, clickFn, claseExtra = "") => {
    const li = document.createElement("li");
    li.className = `page-item ${claseExtra}`;
    li.innerHTML = `<button class="page-link">${texto}</button>`;
    if (clickFn) li.onclick = clickFn;
    return li;
  };

  ul.appendChild(crearItem("&laquo;", paginaActual > 1 ? () => { paginaActual--; renderTabla(); } : null, paginaActual === 1 ? "disabled" : ""));

  for (let i = 1; i <= totalPaginas; i++) {
      ul.appendChild(crearItem(i, () => { paginaActual = i; renderTabla(); }, i === paginaActual ? "active" : ""));
  }

  ul.appendChild(crearItem("&raquo;", paginaActual < totalPaginas ? () => { paginaActual++; renderTabla(); } : null, paginaActual === totalPaginas ? "disabled" : ""));
  paginacion.appendChild(ul);
};

/* -------------------------
   ACCIONES (API)
   ------------------------- */
const agregarParroquiaAPI = (data) => manejarSolicitud(
  "/api/parroquia/agregar", 
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
  "Error al guardar"
).then(() => cargarParroquias());

const actualizarParroquiaAPI = (id, data) => manejarSolicitud(
  `/api/parroquia/actualizar/${id}`,
  { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
  "Error al actualizar"
).then(() => cargarParroquias());

const cambiarEstado = async (id) => {
    if(!confirm("¿Seguro de cambiar el estado?")) return;
    try {
        await manejarSolicitud(`/api/parroquia/cambiar_estado/${id}`, { method: "PUT" }, "Error estado");
        cargarParroquias();
    } catch(e) {}
};

const eliminarParroquia = async (id) => {
  if (!confirm("¿Está seguro de eliminar esta parroquia?")) return;
  try {
    await manejarSolicitud(`/api/parroquia/eliminar/${id}`, { method: "DELETE" }, "Error al eliminar");
    cargarParroquias();
  } catch (err) { console.error(err); }
};

/* -------------------------
   MODAL ÚNICO PARA TODO (AGREGAR, EDITAR, VER)
   ------------------------- */
function crearModalFormulario() {
  const html = `
  <div class="modal" id="modalForm">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
            <h5 class="modal-title" id="modalTitulo"></h5>
            <button class="btn-cerrar" onclick="cerrarModal('modalForm')">&times;</button>
        </div>
        <div class="modal-body">
          <form id="formParroquia" autocomplete="off">
            
            <div class="row" style="display:flex; gap:15px; flex-wrap:wrap;">
                <div class="mb-3" style="flex:1; min-width:200px;">
                    <label class="form-label">Nombre *</label>
                    <input id="pNombre" class="form-control" required>
                </div>
                <div class="mb-3" style="flex:1; min-width:200px;">
                    <label class="form-label">RUC *</label>
                    <input id="pRuc" class="form-control" required>
                </div>
            </div>

            <div class="row" style="display:flex; gap:15px; flex-wrap:wrap;">
                <div class="mb-3" style="flex:1; min-width:200px;">
                    <label class="form-label">Dirección *</label>
                    <input id="pDireccion" class="form-control" required>
                </div>
                <div class="mb-3" style="flex:1; min-width:200px;">
                    <label class="form-label">Teléfono *</label>
                    <input id="pTelefono" class="form-control" required>
                </div>
            </div>

            <div class="row" style="display:flex; gap:15px; flex-wrap:wrap;">
                <div class="mb-3" style="flex:1; min-width:200px;">
                    <label class="form-label">Email *</label>
                    <input id="pEmail" class="form-control" type="email" required>
                </div>
                <div class="mb-3" style="flex:1; min-width:200px;">
                    <label class="form-label">Fecha Creación *</label>
                    <input id="pFecha" type="date" class="form-control" required>
                </div>
            </div>

            <div class="mb-3">
                <label class="form-label">Historia de la Parroquia</label>
                <textarea id="pHistoria" class="form-control" rows="2"></textarea>
            </div>

            <div class="mb-3">
                <label class="form-label">Descripción Breve</label>
                <textarea id="pDescripcion" class="form-control" rows="2"></textarea>
            </div>

            <div class="row" style="display:flex; gap:15px; flex-wrap:wrap;">
                 <div class="mb-3" style="flex:1; min-width:100px;">
                    <label class="form-label">Color</label>
                    <input id="pColor" type="color" class="form-control" style="height:40px; padding:2px;">
                </div>
                <div class="mb-3" style="flex:1; min-width:150px;">
                    <label class="form-label">Latitud</label>
                    <input id="pLat" class="form-control" type="number" step="any">
                </div>
                <div class="mb-3" style="flex:1; min-width:150px;">
                    <label class="form-label">Longitud</label>
                    <input id="pLog" class="form-control" type="number" step="any">
                </div>
            </div>
            
            <div class="modal-footer">
                <button type="button" class="btn-modal btn-modal-secondary" id="btnCancelar" onclick="cerrarModal('modalForm')">Cancelar</button>
                <button type="submit" class="btn-modal btn-modal-primary" id="btnGuardar">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  return document.getElementById("modalForm");
}

function cerrarModal(id) { document.getElementById(id).classList.remove('activo'); }

// Función Unificada para Abrir Modal (Agregar, Editar, Ver)
function abrirModalFormulario(modo, p = null) {
    const modal = document.getElementById("modalForm");
    const form = document.getElementById("formParroquia");
    const titulo = document.getElementById("modalTitulo");
    const btnGuardar = document.getElementById("btnGuardar");
    const btnCancelar = document.getElementById("btnCancelar");
    
    // 1. Resetear formulario y eventos
    form.reset();
    form.onsubmit = null;
    
    // 2. Configurar Inputs (Habilitar/Deshabilitar según modo)
    const inputs = form.querySelectorAll("input, textarea, select");
    const esLectura = (modo === 'ver');
    
    inputs.forEach(input => {
        input.disabled = esLectura;
    });

    // 3. Configurar Botones y Títulos
    if (esLectura) {
        titulo.textContent = "Detalle de Parroquia";
        btnGuardar.style.display = "none"; // Ocultar botón guardar
        btnCancelar.textContent = "Cerrar"; // Botón cancelar ahora dice Cerrar
        
        if(p) llenarDatosModal(p); // Llenar con datos para ver

    } else {
        btnGuardar.style.display = "inline-block";
        btnCancelar.textContent = "Cancelar";
        
        if(modo === "agregar") {
            titulo.textContent = "Nueva Parroquia";
            form.onsubmit = (e) => {
                e.preventDefault();
                const data = recolectarDatos();
                agregarParroquiaAPI(data).then(() => cerrarModal('modalForm'));
            };
        } else if (modo === "editar" && p) {
            titulo.textContent = "Editar Parroquia";
            llenarDatosModal(p);
            form.onsubmit = (e) => {
                e.preventDefault();
                const data = recolectarDatos();
                actualizarParroquiaAPI(p.id, data).then(() => cerrarModal('modalForm'));
            };
        }
    }
    
    modal.classList.add('activo');
}

function llenarDatosModal(p) {
    document.getElementById("pNombre").value = p.nombre || "";
    document.getElementById("pRuc").value = p.ruc || "";
    document.getElementById("pDireccion").value = p.direccion || "";
    document.getElementById("pTelefono").value = p.telefono || "";
    document.getElementById("pEmail").value = p.email || "";
    
    if(p.fecha) {
        let fecha = p.fecha;
        if(fecha.includes(' ')) fecha = fecha.split(' ')[0]; 
        document.getElementById("pFecha").value = fecha;
    }

    // Campos adicionales
    document.getElementById("pHistoria").value = p.historia || "";
    document.getElementById("pDescripcion").value = p.descripcion || "";
    document.getElementById("pColor").value = p.color || "#ffffff";
    document.getElementById("pLat").value = p.lat || "";
    document.getElementById("pLog").value = p.log || "";
}

function recolectarDatos() {
    return {
        nombParroquia: document.getElementById("pNombre").value,
        ruc: document.getElementById("pRuc").value,
        direccion: document.getElementById("pDireccion").value,
        telefonoContacto: document.getElementById("pTelefono").value,
        email: document.getElementById("pEmail").value,
        f_creacion: document.getElementById("pFecha").value,
        historiaParroquia: document.getElementById("pHistoria").value,
        descripcionBreve: document.getElementById("pDescripcion").value,
        color: document.getElementById("pColor").value,
        latParroquia: document.getElementById("pLat").value || null,
        logParroquia: document.getElementById("pLog").value || null
    };
}

// Helpers globales
window.editarParroquia = (id) => {
    const p = parroquias.find(x => x.id === id);
    if(p) abrirModalFormulario("editar", p);
};

window.verDetalle = (id) => {
    const p = parroquias.find(x => x.id === id);
    if(p) abrirModalFormulario("ver", p); // Ahora llama al mismo modal en modo lectura
};

window.cambiarEstado = cambiarEstado;
window.eliminarParroquia = eliminarParroquia;