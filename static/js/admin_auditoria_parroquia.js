// ================== VARIABLES GLOBALES ==================
let eventos = []; // Usamos 'eventos' para diferenciar de 'logs' y 'registros'
let eventosFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 10;

// Referencias del DOM
const tabla = document.querySelector("#tablaAuditoria tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputBusqueda");
// El contenedor de sugerencias se crea dinámicamente

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
function normalizarEvento(item) {
  return {
    idAuditoria: item.idAuditoria,
    fechaHora: item.fechaHora,
    fechaHoraFormateada: formatarFecha(item.fechaHora),
    nombreTabla: item.nombreTabla,
    tipoAccion: item.tipoAccion,
    idRegistroAfectado: item.idRegistroAfectado,
    nombreCampo: item.nombreCampo || "---",
    valorAnterior: item.valorAnterior || "N/A",
    valorNuevo: item.valorNuevo || "N/A"
  };
}

// ================== RENDERIZAR TABLA ==================
function renderTabla() {
  tabla.innerHTML = "";
  const lista = eventosFiltrados ?? eventos;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay eventos de auditoría para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const eventosPagina = lista.slice(inicio, fin);

  eventosPagina.forEach((evento, index) => {
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-fecha">${evento.fechaHoraFormateada}</td>
      <td class="col-tabla">${evento.nombreTabla}</td>
      <td class="col-accion">${evento.tipoAccion}</td>
      <td class="col-id-afectado">${evento.idRegistroAfectado}</td>
      <td class="col-campo">${evento.nombreCampo}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${evento.idAuditoria})" title="Ver Detalles">
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
  for (let i = 1; i <= totalPaginas; i++) {
    ul.appendChild(crearItem(i, paginaActual === i));
  }
  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  const totalPaginas = Math.ceil((eventosFiltrados ?? eventos).length / elementosPorPagina);
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

async function abrirModalFormulario(modo, idAuditoria) {
  if (modo !== 'ver') return;

  const evento = await cargarEventoPorId(idAuditoria);
  if (!evento) {
      mostrarAlerta("No se pudo cargar el registro", "error");
      return;
  }

  document.getElementById("modalFecha").value = formatarFecha(evento.fechaHora);
  document.getElementById("modalTabla").value = evento.nombreTabla;
  document.getElementById("modalAccion").value = evento.tipoAccion;
  document.getElementById("modalIdAfectado").value = evento.idRegistroAfectado;
  document.getElementById("modalCampo").value = evento.nombreCampo || "---";
  document.getElementById("modalValorAnterior").value = evento.valorAnterior || "N/A";
  document.getElementById("modalValorNuevo").value = evento.valorNuevo || "N/A";

  abrirModal("modalFormulario");
}

// ================== API Fetch ==================

/**
 * Carga los datos iniciales
 */
async function cargarEventosDesdeBD() {
  try {
    // Apunta a la API de parroquias
    const respuesta = await fetch("/api/auditoria/parroquias");
    const data = await respuesta.json();
    if (data.success && Array.isArray(data.datos)) {
      eventos = data.datos.map(normalizarEvento);
      eventosFiltrados = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      eventos = [];
      renderTabla();
      mostrarAlerta(data.mensaje || "No se pudieron cargar los registros", "error");
    }
  } catch (err) {
    console.error("Error cargando eventos:", err);
    mostrarAlerta("Error de conexión con la API", "error");
  }
}

/**
 * Carga un evento por ID (para el modal)
 */
async function cargarEventoPorId(id) {
    try {
        // Apunta a la API de parroquias
        const respuesta = await fetch(`/api/auditoria/parroquias/${id}`);
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

// Botón de Búsqueda (Filtro local)
const btnBuscar = document.getElementById("btn_buscar");
btnBuscar.addEventListener("click", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  if (termino === "") {
    eventosFiltrados = null;
  } else {
    eventosFiltrados = eventos.filter(e => 
      e.nombreTabla.toLowerCase().includes(termino) ||
      e.tipoAccion.toLowerCase().includes(termino) ||
      String(e.idRegistroAfectado).includes(termino) ||
      (e.nombreCampo && e.nombreCampo.toLowerCase().includes(termino))
    );
  }
  paginaActual = 1;
  renderTabla();
  contenedorSugerencias.style.display = "none"; // Ocultar sugerencias
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

    const sugerencias = eventos.filter(e => 
        e.nombreTabla.toLowerCase().startsWith(termino) ||
        e.tipoAccion.toLowerCase().startsWith(termino) ||
        String(e.idRegistroAfectado).toLowerCase().startsWith(termino)
    ).slice(0, 5);

    if (sugerencias.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    // Usamos un Set para mostrar solo sugerencias únicas (ej. "UPDATE", "INSERT")
    const terminosUnicos = new Set();
    const sugerenciasUnicas = [];
    sugerencias.forEach(e => {
        if (e.tipoAccion.toLowerCase().startsWith(termino) && !terminosUnicos.has(e.tipoAccion)) {
            terminosUnicos.add(e.tipoAccion);
            sugerenciasUnicas.push({ valor: e.tipoAccion, texto: e.tipoAccion });
        }
        if (e.nombreTabla.toLowerCase().startsWith(termino) && !terminosUnicos.has(e.nombreTabla)) {
            terminosUnicos.add(e.nombreTabla);
            sugerenciasUnicas.push({ valor: e.nombreTabla, texto: e.nombreTabla });
        }
    });


    sugerenciasUnicas.slice(0, 5).forEach(s => {
        const item = document.createElement("div");
        item.className = "sugerencia-item";
        item.textContent = s.texto;
        
        item.onclick = () => {
            inputBusqueda.value = s.valor;
            contenedorSugerencias.style.display = "none";
            document.getElementById("btn_buscar").click();
        };
        contenedorSugerencias.appendChild(item);
    });

    if(sugerenciasUnicas.length > 0) {
        contenedorSugerencias.style.display = "block";
        posicionarSugerencias();
    } else {
        contenedorSugerencias.style.display = "none";
    }
});

// Listeners para ocultar/reposicionar
document.addEventListener("click", (e) => {
    if (!contenedorSugerencias.contains(e.target) && e.target !== inputBusqueda) {
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
    cargarEventosDesdeBD();
});