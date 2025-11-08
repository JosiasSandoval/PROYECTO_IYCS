// ================== VARIABLES GLOBALES ==================
let excepciones = [];
let excepcionesFiltradas = null;
let listaPersonal = []; // Almacenará la lista del personal
let paginaActual = 1;
const elementosPorPagina = 5;

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API (con JOIN)
 */
function normalizarExcepcion(item) {
  // Formatear fechas
  const f_inicio = new Date(item.fechaInicioExcepcion).toLocaleDateString('es-PE');
  const f_fin = item.fechaFinExcepcion ? new Date(item.fechaFinExcepcion).toLocaleDateString('es-PE') : "N/A";

  return {
    idExcepcion: item.idExcepcion,
    nombreExcepcion: item.nombreExcepcion,
    // Guardar fechas en formato YYYY-MM-DD para el modal
    fechaInicioModal: item.fechaInicioExcepcion.split('T')[0],
    fechaFinModal: item.fechaFinExcepcion ? item.fechaFinExcepcion.split('T')[0] : "",
    fechasTabla: `${f_inicio} - ${f_fin}`, // Para la tabla
    motivoExcepcion: item.motivoExcepcion,
    tipoExcepcion: item.tipoExcepcion,
    estadoExcepcion: item.estadoExcepcion === true || item.estadoExcepcion === 1,
    idPersonal: item.idPersonal,
    nombrePersonal: `${item.apePatPers}, ${item.apeMatPers}, ${item.nombPers}`
  };
}

/**
 * Manejador genérico de fetch
 */
const manejarSolicitud = async (url, opciones = {}, mensajeError = "Error") => {
    try {
        const res = await fetch(url, opciones);
        if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.mensaje || mensajeError);
        }
        return await res.json();
    } catch (err) {
        console.error(mensajeError, err);
        mostrarAlerta(err.message || "Error de conexión", "error");
        throw err;
    }
};

// ================== RENDERIZAR TABLA ==================
function renderTabla() {
  tabla.innerHTML = "";
  const lista = excepcionesFiltradas ?? excepciones;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay excepciones para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const excepcionesPagina = lista.slice(inicio, fin);

  excepcionesPagina.forEach((ex, index) => {
    const esActivo = ex.estadoExcepcion;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const tituloBoton = esActivo ? 'Dar de baja' : 'Dar de alta';

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${ex.idExcepcion}</td>
      <td class="col-personal">${ex.nombrePersonal}</td>
      <td class="col-nombre">${ex.nombreExcepcion}</td>
      <td class="col-tipo">${ex.tipoExcepcion}</td>
      <td class="col-fechas">${ex.fechasTabla}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${ex.idExcepcion})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="abrirModalFormulario('editar', ${ex.idExcepcion})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstadoExcepcion(${ex.idExcepcion}, ${esActivo})" title="${tituloBoton}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarExcepcion(${ex.idExcepcion})" title="Eliminar">
            <img src="/static/img/x.png" alt="eliminar">
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });

  renderPaginacion(lista.length);
}

// ================== PAGINACIÓN ==================
function renderPaginacion(totalElementos) {
  paginacion.innerHTML = "";
  const totalPaginas = Math.ceil(totalElementos / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";
  const crearItem = (numero, activo = false, disabled = false, texto = null) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    const btn = document.createElement("button");
    btn.className = "page-link";
    if (!disabled) btn.onclick = () => cambiarPagina(numero);
    btn.innerHTML = texto || numero;
    li.appendChild(btn);
    return li;
  };
  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));
  for (let i = 1; i <= totalPaginas; i++) ul.appendChild(crearItem(i, paginaActual === i));
  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  const totalPaginas = Math.ceil((excepcionesFiltradas ?? excepciones).length / elementosPorPagina);
  if (pagina < 1 || pagina > totalPaginas) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== MODALES (Creación dinámica) ==================

