// ================== VARIABLES GLOBALES ==================
let actos = [];
let actosFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 5; // Más bajo para ver más detalles

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API
 */
function normalizarActo(item) {
  return {
    idActo: item.idActo,
    nombActo: item.nombActo,
    descripcion: item.descripcion || "---",
    numParticipantes: item.numParticipantes,
    tipoParticipantes: item.tipoParticipantes,
    costoBase: parseFloat(item.costoBase).toFixed(2),
    estadoActo: item.estadoActo === true || item.estadoActo === 1,
    imgActo: item.imgActo || "N/A"
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
  const lista = actosFiltrados ?? actos;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay actos litúrgicos para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const actosPagina = lista.slice(inicio, fin);

  actosPagina.forEach((acto, index) => {
    const esActivo = acto.estadoActo;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const tituloBoton = esActivo ? 'Dar de baja' : 'Dar de alta';

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${acto.idActo}</td>
      <td class="col-nombre">${acto.nombActo}</td>
      <td class="col-descripcion">${acto.descripcion}</td>
      <td class="col-numParticipantes">${acto.numParticipantes}</td>
      <td class="col-tipoParticipantes">${acto.tipoParticipantes}</td>
      <td class="col-precio">S/ ${acto.costoBase}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${acto.idActo})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="abrirModalFormulario('editar', ${acto.idActo})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstadoActo(${acto.idActo}, ${esActivo})" title="${tituloBoton}">
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
  const totalPaginas = Math.ceil((actosFiltrados ?? actos).length / elementosPorPagina);
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
                <label for="modalNombre" class="form-label">Nombre del Acto</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>

              <div class="form-grid">
                <div class="mb-3">
                  <label for="modalNumParticipantes" class="form-label">N° de Participantes</label>
                  <input type="number" id="modalNumParticipantes" class="form-control" required>
                </div>
                <div class="mb-3">
                  <label for="modalCosto" class="form-label">Costo Base (S/)</label>
                  <input type="number" id="modalCosto" class="form-control" step="0.01" required>
                </div>
              </div>

              <div class="mb-3">
                <label for="modalTipoParticipantes" class="form-label">Tipo de Participantes</label>
                <input type="text" id="modalTipoParticipantes" class="form-control" placeholder="Ej: Novios, Padrinos, Padres" required>
              </div>

              <div class="mb-3">
                <label for="modalDescripcion" class="form-label">Descripción</label>
                <textarea id="modalDescripcion" class="form-control" rows="3"></textarea>
              </div>

              <div class="mb-3">
                <label for="modalImgUrl" class="form-label">URL de Imagen</label>
                <input type="text" id="modalImgUrl" class="form-control" placeholder="https://ejemplo.com/imagen.png" required>
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
async function abrirModalFormulario(modo, idActo = null) {
  const form = document.getElementById("formModal");
  const footer = document.getElementById("modalFormularioFooter");
  footer.innerHTML = "";

  const campos = {
      titulo: document.getElementById("modalFormularioTitulo"),
      nombre: document.getElementById("modalNombre"),
      numParticipantes: document.getElementById("modalNumParticipantes"),
      costo: document.getElementById("modalCosto"),
      tipoParticipantes: document.getElementById("modalTipoParticipantes"),
      descripcion: document.getElementById("modalDescripcion"),
      imgUrl: document.getElementById("modalImgUrl"),
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
  let acto = null;

  if (modo === "agregar") {
    campos.titulo.textContent = "Agregar Acto Litúrgico";
    footer.appendChild(btnCerrar);
    footer.appendChild(btnGuardar);
    
  } else if (modo === "editar" || modo === "ver") {
    
    try {
        const res = await manejarSolicitud(`/api/acto_liturgico/actos/${idActo}`, {}, "Error al cargar acto");
        acto = normalizarActo(res.datos); // Normalizamos el dato único
    } catch (err) { return; }
        
    if (!acto) return;

    campos.titulo.textContent = modo === 'editar' ? "Editar Acto Litúrgico" : "Detalle del Acto";
    
    // Llenar formulario
    campos.nombre.value = acto.nombActo;
    campos.numParticipantes.value = acto.numParticipantes;
    campos.costo.value = acto.costoBase;
    campos.tipoParticipantes.value = acto.tipoParticipantes;
    campos.descripcion.value = acto.descripcion === "---" ? "" : acto.descripcion;
    campos.imgUrl.value = acto.imgActo;

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
          nombActo: campos.nombre.value,
          numParticipantes: campos.numParticipantes.value,
          costoBase: campos.costo.value,
          tipoParticipantes: campos.tipoParticipantes.value,
          descripcion: campos.descripcion.value || null,
          imgActo: campos.imgUrl.value,
      };

      if (modo === "agregar") {
          data.estadoActo = true; // Se crea como activo
          await guardarActo('POST', '/api/acto_liturgico/actos', data);
      } else if (modo === "editar") {
          await guardarActo('PUT', `/api/acto_liturgico/actos/${idActo}`, data);
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
    const data = await manejarSolicitud("/api/acto_liturgico/actos", {}, "Error al cargar actos litúrgicos");
    if (data.success && Array.isArray(data.datos)) {
      actos = data.datos.map(normalizarActo);
      actosFiltrados = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      actos = [];
      renderTabla();
    }
  } catch (err) {
    console.error("Error cargando datos iniciales:", err);
  }
}

/**
 * Función genérica para guardar (Crear/Editar)
 */
async function guardarActo(method, url, data) {
  try {
    const res = await manejarSolicitud(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, "Error al guardar acto");

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
async function cambiarEstadoActo(id, estadoActual) {
    const nuevoEstado = !estadoActual;
    const confirmacion = confirm(`¿Seguro que deseas ${nuevoEstado ? 'activar' : 'desactivar'} este acto?`);
    if (!confirmacion) return;

    try {
        const res = await manejarSolicitud(`/api/acto_liturgico/actos/${id}/estado`, {
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
 * Elimina un acto
 */
async function eliminarActo(id) {
    if (!confirm(`¿Seguro que deseas eliminar este acto litúrgico?`)) return;

    try {
        const res = await manejarSolicitud(`/api/acto_liturgico/actos/${id}`, {
            method: 'DELETE',
        }, "Error al eliminar acto");
        
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
    actosFiltrados = null;
  } else {
    actosFiltrados = actos.filter(a => 
      a.nombActo.toLowerCase().includes(termino) ||
      a.tipoParticipantes.toLowerCase().includes(termino)
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

    // Filtrar por nombre de acto
    const sugerencias = actos.filter(a => 
        a.nombActo.toLowerCase().startsWith(termino)
    ).slice(0, 5); 

    if (sugerencias.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    sugerencias.forEach(a => {
        const item = document.createElement("div");
        item.className = "sugerencia-item";
        item.textContent = a.nombActo;
        
        item.onclick = () => {
            inputBusqueda.value = a.nombActo;
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