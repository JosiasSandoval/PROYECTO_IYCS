const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

const modalDetalle = crearModal();            
const modalFormulario = crearModalFormulario(); 

let parroquias = [];           
let parroquiasFiltradas = null;
let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

function normalizar(par) {
  const id = par.id ?? par.idParroquia ?? par.id_parroquia ?? null;
  const nombre = par.nombre ?? par.nombParroquia ?? par.nomb_parroquia ?? "";
  const direccion = par.direccion ?? par.direccionParroquia ?? par.direccion_parroquia ?? "";
  const historia = par.historia ?? par.historiaParroquia ?? "";
  const ruc = par.ruc ?? par.rucParroquia ?? "";
  const contacto = par.contacto ?? par.telefonoContacto ?? par.telefono_contacto ?? par.contactoParroquia ?? "";
  const color = par.color ?? par.colorParroquia ?? "";
  const latitud = par.latParroquia ?? par.latitud ?? par.latitudParroquia ?? "";
  const longitud = par.logParroquia ?? par.longitud ?? par.longitudParroquia ?? "";

  let estado = false;
  if (
    par.estado === 1 || par.estado === "1" || par.estado === true ||
    par.estado === "activo" || par.estadoParroquia === true || par.estadoParroquia === 1
  ) {
    estado = true;
  }

  return { id, nombre, direccion, historia, ruc, contacto, color, latitud, longitud, estado };
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

const cargarParroquias = async () => {
  try {
    const data = await manejarSolicitud("/api/parroquia/", {}, "Error al obtener parroquias");
    parroquias = Array.isArray(data.datos) ? data.datos.map(normalizar) : [];
    parroquiasFiltradas = null;
    paginaActual = 1;
    renderTabla();
  } catch (err) {
    console.error("Error cargando parroquias:", err);
  }
};

function existeParroquia(nombre, idIgnorar = null) {
  return parroquias.some(par =>
    par.nombre.toLowerCase() === nombre.toLowerCase() && par.id !== idIgnorar
  );
}

function renderTabla() {
  tabla.innerHTML = "";
  const lista = parroquiasFiltradas ?? parroquias;

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
  const parroquiasPagina = lista.slice(inicio, fin);

  parroquiasPagina.forEach((par, index) => {
    const esActivo = par.estado === true || par.estado === "activo";
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class="col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${escapeHtml(par.nombre)}</td>
      <td class="col-historiaDescripcion">${escapeHtml(par.historiaParroquia)}</td>
      <td class="col-">${escapeHtml(par.nombre)}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="verDetalle(${par.id})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="editarParroquia(${par.id})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${par.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarParroquia(${par.id})" title="Eliminar">
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
  const total = (parroquiasFiltradas ?? parroquias).length;
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
  const total = Math.ceil((parroquiasFiltradas ?? parroquias).length / elementosPorPagina);
  if (pagina < 1 || pagina > total) return;
  paginaActual = pagina;
  renderTabla();
}

// === AGREGAR PARROQUIA ===
const agregarParroquia = (nombre, historia, ruc, contacto, direccion, color, latitud, longitud) =>
  manejarSolicitud(
    "/api/parroquia/agregar",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombParroquia: nombre,
        historiaParroquia: historia || null,
        ruc: ruc || null,
        telefonoContacto: contacto || null,
        direccion: direccion || null,
        color: color || null,
        latParroquia: latitud || null,
        logParroquia: longitud || null,
        estadoParroquia: true
      }),
    },
    "Error al agregar parroquia"
  ).then(() => cargarParroquias());

const actualizarParroquiaAPI = (id, nombre, historia, ruc, contacto, direccion, color, latitud, longitud) =>
  manejarSolicitud(
    `/api/parroquia/actualizar/${id}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombParroquia: nombre,
        historiaParroquia: historia || null,
        ruc: ruc || null,
        telefonoContacto: contacto || null,
        direccion: direccion || null,
        color: color || null,
        latParroquia: latitud || null,
        logParroquia: longitud || null
      }),
    },
    "Error al actualizar parroquia"
  ).then(() => cargarParroquias());


const eliminarParroquia = async id => {
  if (!confirm("¿Está seguro de eliminar esta parroquia?")) return;
  try {
    const res = await fetch(`/api/parroquia/eliminar/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) alert(data.mensaje || "Error al eliminar la parroquia");
    else alert(data.mensaje || "Parroquia eliminada correctamente");
    cargarParroquias();
  } catch (err) {
    console.error("Error al eliminar parroquia", err);
    alert("Error inesperado al eliminar la parroquia");
  }
};

