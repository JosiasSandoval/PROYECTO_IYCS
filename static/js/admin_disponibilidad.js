// ================== VARIABLES GLOBALES ==================
let horarios = [];
let horariosFiltrados = null;
let personalAsignado = []; // Almacenará la lista del personal
let paginaActual = 1;
const elementosPorPagina = 5;

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");

// Lista de días de la semana
const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API
 */
function normalizarHorario(item) {
  return {
    idDisponibilidad: item.idDisponibilidad,
    diaSemana: item.diaSemana,
    horaInicioDis: item.horaInicioDis,
    horaFinDis: item.horaFinDis,
    estadoDisponibilidad: item.estadoDisponibilidad === true || item.estadoDisponibilidad === 1,
    idParroquiaPersonal: item.idParroquiaPersonal
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
  const lista = horariosFiltrados ?? horarios;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay horarios para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const horariosPagina = lista.slice(inicio, fin);

  horariosPagina.forEach((h, index) => {
    const esActivo = h.estadoDisponibilidad;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const tituloBoton = esActivo ? 'Dar de baja' : 'Dar de alta';

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${h.idDisponibilidad}</td>
      <td class="col-diaSemana">${h.diaSemana}</td>
      <td class="col-horaInicioDis">${h.horaInicioDis}</td>
      <td class="col-horaFinDis">${h.horaFinDis}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${h.idDisponibilidad})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="abrirModalFormulario('editar', ${h.idDisponibilidad})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstadoHorario(${h.idDisponibilidad}, ${esActivo})" title="${tituloBoton}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarHorario(${h.idDisponibilidad})" title="Eliminar">
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
  // ... (código de paginación idéntico a los otros CRUDS) ...
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
  const totalPaginas = Math.ceil((horariosFiltrados ?? horarios).length / elementosPorPagina);
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
                <label for="modalPersonal" class="form-label">Personal Asignado</label>
                <select id="modalPersonal" class="form-control" required>
                  <option value="">Cargando...</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="modalDiaSemana" class="form-label">Día de la Semana</label>
                <select id="modalDiaSemana" class="form-control" required>
                  <option value="">Seleccionar día...</option>
                  ${DIAS_SEMANA.map(dia => `<option value="${dia}">${dia}</option>`).join('')}
                </select>
              </div>
              <div class="mb-3">
                <label for="modalHoraInicio" class="form-label">Hora Inicio</label>
                <input type="time" id="modalHoraInicio" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalHoraFin" class="form-label">Hora Fin</label>
                <input type="time" id="modalHoraFin" class="form-control" required>
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
 * Rellena el <select> del personal asignado
 */
function popularPersonalSelect(idSeleccionado = null) {
    const select = document.getElementById("modalPersonal");
    select.innerHTML = '<option value="">Seleccionar personal...</option>';
    
    personalAsignado.forEach(p => {
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
async function abrirModalFormulario(modo, idHorario = null) {
  if (personalAsignado.length === 0) {
      mostrarAlerta("Error: No se cargó la lista de personal asignado.", "error");
      return;
  }

  const form = document.getElementById("formModal");
  const footer = document.getElementById("modalFormularioFooter");
  footer.innerHTML = "";

  const campos = {
      titulo: document.getElementById("modalFormularioTitulo"),
      personal: document.getElementById("modalPersonal"),
      dia: document.getElementById("modalDiaSemana"),
      inicio: document.getElementById("modalHoraInicio"),
      fin: document.getElementById("modalHoraFin"),
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
  let horario = null;

  if (modo === "agregar") {
    campos.titulo.textContent = "Agregar Disponibilidad";
    popularPersonalSelect(); // Llenar el select
    footer.appendChild(btnCerrar);
    footer.appendChild(btnGuardar);
    
  } else if (modo === "editar" || modo === "ver") {
    
    try {
        const res = await manejarSolicitud(`/api/disponibilidad/disponibilidades/${idHorario}`, {}, "Error al cargar horario");
        horario = res.datos;
    } catch (err) { return; }
        
    if (!horario) return;

    campos.titulo.textContent = modo === 'editar' ? "Editar Horario" : "Detalle del Horario";
    
    popularPersonalSelect(horario.idParroquiaPersonal); // Llenar y seleccionar

    // Llenar formulario
    campos.dia.value = horario.diaSemana;
    campos.inicio.value = horario.horaInicioDis;
    campos.fin.value = horario.horaFinDis;

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
          idParroquiaPersonal: campos.personal.value,
          diaSemana: campos.dia.value,
          horaInicioDis: campos.inicio.value,
          horaFinDis: campos.fin.value,
      };

      if (modo === "agregar") {
          await guardarHorario('POST', '/api/disponibilidad/disponibilidades', data);
      } else if (modo === "editar") {
          await guardarHorario('PUT', `/api/disponibilidad/disponibilidades/${idHorario}`, data);
      }
  };

  abrirModal("modalFormulario");
}


// ================== CRUD (API Fetch) ==================

/**
 * Carga los datos iniciales (Personal Asignado y Horarios)
 */
async function cargarDatosIniciales() {
  try {
    // 1. Cargar dependencias (Personal)
    const dataPersonal = await manejarSolicitud("/api/disponibilidad/personal-asignado", {}, "Error al cargar lista de personal");
    if (dataPersonal.success) {
      personalAsignado = dataPersonal.datos;
    } else {
      mostrarAlerta("Error fatal: No se pudo cargar la lista de personal.", "error");
    }

    // 2. Cargar datos principales (Horarios)
    const dataHorarios = await manejarSolicitud("/api/disponibilidad/disponibilidades", {}, "Error al cargar horarios");
    if (dataHorarios.success && Array.isArray(dataHorarios.datos)) {
      horarios = dataHorarios.datos.map(normalizarHorario);
      horariosFiltrados = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      horarios = [];
      renderTabla();
    }
  } catch (err) {
    console.error("Error cargando datos iniciales:", err);
  }
}

/**
 * Función genérica para guardar (Crear/Editar)
 */
async function guardarHorario(method, url, data) {
  try {
    const res = await manejarSolicitud(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, "Error al guardar horario");

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
async function cambiarEstadoHorario(id, estadoActual) {
    const nuevoEstado = !estadoActual;
    const confirmacion = confirm(`¿Seguro que deseas ${nuevoEstado ? 'activar' : 'desactivar'} este horario?`);
    if (!confirmacion) return;

    try {
        const res = await manejarSolicitud(`/api/disponibilidad/disponibilidades/${id}/estado`, {
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
 * Elimina un horario
 */
async function eliminarHorario(id) {
    if (!confirm(`¿Seguro que deseas eliminar este registro de horario?`)) return;

    try {
        const res = await manejarSolicitud(`/api/disponibilidad/disponibilidades/${id}`, {
            method: 'DELETE',
        }, "Error al eliminar horario");
        
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
    horariosFiltrados = null;
  } else {
    horariosFiltrados = horarios.filter(h => 
      String(h.idDisponibilidad).toLowerCase().includes(termino) ||
      h.diaSemana.toLowerCase().includes(termino)
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

    // Filtrar por ID o por Día de la Semana
    const sugerencias = horarios.filter(h => 
        String(h.idDisponibilidad).toLowerCase().startsWith(termino) ||
        h.diaSemana.toLowerCase().startsWith(termino)
    ).slice(0, 5); 

    if (sugerencias.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    // Evitar duplicados (ej. si buscan "Lunes" y hay 5 horarios el Lunes)
    const diasUnicos = [...new Map(sugerencias.map(item =>
      [item.diaSemana, item])).values()];

    diasUnicos.forEach(h => {
        const item = document.createElement("div");
        item.className = "sugerencia-item";
        item.textContent = h.diaSemana.toLowerCase().startsWith(termino) ? h.diaSemana : `ID: ${h.idDisponibilidad}`;
        
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
    cargarDatosIniciales();
});