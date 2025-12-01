const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputDocumento = document.getElementById("inputDocumento"); // Input de búsqueda

// Crear modales al inicio
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario(); 

let parroquias = [];           // Todos los datos en memoria
let parroquiasFiltradas = null; 
let paginaActual = 1;
const elementosPorPagina = 7;
let ordenActual = { campo: null, ascendente: true };

// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Configurar el buscador predictivo
    configurarBuscadorPrincipal();

    // 2. Cargar datos
    cargarParroquias();

    // 3. Eventos
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
   LÓGICA BUSCADOR PREDICTIVO (STARTSWITH)
   ------------------------- */
function configurarBuscadorPrincipal() {
    if (!inputDocumento) return;

    // Crear wrapper y lista dinámicamente
    const wrapper = document.createElement("div");
    wrapper.className = "search-container";
    
    // Insertar wrapper y mover el input dentro
    inputDocumento.parentNode.insertBefore(wrapper, inputDocumento);
    wrapper.appendChild(inputDocumento);

    // Crear la lista de sugerencias
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
            // Si está vacío, mostramos todos (o los primeros para no saturar)
            coincidencias = parroquias;
        } else {
            // ✅ CORRECCIÓN: Usamos startsWith para que busque solo por el inicio
            coincidencias = parroquias.filter(p => 
                p.nombre.toLowerCase().startsWith(texto) || 
                (p.ruc && p.ruc.startsWith(texto))
            );
        }

        if (coincidencias.length === 0) {
            lista.classList.remove("active");
        } else {
            // Mostrar máximo 8 resultados visualmente
            coincidencias.slice(0, 8).forEach(p => {
                const item = document.createElement("div");
                item.className = "dropdown-item";
                // Muestra Nombre y RUC en la sugerencia
                item.innerHTML = `${p.nombre} <small class="text-muted" style="color:#888">(${p.ruc || 'S/R'})</small>`;
                
                // --- AL CLICKAR: SOLO RELLENA INPUT ---
                item.addEventListener("click", () => {
                    inputDocumento.value = p.nombre; 
                    lista.classList.remove("active");  // Cierra la lista
                });
                
                lista.appendChild(item);
            });
            lista.classList.add("active");
        }
    };

    // Escuchar input para actualizar mientras escribes
    inputDocumento.addEventListener("input", actualizarLista);
    // Escuchar focus para mostrar lista al hacer clic
    inputDocumento.addEventListener("focus", actualizarLista);
}

// Función de filtrado usada por el botón LUPA y ENTER
function filtrarDatos() {
    const termino = inputDocumento.value.trim().toLowerCase();
    if (!termino) {
        parroquiasFiltradas = null;
    } else {
        // Filtro para la tabla también con startsWith para ser consistente
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
  const id = p.id ?? p.idParroquia ?? null;
  const nombre = p.nombre ?? p.nombParroquia ?? "";
  const ruc = p.ruc ?? "";
  const direccion = p.direccion ?? "";
  
  let estado = false;
  if (p.estado === 1 || p.estado === true || p.estadoParroquia === true || p.estadoParroquia === 1) {
    estado = true;
  }
  return { id, nombre, ruc, direccion, estado, ...p }; 
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

    const fila = document.createElement("tr");
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

  const crearItem = (numero, activo, disabled, texto) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${numero})">${texto || numero}</button>`;
    return li;
  };

  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));

  for (let i = 1; i <= totalPaginas; i++) {
      ul.appendChild(crearItem(i, paginaActual === i));
  }

  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
};

function cambiarPagina(pagina) {
    const total = Math.ceil((parroquiasFiltradas ?? parroquias).length / elementosPorPagina);
    if (pagina < 1 || pagina > total) return;
    paginaActual = pagina;
    renderTabla();
}

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
   MODALES (HTML)
   ------------------------- */
