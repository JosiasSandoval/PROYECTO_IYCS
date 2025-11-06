// ================== VARIABLES GLOBALES ==================
let requisitos = [];
let requisitosFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 5;

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API
 */
function normalizarRequisito(item) {
  return {
    idRequisito: item.idRequisito,
    nombRequisito: item.nombRequisito,
    // Formatear fecha para la tabla (si existe)
    f_requisito_tabla: item.f_requisito ? new Date(item.f_requisito).toLocaleDateString('es-PE') : "N/A",
    // Guardar fecha para el modal (formato YYYY-MM-DD)
    f_requisito_modal: item.f_requisito ? item.f_requisito.split('T')[0] : "",
    descripcion: item.descripcion || "---",
    estadoRequisito: item.estadoRequisito === true || item.estadoRequisito === 1,
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
  const lista = requisitosFiltrados ?? requisitos;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay requisitos para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const requisitosPagina = lista.slice(inicio, fin);

  requisitosPagina.forEach((req, index) => {
    const esActivo = req.estadoRequisito;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const tituloBoton = esActivo ? 'Dar de baja' : 'Dar de alta';

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${req.idRequisito}</td>
      <td class="col-nombre">${req.nombRequisito}</td>
      <td class="col-fechaRegistro">${req.f_requisito_tabla}</td>
      <td class="col-descripcion">${req.descripcion}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${req.idRequisito})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="abrirModalFormulario('editar', ${req.idRequisito})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstadoRequisito(${req.idRequisito}, ${esActivo})" title="${tituloBoton}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarRequisito(${req.idRequisito})" title="Eliminar">
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
  const totalPaginas = Math.ceil((requisitosFiltrados ?? requisitos).length / elementosPorPagina);
  if (pagina < 1 || pagina > totalPaginas) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== MODALES (Creación dinámica) ==================

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
            <form id="formModal">
              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del Requisito</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalFecha" class="form-label">Fecha de Registro (Opcional)</label>
                <input type="date" id="modalFecha" class="form-control">
              </div>
              <div class="mb-3">
                <label for="modalDescripcion" class="form-label">Descripción (Opcional)</label>
                <textarea id="modalDescripcion" class="form-control" rows="3"></textarea>
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
 * Controla el modal para 'agregar', 'editar' y 'ver'
 */
async function abrirModalFormulario(modo, idRequisito = null) {

  const form = document.getElementById("formModal");
  const footer = document.getElementById("modalFormularioFooter");
  footer.innerHTML = "";

  const campos = {
      titulo: document.getElementById("modalFormularioTitulo"),
      nombre: document.getElementById("modalNombre"),
      fecha: document.getElementById("modalFecha"),
      descripcion: document.getElementById("modalDescripcion"),
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
  let requisito = null;

  if (modo === "agregar") {
    campos.titulo.textContent = "Agregar Requisito";
    footer.appendChild(btnCerrar);
    footer.appendChild(btnGuardar);
    
  } else if (modo === "editar" || modo === "ver") {
    
    try {
        const res = await manejarSolicitud(`/api/requisito/requisitos/${idRequisito}`, {}, "Error al cargar requisito");
        requisito = normalizarRequisito(res.datos); // Normalizamos el dato único
    } catch (err) { return; }
        
    if (!requisito) return;

    campos.titulo.textContent = modo === 'editar' ? "Editar Requisito" : "Detalle del Requisito";
    
    // Llenar formulario
    campos.nombre.value = requisito.nombRequisito;
    campos.fecha.value = requisito.f_requisito_modal; // Usamos la fecha en formato YYYY-MM-DD
    campos.descripcion.value = requisito.descripcion === "---" ? "" : requisito.descripcion; // No mostrar "---"

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
          nombRequisito: campos.nombre.value,
          f_requisito: campos.fecha.value || null, // Enviar null si está vacío
          descripcion: campos.descripcion.value || null,
      };

      if (modo === "agregar") {
          await guardarRequisito('POST', '/api/requisito/requisitos', data);
      } else if (modo === "editar") {
          await guardarRequisito('PUT', `/api/requisito/requisitos/${idRequisito}`, data);
      }
  };

  abrirModal("modalFormulario");
}


// ================== CRUD (API Fetch) ==================

/**
 * Carga los datos iniciales
 */
async function cargarDatosIniciales() {
  try {
    const data = await manejarSolicitud("/api/requisito/requisitos", {}, "Error al cargar requisitos");
    if (data.success && Array.isArray(data.datos)) {
      requisitos = data.datos.map(normalizarRequisito);
      requisitosFiltrados = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      requisitos = [];
      renderTabla();
    }
  } catch (err) {
    console.error("Error cargando datos iniciales:", err);
  }
}

/**
 * Función genérica para guardar (Crear/Editar)
 */
async function guardarRequisito(method, url, data) {
  try {
    const res = await manejarSolicitud(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, "Error al guardar requisito");

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
async function cambiarEstadoRequisito(id, estadoActual) {
    const nuevoEstado = !estadoActual;
    const confirmacion = confirm(`¿Seguro que deseas ${nuevoEstado ? 'activar' : 'desactivar'} este requisito?`);
    if (!confirmacion) return;

    try {
        const res = await manejarSolicitud(`/api/requisito/requisitos/${id}/estado`, {
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
 * Elimina un requisito
 */
async function eliminarRequisito(id) {
    if (!confirm(`¿Seguro que deseas eliminar este requisito?`)) return;

    try {
        const res = await manejarSolicitud(`/api/requisito/requisitos/${id}`, {
            method: 'DELETE',
        }, "Error al eliminar requisito");
        
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarDatosIniciales();
        }
    } catch (err) {
      // El manejador ya mostró la alerta (ej. si está en uso)
    }
}

// ================== BUSQUEDA Y AUTOCOMPLETADO ==================

// Botón de Búsqueda (Filtro local)
const btnBuscar = document.getElementById("btn_buscar");
btnBuscar.addEventListener("click", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  if (termino === "") {
    requisitosFiltrados = null;
  } else {
    requisitosFiltrados = requisitos.filter(r => 
      r.nombRequisito.toLowerCase().includes(termino) ||
      r.descripcion.toLowerCase().includes(termino)
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

    // Filtrar solo por nombre
    const sugerencias = requisitos.filter(r => 
        r.nombRequisito.toLowerCase().startsWith(termino)
    ).slice(0, 5); 

    if (sugerencias.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    sugerencias.forEach(r => {
        const item = document.createElement("div");
        item.className = "sugerencia-item";
        item.textContent = r.nombRequisito;
        
        item.onclick = () => {
            inputBusqueda.value = r.nombRequisito;
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
    cargarDatosIniciales();
});