async function darDeBaja(id) {
  try {
    const par = parroquias.find(d => d.id === id);
    if (!par) return alert("Parroquia no encontrada");
    const nuevoEstado = !par.estado;
    const res = await fetch(`/api/parroquia/cambiar_estado/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ estado: nuevoEstado })
    });
    if (!res.ok) throw new Error("Error al cambiar estado");
    const data = await res.json();
    par.estado = data.nuevo_estado === true;
    renderTabla();
  } catch (err) {
    console.error(err);
    alert("Error al actualizar estado");
  }
}

const inputParroquia = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");
btnBuscar.addEventListener("click", async () => {
  const termino = inputParroquia.value.trim();
  if (termino === "") {
    parroquiasFiltradas = null;
    paginaActual = 1;
    renderTabla();
    return;
  }
  try {
    const res = await fetch(`/api/parroquia/busqueda_parroquia/${encodeURIComponent(termino)}`);
    if (res.status === 404) {
      parroquiasFiltradas = [];
      renderTabla();
      return;
    }
    if (!res.ok) throw new Error("Error en búsqueda");
    const data = await res.json();
    parroquiasFiltradas = Array.isArray(data) ? data.map(normalizar) : [normalizar(data)];
    paginaActual = 1;
    renderTabla();
  } catch (err) {
    console.error(err);
    alert("Error al buscar parroquia");
  }
});

function crearModal() {
  const modalHTML = document.createElement("div");
  modalHTML.innerHTML = `
    <div class="modal" id="modalDetalle">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Detalle de la Parroquia</h5>
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
                <label for="modalNombre" class="form-label">Nombre de la parroquia</label>
                <input type="text" id="modalNombre" class="form-control" required>
              </div>

                <div class="mb-3">
                  <label for="modalHistoria" class="form-label">Historia</label>
                  <textarea 
                    id="modalHistoria" 
                    class="form-control" 
                    rows="2" 
                    style="resize: none;"
                    placeholder="Escribe aquí la historia de la parroquia..."
                  ></textarea>
                </div>

              <div class="mb-3">
                <label for="modalRuc" class="form-label">RUC</label>
                <input type="text" id="modalRuc" class="form-control">
              </div>

              <div class="mb-3">
                <label for="modalContacto" class="form-label">Contacto</label>
                <input type="text" id="modalContacto" class="form-control">
              </div>

              <div class="mb-3">
                <label for="modalDireccion" class="form-label">Dirección</label>
                <input type="text" id="modalDireccion" class="form-control">
              </div>

              <div class="mb-3">
                <label for="modalColor" class="form-label">Color</label>
                <input type="text" id="modalColor" class="form-control" placeholder="#RRGGBB">
              </div>

              <div class="mb-3">
                <label for="modalLatitud" class="form-label">Latitud</label>
                <input type="text" id="modalLatitud" class="form-control">
              </div>

              <div class="mb-3">
                <label for="modalLongitud" class="form-label">Longitud</label>
                <input type="text" id="modalLongitud" class="form-control">
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

function abrirModalFormulario(modo, par = null) {
  const titulo = document.getElementById("modalFormularioTitulo");
  const inputNombre = document.getElementById("modalNombre");
  const inputHistoria = document.getElementById("modalHistoria");
  const inputRuc = document.getElementById("modalRuc");
  const inputContacto = document.getElementById("modalContacto");
  const inputDireccion = document.getElementById("modalDireccion");
  const inputLatitud = document.getElementById("modalLatitud");
  const inputLongitud = document.getElementById("modalLongitud");
  const inputColor = document.getElementById("modalColor");
  const botonGuardar = document.getElementById("btnGuardar");
  const form = document.getElementById("formModalDocumento");
  const modalFooter = document.querySelector("#modalFormulario .modal-footer");

  // limpiar configuración anterior
  form.onsubmit = null;
  botonGuardar.onclick = null;
  modalFooter.innerHTML = "";
  botonGuardar.textContent = "Aceptar";
  botonGuardar.type = "submit";
  botonGuardar.classList.remove("d-none");
  modalFooter.appendChild(botonGuardar);

  // habilitar todos los inputs
  [
    inputNombre,
    inputHistoria,
    inputRuc,
    inputContacto,
    inputDireccion,
    inputLatitud,
    inputLongitud,
    inputColor
  ].forEach(inp => inp.disabled = false);

  // limpiar valores
  [
    inputNombre,
    inputHistoria,
    inputRuc,
    inputContacto,
    inputDireccion,
    inputLatitud,
    inputLongitud,
    inputColor
  ].forEach(inp => inp.value = "");

  // === MODO AGREGAR ===
  if (modo === "agregar") {
    titulo.textContent = "Agregar parroquia";

    form.onsubmit = e => {
      e.preventDefault();
      const nombre = inputNombre.value.trim();
      const historia = inputHistoria.value.trim();
      const ruc = inputRuc.value.trim();
      const contacto = inputContacto.value.trim();
      const direccion = inputDireccion.value.trim();
      const latitud = inputLatitud.value.trim();
      const longitud = inputLongitud.value.trim();
      const color = inputColor.value.trim();

      if (!nombre || !ruc || !contacto || !direccion)
        return alert("Complete todos los campos obligatorios");

      if (existeParroquia(nombre))
        return alert("Ya existe una parroquia con ese nombre");

      agregarParroquia(nombre, historia, ruc, contacto, direccion, color, latitud, longitud)
        .then(() => cerrarModal("modalFormulario"));
    };

  // === MODO EDITAR ===
  } else if (modo === "editar" && par) {
    titulo.textContent = "Editar parroquia";

    inputNombre.value = par.nombre || "";
    inputHistoria.value = par.historia || "";
    inputRuc.value = par.ruc || "";
    inputContacto.value = par.contacto || "";
    inputDireccion.value = par.direccion || "";
    inputLatitud.value = par.latitud || "";
    inputLongitud.value = par.longitud || "";
    inputColor.value = par.color || "#000000";

    form.onsubmit = e => {
      e.preventDefault();
      const nombre = inputNombre.value.trim();
      const historia = inputHistoria.value.trim();
      const ruc = inputRuc.value.trim();
      const contacto = inputContacto.value.trim();
      const direccion = inputDireccion.value.trim();
      const latitud = inputLatitud.value.trim();
      const longitud = inputLongitud.value.trim();
      const color = inputColor.value.trim();

      if (!nombre || !ruc || !contacto || !direccion)
        return alert("Complete todos los campos obligatorios");

      if (existeParroquia(nombre, par.id))
        return alert("Ya existe una parroquia con ese nombre");

      actualizarParroquiaAPI(par.id, nombre, historia, ruc, contacto, direccion, color, latitud, longitud)
        .then(() => cerrarModal("modalFormulario"));
    };

  // === MODO VER ===
  } else if (modo === "ver" && par) {
    titulo.textContent = "Detalle de la parroquia";

    inputNombre.value = par.nombre || "";
    inputHistoria.value = par.historia || "";
    inputRuc.value = par.ruc || "";
    inputContacto.value = par.contacto || "";
    inputDireccion.value = par.direccion || "";
    inputLatitud.value = par.latitud || "";
    inputLongitud.value = par.longitud || "";
    inputColor.value = par.color || "#000000";

    [
      inputNombre,
      inputHistoria,
      inputRuc,
      inputContacto,
      inputDireccion,
      inputLatitud,
      inputLongitud,
      inputColor
    ].forEach(inp => inp.disabled = true);

    botonGuardar.textContent = "Cerrar";
    botonGuardar.type = "button";
    botonGuardar.onclick = () => cerrarModal("modalFormulario");
  }

  abrirModal("modalFormulario");
}



function editarParroquia(id) {
  const par = parroquias.find(d => d.id === id);
  if (par) abrirModalFormulario("editar", par);
}

function verDetalle(id) {
  const par = parroquias.find(d => d.id === id);
  if (par) abrirModalFormulario("ver", par);
}

document.querySelectorAll("#tablaDocumentos thead th").forEach((th, index) => {
  th.style.cursor = "pointer";
  th.addEventListener("click", () => {
    let campo;
    if (index === 1) campo = "nombre";
    else if (index === 2) campo = "direccion";
    else return;
    if (ordenActual.campo === campo) ordenActual.ascendente = !ordenActual.ascendente;
    else { ordenActual.campo = campo; ordenActual.ascendente = true; }
    renderTabla();
  });
});

document.getElementById("btn_guardar").addEventListener("click", () => abrirModalFormulario("agregar"));

cargarParroquias();
