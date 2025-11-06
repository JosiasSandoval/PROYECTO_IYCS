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
// El contenedor de sugerencias se crea dinámicamente

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

// Botón de Búsqueda (Filtro local)
const btnBuscar = document.getElementById("btn_buscar");
btnBuscar.addEventListener("click", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  if (termino === "") {
    personalFiltrados = null;
  } else {
    personalFiltrados = personal.filter(p => 
      p.nombreCompleto.toLowerCase().includes(termino) ||
      String(p.numDocPers).toLowerCase().includes(termino) || // Convertir a String
      p.email.toLowerCase().includes(termino) ||
      p.cargo.toLowerCase().includes(termino)
    );
  }
  paginaActual = 1;
  renderTabla();
  contenedorSugerencias.style.display = "none"; // Ocultar sugerencias
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


// ==================================================
// === INICIO: BLOQUE DE SUGERENCIAS (DINÁMICO) ===
// ==================================================

// 1. Crear el contenedor de sugerencias dinámicamente
const contenedorSugerencias = document.createElement("div");
contenedorSugerencias.id = "sugerenciasContainer";
document.body.appendChild(contenedorSugerencias); 

// 2. Función para posicionar el contenedor
function posicionarSugerencias() {
    const rect = inputBusqueda.getBoundingClientRect(); 
    contenedorSugerencias.style.left = `${rect.left + window.scrollX}px`;
    contenedorSugerencias.style.top = `${rect.bottom + window.scrollY}px`;
    contenedorSugerencias.style.width = `${rect.width}px`;
}

// 3. Event listener 'input' (Lógica de filtrado)
inputBusqueda.addEventListener("input", () => {
    const termino = inputBusqueda.value.trim().toLowerCase();
    contenedorSugerencias.innerHTML = ""; // Limpiar
    
    if (termino.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    // Adaptado para 'personal', 'nombreCompleto' y 'numDocPers'
    const sugerencias = personal.filter(p => 
        p.nombreCompleto.toLowerCase().startsWith(termino) ||
        String(p.numDocPers).toLowerCase().startsWith(termino) // Convertir a String
    ).slice(0, 5); 

    if (sugerencias.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    sugerencias.forEach(p => {
        const item = document.createElement("div");
        item.className = "sugerencia-item";
        item.textContent = `${p.nombreCompleto} (${p.cargo})`; // Mostrar nombre y cargo
        
        item.onclick = () => {
            inputBusqueda.value = p.nombreCompleto;
            contenedorSugerencias.style.display = "none";
            document.getElementById("btn_buscar").click(); // Simular clic
        };
        contenedorSugerencias.appendChild(item);
    });

    contenedorSugerencias.style.display = "block";
    posicionarSugerencias(); // Posicionarlo
});

// 4. Listeners para ocultar/reposicionar
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
    cargarDatosIniciales();
});