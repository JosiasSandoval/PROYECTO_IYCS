// ================== VARIABLES GLOBALES ==================
let personal = [];
let tiposDocumento = []; // Almacenará los tipos de documento
let personalFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 5;

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");
const listaSugerencias = document.getElementById("sugerencias"); // Usamos la UL del HTML

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API
 */
function normalizarPersonal(item) {
  return {
    idPersonal: item.idPersonal,
    nombreCompleto: `${item.apePatPers} ${item.apeMatPers}, ${item.nombPers}`,
    numDocPers: item.numDocPers,
    email: item.email,
    estadoCuenta: item.estadoCuenta === true || item.estadoCuenta === 1,
    idUsuario: item.idUsuario,
    cargo: item.nombCargo || "Sin Asignar" // Maneja NULL
  };
}

// ================== RENDERIZAR TABLA ==================
function renderTabla() {
  tabla.innerHTML = "";
  const lista = personalFiltrados ?? personal;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay personal para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const personalPagina = lista.slice(inicio, fin);

  personalPagina.forEach((p, index) => {
    const esActivo = p.estadoCuenta;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const tituloBoton = esActivo ? 'Desactivar Cuenta' : 'Activar Cuenta';

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class.col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${p.nombreCompleto}</td>
      <td class="col-documento">${p.numDocPers}</td>
      <td class="col-email">${p.email}</td>
      <td class="col-cargo">${p.cargo}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${p.idPersonal})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="abrirModalFormulario('editar', ${p.idPersonal})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstadoPersonal(${p.idUsuario}, ${esActivo})" title="${tituloBoton}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarPersonal(${p.idPersonal})" title="Eliminar">
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
  // Lógica de ... (opcional pero recomendada)
  for (let i = 1; i <= totalPaginas; i++) {
    ul.appendChild(crearItem(i, paginaActual === i));
  }
  ul.appendChild(crearItem(paginaActual + 1, false, paginaActual === totalPaginas, ">"));
  paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
  const totalPaginas = Math.ceil((personalFiltrados ?? personal).length / elementosPorPagina);
  if (pagina < 1 || pagina > totalPaginas) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== MODALES (Creación dinámica) ==================

function crearModalFormulario() {
  const modalHTML = document.createElement("div");
  // Usamos los estilos .modal-lg, .form-grid, etc. que ya tienes en tu CSS
  modalHTML.innerHTML = `
    <div class="modal" id="modalFormulario">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalFormularioTitulo"></h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalFormulario')">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formModalPersonal">
              
              <h6 class="modal-subtitle">Datos de Acceso</h6>
              <div class="form-grid">
                <div class="mb-3 form-grid-item-full">
                  <label for="modalEmail" class="form-label">Email (Usuario)</label>
                  <input type="email" id="modalEmail" class="form-control" required>
                </div>
                <div class="mb-3" id="campoClave">
                  <label for="modalClave" class="form-label">Contraseña</label>
                  <input type="password" id="modalClave" class="form-control" required>
                </div>
                <div class="mb-3" id="campoClaveConfirmar">
                  <label for="modalClaveConfirmar" class="form-label">Confirmar Contraseña</label>
                  <input type="password" id="modalClaveConfirmar" class="form-control" required>
                </div>
              </div>

              <h6 class="modal-subtitle">Datos Personales</h6>
              <div class="form-grid">
                 <div class="mb-3">
                  <label for="modalNombPers" class="form-label">Nombres</label>
                  <input type="text" id="modalNombPers" class="form-control" required>
                </div>
                 <div class="mb-3">
                  <label for="modalApePatPers" class="form-label">Apellido Paterno</label>
                  <input type="text" id="modalApePatPers" class="form-control" required>
                </div>
                 <div class="mb-3">
                  <label for="modalApeMatPers" class="form-label">Apellido Materno</label>
                  <input type="text" id="modalApeMatPers" class="form-control" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="mb-3">
                  <label for="modalTipoDocumento" class="form-label">Tipo Documento</label>
                  <select id="modalTipoDocumento" class="form-control" required>
                    <option value="">Cargando...</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="modalNumDocPers" class="form-label">Número de Documento</label>
                  <input type="text" id="modalNumDocPers" class="form-control" required>
                </div>
                 <div class="mb-3">
                  <label for="modalSexo" class="form-label">Sexo</label>
                  <select id="modalSexo" class="form-control">
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
              </div>

              <h6 class="modal-subtitle">Datos de Contacto</h6>
              <div class="form-grid">
                <div class="mb-3">
                  <label for="modalTelefono" class="form-label">Teléfono</label>
                  <input type="tel" id="modalTelefono" class="form-control">
                </div>
                <div class="mb-3 form-grid-item-full">
                  <label for="modalDireccion" class="form-label">Dirección</label>
                  <input type="text" id="modalDireccion" class="form-control">
                </div>
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
 * Rellena el <select> de Tipos de Documento
 */
function popularTiposDocumentoSelect() {
    const select = document.getElementById("modalTipoDocumento");
    select.innerHTML = '<option value="">Seleccionar...</option>';
    
    tiposDocumento.filter(td => td.estadoDocumento === true).forEach(td => {
        const option = document.createElement("option");
        option.value = td.idTipoDocumento;
        option.textContent = td.nombDocumento;
        select.appendChild(option);
    });
}

/**
 * Controla el modal para 'agregar', 'editar' y 'ver'
 */
async function abrirModalFormulario(modo, idPersonal = null) {
  if (tiposDocumento.length === 0) {
      mostrarAlerta("Error: No se cargaron los tipos de documento.", "error");
      return;
  }
  popularTiposDocumentoSelect();

  const form = document.getElementById("formModalPersonal");
  const footer = document.getElementById("modalFormularioFooter");
  footer.innerHTML = "";

  const campos = {
      titulo: document.getElementById("modalFormularioTitulo"),
      email: document.getElementById("modalEmail"),
      clave: document.getElementById("modalClave"),
      claveConfirmar: document.getElementById("modalClaveConfirmar"),
      campoClave: document.getElementById("campoClave"),
      campoClaveConfirmar: document.getElementById("campoClaveConfirmar"),
      nombPers: document.getElementById("modalNombPers"),
      apePatPers: document.getElementById("modalApePatPers"),
      apeMatPers: document.getElementById("modalApeMatPers"),
      tipoDoc: document.getElementById("modalTipoDocumento"),
      numDoc: document.getElementById("modalNumDocPers"),
      sexo: document.getElementById("modalSexo"),
      telefono: document.getElementById("modalTelefono"),
      direccion: document.getElementById("modalDireccion"),
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

  if (modo === "agregar") {
    campos.titulo.textContent = "Agregar Personal";
    campos.campoClave.style.display = "block";
    campos.campoClaveConfirmar.style.display = "block";
    campos.clave.required = true;
    campos.claveConfirmar.required = true;

    footer.appendChild(btnCerrar);
    footer.appendChild(btnGuardar);
    
    form.onsubmit = (e) => {
        e.preventDefault();
        if (campos.clave.value !== campos.claveConfirmar.value) {
            mostrarAlerta("Las contraseñas no coinciden.", "error");
            return;
        }
        const data = {
            email: campos.email.value,
            clave: campos.clave.value,
            nombPers: campos.nombPers.value,
            apePatPers: campos.apePatPers.value,
            apeMatPers: campos.apeMatPers.value,
            idTipoDocumento: campos.tipoDoc.value,
            numDocPers: campos.numDoc.value,
            sexoPers: campos.sexo.value || null,
            telefonoPers: campos.telefono.value || null,
            direccionPers: campos.direccion.value || null,
        };
        guardarPersonal('POST', '/api/personal/personales', data);
    };

  } else if (modo === "editar" || modo === "ver") {
    const personalData = await cargarPersonalPorId(idPersonal);
    if (!personalData) return;

    campos.titulo.textContent = modo === 'editar' ? "Editar Personal" : "Detalle del Personal";
    
    campos.campoClave.style.display = "none";
    campos.campoClaveConfirmar.style.display = "none";
    campos.clave.required = false;
    campos.claveConfirmar.required = false;

    // Llenar el formulario
    campos.email.value = personalData.email;
    campos.nombPers.value = personalData.nombPers;
    campos.apePatPers.value = personalData.apePatPers;
    campos.apeMatPers.value = personalData.apeMatPers;
    campos.tipoDoc.value = personalData.idTipoDocumento;
    campos.numDoc.value = personalData.numDocPers;
    campos.sexo.value = personalData.sexoPers || "";
    campos.telefono.value = personalData.telefonoPers || "";
    campos.direccion.value = personalData.direccionPers || "";

    if (modo === 'editar') {
        footer.appendChild(btnCerrar);
        footer.appendChild(btnGuardar);

        form.onsubmit = (e) => {
            e.preventDefault();
            const data = {
                idUsuario: personalData.idUsuario, // Importante
                email: campos.email.value,
                nombPers: campos.nombPers.value,
                apePatPers: campos.apePatPers.value,
                apeMatPers: campos.apeMatPers.value,
                idTipoDocumento: campos.tipoDoc.value,
                numDocPers: campos.numDoc.value,
                sexoPers: campos.sexo.value || null,
                telefonoPers: campos.telefono.value || null,
                direccionPers: campos.direccion.value || null,
            };
            guardarPersonal('PUT', `/api/personal/personales/${idPersonal}`, data);
        };

    } else { // modo === 'ver'
        footer.appendChild(btnCerrar);
        Object.values(campos).forEach(campo => {
            if (campo && campo.disabled !== undefined) campo.disabled = true;
        });
        form.onsubmit = (e) => e.preventDefault();
    }
  }

  abrirModal("modalFormulario");
}


// ================== CRUD (API Fetch) ==================

/**
 * Carga los datos iniciales (Tipos de Documento y Personal)
 */
async function cargarDatosIniciales() {
  try {
    const respTiposDoc = await fetch("/api/tipoDocumento/documentos");
    const dataTiposDoc = await respTiposDoc.json();
    if (dataTiposDoc.success) {
      tiposDocumento = dataTiposDoc.datos;
    } else {
      mostrarAlerta("Error fatal: No se pudieron cargar los tipos de documento.", "error");
    }

    const respPersonal = await fetch("/api/personal/personales");
    const dataPersonal = await respPersonal.json();
    if (dataPersonal.success && Array.isArray(dataPersonal.datos)) {
      personal = dataPersonal.datos.map(normalizarPersonal);
      personalFiltrados = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      personal = [];
      renderTabla();
      mostrarAlerta(dataPersonal.mensaje || "No se pudo cargar el personal", "error");
    }
  } catch (err) {
    console.error("Error cargando datos iniciales:", err);
    mostrarAlerta("Error de conexión con la API", "error");
  }
}

/**
 * Carga los datos completos de UN miembro del personal (para modal)
 */
async function cargarPersonalPorId(id) {
    try {
        const respuesta = await fetch(`/api/personal/personales/${id}`);
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

/**
 * Función genérica para guardar (Crear/Editar)
 */
async function guardarPersonal(method, url, data) {
  try {
    const respuesta = await fetch(url, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const res = await respuesta.json();

    if (res.success) {
      mostrarAlerta(res.mensaje, "success");
      cerrarModal("modalFormulario");
      await cargarDatosIniciales(); // Recargar todo
    } else {
      mostrarAlerta(res.mensaje || "Error en la operación", "error");
    }
  } catch (err) {
    console.error("Error guardando:", err);
    mostrarAlerta("Error de conexión con la API", "error");
  }
}

/**
 * Cambia el estado (Activo/Inactivo)
 */
async function cambiarEstadoPersonal(idUsuario, estadoActual) {
    const nuevoEstado = !estadoActual;
    const confirmacion = confirm(`¿Seguro que deseas ${nuevoEstado ? 'activar' : 'desactivar'} esta cuenta?`);
    if (!confirmacion) return;

    try {
        const respuesta = await fetch(`/api/personal/personales/${idUsuario}/estado`, {
            method: 'PATCH',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estadoCuenta: nuevoEstado }),
        });
        const res = await respuesta.json();
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarDatosIniciales(); // Recargar
        } else {
            mostrarAlerta(res.mensaje, "error");
        }
    } catch (err) {
        console.error("Error cambiando estado:", err);
        mostrarAlerta("Error de conexión con la API", "error");
    }
}

/**
 * Elimina un miembro del personal (y su usuario asociado)
 */
async function eliminarPersonal(idPersonal) {
    const p = personal.find((per) => per.idPersonal === idPersonal);
    if (!p) return;
    
    if (!confirm(`¿Seguro que deseas eliminar al personal "${p.nombreCompleto}"?\n\n¡ATENCIÓN! Esto eliminará también su cuenta de usuario y todas sus asignaciones. Esta acción es irreversible.`)) return;

    try {
        const respuesta = await fetch(`/api/personal/personales/${idPersonal}`, {
            method: 'DELETE',
        });
        const res = await respuesta.json();
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarDatosIniciales(); // Recargar
        } else {
            mostrarAlerta(res.mensaje, "error");
        }
    } catch (err) {
        console.error("Error eliminando:", err);
        mostrarAlerta("Error de conexión con la API", "error");
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

  const sugerencias = personal.filter(p => 
      p.nombreCompleto.toLowerCase().includes(termino) ||
      p.numDocPers.toLowerCase().includes(termino) ||
      p.email.toLowerCase().includes(termino) ||
      p.cargo.toLowerCase().includes(termino)
  ).slice(0, 5);

  if (sugerencias.length === 0) {
    return;
  }

  sugerencias.forEach(p => {
    const item = document.createElement("li");
    item.textContent = `${p.nombreCompleto} (${p.cargo})`;
    item.onclick = () => {
      inputBusqueda.value = p.nombreCompleto;
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
    personalFiltrados = null;
  } else {
    personalFiltrados = personal.filter(p => 
      p.nombreCompleto.toLowerCase().includes(termino) ||
      p.numDocPers.toLowerCase().includes(termino) ||
      p.email.toLowerCase().includes(termino) ||
      p.cargo.toLowerCase().includes(termino)
    );
  }
  paginaActual = 1;
  renderTabla();
  listaSugerencias.style.display = "none";
});

// Botón de Agregar (Formulario principal)
document.getElementById("btn_guardar").addEventListener("click", (e) => {
    e.preventDefault(); // Es tipo 'submit' en tu HTML
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


// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    crearModalFormulario(); 
    cargarDatosIniciales();
});
=======
/* usuario_personal.js
   Cambios mínimos: roles dedupe, f_inicio/f_fin visibles y formateadas, estado visual corregido.
   Mantiene el resto de la funcionalidad.
*/

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

let personales = [];
let personalesFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

// ---------------- helpers ----------------
const manejarSolicitud = async (url, opciones = {}, mensajeError = "Error") => {
    try {
        const res = await fetch(url, opciones);
        if (!res.ok) {
            let txt;
            try { txt = await res.json(); } catch (e) { txt = null; }
            throw new Error((txt && txt.mensaje) ? txt.mensaje : mensajeError);
        }
        return await res.json();
    } catch (err) {
        console.error(mensajeError, err);
        alert(mensajeError + (err.message ? `: ${err.message}` : ""));
        throw err;
    }
};

// formatea "Wed, 15 Jan 2020 00:00:00 GMT" -> "15/01/2020" (display en tabla)
function formatDateDisplay(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}

// formatea dateStr -> "YYYY-MM-DD" para value de input type=date
function formatDateForInput(dateStr) {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d)) return "";
    return d.toISOString().slice(0, 10);
}

const escapeHtml = text =>
    String(text || "").replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));

// ---------------- normalización ----------------
function normalizarPersonal(p) {
    // asegurar roles como arreglo y sin duplicados
    let rolesArr = [];
    if (Array.isArray(p.roles)) rolesArr = p.roles.slice();
    else if (p.roles) rolesArr = typeof p.roles === "string" ? [p.roles] : (p.nombRol ? [p.nombRol] : []);
    rolesArr = Array.from(new Set(rolesArr.map(r => (r || "").toString())));

    return {
        id: p.idUsuario || p.id || p.idPersonal,
        nombreCompleto: `${p.nombPers || ""} ${p.apePatPers || ""} ${p.apeMatPers || ""}`.trim(),
        nombPers: p.nombPers || "",
        apePatPers: p.apePatPers || "",
        apeMatPers: p.apeMatPers || "",
        numDocPers: p.numDocPers || p.numDoc || "",
        email: p.email || "",
        clave: p.clave || "",
        // corregido: usar estadoCuenta
        estado: (p.estadoCuenta === true || p.estadoCuenta === 1 || p.estadoCuenta === "1"),
        sexoPers: p.sexoPers || "",
        direccionPers: p.direccionPers || "",
        telefonoPers: p.telefonoPers || "",
        idTipoDocumento: p.idTipoDocumento || "",
        nombDocumento: p.nombDocumento || p.nombDocumento || "",
        f_inicio: p.f_inicio || null,
        f_fin: p.f_fin || null,
        vigenciaParrPers: p.vigenciaParrPers || null,
        nombCargo: p.nombCargo || "",
        nombParroquia: p.nombParroquia || "",
        roles: rolesArr
    };
}

// ---------------- carga principal ----------------
async function cargarPersonales() {
    try {
        const data = await manejarSolicitud("/api/usuario/personal", {}, "Error al obtener personal");
        const items = Array.isArray(data.datos) ? data.datos : (Array.isArray(data) ? data : (data.datos ? data.datos : []));
        personales = items.map(normalizarPersonal);
        personalesFiltrados = null;
        paginaActual = 1;
        renderTabla();
    } catch (err) {
        console.error("Error cargando personal:", err);
    }
}

// ---------------- render tabla ----------------
function renderTabla() {
    tabla.innerHTML = "";
    const lista = personalesFiltrados ?? personales;

    if (ordenActual.campo) {
        lista.sort((a, b) => {
            const valorA = (a[ordenActual.campo] || "").toString().toLowerCase();
            const valorB = (b[ordenActual.campo] || "").toString().toLowerCase();
            if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
            if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
            return 0;
        });
    }

    const inicio = (paginaActual - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    const pagina = lista.slice(inicio, fin);

    pagina.forEach((u, idx) => {
        const esActivo = !!u.estado;
        // color y flecha: activo -> naranja + flecha abajo; inactivo -> verde + flecha arriba
        const botonStyle = `background:${esActivo ? 'orange' : 'green'};border:none;color:#fff;padding:6px 8px;border-radius:4px;`;
        const rotacion = esActivo ? "" : "transform: rotate(180deg);";

        // roles como etiquetas, sin duplicados (ya dedupe en normalizar)
        const rolesMostrar = (u.roles || []).join(", ");

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${inicio + idx + 1}</td>
            <td>${escapeHtml(u.numDocPers)}</td>
            <td>${escapeHtml(u.nombreCompleto)}</td>
            <td>${escapeHtml(u.email)}</td>
            <td class="col-acciones">
                <div class="d-flex justify-content-center flex-wrap gap-1">
                    <button class="btn btn-info btn-sm" onclick="verDetallePersonal(${u.id})" title="Ver">
                        <img src="/static/img/ojo.png" alt="ver">
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="editarPersonal(${u.id})" title="Editar">
                        <img src="/static/img/lapiz.png" alt="editar">
                    </button>
                    <button class="btn btn-sm" style="${botonStyle}" onclick="darDeBajaPersonal(${u.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
                        <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion};width:16px;height:16px;">
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarPersonal(${u.id})" title="Eliminar">
                        <img src="/static/img/x.png" alt="eliminar">
                    </button>
                </div>
            </td>
        `;
        tabla.appendChild(fila);
    });

    renderPaginacion();
}

function renderPaginacion() {
    paginacion.innerHTML = "";
    const total = (personalesFiltrados ?? personales).length;
    const totalPaginas = Math.ceil(total / elementosPorPagina);
    if (totalPaginas <= 1) return;

    const ul = document.createElement("ul");
    ul.className = "pagination";

    const crearItem = (numero, activo, disabled, texto) => {
        const li = document.createElement('li');
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
}

function cambiarPagina(pagina) {
    const total = Math.ceil((personalesFiltrados ?? personales).length / elementosPorPagina);
    if (pagina < 1 || pagina > total) return;
    paginaActual = pagina;
    renderTabla();
}

// ---------------- modales ----------------
function crearModalPersonal() {
    const cont = document.createElement('div');
    cont.innerHTML = `
        <div class="modal" id="modalDetallePersonal">
            <div class="modal-dialog"><div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Detalle personal</h5>
                    <button type="button" class="btn-cerrar" onclick="cerrarModal('modalDetallePersonal')">&times;</button>
                </div>
                <div class="modal-body" id="modalDetallePersonalContenido"></div>
            </div></div>
        </div>`;
    document.body.appendChild(cont);
    return document.getElementById('modalDetallePersonal');
}

function crearModalFormularioPersonal() {
    const cont = document.createElement('div');
    cont.innerHTML = `
        <div class="modal" id="modalFormularioPersonal">
            <div class="modal-dialog"><div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="tituloModalPersonal"></h5>
                    <button type="button" class="btn-cerrar" onclick="cerrarModal('modalFormularioPersonal')">&times;</button>
                </div>
                <div class="modal-body" style="max-height:70vh; overflow-y:auto;">
                    <form id="formPersonal">
                        <div class="mb-2"><label>Nombres</label><input id="p_nombPers" class="form-control"></div>
                        <div class="mb-2"><label>Apellido Paterno</label><input id="p_apePatPers" class="form-control"></div>
                        <div class="mb-2"><label>Apellido Materno</label><input id="p_apeMatPers" class="form-control"></div>
                        <div class="mb-2"><label>Documento</label><input id="p_numDocPers" class="form-control"></div>
                        <div class="mb-2"><label>Correo</label><input id="p_email" type="email" class="form-control"></div>
                        <div class="mb-2"><label>Contraseña</label><input id="p_clave" type="password" class="form-control"></div>
                        <div class="mb-2"><label>Sexo</label>
                            <select id="p_sexo" class="form-control">
                                <option value="">Seleccione</option>
                                <option value="M">Masculino</option>
                                <option value="F">Femenino</option>
                            </select>
                        </div>
                        <div class="mb-2"><label>Dirección</label><input id="p_direccion" class="form-control"></div>
                        <div class="mb-2"><label>Teléfono</label><input id="p_telefono" class="form-control"></div>

                        <div class="mb-2">
                            <label>Tipo documento</label>
                            <select id="p_tipoDocumento" class="form-control"></select>
                        </div>

                        <div class="mb-2">
                            <label>Cargo</label>
                            <select id="p_cargo" class="form-control"></select>
                        </div>

                        <div class="mb-2">
                            <label>Parroquia</label>
                            <select id="p_parroquia" class="form-control"></select>
                        </div>

                        <div class="mb-2">
                            <label>Roles</label>
                            <div id="p_roles_container" style="display:flex;flex-wrap:wrap;gap:8px;"></div>
                        </div>

                        <div class="mb-2">
                            <label>Inicio</label><input id="p_f_inicio" type="date" class="form-control">
                        </div>
                        <div class="mb-2">
                            <label>Fin</label><input id="p_f_fin" type="date" class="form-control">
                        </div>

                        <div class="modal-footer">
                            <button class="btn btn-modal btn-modal-primary" id="btnGuardarPersonal">Aceptar</button>
                        </div>
                    </form>
                </div>
            </div></div>
        </div>
    `;
    document.body.appendChild(cont);

    // cargar selects y roles al crear el modal
    cargarTiposDocumentoParaPersonal();
    cargarCargos();
    cargarParroquias();
    cargarRoles();

    return document.getElementById('modalFormularioPersonal');
}

const modalDetallePersonal = crearModalPersonal();
const modalFormularioPersonal = crearModalFormularioPersonal();

function abrirModal(id) { document.getElementById(id).classList.add('activo'); }
function cerrarModal(id) { document.getElementById(id).classList.remove('activo'); }

// ---------------- auxiliares (cargas) ----------------
async function cargarTiposDocumentoParaPersonal() {
    try {
        const data = await manejarSolicitud("/api/tipoDocumento/", {}, "Error al cargar tipos de documento");
        const sel = document.getElementById("p_tipoDocumento");
        if (!sel) return;
        sel.innerHTML = '<option value="">Seleccione</option>';
        const items = Array.isArray(data.datos) ? data.datos : (Array.isArray(data) ? data : (data || []));
        items.forEach(d => {
            const nombre = d.nombre || d.nombDocumento || d.nomb || d;
            const o = document.createElement('option');
            o.value = nombre;
            o.textContent = nombre;
            sel.appendChild(o);
        });
    } catch (e) { console.error(e); }
}

async function cargarCargos() {
    try {
        const data = await manejarSolicitud("/api/cargo/", {}, "Error al cargar cargos");
        const sel = document.getElementById("p_cargo");
        if (!sel) return;
        sel.innerHTML = '<option value="">Seleccione</option>';
        const items = Array.isArray(data.datos) ? data.datos : (Array.isArray(data) ? data : (data || []));
        items.forEach(c => {
            const nombre = c.nombre || c.nombCargo || c.nomb || c;
            const o = document.createElement('option');
            o.value = nombre;
            o.textContent = nombre;
            sel.appendChild(o);
        });
    } catch (e) { console.error(e); }
}

async function cargarParroquias() {
    try {
        const data = await manejarSolicitud("/api/parroquia/datos", {}, "Error al cargar parroquias");
        const sel = document.getElementById("p_parroquia");
        if (!sel) return;
        sel.innerHTML = '<option value="">Seleccione</option>';
        const items = Array.isArray(data.datos) ? data.datos : (Array.isArray(data) ? data : (data || []));
        items.forEach(p => {
            const nombre = p.nombParroquia || p.nombre || p.nomb || p;
            const o = document.createElement('option');
            o.value = nombre;
            o.textContent = nombre;
            sel.appendChild(o);
        });
    } catch (e) { console.error(e); }
}

async function cargarRoles() {
    try {
        const data = await manejarSolicitud("/api/rol/", {}, "Error al cargar roles");
        const cont = document.getElementById("p_roles_container");
        if (!cont) return;
        cont.innerHTML = ""; // importantísimo para evitar duplicados
        const items = Array.isArray(data.datos) ? data.datos : (Array.isArray(data) ? data : (data || []));
        // dedupe roles por nombre por seguridad
        const nombres = Array.from(new Set(items.map(r => (r.nombre || r.nombRol || r.nomb || r).toString())));
        nombres.forEach(name => {
            const id = `rol_chk_${name.replace(/\s+/g, '_')}`;
            const wrapper = document.createElement('label');
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.gap = "6px";
            wrapper.innerHTML = `<input type="checkbox" class="rol-checkbox" value="${name}" id="${id}"> ${name}`;
            cont.appendChild(wrapper);
        });
    } catch (e) { console.error(e); }
}

// ---------------- modal formulario (agregar/editar/ver) ----------------
async function abrirModalFormularioPersonal(modo, usuario = null) {
    const titulo = document.getElementById("tituloModalPersonal");
    const form = document.getElementById("formPersonal");
    const btnGuardar = document.getElementById("btnGuardarPersonal");

    form.reset();
    btnGuardar.style.display = "inline-block";
    // habilitar inputs
    ["p_nombPers","p_apePatPers","p_apeMatPers","p_numDocPers","p_email","p_clave","p_sexo","p_direccion","p_telefono","p_tipoDocumento","p_cargo","p_parroquia","p_roles_container","p_f_inicio","p_f_fin"].forEach(id=> {
        const el = document.getElementById(id);
        if (el) el.disabled = false;
    });

    // asegurar selects/roles cargados (limpian internamente)
    await Promise.all([cargarTiposDocumentoParaPersonal(), cargarCargos(), cargarParroquias(), cargarRoles()]);

    if (modo === "agregar") {
        titulo.textContent = "Agregar personal";
        document.getElementById("p_clave").type = "text";
        form.onsubmit = async e => {
            e.preventDefault();
            const roles = Array.from(document.querySelectorAll(".rol-checkbox:checked")).map(ch => ch.value);
            const payload = {
                email: document.getElementById("p_email").value.trim(),
                clave: document.getElementById("p_clave").value.trim(),
                numDocPers: document.getElementById("p_numDocPers").value.trim(),
                nombre: document.getElementById("p_nombPers").value.trim(),
                apePaterno: document.getElementById("p_apePatPers").value.trim(),
                apeMaterno: document.getElementById("p_apeMatPers").value.trim(),
                sexo: document.getElementById("p_sexo").value,
                direccion: document.getElementById("p_direccion").value.trim(),
                telefono: document.getElementById("p_telefono").value.trim(),
                tipoDocumento: document.getElementById("p_tipoDocumento").value,
                cargo: document.getElementById("p_cargo").value,
                parroquia: document.getElementById("p_parroquia").value,
                roles: roles,
                finicio: document.getElementById("p_f_inicio").value || null,
                f_fin: document.getElementById("p_f_fin").value || null
            };
            try {
                await manejarSolicitud("/api/usuario/agregar_personal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }, "Error al agregar personal");
                await cargarPersonales();
                cerrarModal("modalFormularioPersonal");
            } catch (err) { console.error(err); }
        };
    } else if (modo === "editar" && usuario) {
        titulo.textContent = "Editar personal";
        document.getElementById("p_clave").type = "text";
        // llenar campos (fechas en formato YYYY-MM-DD para inputs)
        document.getElementById("p_nombPers").value = usuario.nombPers || "";
        document.getElementById("p_apePatPers").value = usuario.apePatPers || "";
        document.getElementById("p_apeMatPers").value = usuario.apeMatPers || "";
        document.getElementById("p_numDocPers").value = usuario.numDocPers || "";
        document.getElementById("p_email").value = usuario.email || "";
        document.getElementById("p_clave").value = usuario.clave || "";
        document.getElementById("p_sexo").value = usuario.sexoPers || "";
        document.getElementById("p_direccion").value = usuario.direccionPers || "";
        document.getElementById("p_telefono").value = usuario.telefonoPers || "";
        document.getElementById("p_tipoDocumento").value = usuario.nombDocumento || "";
        document.getElementById("p_cargo").value = usuario.nombCargo || "";
        document.getElementById("p_parroquia").value = usuario.nombParroquia || "";
        document.getElementById("p_f_inicio").value = formatDateForInput(usuario.f_inicio) || "";
        document.getElementById("p_f_fin").value = formatDateForInput(usuario.f_fin) || "";

        // marcar roles (asegura que checkboxes ya cargados)
        document.querySelectorAll(".rol-checkbox").forEach(c => {
            c.checked = usuario.roles && usuario.roles.includes(c.value);
        });

        form.onsubmit = async e => {
            e.preventDefault();
            const roles = Array.from(document.querySelectorAll(".rol-checkbox:checked")).map(ch => ch.value);
            const payload = {
                email: document.getElementById("p_email").value.trim(),
                clave: document.getElementById("p_clave").value.trim(),
                numDocPers: document.getElementById("p_numDocPers").value.trim(),
                nombre: document.getElementById("p_nombPers").value.trim(),
                apePaterno: document.getElementById("p_apePatPers").value.trim(),
                apeMaterno: document.getElementById("p_apeMatPers").value.trim(),
                sexo: document.getElementById("p_sexo").value,
                direccion: document.getElementById("p_direccion").value.trim(),
                telefono: document.getElementById("p_telefono").value.trim(),
                tipoDocumento: document.getElementById("p_tipoDocumento").value,
                cargo: document.getElementById("p_cargo").value,
                parroquia: document.getElementById("p_parroquia").value,
                roles: roles,
                finicio: document.getElementById("p_f_inicio").value || null,
                f_fin: document.getElementById("p_f_fin").value || null
            };
            try {
                await manejarSolicitud(`/api/usuario/actualizar_personal/${usuario.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                }, "Error al actualizar personal");
                await cargarPersonales();
                cerrarModal("modalFormularioPersonal");
            } catch (err) { console.error(err); }
        };
    } else if (modo === "ver" && usuario) {
        titulo.textContent = "Detalle personal";
        // poblar y deshabilitar (fechas se muestran en inputs pero deshabilitados)
        document.getElementById("p_nombPers").value = usuario.nombPers || "";
        document.getElementById("p_apePatPers").value = usuario.apePatPers || "";
        document.getElementById("p_apeMatPers").value = usuario.apeMatPers || "";
        document.getElementById("p_numDocPers").value = usuario.numDocPers || "";
        document.getElementById("p_email").value = usuario.email || "";
        document.getElementById("p_clave").value = usuario.clave || "";
        document.getElementById("p_sexo").value = usuario.sexoPers || "";
        document.getElementById("p_direccion").value = usuario.direccionPers || "";
        document.getElementById("p_telefono").value = usuario.telefonoPers || "";
        document.getElementById("p_tipoDocumento").value = usuario.nombDocumento || "";
        document.getElementById("p_cargo").value = usuario.nombCargo || "";
        document.getElementById("p_parroquia").value = usuario.nombParroquia || "";
        document.getElementById("p_f_inicio").value = formatDateForInput(usuario.f_inicio) || "";
        document.getElementById("p_f_fin").value = formatDateForInput(usuario.f_fin) || "";
        // roles
        document.querySelectorAll(".rol-checkbox").forEach(c => {
            c.checked = usuario.roles && usuario.roles.includes(c.value);
            c.disabled = true;
        });

        
        ["p_nombPers","p_apePatPers","p_apeMatPers","p_numDocPers","p_email","p_clave","p_sexo","p_direccion","p_telefono","p_tipoDocumento","p_cargo","p_parroquia","p_roles_container","p_f_inicio","p_f_fin"].forEach(id=> {
            const el = document.getElementById(id);
            if (el) el.disabled = true;
        });
    }

    abrirModal("modalFormularioPersonal");
}

