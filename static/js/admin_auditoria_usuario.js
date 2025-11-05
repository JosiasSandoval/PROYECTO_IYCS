// ================== VARIABLES GLOBALES ==================
let logs = [];
let logsFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 10; // Las auditorías pueden ser más largas

// Referencias del DOM
const tabla = document.querySelector("#tablaAuditoria tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputBusqueda");
const listaSugerencias = document.getElementById("sugerencias");

// ================== FUNCIONES ==================

/**
 * Formatea la fecha ISO a un formato legible
 */
function formatarFecha(fechaISO) {
    if (!fechaISO) return "N/A";
    const fecha = new Date(fechaISO);
    return fecha.toLocaleString('es-PE', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
}

/**
 * Normaliza los datos venidos de la API
 */
function normalizarLog(item) {
  return {
    idAuditoria: item.idAuditoria,
    fechaHora: item.fechaHora, // Mantenemos ISO para el modal
    fechaHoraFormateada: formatarFecha(item.fechaHora),
    nombreTabla: item.nombreTabla,
    tipoAccion: item.tipoAccion,
    idRegistroAfectado: item.idRegistroAfectado,
    nombreCampo: item.nombreCampo || "---", // Si es NULO
    valorAnterior: item.valorAnterior || "N/A",
    valorNuevo: item.valorNuevo || "N/A"
  };
}

// ================== RENDERIZAR TABLA ==================
function renderTabla() {
  tabla.innerHTML = "";
  const lista = logsFiltrados ?? logs;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay registros de auditoría para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const logsPagina = lista.slice(inicio, fin);

  logsPagina.forEach((log, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-fecha">${log.fechaHoraFormateada}</td>
      <td class="col-tabla">${log.nombreTabla}</td>
      <td class="col-accion">${log.tipoAccion}</td>
      <td class="col-id-afectado">${log.idRegistroAfectado}</td>
      <td class="col-campo">${log.nombreCampo}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${log.idAuditoria})" title="Ver Detalles">
            <img src="/static/img/ojo.png" alt="ver">
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
    if (!disabled) {
        btn.onclick = () => cambiarPagina(numero);
    }
    btn.innerHTML = texto || numero;
    li.appendChild(btn);
    return li;
  };

  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));
  // Simple paginación
  for (let i = 1; i <= totalPaginas; i++) {
    ul.appendChild(crearItem(i, paginaActual === i));
  }
  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  const totalPaginas = Math.ceil((logsFiltrados ?? logs).length / elementosPorPagina);
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
            <h5 class="modal-title" id="modalFormularioTitulo">Detalle de Auditoría</h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalFormulario')">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formModalAuditoria">
              
              <div class="form-grid">
                 <div class="mb-3">
                  <label class="form-label">Fecha y Hora</label>
                  <input type="text" id="modalFecha" class="form-control" disabled>
                </div>
                 <div class="mb-3">
                  <label class="form-label">Tabla Afectada</label>
                  <input type="text" id="modalTabla" class="form-control" disabled>
                </div>
              </div>

              <div class="form-grid">
                 <div class="mb-3">
                  <label class="form-label">Tipo de Acción</label>
                  <input type="text" id="modalAccion" class="form-control" disabled>
                </div>
                 <div class="mb-3">
                  <label class="form-label">ID Registro Afectado</label>
                  <input type="text" id="modalIdAfectado" class="form-control" disabled>
                </div>
              </div>
              
              <div class="mb-3">
                  <label class="form-label">Campo Modificado</label>
                  <input type="text" id="modalCampo" class="form-control" disabled>
              </div>

              <div class="mb-3">
                  <label class="form-label">Valor Anterior</label>
                  <textarea id="modalValorAnterior" class="form-control" rows="4" disabled></textarea>
              </div>

              <div class="mb-3">
                  <label class="form-label">Valor Nuevo</label>
                  <textarea id="modalValorNuevo" class="form-control" rows="4" disabled></textarea>
              </div>

              <div class="modal-footer" id="modalFormularioFooter">
                <button type="button" class="btn-modal btn-modal-secondary" onclick="cerrarModal('modalFormulario')">Cerrar</button>
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
 * Abre el modal de "Ver"
 */
