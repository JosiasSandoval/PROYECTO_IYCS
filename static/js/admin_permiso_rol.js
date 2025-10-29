const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

const modalDetalle = crearModal();            
const modalFormulario = crearModalFormulario(); 

let roles = [];           
let rolesFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

function normalizar(rol) {
  const id = rol.id ?? rol.idRol ?? null;
  const nombre = rol.nombre ?? rol.nombRol ?? "";
  let estado = false;
  if (
    rol.estado === 1 || rol.estado === "1" || rol.estado === true || 
    rol.estado === "activo" || rol.estadoRol === true || rol.estadoRol === 1
  ) {
    estado = true;
  }
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

const cargarRoles = async () => {
  try {
    const data = await manejarSolicitud("/api/rol/", {}, "Error al obtener roles");
    roles = Array.isArray(data) ? data.map(normalizar) : [];
    rolesFiltrados = null;
    paginaActual = 1;
    renderTabla();
  } catch (err) {
    console.error("Error cargando roles:", err);
  }
};

function existeRol(nombre, idIgnorar = null) {
  return roles.some(doc =>
    doc.nombre.toLowerCase() === nombre.toLowerCase() && doc.id !== idIgnorar
  );
}

function renderTabla() {
  tabla.innerHTML = "";
  const lista = rolesFiltrados ?? roles;

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
          <button class="btn btn-secondary btn-sm" onclick="abrirModalPermisos(${doc.id})" title="Permisos">
            <img src="/static/img/permiso.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarRol(${doc.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${doc.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarRol(${doc.id})" title="Eliminar">
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
  const total = (rolesFiltrados ?? roles).length;
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
  const total = Math.ceil((rolesFiltrados ?? roles).length / elementosPorPagina);
  if (pagina < 1 || pagina > total) return;
  paginaActual = pagina;
  renderTabla();
}

const agregarRol = nombre => manejarSolicitud(
  "/api/rol/agregar",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombRol: nombre }),
  },
  "Error al agregar rol"
).then(() => cargarRoles());

const actualizarRolAPI = (id, nombre) => manejarSolicitud(
  `/api/rol/actualizar/${id}`,
  {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombRol: nombre }),
  },
  "Error al actualizar rol"
).then(() => cargarRoles());

const eliminarRol = async id => {
  if (!confirm("¿Está seguro de eliminar este rol?")) return;
  try {
    const res = await fetch(`/api/rol/eliminar/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.error || "Error al eliminar el rol");
    else alert(data.mensaje || "Rol eliminado correctamente");
    cargarRoles();
  } catch (err) {
    console.error("Error al eliminar rol", err);
    alert("Error inesperado al eliminar el rol");
  }
};

async function darDeBaja(id) {
  try {
    const rol = roles.find(r => r.id === id);
    if (!rol) return alert("Rol no encontrado");

    const res = await fetch(`/api/rol/cambiar_estado/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
    });

    // intenta leer respuesta JSON (puede devolver {ok:..., nuevo_estado:...} o sólo {ok:...})
    let data = {};
    try { data = await res.json(); } catch (err) { /* si no es JSON, lo ignoramos */ }

    if (!res.ok) {
      const msg = (data && data.mensaje) ? data.mensaje : "Error al cambiar estado";
      return alert(msg);
    }

    // Si el servidor nos dice el nuevo estado, úsalo; si no, invertimos el estado local
    if (typeof data.nuevo_estado !== "undefined") {
      rol.estado = data.nuevo_estado === true || data.nuevo_estado === 1;
    } else {
      rol.estado = !rol.estado;
    }

    // repinta la tabla para reflejar el nuevo color/icono
    renderTabla();

  } catch (err) {
    console.error("Error al cambiar estado:", err);
    alert("Error al actualizar estado del rol");
  }
}


const inputRol = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");
btnBuscar.addEventListener("click", async () => {
  const termino = inputRol.value.trim();
  if (termino === "") {
    rolesFiltrados = null;
    paginaActual = 1;
    renderTabla();
    return;
  }
  try {
    const res = await fetch(`/api/rol/busqueda_rol/${encodeURIComponent(termino)}`);
    if (res.status === 404) {
      rolesFiltrados = [];
      renderTabla();
      return;
    }
    if (!res.ok) throw new Error("Error en búsqueda");
    const data = await res.json();
    rolesFiltrados = Array.isArray(data) ? data.map(normalizar) : [normalizar(data)];
    paginaActual = 1;
    renderTabla();
  } catch (err) {
    console.error(err);
    alert("Error al buscar rol");
  }
});

