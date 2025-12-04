// =======================================================
// VARIABLES GLOBALES (Solo estado, no elementos DOM)
// =======================================================
let parroquias = [];           
let parroquiasFiltradas = null; 
let paginaActual = 1;
const elementosPorPagina = 7;
let ordenActual = { campo: null, ascendente: true };
let esAdminGlobal = false;  
let idParroquiaUsuario = null;

// Variables para elementos del DOM (se llenan al cargar)
let tabla, paginacion, inputDocumento, modalFormulario;

// =======================================================
// INICIALIZACIÓN (DOMContentLoaded)
// =======================================================
document.addEventListener("DOMContentLoaded", async () => {
    console.log("🚀 Iniciando administrador de parroquias...");

    // 1. Referencias al DOM (Ahora es seguro hacerlo)
    tabla = document.querySelector("#tablaDocumentos tbody");
    paginacion = document.getElementById("paginacionContainer");
    inputDocumento = document.getElementById("inputDocumento");

    // 2. Inyectar el Modal en el HTML
    modalFormulario = crearModalFormulario(); 

    // 3. Detectar Permisos
    await detectarTipoAdmin();
    
    // 4. Configurar Buscador y Cargar Datos
    configurarBuscadorPrincipal();
    cargarParroquias();

    // 5. Eventos Generales
    document.getElementById("btn_buscar")?.addEventListener("click", filtrarDatos);
    inputDocumento?.addEventListener("keyup", (e) => { if(e.key === "Enter") filtrarDatos(); });

    // 6. Botón "Nuevo" (Solo Admin Global)
    const btnGuardarMain = document.getElementById("btn_guardar"); // El botón verde de la tabla
    if (esAdminGlobal) {
        if (btnGuardarMain) {
            btnGuardarMain.addEventListener("click", (e) => {
                e.preventDefault(); 
                abrirModalFormulario("agregar");
            });
        }
    } else {
        if (btnGuardarMain) btnGuardarMain.style.display = 'none';
    }

    // Cerrar lista de búsqueda al hacer clic fuera
    document.addEventListener("click", (e) => {
        const lista = document.getElementById("listaBusquedaPrincipal");
        const wrapper = document.querySelector(".search-container");
        if (lista && wrapper && !wrapper.contains(e.target)) {
            lista.classList.remove("active");
        }
    });
});

/* -------------------------------------------------------
   LÓGICA DEL FORMULARIO Y GUARDADO (CRÍTICO)
   ------------------------------------------------------- */
function recolectarDatos() {
    // Obtenemos valores
    const lat = document.getElementById("pLat").value;
    const log = document.getElementById("pLog").value;
    const nombre = document.getElementById("pNombre").value;
    const email = document.getElementById("pEmail").value;

    // Validación básica antes de enviar
    if(!nombre || !email) {
        alert("El nombre y el email son obligatorios.");
        return null;
    }

    const datos = {
        nombParroquia: nombre,
        ruc: document.getElementById("pRuc").value,
        direccion: document.getElementById("pDireccion").value,
        telefonoContacto: document.getElementById("pTelefono").value,
        email: email,
        f_creacion: document.getElementById("pFecha").value,
        historiaParroquia: document.getElementById("pHistoria").value,
        descripcionBreve: document.getElementById("pDescripcion").value,
        color: document.getElementById("pColor").value,
        // Convertir a float o null para que el backend lo reciba limpio
        latParroquia: lat ? parseFloat(lat) : null,
        logParroquia: log ? parseFloat(log) : null
    };

    console.log("📦 Datos recolectados para enviar:", datos);
    return datos;
}

// Función Unificada para Abrir Modal
function abrirModalFormulario(modo, p = null) {
    const modal = document.getElementById("modalForm");
    const form = document.getElementById("formParroquia");
    const titulo = document.getElementById("modalTitulo");
    const btnGuardarModal = document.getElementById("btnGuardarModal"); // ID único para el botón del modal
    const btnCancelar = document.getElementById("btnCancelar");
    
    // Resetear
    form.reset();
    
    // Habilitar/Deshabilitar según modo
    const inputs = form.querySelectorAll("input, textarea, select");
    const esLectura = (modo === 'ver');
    inputs.forEach(input => input.disabled = esLectura);

    if (esLectura) {
        titulo.textContent = "Detalle de Parroquia";
        btnGuardarModal.style.display = "none";
        btnCancelar.textContent = "Cerrar";
        if(p) llenarDatosModal(p);
    } else {
        btnGuardarModal.style.display = "inline-block";
        btnCancelar.textContent = "Cancelar";
        
        // Clonamos el botón para eliminar event listeners viejos (truco para evitar envíos dobles)
        const newBtn = btnGuardarModal.cloneNode(true);
        btnGuardarModal.parentNode.replaceChild(newBtn, btnGuardarModal);
        
        if(modo === "agregar") {
            titulo.textContent = "Nueva Parroquia";
            // Asignar evento al nuevo botón
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const data = recolectarDatos();
                if(data) agregarParroquiaAPI(data).then(() => cerrarModal('modalForm'));
            });
        } else if (modo === "editar" && p) {
            titulo.textContent = "Editar Parroquia";
            llenarDatosModal(p);
            newBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const data = recolectarDatos();
                if(data) actualizarParroquiaAPI(p.id, data).then(() => cerrarModal('modalForm'));
            });
        }
    }
    
    modal.classList.add('activo');
}

