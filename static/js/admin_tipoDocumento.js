// ================== VARIABLES GLOBALES ==================
let documentos = [];
let documentosFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 5;
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API a una estructura consistente.
 */
function normalizarDocumento(item) {
  return {
    idTipoDocumento: item.idTipoDocumento ?? item.id ?? null,
    nombDocumento: item.nombDocumento ?? item.nombre ?? "",
    abreviatura: item.abreviatura ?? "",
    estadoDocumento:
      item.estadoDocumento === true ||
      item.estadoDocumento === 1 ||
      item.estadoDocumento === "activo",
  };
}

// ================== RENDERIZAR TABLA ==================
function renderTabla() {
  tabla.innerHTML = "";
  const lista = documentosFiltrados ?? documentos;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay documentos para mostrar.</td></tr>';
    renderPaginacion(0); // Renderiza paginación vacía
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const docsPagina = lista.slice(inicio, fin);

  docsPagina.forEach((doc, index) => {
    const esActivo = doc.estadoDocumento === true;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const tituloBoton = esActivo ? 'Dar de baja' : 'Dar de alta';

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${doc.nombDocumento}</td>
      <td class="col-abreviatura">${doc.abreviatura}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDocumento(${doc.idTipoDocumento})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarDocumento(${doc.idTipoDocumento})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstadoDocumento(${doc.idTipoDocumento}, ${esActivo})" title="${tituloBoton}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarDocumento(${doc.idTipoDocumento})" title="Eliminar">
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
    if (!disabled) {
        btn.onclick = () => cambiarPagina(numero);
    }
    btn.innerHTML = texto || numero;
    li.appendChild(btn);
    return li;
  };

  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));

  const start = Math.max(1, paginaActual - 2);
  const end = Math.min(totalPaginas, paginaActual + 2);

  if (start > 1) {
    ul.appendChild(crearItem(1, paginaActual === 1));
    if (start > 2) ul.appendChild(crearItem(null, false, true, "..."));
  }

  for (let i = start; i <= end; i++) {
    ul.appendChild(crearItem(i, paginaActual === i));
  }

  if (end < totalPaginas) {
    if (end < totalPaginas - 1) ul.appendChild(crearItem(null, false, true, "..."));
    ul.appendChild(crearItem(totalPaginas, paginaActual === totalPaginas));
  }

  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  const totalPaginas = Math.ceil((documentosFiltrados ?? documentos).length / elementosPorPagina);
  if (pagina < 1 || pagina > totalPaginas) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== MODALES (Creación dinámica) ==================

// Creamos el HTML del modal una sola vez
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
                <label for="modalNombre" class="form-label">Nombre del Documento</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalAbreviatura" class="form-label">Abreviatura</label>
                <input type="text" id="modalAbreviatura" class="form-control" required>
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
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("activo");
}

function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("activo");
}