function crearModalFormulario() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalFormulario">
      <div class="modal-dialog modal-lg"> <!-- modal-lg para más espacio -->
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalFormularioTitulo"></h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalFormulario')">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formModal">
              <div class="mb-3">
                <label for="modalPersonal" class="form-label">Personal</label>
                <select id="modalPersonal" class="form-control" required>
                  <option value="">Cargando personal...</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre de la Excepción</label>
                <input type="text" id="modalNombre" class="form-control" placeholder="Ej: Vacaciones Programadas" required>
              </div>
              <div class="mb-3">
                <label for="modalTipo" class="form-label">Tipo de Excepción</label>
                <input type="text" id="modalTipo" class="form-control" placeholder="Ej: Ausencia Programada, Emergencia" required>
              </div>
              <div class="form-grid">
                <div class="mb-3">
                  <label for="modalFechaInicio" class="form-label">Fecha Inicio</label>
                  <input type="date" id="modalFechaInicio" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label for="modalFechaFin" class="form-label">Fecha Fin (Opcional)</label>
                  <input type="date" id="modalFechaFin" class="form-control">
                </div>
              </div>
              <div class="mb-3">
                <label for="modalMotivo" class="form-label">Motivo</label>
                <textarea id="modalMotivo" class="form-control" rows="3" required></textarea>
              </div>
              <div class="modal-footer" id="modalFormularioFooter">
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
}

function abrirModal(id) {
  document.getElementById(id)?.classList.add("activo");
}

function cerrarModal(id) {
  document.getElementById(id)?.classList.remove("activo");
}

/**
 * Rellena el <select> del personal
 */
function popularPersonalSelect(idSeleccionado = null) {
    const select = document.getElementById("modalPersonal");
    select.innerHTML = '<option value="">Seleccionar personal...</option>';
    
    listaPersonal.forEach(p => {
        const option = document.createElement("option");
        option.value = p.id;
        option.textContent = p.nombre;
        select.appendChild(option);
    });
    
    if (idSeleccionado) {
        select.value = idSeleccionado;
    }
}

/**
 * Controla el modal para 'agregar', 'editar' y 'ver'
 */