// ---------------- acciones ----------------
function editarPersonal(id) {
    const u = personales.find(x => x.id === id);
    if (!u) return alert("Personal no encontrado");
    abrirModalFormularioPersonal("editar", u);
}

function verDetallePersonal(id) {
        const u = personales.find(x => x.id === id);
    if (!u) return alert("Personal no encontrado");
    abrirModalFormularioPersonal("ver", u);
}

async function eliminarPersonal(id) {
    if (!confirm("¿Seguro de eliminar este personal?")) return;
    try {
        await manejarSolicitud(`/api/usuario/eliminar_personal/${id}`, { method: "DELETE" }, "Error al eliminar personal");
        await cargarPersonales();
    } catch (e) { console.error(e); }
}

async function darDeBajaPersonal(id) {
    try {
        const u = personales.find(x => x.id === id);
        if (!u) return alert("Personal no encontrado");
        const nuevoEstado = !u.estado;
        await manejarSolicitud(`/api/usuario/cambiar_estado_cuenta/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estadoCuenta: nuevoEstado })
        }, "Error al cambiar estado");
        u.estado = nuevoEstado;
        renderTabla();
    } catch (e) { console.error(e); alert("Error al actualizar estado"); }
}

// ---------------- búsqueda ----------------
const inputBuscarPersonal = document.getElementById("inputDocumento");
const btnBuscarPersonal = document.getElementById("btn_buscar");
if (btnBuscarPersonal) {
    btnBuscarPersonal.addEventListener("click", async () => {
        const termino = inputBuscarPersonal.value.trim();
        if (!termino) { personalesFiltrados = null; paginaActual = 1; renderTabla(); return; }
        try {
            const res = await fetch(`/api/usuario/busqueda_personal/${encodeURIComponent(termino)}`);
            if (res.status === 404) { personalesFiltrados = []; renderTabla(); return; }
            if (!res.ok) throw new Error("Error en búsqueda");
            const data = await res.json();
            const items = Array.isArray(data.datos) ? data.datos : (Array.isArray(data) ? data : (data.datos ? data.datos : []));
            personalesFiltrados = items.map(normalizarPersonal);
            paginaActual = 1;
            renderTabla();
        } catch (err) { console.error(err); alert("Error al buscar personal"); }
    });
}

// orden tabla (mantener tu comportamiento)
document.querySelectorAll("#tablaDocumentos thead th").forEach((th, index) => {
    th.style.cursor = "pointer";
    th.addEventListener("click", () => {
        let campo = index === 2 ? "nombreCompleto" : null; // ajustado: columna 2 es nombre en esta versión
        if (!campo) return;
        if (ordenActual.campo === campo) ordenActual.ascendente = !ordenActual.ascendente;
        else { ordenActual.campo = campo; ordenActual.ascendente = true; }
        renderTabla();
    });
});

// botón agregar
const btnAgregar = document.getElementById("btn_guardar");
if (btnAgregar) btnAgregar.addEventListener("click", () => abrirModalFormularioPersonal("agregar"));

// inicializar
cargarPersonales();