function crearModal() {
  const html = `<div class="modal" id="modalDetalle"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title">Detalle</h5><button class="btn-cerrar" onclick="cerrarModal('modalDetalle')">&times;</button></div>
    <div class="modal-body" id="modalDetalleBody"></div>
    <div class="modal-footer"><button class="btn-modal btn-modal-secondary" onclick="cerrarModal('modalDetalle')">Cerrar</button></div>
  </div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  return document.getElementById("modalDetalle");
}

function crearModalFormulario() {
  const html = `<div class="modal" id="modalForm"><div class="modal-dialog"><div class="modal-content">
    <div class="modal-header"><h5 class="modal-title" id="modalTitulo"></h5><button class="btn-cerrar" onclick="cerrarModal('modalForm')">&times;</button></div>
    <div class="modal-body">
      <form id="formParroquia">
        <div class="mb-3"><label class="form-label">Nombre *</label><input id="pNombre" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">RUC *</label><input id="pRuc" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Dirección *</label><input id="pDireccion" class="form-control" required></div>
        <div class="mb-3"><label class="form-label">Teléfono</label><input id="pTelefono" class="form-control"></div>
        <div class="mb-3"><label class="form-label">Email</label><input id="pEmail" class="form-control" type="email"></div>
        <div class="mb-3"><label class="form-label">Fecha Creación</label><input id="pFecha" type="date" class="form-control" required></div>
        <div class="modal-footer"><button type="button" class="btn-modal btn-modal-secondary" onclick="cerrarModal('modalForm')">Cancelar</button>
        <button type="submit" class="btn-modal btn-modal-primary">Guardar</button></div>
      </form>
    </div></div></div></div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  return document.getElementById("modalForm");
}

function cerrarModal(id) { document.getElementById(id).classList.remove('activo'); }

function abrirModalFormulario(modo, p = null) {
    const form = document.getElementById("formParroquia");
    const titulo = document.getElementById("modalTitulo");
    form.reset();
    
    if(modo === "agregar") {
        titulo.textContent = "Nueva Parroquia";
        form.onsubmit = (e) => {
            e.preventDefault();
            const data = {
                nombParroquia: document.getElementById("pNombre").value,
                ruc: document.getElementById("pRuc").value,
                direccion: document.getElementById("pDireccion").value,
                telefonoContacto: document.getElementById("pTelefono").value,
                email: document.getElementById("pEmail").value,
                f_creacion: document.getElementById("pFecha").value,
                color: "#ffffff" 
            };
            agregarParroquiaAPI(data).then(() => cerrarModal('modalForm'));
        };
    } else {
        titulo.textContent = "Editar Parroquia";
        document.getElementById("pNombre").value = p.nombre;
        document.getElementById("pRuc").value = p.ruc;
        document.getElementById("pDireccion").value = p.direccion;
        document.getElementById("pTelefono").value = p.telefonoContacto || "";
        document.getElementById("pEmail").value = p.email || "";
        
        if(p.f_creacion) {
            let fecha = p.f_creacion;
            if(fecha.includes(' ')) fecha = fecha.split(' ')[0]; 
            document.getElementById("pFecha").value = fecha;
        }
        
        form.onsubmit = (e) => {
            e.preventDefault();
            const data = {
                nombParroquia: document.getElementById("pNombre").value,
                ruc: document.getElementById("pRuc").value,
                direccion: document.getElementById("pDireccion").value,
                telefonoContacto: document.getElementById("pTelefono").value,
                email: document.getElementById("pEmail").value,
                f_creacion: document.getElementById("pFecha").value
            };
            actualizarParroquiaAPI(p.id, data).then(() => cerrarModal('modalForm'));
        };
    }
    document.getElementById("modalForm").classList.add('activo');
}

window.editarParroquia = (id) => {
    const p = parroquias.find(x => x.id === id);
    if(p) abrirModalFormulario("editar", p);
};

window.verDetalle = (id) => {
    const p = parroquias.find(x => x.id === id);
    if(p) {
        document.getElementById("modalDetalleBody").innerHTML = `
            <p><strong>Nombre:</strong> ${p.nombre}</p>
            <p><strong>RUC:</strong> ${p.ruc}</p>
            <p><strong>Dirección:</strong> ${p.direccion}</p>
            <p><strong>Email:</strong> ${p.email || '-'}</p>
            <p><strong>Teléfono:</strong> ${p.telefonoContacto || '-'}</p>
            <p><strong>Historia:</strong> ${p.historiaParroquia || '-'}</p>
        `;
        document.getElementById("modalDetalle").classList.add('activo');
    }
};

window.cambiarEstado = cambiarEstado;
window.eliminarParroquia = eliminarParroquia;