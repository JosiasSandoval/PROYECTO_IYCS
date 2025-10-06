// ================== VARIABLES GLOBALES ==================
let usuarios = [];
let usuariosFiltrados = null;
let usuarioEditandoId = null;

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

// Referencias a los modales
const modalDetalle = crearModal();
const modalFormulario = crearModalFormulario();

let paginaActual = 1;
const elementosPorPagina = 10;

// ================== FUNCIONES ==================

// Renderizar tabla
function renderTabla() {
  tabla.innerHTML = "";
  const lista = usuariosFiltrados ?? usuarios;

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const pagina = lista.slice(inicio, fin);

  pagina.forEach((u, index) => {
    const esActivo = u.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${u.nombre}</td>
      <td class="col-numDocumento">${u.numDocumento}</td>
      <td class="col-tipoDocumento">${u.tipoDocumento}</td>
      <td class="col-correo">${u.correo}</td>
      <td class="col-telefono">${u.telefono}</td>
      <td class="col-clave">${u.clave}</td>
      <td class="col-tipoUsuario">${u.tipoUsuario}</td>
      <td class="col-cargo">${u.cargo}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verUsuario(${u.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarUsuario(${u.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${u.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${u.id})" title="Eliminar">
            <img src="/static/img/x.png" alt="eliminar">
          </button>
        </div>
      </td>
    `;
    tabla.appendChild(fila);
  });

  renderPaginacion();
}

// ================== PAGINACIÓN ==================
function renderPaginacion() {
  paginacion.innerHTML = "";
  const totalPaginas = Math.ceil(usuarios.length / elementosPorPagina);
  if (totalPaginas <= 1) return;

  const ul = document.createElement("ul");
  ul.className = "pagination";

  const crearItem = (num, activo = false, disabled = false, texto = null) => {
    const li = document.createElement("li");
    li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
    li.innerHTML = `<button class="page-link" onclick="cambiarPagina(${num})">${texto || num}</button>`;
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
  if (pagina < 1 || pagina > Math.ceil(usuarios.length / elementosPorPagina)) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== CRUD ==================
function agregarUsuario(datos) {
  usuarios.push({
    id: Date.now(),
    ...datos,
    estado: "activo",
  });
  renderTabla();
}

function editarUsuario(id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;
  abrirModalFormulario("editar", usuario);
}

function eliminarUsuario(id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;
  if (!confirm(`¿Seguro que deseas eliminar al usuario "${usuario.nombre}"?`)) return;
  usuarios = usuarios.filter((u) => u.id !== id);
  renderTabla();
}

function darDeBaja(id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;
  usuario.estado = usuario.estado === "activo" ? "inactivo" : "activo";
  renderTabla();
}

function verUsuario(id) {
  const usuario = usuarios.find((u) => u.id === id);
  if (!usuario) return;
  abrirModalFormulario("ver", usuario);
}

// ================== MODALES ==================
function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Usuario</h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalDetalle')">&times;</button>
          </div>
          <div class="modal-body" id="modalDetalleContenido"></div>
        </div>
      </div>
    </div>`;
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
            <form id="formModalUsuario">
              <div class="mb-2">
                <label for="modalNombre" class="form-label">Nombre y Apellidos</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>
              <div class="mb-2">
                <label for="modalNumDoc" class="form-label">Número de Documento</label>
                <input type="text" id="modalNumDoc" class="form-control" required>
              </div>
              <div class="mb-2">
                <label for="modalTipoDoc" class="form-label">Tipo de Documento</label>
                <input type="text" id="modalTipoDoc" class="form-control" required>
              </div>
              <div class="mb-2">
                <label for="modalCorreo" class="form-label">Correo Electrónico</label>
                <input type="email" id="modalCorreo" class="form-control" required>
              </div>
              <div class="mb-2">
                <label for="modalTelefono" class="form-label">Teléfono</label>
                <input type="text" id="modalTelefono" class="form-control" required>
              </div>
              <div class="mb-2">
                <label for="modalClave" class="form-label">Clave</label>
                <input type="password" id="modalClave" class="form-control" required>
              </div>
              <div class="mb-2">
                <label for="modalTipoUsuario" class="form-label">Tipo de Usuario</label>
                <input type="text" id="modalTipoUsuario" class="form-control" required>
              </div>
              <div class="mb-2">
                <label for="modalCargo" class="form-label">Cargo</label>
                <input type="text" id="modalCargo" class="form-control" required>
              </div>
              <div class="modal-footer">
                <button type="submit" class="btn btn-modal btn-modal-primary" id="btnGuardar">Aceptar</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>`;
  document.body.appendChild(modalHTML);
  return document.getElementById("modalFormulario");
}

function abrirModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add("activo");
}

function cerrarModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.remove("activo");
}

function abrirModalFormulario(modo, usuario = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const form = document.getElementById("formModalUsuario");
  const campos = {
    nombre: document.getElementById("modalNombre"),
    numDocumento: document.getElementById("modalNumDoc"),
    tipoDocumento: document.getElementById("modalTipoDoc"),
    correo: document.getElementById("modalCorreo"),
    telefono: document.getElementById("modalTelefono"),
    clave: document.getElementById("modalClave"),
    tipoUsuario: document.getElementById("modalTipoUsuario"),
    cargo: document.getElementById("modalCargo"),
  };

  Object.values(campos).forEach((input) => (input.disabled = false));

  if (modo === "agregar") {
    titulo.textContent = "Agregar Usuario";
    form.reset();
    form.onsubmit = (e) => {
      e.preventDefault();
      const datos = {};
      for (const [key, input] of Object.entries(campos)) datos[key] = input.value.trim();
      agregarUsuario(datos);
      cerrarModal("modalFormulario");
    };
  } else if (modo === "editar" && usuario) {
    titulo.textContent = "Editar Usuario";
    for (const key in campos) campos[key].value = usuario[key];
    form.onsubmit = (e) => {
      e.preventDefault();
      for (const key in campos) usuario[key] = campos[key].value.trim();
      renderTabla();
      cerrarModal("modalFormulario");
    };
  } else if (modo === "ver" && usuario) {
    titulo.textContent = "Detalle del Usuario";
    for (const key in campos) {
      campos[key].value = usuario[key];
      campos[key].disabled = true;
    }
    form.onsubmit = (e) => {
      e.preventDefault();
      cerrarModal("modalFormulario");
    };
  }

  abrirModal("modalFormulario");
}

// ================== BUSQUEDA ==================
document.getElementById("btn_buscar").addEventListener("click", () => {
  const termino = document.getElementById("inputDocumento").value.trim().toLowerCase();
  usuariosFiltrados = termino === ""
    ? null
    : usuarios.filter((u) => u.nombre.toLowerCase().includes(termino));
  paginaActual = 1;
  renderTabla();
});

// ================== EVENTO FORM PRINCIPAL ==================
document.getElementById("formDocumento").addEventListener("submit", (e) => {
  e.preventDefault();
  abrirModalFormulario("agregar");
});

// ================== DATOS DE EJEMPLO ==================
usuarios = [
  {
    id: 1,
    nombre: "Juan Pérez",
    numDocumento: "74859632",
    tipoDocumento: "DNI",
    correo: "juanperez@gmail.com",
    telefono: "987654321",
    clave: "12345",
    tipoUsuario: "Administrador",
    cargo: "Coordinador",
    estado: "activo",
  },
  {
    id: 2,
    nombre: "María López",
    numDocumento: "76589412",
    tipoDocumento: "DNI",
    correo: "marialopez@gmail.com",
    telefono: "912345678",
    clave: "54321",
    tipoUsuario: "Invitado",
    cargo: "Asistente",
    estado: "activo",
  },
];

renderTabla();