/* -------------------------------------------------------
   DETECTAR TIPO DE ADMINISTRADOR
   ------------------------------------------------------- */
async function detectarTipoAdmin() {
    try {
        const res = await fetch('/api/auth/get_session_data');
        const data = await res.json();
        
        esAdminGlobal = data.es_admin_global || false;
        idParroquiaUsuario = data.idParroquia;
        
        console.log('🔑 Tipo Admin:', esAdminGlobal ? 'GLOBAL' : 'LOCAL');
        mostrarBadgeAdmin();
    } catch (error) {
        console.error('Error detectando tipo admin:', error);
        esAdminGlobal = false;
    }
}

function mostrarBadgeAdmin() {
    const titulo = document.querySelector('.titulo-seccion');
    if (!titulo) return;
    
    // Evitar duplicados si se llama varias veces
    const existingBadge = titulo.querySelector('.admin-badge');
    if(existingBadge) existingBadge.remove();

    const badge = document.createElement('span');
    badge.className = 'admin-badge';
    badge.style.cssText = 'margin-left:15px; padding:6px 12px; border-radius:4px; font-size:12px; font-weight:bold;';
    
    if (esAdminGlobal) {
        badge.textContent = '🌐 Global';
        badge.style.background = '#28a745';
        badge.style.color = '#fff';
    } else {
        badge.textContent = '📍 Local';
        badge.style.background = '#ffc107';
        badge.style.color = '#000';
    }
    titulo.appendChild(badge);
}

/* -------------------------
   API HANDLERS
   ------------------------- */
const manejarSolicitud = async (url, opciones = {}, mensajeError = "Error") => {
  try {
    const res = await fetch(url, opciones);
    const data = await res.json(); // Leemos JSON primero para ver errores del backend
    if (!res.ok || data.ok === false) {
        throw new Error(data.mensaje || mensajeError);
    }
    return data;
  } catch (err) {
    console.error(mensajeError, err);
    alert(err.message); // Mostrar el mensaje que manda el Python
    throw err;
  }
};

const cargarParroquias = async () => {
  try {
      const data = await manejarSolicitud("/api/parroquia/", {}, "Error al obtener parroquias");
      const items = data.datos || data; 
      parroquias = Array.isArray(items) ? items.map(normalizar) : [];
      parroquiasFiltradas = null;
      paginaActual = 1;
      renderTabla();
  } catch (e) { console.error(e); }
};

const agregarParroquiaAPI = (data) => manejarSolicitud(
  "/api/parroquia/agregar", 
  { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
  "Error al guardar la parroquia"
).then(() => {
    alert("✅ Parroquia guardada correctamente");
    cargarParroquias();
});

const actualizarParroquiaAPI = (id, data) => manejarSolicitud(
  `/api/parroquia/actualizar/${id}`,
  { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) },
  "Error al actualizar"
).then(() => {
    alert("✅ Parroquia actualizada correctamente");
    cargarParroquias();
});

const eliminarParroquia = async (id) => {
  if (!confirm("¿Está seguro de eliminar esta parroquia?")) return;
  try {
    await manejarSolicitud(`/api/parroquia/eliminar/${id}`, { method: "DELETE" }, "Error al eliminar");
    cargarParroquias();
  } catch (err) { console.error(err); }
};

const cambiarEstado = async (id) => {
    if(!confirm("¿Seguro de cambiar el estado?")) return;
    try {
        await manejarSolicitud(`/api/parroquia/cambiar_estado/${id}`, { method: "PUT" }, "Error estado");
        cargarParroquias();
    } catch(e) {}
};

/* -------------------------
   RENDERIZADO Y NORMALIZACIÓN
   ------------------------- */
function normalizar(p) {
  const id = p.id ?? p.idParroquia ?? null;
  const nombre = p.nombre ?? p.nombParroquia ?? "";
  const ruc = p.ruc ?? "";
  const direccion = p.direccion ?? "";
  const email = p.email ?? "";
  const telefono = p.telefono ?? p.telefonoContacto ?? "";
  const fecha = p.f_creacion ?? "";
  
  const historia = p.historia ?? p.historiaParroquia ?? "";
  const descripcion = p.descripcion ?? p.descripcionBreve ?? "";
  const color = p.color ?? "#ffffff";
  const lat = p.lat ?? p.latParroquia ?? "";
  const log = p.log ?? p.logParroquia ?? "";

  let estado = false;
  if (p.estado === 1 || p.estado === true || p.estadoParroquia === true || p.estadoParroquia === 1) {
    estado = true;
  }
  return { id, nombre, ruc, direccion, email, telefono, fecha, historia, descripcion, color, lat, log, estado }; 
}

