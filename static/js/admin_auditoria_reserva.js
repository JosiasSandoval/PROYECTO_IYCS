// ================== VARIABLES GLOBALES ==================
let registros = []; // Terminología cambiada
let registrosFiltrados = null; // Terminología cambiada
let paginaActual = 1;
const elementosPorPagina = 10;

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
function normalizarRegistro(item) { // Terminología cambiada
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
  const lista = registrosFiltrados ?? registros; // Terminología cambiada

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay registros de auditoría para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const registrosPagina = lista.slice(inicio, fin); // Terminología cambiada

  registrosPagina.forEach((registro, index) => { // Terminología cambiada
    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-fecha">${registro.fechaHoraFormateada}</td>
      <td class="col-tabla">${registro.nombreTabla}</td>
      <td class="col-accion">${registro.tipoAccion}</td>
      <td class="col-id-afectado">${registro.idRegistroAfectado}</td>
      <td class="col-campo">${registro.nombreCampo}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${registro.idAuditoria})" title="Ver Detalles">
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
  const totalPaginas = Math.ceil((registrosFiltrados ?? registros).length / elementosPorPagina); // Terminología cambiada
  if (pagina < 1 || pagina > totalPaginas) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== MODALES (Creación dinámica) ==================
// (Esta función es idéntica, ya que el modal se crea en el DOM y se reutiliza)
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

  const registro = await cargarRegistroPorId(idAuditoria); // Terminología cambiada
  if (!registro) {
      mostrarAlerta("No se pudo cargar el registro", "error");
      return;
  }

  document.getElementById("modalFecha").value = formatarFecha(registro.fechaHora);
  document.getElementById("modalTabla").value = registro.nombreTabla;
  document.getElementById("modalAccion").value = registro.tipoAccion;
  document.getElementById("modalIdAfectado").value = registro.idRegistroAfectado;
  document.getElementById("modalCampo").value = registro.nombreCampo || "---";
  document.getElementById("modalValorAnterior").value = registro.valorAnterior || "N/A";
  document.getElementById("modalValorNuevo").value = registro.valorNuevo || "N/A";

  abrirModal("modalFormulario");
}

// ================== API Fetch ==================

/**
 * Carga los datos iniciales
 */
async function cargarRegistrosDesdeBD() { // Terminología cambiada
  try {
    // === CAMBIO CLAVE: Apuntar a la API de reservas ===
    const respuesta = await fetch("/api/auditoria/reservas");
    const data = await respuesta.json();
    if (data.success && Array.isArray(data.datos)) {
      registros = data.datos.map(normalizarRegistro); // Terminología cambiada
      registrosFiltrados = null; // Terminología cambiada
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      registros = []; // Terminología cambiada
      renderTabla();
      mostrarAlerta(data.mensaje || "No se pudieron cargar los registros", "error");
    }
  } catch (err) {
    console.error("Error cargando registros:", err); // Terminología cambiada
    mostrarAlerta("Error de conexión con la API", "error");
  }
}

/**
 * Carga un registro por ID (para el modal)
 */
async function cargarRegistroPorId(id) { // Terminología cambiada
    try {
        // === CAMBIO CLAVE: Apuntar a la API de reservas ===
        const respuesta = await fetch(`/api/auditoria/reservas/${id}`);
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
  
  const sugerencias = registros.filter(reg => // Terminología cambiada
      reg.nombreTabla.toLowerCase().includes(termino) ||
      reg.tipoAccion.toLowerCase().includes(termino) ||
      String(reg.idRegistroAfectado).includes(termino)
  ).slice(0, 5);

  if (sugerencias.length === 0) {
    return;
  }
  
  const sugerenciasUnicas = [...new Map(sugerencias.map(item =>
      [item.tipoAccion, item])).values()];

  sugerenciasUnicas.forEach(reg => { // Terminología cambiada
    const item = document.createElement("li");
    item.textContent = `${reg.tipoAccion} - ${reg.nombreTabla} (ID: ${reg.idRegistroAfectado})`;
    item.onclick = () => {
      inputBusqueda.value = reg.tipoAccion;
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
    registrosFiltrados = null; // Terminología cambiada
  } else {
    registrosFiltrados = registros.filter(reg => // Terminología cambiada
      reg.nombreTabla.toLowerCase().includes(termino) ||
      reg.tipoAccion.toLowerCase().includes(termino) ||
      String(reg.idRegistroAfectado).includes(termino) ||
      (reg.nombreCampo && reg.nombreCampo.toLowerCase().includes(termino))
    );
  }
  paginaActual = 1;
  renderTabla();
  listaSugerencias.style.display = "none";
});

document.getElementById("formBusqueda").addEventListener("submit", (e) => e.preventDefault());

// ================== NOTIFICACIONES (Alertas) ==================
// (Esta función es genérica y se reutiliza)
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
    cargarRegistrosDesdeBD(); // Terminología cambiada
});