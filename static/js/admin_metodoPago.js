// ================== VARIABLES GLOBALES ==================
let metodos = []; 
let metodosFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: 'nombre', ascendente: true };

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");
// El modal se crea dinámicamente

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API
 */
function normalizar(met) {
  const id = met.idMetodo;
  const nombre = met.nombMetodo ?? "";
  const estado = met.estadoMetodo === true || met.estadoMetodo === 1;
  return { id, nombre, estado };
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

/**
 * Carga los datos iniciales (Métodos de Pago)
 */
const cargarDatosIniciales = async () => {
  try {
    // Apunta a la nueva API RESTful
    const data = await manejarSolicitud("/api/pago-metodo/metodos", {}, "Error al obtener métodos de pago");
    
    // Espera { success: true, datos: [...] }
    if (data.success && Array.isArray(data.datos)) {
        metodos = data.datos.map(normalizar);
    } else {
        metodos = [];
    }
    
    metodosFiltrados = null;
    inputBusqueda.value = "";
    paginaActual = 1;
    renderTabla();
  } catch (err) {
    console.error("Error cargando métodos de pago:", err);
  }
};

function existeMetodo(nombre, idIgnorar = null) {
  return metodos.some(doc =>
    doc.nombre.toLowerCase() === nombre.toLowerCase() && doc.id !== idIgnorar
  );
}

function renderTabla() {
  tabla.innerHTML = "";
  const lista = metodosFiltrados ?? metodos;

  if (ordenActual.campo) {
    lista.sort((a, b) => {
      const campo = ordenActual.campo;
      const valorA = (a[campo] || "").toString().toLowerCase();
      const valorB = (b[campo] || "").toString().toLowerCase();
      if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
      if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
      return 0;
    });
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const documentosPagina = lista.slice(inicio, fin);

  if (documentosPagina.length === 0 && paginaActual === 1) {
    tabla.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay métodos de pago para mostrar.</td></tr>';
  }

  documentosPagina.forEach((doc, index) => {
    const esActivo = doc.estado === true;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const tituloBoton = esActivo ? 'Dar de baja' : 'Dar de alta';

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${doc.id}</td>
      <td class="col-nombre">${escapeHtml(doc.nombre)}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDetalle(${doc.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarMetodo(${doc.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${doc.id}, ${esActivo})" title="${tituloBoton}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarMetodo(${doc.id})" title="Eliminar">
            <img src="/static/img/x.png" alt="eliminar">
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });

  renderPaginacion(lista.length);
}

const escapeHtml = text =>
  String(text || "").replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));

const renderPaginacion = (totalElementos) => {
  paginacion.innerHTML = "";
  const totalPaginas = Math.ceil(totalElementos / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";
  // ... (código de paginación idéntico) ...
  const crearItem = (numero, activo, disabled, texto) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${numero})">${texto || numero}</button>`;
    return li;
  };
  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));
  for (let i = 1; i <= totalPaginas; i++) ul.appendChild(crearItem(i, paginaActual === i));
  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
};

function cambiarPagina(pagina) {
  const total = Math.ceil((metodosFiltrados ?? metodos).length / elementosPorPagina);
  if (pagina < 1 || pagina > total) return;
  paginaActual = pagina;
  renderTabla();
}

/**
 * Función genérica para guardar (Crear/Editar)
 */
async function guardarMetodo(method, url, data) {
  try {
    const res = await manejarSolicitud(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, "Error al guardar método");

    if (res.success) {
      mostrarAlerta(res.mensaje, "success");
      cerrarModal("modalFormulario");
      await cargarDatosIniciales();
    }
  } catch (err) {
    // El manejador ya mostró la alerta
  }
}

const eliminarMetodo = async id => {
  if (!confirm("¿Está seguro de eliminar este metodo de pago?")) return;
  try {
    const res = await manejarSolicitud(`/api/pago-metodo/metodos/${id}`, { method: "DELETE" }, "Error al eliminar método");
    if (res.success) {
        mostrarAlerta(res.mensaje, "success");
        cargarDatosIniciales();
    }
  } catch (err) {
     // El manejador ya mostró la alerta
  }
};

async function darDeBaja(id, estadoActual) {
  try {
    const nuevoEstado = !estadoActual;
    const res = await manejarSolicitud(`/api/pago-metodo/metodos/${id}/estado`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    }, "Error al cambiar estado");
    
    if (res.success) {
        mostrarAlerta(res.mensaje, "success");
        cargarDatosIniciales();
    }
  } catch (err) {
    // El manejador ya mostró la alerta
  }
}