async function abrirModalFormulario(modo, idAuditoria) {
  if (modo !== 'ver') return; // Solo permitimos ver

  const log = await cargarLogPorId(idAuditoria);
  if (!log) {
      mostrarAlerta("No se pudo cargar el registro", "error");
      return;
  }

  // Llenar el formulario del modal
  document.getElementById("modalFecha").value = formatarFecha(log.fechaHora);
  document.getElementById("modalTabla").value = log.nombreTabla;
  document.getElementById("modalAccion").value = log.tipoAccion;
  document.getElementById("modalIdAfectado").value = log.idRegistroAfectado;
  document.getElementById("modalCampo").value = log.nombreCampo || "---";
  document.getElementById("modalValorAnterior").value = log.valorAnterior || "N/A";
  document.getElementById("modalValorNuevo").value = log.valorNuevo || "N/A";

  abrirModal("modalFormulario");
}

// ================== API Fetch ==================

/**
 * Carga los datos iniciales
 */
async function cargarLogsDesdeBD() {
  try {
    const respuesta = await fetch("/api/auditoria/usuarios");
    const data = await respuesta.json();
    if (data.success && Array.isArray(data.datos)) {
      logs = data.datos.map(normalizarLog);
      logsFiltrados = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      logs = [];
      renderTabla();
      mostrarAlerta(data.mensaje || "No se pudieron cargar los registros", "error");
    }
  } catch (err) {
    console.error("Error cargando logs:", err);
    mostrarAlerta("Error de conexión con la API", "error");
  }
}

/**
 * Carga un log por ID (para el modal)
 */
async function cargarLogPorId(id) {
    try {
        const respuesta = await fetch(`/api/auditoria/usuarios/${id}`);
        const res = await respuesta.json();
        if (res.success) {
            return res.datos;
        } else {
            mostrarAlerta(res.mensaje, "error");
            return null;
        }
    } catch (err) {
        mostrarAlerta("Error de conexión con la API", "error");
        return null;
    }
}

// ================== BUSQUEDA Y AUTOCOMPLETADO ==================

inputBusqueda.addEventListener("input", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  listaSugerencias.innerHTML = "";
  listaSugerencias.style.display = "none";

  if (termino.length === 0) {
    return;
  }
  
  // Convertir idRegistroAfectado a string para la búsqueda
  const sugerencias = logs.filter(log => 
      log.nombreTabla.toLowerCase().includes(termino) ||
      log.tipoAccion.toLowerCase().includes(termino) ||
      String(log.idRegistroAfectado).includes(termino)
  ).slice(0, 5); // Limitar a 5

  if (sugerencias.length === 0) {
    return;
  }
  
  // Evitar duplicados en sugerencias (ej. "UPDATE")
  const sugerenciasUnicas = [...new Map(sugerencias.map(item =>
      [item.tipoAccion, item])).values()];

  sugerenciasUnicas.forEach(log => {
    const item = document.createElement("li");
    item.textContent = `${log.tipoAccion} - ${log.nombreTabla} (ID: ${log.idRegistroAfectado})`;
    item.onclick = () => {
      inputBusqueda.value = log.tipoAccion; // Autocompletar con la acción
      listaSugerencias.style.display = "none";
      document.getElementById("btn_buscar").click();
    };
    listaSugerencias.appendChild(item);
  });

  listaSugerencias.style.display = "block";
});

document.addEventListener("click", (e) => {
  if (e.target !== inputBusqueda) {
    listaSugerencias.style.display = "none";
  }
});

// Botón de Búsqueda (Filtro local)
document.getElementById("btn_buscar").addEventListener("click", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  if (termino === "") {
    logsFiltrados = null;
  } else {
    logsFiltrados = logs.filter(log => 
      log.nombreTabla.toLowerCase().includes(termino) ||
      log.tipoAccion.toLowerCase().includes(termino) ||
      String(log.idRegistroAfectado).includes(termino) ||
      (log.nombreCampo && log.nombreCampo.toLowerCase().includes(termino))
    );
  }
  paginaActual = 1;
  renderTabla();
  listaSugerencias.style.display = "none";
});

document.getElementById("formBusqueda").addEventListener("submit", (e) => e.preventDefault());


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


// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    crearModalFormulario(); 
    cargarLogsDesdeBD();
});