function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle del Rol</h5>
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
                <label for="modalNombre" class="form-label">Nombre del Rol</label>
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
    titulo.textContent = "Agregar rol";
    inputNombre.value = "";
    form.onsubmit = e => {
      e.preventDefault();
      const nombre = inputNombre.value.trim();
      if (!nombre) return alert("Complete todos los campos");
      if (existeRol(nombre)) return alert("Ya existe un rol con ese nombre");
      agregarRol(nombre).then(() => cerrarModal("modalFormulario"));
    };
  } else if (modo === "editar" && doc) {
    titulo.textContent = "Editar rol";
    inputNombre.value = doc.nombre;
    form.onsubmit = e => {
      e.preventDefault();
      const nombre = inputNombre.value.trim();
      if (!nombre) return alert("Complete todos los campos");
      if (existeRol(nombre, doc.id)) return alert("Ya existe un rol con ese nombre");
      actualizarRolAPI(doc.id, nombre).then(() => cerrarModal("modalFormulario"));
    };
  } else if (modo === "ver" && doc) {
    titulo.textContent = "Detalle del rol";
    inputNombre.value = doc.nombre;
    inputNombre.disabled = true;
    botonGuardar.onclick = e => { e.preventDefault(); cerrarModal("modalFormulario"); };
  }

  abrirModal("modalFormulario");
}

function editarRol(id) {
  const doc = roles.find(d => d.id === id);
  if (doc) abrirModalFormulario("editar", doc);
}

function verDetalle(id) {
  const doc = roles.find(d => d.id === id);
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

const modalPermisos = (() => {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalPermisos">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Permisos del Rol</h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalPermisos')">&times;</button>
          </div>
          <div class="modal-body" id="modalPermisosContenido">
            <p>Cargando permisos...</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-modal btn-modal-primary" id="btnGuardarPermisos">Guardar</button>
          </div>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modalHTML);
  return document.getElementById("modalPermisos");
})();

async function abrirModalPermisos(idRol) {
  const contenido = document.getElementById("modalPermisosContenido");
  contenido.innerHTML = "<p>Cargando permisos...</p>";

  try {
    // 1️⃣ Traer todos los permisos
    const todosPermisos = await fetch(`/api/permiso/`).then(res => res.json());

    // 2️⃣ Traer permisos del rol
    const permisosRol = await fetch(`/api/permiso/${idRol}`).then(res => res.json());
    const idsPermisosRol = permisosRol.map(p => p.id); // solo los ids

    contenido.innerHTML = ""; // limpiar mensaje de carga

    // 3️⃣ Agrupar permisos por tabla
    const permisosPorTabla = todosPermisos.reduce((acc, p) => {
      const tabla = p.tabla || "Sin tabla";
      if (!acc[tabla]) acc[tabla] = [];
      acc[tabla].push(p);
      return acc;
    }, {});

    // 4️⃣ Crear checkboxes
    for (const tabla in permisosPorTabla) {
      const bloque = document.createElement("div");
      bloque.className = "tabla-permisos mb-3";
      bloque.innerHTML = `<h5>${tabla}</h5>`;

      permisosPorTabla[tabla].forEach(p => {
        const div = document.createElement("div");
        div.className = "form-check ms-3";
        const estaAsignado = idsPermisosRol.includes(p.id);
        div.innerHTML = `
          <input class="form-check-input" type="checkbox" value="${p.id}" id="permiso_${p.id}" ${estaAsignado ? "checked" : ""}>
          <label class="form-check-label" for="permiso_${p.id}">${p.accion}</label>
        `;
        bloque.appendChild(div);
      });

      contenido.appendChild(bloque);
    }

    abrirModal("modalPermisos");

    // 5️⃣ Guardar cambios
    const btnGuardar = document.getElementById("btnGuardarPermisos");
    btnGuardar.onclick = async () => {
      const checkboxes = contenido.querySelectorAll("input[type='checkbox']");
      const promesas = Array.from(checkboxes).map(cb => {
        const idPermiso = parseInt(cb.value);
        const activo = cb.checked;
        const estabaAsignado = idsPermisosRol.includes(idPermiso);

        // Si se marcó y no estaba asignado -> agregar
        if (activo && !estabaAsignado) {
          return fetch("/api/permiso/agregar_rol_permiso", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idRol, idPermiso })
          });
        }
        // Si se desmarcó y estaba asignado -> cambiar estado
        else if (!activo && estabaAsignado) {
          return fetch(`/api/permiso/cambiar_estado/${idPermiso}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" }
          });
        }

        return Promise.resolve();
      });

      await Promise.all(promesas);
      alert("Permisos actualizados correctamente");
      cerrarModal("modalPermisos");
    };

  } catch (err) {
    contenido.innerHTML = "<p>Error al cargar permisos</p>";
    console.error(err);
  }
}

document.getElementById("btn_guardar").addEventListener("click", () => abrirModalFormulario("agregar"));

cargarRoles();