function renderTabla() {
  tabla.innerHTML = "";
  const lista = parroquiasFiltradas ?? parroquias;

  if (lista.length === 0) {
      tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay registros encontrados</td></tr>';
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
  const itemsPagina = lista.slice(inicio, fin);

  itemsPagina.forEach((p, index) => {
    const esActivo = p.estado;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const titleEstado = esActivo ? "Dar de baja" : "Dar de alta";
    
    // Resaltar para admin local
    const estuParroquia = !esAdminGlobal && p.id === idParroquiaUsuario;
    const estiloFila = estuParroquia ? 'background-color: #fff3cd;' : '';

    const fila = document.createElement("tr");
    fila.style.cssText = estiloFila;
    
    let botonesAccion = `
      <button class="btn btn-info btn-sm" onclick="verDetalle(${p.id})" title="Ver Detalle">
        <img src="/static/img/ojo.png" alt="ver">
      </button>
    `;
    
    if (esAdminGlobal) {
      botonesAccion += `
        <button class="btn btn-warning btn-sm" onclick="editarParroquia(${p.id})" title="Editar">
          <img src="/static/img/lapiz.png" alt="editar">
        </button>
        <button class="btn ${botonColor} btn-sm" onclick="cambiarEstado(${p.id})" title="${titleEstado}">
          <img src="/static/img/flecha-hacia-abajo.png" style="${rotacion}">
        </button>
        <button class="btn btn-danger btn-sm" onclick="eliminarParroquia(${p.id})" title="Eliminar">
          <img src="/static/img/x.png" alt="eliminar">
        </button>
      `;
    }
    
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${p.nombre}</td>
      <td class="col-direccion">${p.direccion}</td>
      <td class="col-ruc">${p.ruc}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          ${botonesAccion}
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
   BUSCADOR
   ------------------------- */
function configurarBuscadorPrincipal() {
    if (!inputDocumento) return;

    const wrapper = document.createElement("div");
    wrapper.className = "search-container";
    if(inputDocumento.parentNode) inputDocumento.parentNode.insertBefore(wrapper, inputDocumento);
    wrapper.appendChild(inputDocumento);

    const lista = document.createElement("div");
    lista.id = "listaBusquedaPrincipal";
    lista.className = "dropdown-list";
    wrapper.appendChild(lista);

    const actualizarLista = () => {
        const texto = inputDocumento.value.toLowerCase().trim();
        lista.innerHTML = "";
        
        if (!parroquias || parroquias.length === 0) return;

        let coincidencias = !texto ? parroquias : parroquias.filter(p => 
            p.nombre.toLowerCase().startsWith(texto) || (p.ruc && p.ruc.startsWith(texto))
        );

        if (coincidencias.length === 0) {
            lista.classList.remove("active");
        } else {
            coincidencias.slice(0, 8).forEach(p => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                item.innerHTML = `${p.nombre} <small class="text-muted">(${p.ruc || 'S/R'})</small>`;
                item.addEventListener("click", () => {
                    inputDocumento.value = p.nombre; 
                    lista.classList.remove("active");
                    filtrarDatos();
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
            p.nombre.toLowerCase().startsWith(termino) || (p.ruc && p.ruc.startsWith(termino))
        );
    }
    paginaActual = 1;
    renderTabla();
}

/* -------------------------
   MODAL HTML INJECTION
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
                <label class="form-label">Historia</label>
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
                <button type="submit" class="btn-modal btn-modal-primary" id="btnGuardarModal">Guardar</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  return document.getElementById("modalForm");
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
    } else {
        document.getElementById("pFecha").value = new Date().toISOString().split('T')[0];
    }

    document.getElementById("pHistoria").value = p.historia || "";
    document.getElementById("pDescripcion").value = p.descripcion || "";
    document.getElementById("pColor").value = p.color || "#000000";
    document.getElementById("pLat").value = p.lat || "";
    document.getElementById("pLog").value = p.log || "";
}

function cerrarModal(id) { 
    document.getElementById(id).classList.remove('activo'); 
}

// Helpers globales para onclick HTML
window.editarParroquia = (id) => { const p = parroquias.find(x => x.id === id); if(p) abrirModalFormulario("editar", p); };
window.verDetalle = (id) => { const p = parroquias.find(x => x.id === id); if(p) abrirModalFormulario("ver", p); };
window.cambiarEstado = cambiarEstado;
window.eliminarParroquia = eliminarParroquia;
window.cerrarModal = cerrarModal;