async function abrirModalFormulario(modo, idExcepcion = null) {
  if (listaPersonal.length === 0) {
      mostrarAlerta("Error: No se cargó la lista de personal.", "error");
      return;
  }

  const form = document.getElementById("formModal");
  const footer = document.getElementById("modalFormularioFooter");
  footer.innerHTML = "";

  const campos = {
      titulo: document.getElementById("modalFormularioTitulo"),
      personal: document.getElementById("modalPersonal"),
      nombre: document.getElementById("modalNombre"),
      tipo: document.getElementById("modalTipo"),
      inicio: document.getElementById("modalFechaInicio"),
      fin: document.getElementById("modalFechaFin"),
      motivo: document.getElementById("modalMotivo"),
  };

  Object.values(campos).forEach(campo => {
      if (campo && campo.disabled !== undefined) campo.disabled = false;
  });

  const btnCerrar = document.createElement("button");
  btnCerrar.type = "button";
  btnCerrar.className = "btn-modal btn-modal-secondary";
  btnCerrar.textContent = "Cerrar";
  btnCerrar.onclick = () => cerrarModal("modalFormulario");

  const btnGuardar = document.createElement("button");
  btnGuardar.type = "submit";
  btnGuardar.className = "btn-modal btn-modal-primary";
  btnGuardar.textContent = "Guardar";
  
  form.reset();
  let excepcion = null;

  if (modo === "agregar") {
    campos.titulo.textContent = "Agregar Excepción";
    popularPersonalSelect(); // Llenar el select
    footer.appendChild(btnCerrar);
    footer.appendChild(btnGuardar);
    
  } else if (modo === "editar" || modo === "ver") {
    
    try {
        const res = await manejarSolicitud(`/api/excepcion/excepciones/${idExcepcion}`, {}, "Error al cargar excepción");
        excepcion = res.datos;
    } catch (err) { return; }
        
    if (!excepcion) return;

    campos.titulo.textContent = modo === 'editar' ? "Editar Excepción" : "Detalle de Excepción";
    
    popularPersonalSelect(excepcion.idPersonal); // Llenar y seleccionar

    // Llenar formulario
    campos.nombre.value = excepcion.nombreExcepcion;
    campos.tipo.value = excepcion.tipoExcepcion;
    campos.inicio.value = excepcion.fechaInicioExcepcion ? excepcion.fechaInicioExcepcion.split('T')[0] : "";
    campos.fin.value = excepcion.fechaFinExcepcion ? excepcion.fechaFinExcepcion.split('T')[0] : "";
    campos.motivo.value = excepcion.motivoExcepcion;

    if (modo === 'editar') {
        footer.appendChild(btnCerrar);
        footer.appendChild(btnGuardar);
    } else { // modo === 'ver'
        footer.appendChild(btnCerrar);
        Object.values(campos).forEach(campo => campo.disabled = true);
    }
  }

  form.onsubmit = async (e) => {
      e.preventDefault();
      if (modo === 'ver') return cerrarModal('modalFormulario');

      const data = {
          idPersonal: campos.personal.value,
          nombreExcepcion: campos.nombre.value,
          tipoExcepcion: campos.tipo.value,
          fechaInicioExcepcion: campos.inicio.value,
          fechaFinExcepcion: campos.fin.value || null,
          motivoExcepcion: campos.motivo.value,
      };

      if (modo === "agregar") {
          data.estadoExcepcion = true; // Se crea como activo
          await guardarExcepcion('POST', '/api/excepcion/excepciones', data);
      } else if (modo === "editar") {
          await guardarExcepcion('PUT', `/api/excepcion/excepciones/${idExcepcion}`, data);
      }
  };

  abrirModal("modalFormulario");
}


// ================== CRUD (API Fetch) ==================

/**
 * Carga los datos iniciales (Personal y Excepciones)
 */
async function cargarDatosIniciales() {
  try {
    // 1. Cargar dependencias (Personal)
    const dataPersonal = await manejarSolicitud("/api/excepcion/lista-personal", {}, "Error al cargar lista de personal");
    if (dataPersonal.success) {
      listaPersonal = dataPersonal.datos;
    } else {
      mostrarAlerta("Error fatal: No se pudo cargar la lista de personal.", "error");
    }

    // 2. Cargar datos principales (Excepciones)
    const dataExcepciones = await manejarSolicitud("/api/excepcion/excepciones", {}, "Error al cargar excepciones");
    if (dataExcepciones.success && Array.isArray(dataExcepciones.datos)) {
      excepciones = dataExcepciones.datos.map(normalizarExcepcion);
      excepcionesFiltradas = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      excepciones = [];
      renderTabla();
    }
  } catch (err) {
    console.error("Error cargando datos iniciales:", err);
  }
}

/**
 * Función genérica para guardar (Crear/Editar)
 */
async function guardarExcepcion(method, url, data) {
  try {
    const res = await manejarSolicitud(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, "Error al guardar excepción");

    if (res.success) {
      mostrarAlerta(res.mensaje, "success");
      cerrarModal("modalFormulario");
      await cargarDatosIniciales();
    }
  } catch (err) {
    // El manejador ya mostró la alerta
  }
}

/**
 * Cambia el estado (Activo/Inactivo)
 */
async function cambiarEstadoExcepcion(id, estadoActual) {
    const nuevoEstado = !estadoActual;
    const confirmacion = confirm(`¿Seguro que deseas ${nuevoEstado ? 'activar' : 'desactivar'} esta excepción?`);
    if (!confirmacion) return;

    try {
        const res = await manejarSolicitud(`/api/excepcion/excepciones/${id}/estado`, {
            method: 'PATCH',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado }),
        }, "Error al cambiar estado");
        
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarDatosIniciales();
        }
    } catch (err) {
      // El manejador ya mostró la alerta
    }
}

