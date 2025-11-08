// ================== VARIABLES GLOBALES ==================
let pagos = [];
let pagosFiltrados = null;
let metodosDePago = []; // Almacenará los métodos de pago
let paginaActual = 1;
const elementosPorPagina = 10;

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");
// El modal se crea dinámicamente

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API de Pagos
 */
function normalizarPago(item) {
  return {
    id: item.idPago,
    montoTotal: parseFloat(item.montoTotal).toFixed(2),
    // Formatear fecha para la tabla
    f_transaccion_tabla: new Date(item.f_transaccion).toLocaleString('es-PE', { hour12: true, timeZone: 'America/Lima' }),
    // Formatear fecha para el modal (YYYY-MM-DDTHH:MM)
    f_transaccion_modal: item.f_transaccion ? item.f_transaccion.slice(0, 16) : "",
    numTarjeta: item.numTarjeta || "N/A",
    estadoPago: item.estadoPago, // "Completado", "Pendiente", etc.
    vigenciaPago: item.vigenciaPago === true || item.vigenciaPago === 1,
    idMetodo: item.idMetodo,
    nombMetodo: item.nombMetodo || "N/A", // Nombre del método (del JOIN)
    idReserva: item.idReserva
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
  const lista = pagosFiltrados ?? pagos;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay pagos para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const pagosPagina = lista.slice(inicio, fin);

  pagosPagina.forEach((pago, index) => {
    const esVigente = pago.vigenciaPago;
    const botonColor = esVigente ? "btn-orange" : "btn-success";
    const rotacion = esVigente ? "" : "transform: rotate(180deg);";
    const tituloBoton = esVigente ? 'Anular (Dar de baja)' : 'Reactivar';

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${pago.id}</td>
      <td class="col-monto">S/ ${pago.montoTotal}</td>
      <td class="col-fechaPago">${pago.f_transaccion_tabla}</td>
      <td class="col-estadoPago">${pago.estadoPago}</td>
      <td class="col-metodoPago">${pago.nombMetodo}</td>
      <td class="col-reserva">${pago.idReserva}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${pago.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="abrirModalFormulario('editar', ${pago.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarVigenciaPago(${pago.id}, ${esVigente})" title="${tituloBoton}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarPago(${pago.id})" title="Eliminar">
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
  const totalPaginas = Math.ceil((pagosFiltrados ?? pagos).length / elementosPorPagina);
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
                <label for="modalReserva" class="form-label">ID de Reserva</label>
                <input type="number" id="modalReserva" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalMonto" class="form-label">Monto Total (S/)</label>
                <input type="number" id="modalMonto" class="form-control" step="0.01" required>
              </div>
              <div class="mb-3">
                <label for="modalFecha" class="form-label">Fecha de Transacción</label>
                <input type="datetime-local" id="modalFecha" class="form-control" required>
              </div>
              <div class="mb-3">
                <label for="modalMetodo" class="form-label">Método de Pago</label>
                <select id="modalMetodo" class="form-control" required>
                  <option value="">Cargando...</option>
                </select>
              </div>
              <div class="mb-3">
                <label for="modalNumTarjeta" class="form-label">Número de Tarjeta (Opcional)</label>
                <input type="text" id="modalNumTarjeta" class="form-control" placeholder="Ej: 4550...1234">
              </div>
              <div class="mb-3">
                <label for="modalEstado" class="form-label">Estado del Pago</label>
                <select id="modalEstado" class="form-control" required>
                  <option value="">Seleccionar...</option>
                  <option value="Pendiente">Pendiente</option>
                  <option value="Completado">Completado</option>
                  <option value="Cancelado">Cancelado</option>
                  <option value="Reembolsado">Reembolsado</option>
                </select>
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
 * Rellena el <select> de Métodos de Pago
 */
function popularMetodosSelect(idSeleccionado = null) {
    const select = document.getElementById("modalMetodo");
    select.innerHTML = '<option value="">Seleccionar método...</option>';
    
    metodosDePago.filter(m => m.estadoMetodo === true).forEach(m => {
        const option = document.createElement("option");
        option.value = m.idMetodo;
        option.textContent = m.nombMetodo;
        select.appendChild(option);
    });
    
    if (idSeleccionado) {
        select.value = idSeleccionado;
    }
}

/**
 * Controla el modal para 'agregar', 'editar' y 'ver'
 */
async function abrirModalFormulario(modo, idPago = null) {
  if (metodosDePago.length === 0) {
      mostrarAlerta("Error: No se cargaron los métodos de pago.", "error");
      return;
  }

  const form = document.getElementById("formModal");
  const footer = document.getElementById("modalFormularioFooter");
  footer.innerHTML = "";

  const campos = {
      titulo: document.getElementById("modalFormularioTitulo"),
      reserva: document.getElementById("modalReserva"),
      monto: document.getElementById("modalMonto"),
      fecha: document.getElementById("modalFecha"),
      metodo: document.getElementById("modalMetodo"),
      tarjeta: document.getElementById("modalNumTarjeta"),
      estado: document.getElementById("modalEstado"),
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
  let pago = null;

  if (modo === "agregar") {
    campos.titulo.textContent = "Agregar Pago";
    popularMetodosSelect(); // Llenar el select
    footer.appendChild(btnCerrar);
    footer.appendChild(btnGuardar);
    
  } else if (modo === "editar" || modo === "ver") {
    
    try {
        const res = await manejarSolicitud(`/api/pago/pagos/${idPago}`, {}, "Error al cargar pago");
        pago = normalizarPago(res.datos); // Normalizamos el dato único
    } catch (err) { return; }
        
    if (!pago) return;

    campos.titulo.textContent = modo === 'editar' ? "Editar Pago" : "Detalle del Pago";
    
    popularMetodosSelect(pago.idMetodo); // Llenar y seleccionar

    // Llenar formulario
    campos.reserva.value = pago.idReserva;
    campos.monto.value = pago.montoTotal;
    campos.fecha.value = pago.f_transaccion_modal;
    campos.tarjeta.value = pago.numTarjeta === "N/A" ? "" : pago.numTarjeta;
    campos.estado.value = pago.estadoPago;

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
          idReserva: campos.reserva.value,
          montoTotal: campos.monto.value,
          f_transaccion: campos.fecha.value,
          idMetodo: campos.metodo.value,
          numTarjeta: campos.tarjeta.value || null,
          estadoPago: campos.estado.value,
          vigenciaPago: true // Al crear/editar, se asume vigente
      };

      if (modo === "agregar") {
          await guardarPago('POST', '/api/pago/pagos', data);
      } else if (modo === "editar") {
          data.vigenciaPago = pago.vigenciaPago; 
          await guardarPago('PUT', `/api/pago/pagos/${idPago}`, data);
      }
  };

  abrirModal("modalFormulario");
}


// ================== CRUD (API Fetch) ==================

/**
 * Carga los datos iniciales (Métodos de Pago y Pagos)
 */
async function cargarDatosIniciales() {
  try {
    // 1. Cargar dependencias (Métodos de Pago)
    const dataMetodos = await manejarSolicitud("/api/metodo-pago/metodos", {}, "Error al cargar métodos de pago");
    if (dataMetodos.success) {
      metodosDePago = dataMetodos.datos;
    } else {
      mostrarAlerta("Error fatal: No se pudieron cargar los métodos de pago.", "error");
    }

    // 2. Cargar datos principales (Pagos)
    const dataPagos = await manejarSolicitud("/api/pago/pagos", {}, "Error al cargar pagos");
    if (dataPagos.success && Array.isArray(dataPagos.datos)) {
      pagos = dataPagos.datos.map(normalizarPago);
      pagosFiltrados = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      pagos = [];
      renderTabla();
    }
  } catch (err) {
    console.error("Error cargando datos iniciales:", err);
  }
}

/**
 * Función genérica para guardar (Crear/Editar)
 */
async function guardarPago(method, url, data) {
  try {
    const res = await manejarSolicitud(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }, "Error al guardar el pago");

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
 * Cambia el estado (Vigencia)
 */
async function cambiarVigenciaPago(id, vigenciaActual) {
    const nuevaVigencia = !vigenciaActual;
    const confirmacion = confirm(`¿Seguro que deseas ${nuevaVigencia ? 'reactivar' : 'anular'} este pago?`);
    if (!confirmacion) return;

    try {
        const res = await manejarSolicitud(`/api/pago/pagos/${id}/estado`, {
            method: 'PATCH',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevaVigencia }), // La API espera 'estado' (para vigenciaPago)
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
 * Elimina un pago
 */
async function eliminarPago(id) {
    if (!confirm(`¿Seguro que deseas eliminar el registro de pago ID: ${id}?`)) return;

    try {
        const res = await manejarSolicitud(`/api/pago/pagos/${id}`, {
            method: 'DELETE',
        }, "Error al eliminar el pago");
        
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
    pagosFiltrados = null;
  } else {
    // Buscar por ID de Pago o ID de Reserva
    pagosFiltrados = pagos.filter(p => 
      String(p.id).toLowerCase().includes(termino) ||
      String(p.idReserva).toLowerCase().includes(termino)
    );
  }
  paginaActual = 1;
  renderTabla();
  contenedorSugerencias.style.display = "none";
});

// Botón de Agregar (Formulario principal)
document.getElementById("formDocumento").addEventListener("submit", (e) => {
    e.preventDefault();
    abrirModalFormulario("agregar");
});


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

// 
// === INICIO: BLOQUE DE SUGERENCIAS  ===

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

    // Filtrar por ID de Pago o ID de Reserva
    const sugerencias = pagos.filter(p => 
        String(p.id).toLowerCase().startsWith(termino) ||
        String(p.idReserva).toLowerCase().startsWith(termino)
    ).slice(0, 5); 

    if (sugerencias.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    sugerencias.forEach(p => {
        const item = document.createElement("div");
        item.className = "sugerencia-item";
        item.textContent = `Pago ID: ${p.id} (Reserva ID: ${p.idReserva})`;
        
        item.onclick = () => {
            inputBusqueda.value = p.id; // Autocompleta con el ID del PAGO
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


// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    crearModalFormulario(); 
    cargarDatosIniciales(); // Carga métodos de pago y luego los pagos
});