function abrirModalFormulario(modo, doc = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const inputAbreviatura = document.getElementById("modalAbreviatura");
  const form = document.getElementById("formModalDocumento");
  const footer = document.getElementById("modalFormularioFooter");

  // Limpiar pie de página y listeners
  footer.innerHTML = "";
  form.onsubmit = null;
  inputNombre.disabled = false;
  inputAbreviatura.disabled = false;

  // Botón genérico de Guardar
  const btnGuardar = document.createElement("button");
  btnGuardar.type = "submit";
  btnGuardar.className = "btn-modal btn-modal-primary";
  btnGuardar.textContent = "Guardar";

  // Botón genérico de Cerrar
  const btnCerrar = document.createElement("button");
  btnCerrar.type = "button";
  btnCerrar.className = "btn-modal btn-modal-secondary"; // Asegúrate de tener este estilo
  btnCerrar.textContent = "Cerrar";
  btnCerrar.onclick = () => cerrarModal("modalFormulario");

  if (modo === "agregar") {
    titulo.textContent = "Agregar Tipo de Documento";
    inputNombre.value = "";
    inputAbreviatura.value = "";

    footer.appendChild(btnCerrar);
    footer.appendChild(btnGuardar);
    
    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        nombDocumento: inputNombre.value.trim(),
        abreviatura: inputAbreviatura.value.trim(),
        estadoDocumento: true // Siempre se crea como activo
      };
      await guardarDocumento("POST", "/api/tipoDocumento/documentos", data);
    };

  } else if (modo === "editar" && doc) {
    titulo.textContent = "Editar Tipo de Documento";
    inputNombre.value = doc.nombDocumento;
    inputAbreviatura.value = doc.abreviatura;
    
    footer.appendChild(btnCerrar);
    footer.appendChild(btnGuardar);

    form.onsubmit = async (e) => {
      e.preventDefault();
      const data = {
        nombDocumento: inputNombre.value.trim(),
        abreviatura: inputAbreviatura.value.trim(),
        estadoDocumento: doc.estadoDocumento // Mantenemos el estado que ya tenía
      };
      await guardarDocumento("PUT", `/api/tipoDocumento/documentos/${doc.idTipoDocumento}`, data);
    };

  } else if (modo === "ver" && doc) {
    titulo.textContent = "Detalle del Documento";
    inputNombre.value = doc.nombDocumento;
    inputAbreviatura.value = doc.abreviatura;
    inputNombre.disabled = true;
    inputAbreviatura.disabled = true;

    footer.appendChild(btnCerrar); // Solo botón de cerrar
  }

  abrirModal("modalFormulario");
}

// ================== CRUD (API Fetch) ==================

/**
 * Función genérica para guardar (Crear/Editar)
 */
async function guardarDocumento(method, url, data) {
  try {
    const respuesta = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const res = await respuesta.json();

    if (res.success) {
      mostrarAlerta(res.mensaje || "Operación exitosa", "success");
      cerrarModal("modalFormulario");
      await cargarDocumentosDesdeBD(); // Recargar datos
    } else {
      mostrarAlerta(res.mensaje || "Error en la operación", "error");
    }
  } catch (err) {
    console.error("Error guardando:", err);
    mostrarAlerta("Error de conexión con la API", "error");
  }
}

/**
 * Cargar todos los documentos desde la API
 */
async function cargarDocumentosDesdeBD() {
  try {
    const respuesta = await fetch("/api/tipoDocumento/documentos");
    const data = await respuesta.json();
    if (data.success && Array.isArray(data.datos)) {
      documentos = data.datos.map(normalizarDocumento);
      documentosFiltrados = null; // Resetear filtro
      inputBusqueda.value = ""; // Limpiar búsqueda
      paginaActual = 1;
      renderTabla();
    } else {
      documentos = [];
      renderTabla();
      mostrarAlerta(data.mensaje || "No se pudieron cargar los documentos", "error");
    }
  } catch (err) {
    console.error("Error cargando documentos:", err);
    mostrarAlerta("Error de conexión con la API", "error");
  }
}

// Funciones wrapper para los botones
function verDocumento(id) {
    const doc = documentos.find((d) => d.idTipoDocumento === id);
    if (doc) abrirModalFormulario("ver", doc);
}

function editarDocumento(id) {
    const doc = documentos.find((d) => d.idTipoDocumento === id);
    if (doc) abrirModalFormulario("editar", doc);
}

async function cambiarEstadoDocumento(id, estadoActual) {
    const nuevoEstado = !estadoActual;
    const confirmacion = confirm(`¿Seguro que deseas ${nuevoEstado ? 'activar' : 'desactivar'} este documento?`);
    if (!confirmacion) return;

    try {
        const respuesta = await fetch(`/api/tipoDocumento/documentos/${id}/estado`, {
            method: 'PATCH',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estadoDocumento: nuevoEstado }),
        });
        const res = await respuesta.json();
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarDocumentosDesdeBD(); // Recargar
        } else {
            mostrarAlerta(res.mensaje, "error");
        }
    } catch (err) {
        console.error("Error cambiando estado:", err);
        mostrarAlerta("Error de conexión con la API", "error");
    }
}

