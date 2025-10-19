const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

const modalDetalle = crearModal();            
const modalFormulario = crearModalFormulario(); 

let metodos = [];           
let metodosFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

function normalizar(met) {
  const id = met.idMetodo;                   // Campo de la BD
  const nombre = met.nombMetodo ?? "";       // Campo de la BD
  const estado = met.estadoMetodo === true || met.estadoMetodo === 1; // Booleano
  return { id, nombre, estado };
}


const manejarSolicitud = async (url, opciones = {}, mensajeError = "Error") => {
  try {
    const res = await fetch(url, opciones);
    if (!res.ok) throw new Error(mensajeError);
    return await res.json();
  } catch (err) {
    console.error(mensajeError, err);
    alert(mensajeError);
    throw err;
  }
};

const cargarMetodos = async () => {
  try {
    const data = await manejarSolicitud("/api/pago/metodo", {}, "Error al obtener metodos de pago");
    console.log("Datos recibidos de la API:", data); // 🔹 para depuración
    metodos = Array.isArray(data) ? data.map(normalizar) : [];
    metodosFiltrados = null;
    paginaActual = 1;
    renderTabla();
  } catch (err) {
    console.error("Error cargando metodos de pago:", err);
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

  documentosPagina.forEach((doc, index) => {
    const esActivo = doc.estado === true || doc.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${escapeHtml(doc.nombre)}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDetalle(${doc.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarMetodo(${doc.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${doc.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
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

  renderPaginacion();
}

const escapeHtml = text =>
  String(text || "").replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));

const renderPaginacion = () => {
  paginacion.innerHTML = "";
  const total = (metodosFiltrados ?? metodos).length;
  const totalPaginas = Math.ceil(total / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";

  const crearItem = (numero, activo, disabled, texto) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${numero})">${texto || numero}</button>`;
    return li;
  };

  ul.appendChild(crearItem(paginaActual - 1, false, paginaActual === 1, "<"));
  const range = [Math.max(1, paginaActual - 2), Math.min(totalPaginas, paginaActual + 2)];
  if (range[0] > 1) {
    ul.appendChild(crearItem(1, paginaActual === 1));
    if (range[0] > 2) ul.appendChild(crearItem(null, false, true, "..."));
  }
  for (let i = range[0]; i <= range[1]; i++) ul.appendChild(crearItem(i, paginaActual === i));
  if (range[1] < totalPaginas) {
    if (range[1] < totalPaginas - 1) ul.appendChild(crearItem(null, false, true, "..."));
    ul.appendChild(crearItem(totalPaginas, paginaActual === totalPaginas));
  }
  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
};

function cambiarPagina(pagina) {
  const total = Math.ceil((metodosFiltrados ?? metodos).length / elementosPorPagina);
  if (pagina < 1 || pagina > total) return;
  paginaActual = pagina;
  renderTabla();
}

const agregarMetodo = nombre => manejarSolicitud(
  "/api/pago/agregar_metodo",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre }),
  },
  "Error al agregar metodo"
).then(() => cargarMetodos());

const actualizarMetodoAPI = (id, nombre) => manejarSolicitud(
  `/api/pago/actualizar_metodo/${id}`,
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombMetodo: nombre }),
  },
  "Error al actualizar metodo"
).then(() => cargarMetodos());

const eliminarMetodo = async id => {
  if (!confirm("¿Está seguro de eliminar este metodo de pago?")) return;
  try {
    const res = await fetch(`/api/pago/eliminar_metodo/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Error al eliminar el cargo");
    else alert(data.mensaje || "Metodo de pagoeliminado correctamente");
    cargarMetodos();
  } catch (err) {
    console.error("Error al eliminar metodo de pago", err);
    alert("Error inesperado al eliminar el metodo de pago");
  }
};

async function darDeBaja(id) {
  try {
    const doc = metodos.find(d => d.id === id);
    if (!doc) return alert("Metodo de pago no encontrado");
    const nuevoEstado = !doc.estado;
    const res = await fetch(`/api/pago/cambiar_estado_metodo/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error("Error al cambiar estado");
    const data = await res.json();
    doc.estado = data.nuevo_estado === true;
    renderTabla();
  } catch (err) {
    console.error(err);
    alert("Error al actualizar estado");
  }
}

// ===== BÚSQUEDA CORREGIDA =====
const inputMetodo = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");

btnBuscar.addEventListener("click", async () => {
  const termino = inputMetodo.value.trim(); // ✅ corregido
  if (termino === "") {
    metodosFiltrados = null;
    paginaActual = 1;
    renderTabla();
    return;
  }
  try {
    const res = await fetch(`/api/pago/busqueda_metodo/${encodeURIComponent(termino)}`);
    if (res.status === 404) {
      metodosFiltrados = [];
      renderTabla();
      return;
    }
    if (!res.ok) throw new Error("Error en búsqueda");
    const data = await res.json();
    metodosFiltrados = Array.isArray(data) ? data.map(normalizar) : [normalizar(data)];
    paginaActual = 1;
    renderTabla();
  } catch (err) {
    console.error(err);
    alert("Error al buscar metodo de pago");
  }
});

function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Metodo de pago</h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalDetalle')">&times;</button>
          </div>
          <div class="modal-body" id="modalDetalleContenido"></div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
  return document.getElementById("modalDetalle");
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

function abrirModalFormulario(modo, doc = null) {
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
      if (!nombre) return alert("Complete todos los campos");
      if (existeMetodo(nombre)) return alert("Ya existe un metodo de pago con ese nombre");
      agregarMetodo(nombre).then(() => cerrarModal("modalFormulario"));
    };
  } else if (modo === "editar" && doc) {
    titulo.textContent = "Editar metodo de metodo de pago";
    inputNombre.value = doc.nombre;
    form.onsubmit = e => {
      e.preventDefault();
      const nombre = inputNombre.value.trim();
      if (!nombre) return alert("Complete todos los campos");
      if (existeMetodo(nombre, doc.id)) return alert("Ya existe un metodo de pago con ese nombre");
      actualizarMetodoAPI(doc.id, nombre).then(() => cerrarModal("modalFormulario"));
    };
  } else if (modo === "ver" && doc) {
    titulo.textContent = "Detalle del metodo de pago";
    inputNombre.value = doc.nombre;
    inputNombre.disabled = true;
    botonGuardar.onclick = e => { e.preventDefault(); cerrarModal("modalFormulario"); };
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
document.getElementById("btn_guardar").addEventListener("click", () => abrirModalFormulario("agregar"));

// ===== Carga inicial =====
cargarMetodos();