/**
 * Elimina una excepción
 */
async function eliminarExcepcion(id) {
    if (!confirm(`¿Seguro que deseas eliminar este registro de excepción?`)) return;

    try {
        const res = await manejarSolicitud(`/api/excepcion/excepciones/${id}`, {
            method: 'DELETE',
        }, "Error al eliminar excepción");
        
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarDatosIniciales();
        }
    } catch (err) {
      // El manejador ya mostró la alerta
    }
}

// ================== BUSQUEDA Y AUTOCOMPLETADO ==================

// Botón de Búsqueda (Filtro local)
const btnBuscar = document.getElementById("btn_buscar");
btnBuscar.addEventListener("click", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  if (termino === "") {
    excepcionesFiltradas = null;
  } else {
    excepcionesFiltradas = excepciones.filter(e => 
      e.nombrePersonal.toLowerCase().includes(termino) ||
      e.nombreExcepcion.toLowerCase().includes(termino) ||
      e.tipoExcepcion.toLowerCase().includes(termino)
    );
  }
  paginaActual = 1;
  renderTabla();
  contenedorSugerencias.style.display = "none";
});

// Botón de Agregar (Formulario principal)
document.getElementById("btn_guardar").addEventListener("click", (e) => {
    e.preventDefault();
    abrirModalFormulario("agregar");
});

document.getElementById("formDocumento").addEventListener("submit", (e) => e.preventDefault());

// ================== NOTIFICACIONES (Alertas) ==================
function mostrarAlerta(mensaje, tipo = "success") {
    const alerta = document.createElement("div");
    alerta.className = `alerta-toast ${tipo}`;
    alerta.textContent = mensaje;
    
    document.body.appendChild(alerta);
    setTimeout(() => alerta.classList.add("mostrar"), 10);
    setTimeout(() => {
        alerta.classList.remove("mostrar");
        setTimeout(() => alerta.remove(), 500);
    }, 3000);
}

// ==================================================
// === INICIO: BLOQUE DE SUGERENCIAS (DINÁMICO) ===
// ==================================================

const contenedorSugerencias = document.createElement("div");
contenedorSugerencias.id = "sugerenciasContainer";
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

    // Filtrar por nombre de excepción o nombre de personal
    const sugerencias = excepciones.filter(e => 
        e.nombreExcepcion.toLowerCase().startsWith(termino) ||
        e.nombrePersonal.toLowerCase().startsWith(termino)
    ).slice(0, 5); 

    if (sugerencias.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    // Evitar duplicados (ej. si "Vacaciones" aparece 5 veces)
    const sugerenciasUnicas = [...new Map(sugerencias.map(item =>
      [item.nombreExcepcion, item])).values()];

    sugerenciasUnicas.forEach(e => {
        const item = document.createElement("div");
        item.className = "sugerencia-item";
        item.textContent = e.nombreExcepcion.toLowerCase().startsWith(termino) ? e.nombreExcepcion : e.nombrePersonal;
        
        item.onclick = () => {
            inputBusqueda.value = item.textContent;
            contenedorSugerencias.style.display = "none";
            document.getElementById("btn_buscar").click();
        };
        contenedorSugerencias.appendChild(item);
    });

    contenedorSugerencias.style.display = "block";
    posicionarSugerencias();
});

// Listeners para ocultar/reposicionar
document.addEventListener("click", (e) => {
    if (contenedorSugerencias && !contenedorSugerencias.contains(e.target) && e.target !== inputBusqueda) {
        contenedorSugerencias.style.display = "none";
    }
});
window.addEventListener("resize", posicionarSugerencias);
window.addEventListener("scroll", posicionarSugerencias, true);

// === FIN: BLOQUE DE SUGERENCIAS ===
// ==================================

// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    crearModalFormulario(); 
    cargarDatosIniciales(); // Carga Personal y luego Excepciones
});