// ===== BÚSQUEDA (Filtro Local) =====
const inputMetodo = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", () => {
  const termino = inputMetodo.value.trim().toLowerCase();
  if (termino === "") {
    metodosFiltrados = null;
  } else {
    metodosFiltrados = metodos.filter(m => 
        m.nombre.toLowerCase().includes(termino)
    );
  }
  paginaActual = 1;
  renderTabla();
  contenedorSugerencias.style.display = "none";
});

function crearModal() {
  // Esta función ya no es necesaria si solo usamos un modal
  return null;
}

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
            <form id="formModalDocumento">
              <div class="mb-3">
                <label for="modalNombre" class="form-label">Nombre del metodo de pago</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-modal btn-modal-primary" id="btnGuardar">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
  return document.getElementById("modalFormulario");
}

function abrirModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.add('activo');
}

function cerrarModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('activo');
}

async function abrirModalFormulario(modo, doc = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalDocumento");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  form.onsubmit = null;
  botonGuardar.onclick = null;
  modalFooter.innerHTML = "";
  botonGuardar.textContent = "Aceptar";
  botonGuardar.type = "submit";
  botonGuardar.classList.remove("d-none");
  modalFooter.appendChild(botonGuardar);
  inputNombre.disabled = false;

  if (modo === "agregar") {
    titulo.textContent = "Agregar metodo de pago";
    inputNombre.value = "";
    form.onsubmit = e => {
      e.preventDefault();
      const nombre = inputNombre.value.trim();
      if (!nombre) return mostrarAlerta("Complete todos los campos", "error");
      if (existeMetodo(nombre)) return mostrarAlerta("Ya existe un metodo de pago con ese nombre", "error");
      
      guardarMetodo('POST', '/api/pago-metodo/metodos', { nombMetodo: nombre, estadoMetodo: true });
    };
  } else if (modo === "editar" && doc) {
    titulo.textContent = "Editar metodo de metodo de pago";
    inputNombre.value = doc.nombre;
    form.onsubmit = e => {
      e.preventDefault();
      const nombre = inputNombre.value.trim();
      if (!nombre) return mostrarAlerta("Complete todos los campos", "error");
      if (existeMetodo(nombre, doc.id)) return mostrarAlerta("Ya existe un metodo de pago con ese nombre", "error");
      
      guardarMetodo('PUT', `/api/pago-metodo/metodos/${doc.id}`, { nombMetodo: nombre });
    };
  } else if (modo === "ver" && doc) {
    titulo.textContent = "Detalle del metodo de pago";
    inputNombre.value = doc.nombre;
    inputNombre.disabled = true;
    
    // Cambiar botón a "Cerrar"
    botonGuardar.textContent = "Cerrar";
    botonGuardar.type = "button";
    botonGuardar.onclick = (e) => { e.preventDefault(); cerrarModal("modalFormulario"); };
  }

  abrirModal("modalFormulario");
}

function editarMetodo(id) {
  const doc = metodos.find(d => d.id === id);
  if (doc) abrirModalFormulario("editar", doc);
}

function verDetalle(id) {
  const doc = metodos.find(d => d.id === id);
  if (doc) abrirModalFormulario("ver", doc);
}

document.querySelectorAll("#tablaDocumentos thead th").forEach((th, index) => {
  th.style.cursor = "pointer";
  th.addEventListener("click", () => {
    let campo;
    if (index === 1) campo = "nombre";
    else return;
    if (ordenActual.campo === campo) ordenActual.ascendente = !ordenActual.ascendente;
    else { ordenActual.campo = campo; ordenActual.ascendente = true; }
    renderTabla();
  });
});

// ===== Botón agregar =====
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

    // Filtrar por nombre de método
    const sugerencias = metodos.filter(m => 
        m.nombre.toLowerCase().startsWith(termino)
    ).slice(0, 5); 

    if (sugerencias.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    sugerencias.forEach(m => {
        const item = document.createElement("div");
        item.className = "sugerencia-item";
        item.textContent = m.nombre;
        
        item.onclick = () => {
            inputBusqueda.value = m.nombre;
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

// ===== Carga inicial =====
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosIniciales();
});