async function eliminarDocumento(id) {
    const doc = documentos.find((d) => d.idTipoDocumento === id);
    if (!doc) return;
    
    if (!confirm(`¿Seguro que deseas eliminar el documento "${doc.nombDocumento}"?`)) return;

    try {
        const respuesta = await fetch(`/api/tipoDocumento/documentos/${id}`, {
            method: 'DELETE',
        });
        const res = await respuesta.json();
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarDocumentosDesdeBD(); // Recargar
        } else {
            mostrarAlerta(res.mensaje, "error");
        }
    } catch (err) {
        console.error("Error eliminando:", err);
        mostrarAlerta("Error de conexión con la API", "error");
    }
}


// ================== BUSQUEDA Y AUTOCOMPLETADO ==================
const contenedorSugerencias = document.createElement("div");
contenedorSugerencias.id = "sugerenciasContainer";
document.body.appendChild(contenedorSugerencias); // Se añade al body

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

  const sugerencias = documentos.filter(d => 
      d.nombDocumento.toLowerCase().startsWith(termino) ||
      d.abreviatura.toLowerCase().startsWith(termino)
  );

  if (sugerencias.length === 0) {
    contenedorSugerencias.style.display = "none";
    return;
  }

  sugerencias.forEach(doc => {
    const item = document.createElement("div");
    item.textContent = `${doc.nombDocumento} (${doc.abreviatura})`;
    item.className = 'sugerencia-item'; // Clase para CSS
    item.onclick = () => {
      inputBusqueda.value = doc.nombDocumento;
      contenedorSugerencias.style.display = "none";
      // Opcional: filtrar inmediatamente al hacer clic
      // document.getElementById("btn_buscar").click();
    };
    contenedorSugerencias.appendChild(item);
  });

  contenedorSugerencias.style.display = "block";
  posicionarSugerencias();
});

// Ocultar sugerencias si se hace clic fuera
document.addEventListener("click", (e) => {
  if (!contenedorSugerencias.contains(e.target) && e.target !== inputBusqueda) {
    contenedorSugerencias.style.display = "none";
  }
});

// Reposicionar con scroll y resize
window.addEventListener("resize", posicionarSugerencias);
window.addEventListener("scroll", posicionarSugerencias, true); // Usar captura

// Botón de Búsqueda (Filtro local)
document.getElementById("btn_buscar").addEventListener("click", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  if (termino === "") {
    documentosFiltrados = null;
  } else {
    documentosFiltrados = documentos.filter(d => 
      d.nombDocumento.toLowerCase().includes(termino) ||
      d.abreviatura.toLowerCase().includes(termino)
    );
  }
  paginaActual = 1;
  renderTabla();
  contenedorSugerencias.style.display = "none"; // Ocultar sugerencias
});

// Botón de Agregar (Formulario principal)
document.getElementById("btn_guardar").addEventListener("click", () => {
    abrirModalFormulario("agregar");
});
// Evitar que el form principal se envíe
document.getElementById("formDocumento").addEventListener("submit", (e) => e.preventDefault());


// ================== NOTIFICACIONES (Alertas) ==================
function mostrarAlerta(mensaje, tipo = "success") {
    const alerta = document.createElement("div");
    alerta.className = `alerta-toast ${tipo}`; // 'success' o 'error'
    alerta.textContent = mensaje;
    
    document.body.appendChild(alerta);

    // Mostrar
    setTimeout(() => alerta.classList.add("mostrar"), 10);
    
    // Ocultar y eliminar
    setTimeout(() => {
        alerta.classList.remove("mostrar");
        setTimeout(() => alerta.remove(), 500); // Esperar a que termine la transición
    }, 3000);
}


// ================== INICIALIZACIÓN ==================
// Crear el modal en el DOM al cargar la página
crearModalFormulario(); 
// Cargar los datos iniciales
cargarDocumentosDesdeBD();