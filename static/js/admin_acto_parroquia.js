// ================== VARIABLES GLOBALES ==================
let asignaciones = [];
let asignacionesFiltradas = null;
let actos = []; // Lista de Actos Litúrgicos
let parroquias = []; // Lista de Parroquias
let paginaActual = 1;
const elementosPorPagina = 5;

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");

// Días de la semana (basado en CHAR(3) de tu BD)
const DIAS_SEMANA = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API (con JOINs)
 */
function normalizarAsignacion(item) {
  return {
    idActoParroquia: item.idActoParroquia,
    diaSemana: item.diaSemana,
    horaInicioActo: item.horaInicioActo,
    idActo: item.idActo,
    nombActo: item.nombActo,
    idParroquia: item.idParroquia,
    nombParroquia: item.nombParroquia
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
  const lista = asignacionesFiltradas ?? asignaciones;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay asignaciones para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const asignacionesPagina = lista.slice(inicio, fin);

  asignacionesPagina.forEach((a, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${a.idActoParroquia}</td>
      <td class="col-acto">${a.nombActo}</td>
      <td class="col-parroquia">${a.nombParroquia}</td>
      <td class="col-dia">${a.diaSemana}</td>
      <td class="col-hora">${a.horaInicioActo}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${a.idActoParroquia})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="abrirModalFormulario('editar', ${a.idActoParroquia})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarAsignacion(${a.idActoParroquia})" title="Eliminar">
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
  const totalPaginas = Math.ceil((asignacionesFiltradas ?? asignaciones).length / elementosPorPagina);
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
                <label for="modalActo" class="form-label">Acto Litúrgico</label>
                <select id="modalActo" class="form-control" required>
                  <option value="">Cargando actos...</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="modalParroquia" class="form-label">Parroquia</label>
                <select id="modalParroquia" class="form-control" required>
                  <option value="">Cargando parroquias...</option>
                </select>
              </div>
              <div class="form-grid">
                <div class="mb-3">
                  <label for="modalDia" class="form-label">Día de la Semana</label>
                  <select id="modalDia" class="form-control" required>
                    <option value="">Seleccionar...</option>
                    ${DIAS_SEMANA.map(dia => `<option value="${dia}">${dia}</option>`).join('')}
                  </select>
                </div>
                <div class="mb-3">
                  <label for="modalHora" class="form-label">Hora Inicio</label>
                  <input type="time" id="modalHora" class="form-control" required>
                </div>
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
 * Rellena los <select> del modal
 */
function popularSelects(selectId, data, valueField, textField, idSeleccionado) {
    const select = document.getElementById(selectId);
    select.innerHTML = `<option value="">Seleccionar...</option>`;
    data.forEach(item => {
        // Solo poblamos con actos/parroquias que estén activos
        if(item.estadoActo === false || item.estadoParroquia === false) return;
        
        const option = document.createElement("option");
        option.value = item[valueField];
        option.textContent = item[textField];
        select.appendChild(option);
    });
    if (idSeleccionado) {
        select.value = idSeleccionado;
    }
}

/**
 * Controla el modal para 'agregar', 'editar' y 'ver'
 */
async function abrirModalFormulario(modo, idAsignacion = null) {
  if (actos.length === 0 || parroquias.length === 0) {
      mostrarAlerta("Error: No se cargaron las dependencias (actos o parroquias).", "error");
      return;
  }

  const form = document.getElementById("formModal");
  const footer = document.getElementById("modalFormularioFooter");
  footer.innerHTML = "";

  const campos = {
      titulo: document.getElementById("modalFormularioTitulo"),
      acto: document.getElementById("modalActo"),
      parroquia: document.getElementById("modalParroquia"),
      dia: document.getElementById("modalDia"),
      hora: document.getElementById("modalHora"),
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
  let asignacion = null;

  if (modo === "agregar") {
    campos.titulo.textContent = "Asignar Horario";
    popularSelects("modalActo", actos, "idActo", "nombActo", null);
    popularSelects("modalParroquia", parroquias, "idParroquia", "nombParroquia", null);
    footer.appendChild(btnCerrar);
    footer.appendChild(btnGuardar);
    
  } else if (modo === "editar" || modo === "ver") {
    
    try {
        const res = await manejarSolicitud(`/api/acto-parroquia/asignaciones/${idAsignacion}`, {}, "Error al cargar asignación");
        asignacion = res.datos;
    } catch (err) { return; }
        
    if (!asignacion) return;

    campos.titulo.textContent = modo === 'editar' ? "Editar Asignación" : "Detalle de Asignación";
    
    popularSelects("modalActo", actos, "idActo", "nombActo", asignacion.idActo);
    popularSelects("modalParroquia", parroquias, "idParroquia", "nombParroquia", asignacion.idParroquia);

    // Llenar formulario
    campos.dia.value = asignacion.diaSemana;
    campos.hora.value = asignacion.horaInicioActo;

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
          idActo: campos.acto.value,
          idParroquia: campos.parroquia.value,
          diaSemana: campos.dia.value,
          horaInicioActo: campos.hora.value,
      };

      if (modo === "agregar") {
          await guardarAsignacion('POST', '/api/acto-parroquia/asignaciones', data);
      } else if (modo === "editar") {
          await guardarAsignacion('PUT', `/api/acto-parroquia/asignaciones/${idAsignacion}`, data);
      }
  };

  abrirModal("modalFormulario");
}


// ================== CRUD (API Fetch) ==================

/**
 * Carga los datos iniciales (Dependencias y Datos Principales)
 */
async function cargarDatosIniciales() {
  try {
    // 1. Cargar dependencias (Actos y Parroquias) en paralelo
    const [dataActos, dataParroquias] = await Promise.all([
        manejarSolicitud("/api/acto_liturgico/actos", {}, "Error al cargar actos"),
        manejarSolicitud("/api/parroquia/parroquias", {}, "Error al cargar parroquias") // Asumiendo que esta es la ruta de la lista
    ]);

    if (dataActos.success) {
        actos = dataActos.datos;
    } else {
        mostrarAlerta("Error fatal: No se pudieron cargar los actos litúrgicos.", "error");
    }
    
    if (dataParroquias.success) {
        parroquias = dataParroquias.datos;
    } else {
        mostrarAlerta("Error fatal: No se pudieron cargar las parroquias.", "error");
    }

    // 2. Cargar datos principales (Asignaciones)
    const dataAsignaciones = await manejarSolicitud("/api/acto-parroquia/asignaciones", {}, "Error al cargar asignaciones");
    if (dataAsignaciones.success && Array.isArray(dataAsignaciones.datos)) {
      asignaciones = dataAsignaciones.datos.map(normalizarAsignacion);
      asignacionesFiltrados = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      asignaciones = [];
      renderTabla();
    }
  } catch (err) {
    console.error("Error cargando datos iniciales:", err);
  }
}

/**
 * Función genérica para guardar (Crear/Editar)
 */
async function guardarAsignacion(method, url, data) {
  try {
    const res = await manejarSolicitud(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, "Error al guardar asignación");

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
 * Elimina una asignación
 */
async function eliminarAsignacion(id) {
    if (!confirm(`¿Seguro que deseas eliminar esta asignación de horario?`)) return;

    try {
        const res = await manejarSolicitud(`/api/acto-parroquia/asignaciones/${id}`, {
            method: 'DELETE',
        }, "Error al eliminar asignación");
        
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
    asignacionesFiltradas = null;
  } else {
    asignacionesFiltradas = asignaciones.filter(a => 
      a.nombActo.toLowerCase().includes(termino) ||
      a.nombParroquia.toLowerCase().includes(termino) ||
      a.diaSemana.toLowerCase().includes(termino)
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

    // Filtrar por nombre de Acto o nombre de Parroquia
    const sugerencias = asignaciones.filter(a => 
        a.nombActo.toLowerCase().startsWith(termino) ||
        a.nombParroquia.toLowerCase().startsWith(termino)
    );

    // Evitar duplicados
    const sugerenciasUnicas = [...new Map(sugerencias.map(item =>
      [item.nombActo.toLowerCase().startsWith(termino) ? item.nombActo : item.nombParroquia, item]))
      .values()].slice(0, 5);

    if (sugerenciasUnicas.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    sugerenciasUnicas.forEach(a => {
        const item = document.createElement("div");
        item.className = "sugerencia-item";
        // Mostrar el término que coincidió
        item.textContent = a.nombActo.toLowerCase().startsWith(termino) ? a.nombActo : a.nombParroquia;
        
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
    cargarDatosIniciales(); // Carga Actos, Parroquias y luego Asignaciones
});