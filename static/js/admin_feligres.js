// ================== VARIABLES GLOBALES ==================
let feligreses = [];
let tiposDocumento = []; // Almacenará los tipos de documento
let feligresesFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 5;

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");
const listaSugerencias = document.getElementById("listaSugerencias"); // Usamos la UL del HTML

// ================== FUNCIONES ==================

/**
 * Normaliza los datos venidos de la API
 */
function normalizarFeligres(item) {
  return {
    idFeligres: item.idFeligres,
    // Concatenamos el nombre completo
    nombreCompleto: `${item.apePatFel} ${item.apeMatFel}, ${item.nombFel}`,
    numDocFel: item.numDocFel,
    email: item.email,
    estadoCuenta: item.estadoCuenta === true || item.estadoCuenta === 1,
    idUsuario: item.idUsuario
  };
}

// ================== RENDERIZAR TABLA ==================
function renderTabla() {
  tabla.innerHTML = "";
  const lista = feligresesFiltrados ?? feligreses;

  if (lista.length === 0) {
    tabla.innerHTML = '<tr><td colspan="5" style="text-align:center;">No hay feligreses para mostrar.</td></tr>';
    renderPaginacion(0);
    return;
  }

  const inicio = (paginaActual - 1) * elementosPorPagina;
  const fin = inicio + elementosPorPagina;
  const feligresesPagina = lista.slice(inicio, fin);

  feligresesPagina.forEach((f, index) => {
    const esActivo = f.estadoCuenta;
    const botonColor = esActivo ? "btn-orange" : "btn-success";
    const rotacion = esActivo ? "" : "transform: rotate(180deg);";
    const tituloBoton = esActivo ? 'Desactivar Cuenta' : 'Activar Cuenta';

    const fila = document.createElement("tr");
    fila.innerHTML = `
      <td class.col-id">${inicio + index + 1}</td>
      <td class="col-nombre">${f.nombreCompleto}</td>
      <td class="col-numDocumento">${f.numDocFel}</td>
      <td class="col-correo">${f.email}</td>
      <td class="col-acciones">
        <div class="d-flex justify-content-center flex-wrap gap-1">
          <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${f.idFeligres})" title="Ver">
            <img src="/static/img/ojo.png" alt="ver">
          </button>
          <button class="btn btn-warning btn-sm" onclick="abrirModalFormulario('editar', ${f.idFeligres})" title="Editar">
            <img src="/static/img/lapiz.png" alt="editar">
          </button>
          <button class="btn ${botonColor} btn-sm" onclick="cambiarEstadoFeligres(${f.idUsuario}, ${esActivo})" title="${tituloBoton}">
            <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
          </button>
          <button class="btn btn-danger btn-sm" onclick="eliminarFeligres(${f.idFeligres})" title="Eliminar">
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
  const totalPaginas = Math.ceil((feligresesFiltrados ?? feligreses).length / elementosPorPagina);
  if (pagina < 1 || pagina > totalPaginas) return;
  paginaActual = pagina;
  renderTabla();
}

// ================== MODALES (Creación dinámica) ==================

function crearModalFormulario() {
  const modalHTML = document.createElement("div");
  // Este modal es mucho más grande
  modalHTML.innerHTML = `
    <div class="modal" id="modalFormulario">
      <div class="modal-dialog modal-lg"> <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalFormularioTitulo"></h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalFormulario')">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formModalFeligres">
              
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
                  <label for="modalNombFel" class="form-label">Nombres</label>
                  <input type="text" id="modalNombFel" class="form-control" required>
                </div>
                 <div class="mb-3">
                  <label for="modalApePatFel" class="form-label">Apellido Paterno</label>
                  <input type="text" id="modalApePatFel" class="form-control" required>
                </div>
                 <div class="mb-3">
                  <label for="modalApeMatFel" class="form-label">Apellido Materno</label>
                  <input type="text" id="modalApeMatFel" class="form-control" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="mb-3">
                  <label for="modalTipoDocumento" class="form-label">Tipo Documento</label>
                  <select id="modalTipoDocumento" class="form-control" required>
                    <option value="">Cargando...</option>
                  </select>
                </div>
                <div class="mb-3 form-grid-item-full">
                  <label for="modalNumDocFel" class="form-label">Número de Documento</label>
                  <input type="text" id="modalNumDocFel" class="form-control" required>
                </div>
              </div>

              <div class="form-grid">
                <div class="mb-3">
                  <label for="modalFNac" class="form-label">Fecha Nacimiento</label>
                  <input type="date" id="modalFNac" class="form-control">
                </div>
                 <div class="mb-3">
                  <label for="modalSexo" class="form-label">Sexo</label>
                  <select id="modalSexo" class="form-control">
                    <option value="">Seleccionar...</option>
                    <option value="M">Masculino</option>
                    <option value="F">Femenino</option>
                  </select>
                </div>
                <div class="mb-3">
                  <label for="modalTelefono" class="form-label">Teléfono</label>
                  <input type="tel" id="modalTelefono" class="form-control">
                </div>
              </div>

               <div class="mb-3">
                  <label for="modalDireccion" class="form-label">Dirección</label>
                  <input type="text" id="modalDireccion" class="form-control">
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
    select.innerHTML = '<option value="">Seleccionar...</option>'; // Limpiar
    
    // Filtramos solo los activos
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
async function abrirModalFormulario(modo, idFeligres = null) {
  // Asegurarnos que los tipos de documento estén cargados
  if (tiposDocumento.length === 0) {
      mostrarAlerta("Error: No se cargaron los tipos de documento.", "error");
      return;
  }
  
  popularTiposDocumentoSelect(); // Popular el <select>

  const form = document.getElementById("formModalFeligres");
  const footer = document.getElementById("modalFormularioFooter");
  footer.innerHTML = ""; // Limpiar botones

  // Referencias a todos los campos
  const campos = {
      titulo: document.getElementById("modalFormularioTitulo"),
      email: document.getElementById("modalEmail"),
      clave: document.getElementById("modalClave"),
      claveConfirmar: document.getElementById("modalClaveConfirmar"),
      campoClave: document.getElementById("campoClave"),
      campoClaveConfirmar: document.getElementById("campoClaveConfirmar"),
      nombFel: document.getElementById("modalNombFel"),
      apePatFel: document.getElementById("modalApePatFel"),
      apeMatFel: document.getElementById("modalApeMatFel"),
      tipoDoc: document.getElementById("modalTipoDocumento"),
      numDoc: document.getElementById("modalNumDocFel"),
      fNac: document.getElementById("modalFNac"),
      sexo: document.getElementById("modalSexo"),
      telefono: document.getElementById("modalTelefono"),
      direccion: document.getElementById("modalDireccion"),
  };

  // Resetear estado 'disabled'
  for (const key in campos) {
      if (campos[key] && campos[key].disabled !== undefined) {
          campos[key].disabled = false;
      }
  }

  // Botón genérico de Cerrar
  const btnCerrar = document.createElement("button");
  btnCerrar.type = "button";
  btnCerrar.className = "btn-modal btn-modal-secondary";
  btnCerrar.textContent = "Cerrar";
  btnCerrar.onclick = () => cerrarModal("modalFormulario");

  // Botón genérico de Guardar
  const btnGuardar = document.createElement("button");
  btnGuardar.type = "submit";
  btnGuardar.className = "btn-modal btn-modal-primary";
  btnGuardar.textContent = "Guardar";
  
  // Limpiar formulario
  form.reset();

  if (modo === "agregar") {
    campos.titulo.textContent = "Agregar Feligrés";
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
            nombFel: campos.nombFel.value,
            apePatFel: campos.apePatFel.value,
            apeMatFel: campos.apeMatFel.value,
            idTipoDocumento: campos.tipoDoc.value,
            numDocFel: campos.numDoc.value,
            f_nacimiento: campos.fNac.value || null,
            sexoFel: campos.sexo.value || null,
            telefonoFel: campos.telefono.value || null,
            direccionFel: campos.direccion.value || null,
        };
        guardarFeligres('POST', '/api/feligres/feligreses', data);
    };

  } else if (modo === "editar" || modo === "ver") {
    // Cargar datos completos del feligrés
    const feligres = await cargarFeligresPorId(idFeligres);
    if (!feligres) return;

    campos.titulo.textContent = modo === 'editar' ? "Editar Feligrés" : "Detalle del Feligrés";
    
    // Ocultar campos de clave
    campos.campoClave.style.display = "none";
    campos.campoClaveConfirmar.style.display = "none";
    campos.clave.required = false;
    campos.claveConfirmar.required = false;

    // Llenar el formulario
    campos.email.value = feligres.email;
    campos.nombFel.value = feligres.nombFel;
    campos.apePatFel.value = feligres.apePatFel;
    campos.apeMatFel.value = feligres.apeMatFel;
    campos.tipoDoc.value = feligres.idTipoDocumento;
    campos.numDoc.value = feligres.numDocFel;
    campos.fNac.value = feligres.f_nacimiento || "";
    campos.sexo.value = feligres.sexoFel || "";
    campos.telefono.value = feligres.telefonoFel || "";
    campos.direccion.value = feligres.direccionFel || "";

    if (modo === 'editar') {
        footer.appendChild(btnCerrar);
        footer.appendChild(btnGuardar);

        form.onsubmit = (e) => {
            e.preventDefault();
            const data = {
                idUsuario: feligres.idUsuario, // Importante para actualizar el usuario
                email: campos.email.value,
                nombFel: campos.nombFel.value,
                apePatFel: campos.apePatFel.value,
                apeMatFel: campos.apeMatFel.value,
                idTipoDocumento: campos.tipoDoc.value,
                numDocFel: campos.numDoc.value,
                f_nacimiento: campos.fNac.value || null,
                sexoFel: campos.sexo.value || null,
                telefonoFel: campos.telefono.value || null,
                direccionFel: campos.direccion.value || null,
            };
            guardarFeligres('PUT', `/api/feligres/feligreses/${idFeligres}`, data);
        };

    } else { // modo === 'ver'
        footer.appendChild(btnCerrar);
        // Deshabilitar todos los campos
        for (const key in campos) {
            if (campos[key] && campos[key].disabled !== undefined) {
                campos[key].disabled = true;
            }
        }
        form.onsubmit = (e) => e.preventDefault();
    }
  }

  abrirModal("modalFormulario");
}


// ================== CRUD (API Fetch) ==================

/**
 * Carga los datos iniciales (Feligreses y Tipos de Documento)
 */
async function cargarDatosIniciales() {
  try {
    // Cargar tipos de documento primero
    const respTiposDoc = await fetch("/api/tipoDocumento/documentos");
    const dataTiposDoc = await respTiposDoc.json();
    if (dataTiposDoc.success) {
      tiposDocumento = dataTiposDoc.datos.map(td => ({
          idTipoDocumento: td.idTipoDocumento,
          nombDocumento: td.nombDocumento,
          estadoDocumento: td.estadoDocumento
      }));
    } else {
      mostrarAlerta("Error fatal: No se pudieron cargar los tipos de documento.", "error");
    }

    // Cargar feligreses
    const respFeligreses = await fetch("/api/feligres/feligreses");
    const dataFeligreses = await respFeligreses.json();
    if (dataFeligreses.success && Array.isArray(dataFeligreses.datos)) {
      feligreses = dataFeligreses.datos.map(normalizarFeligres);
      feligresesFiltrados = null;
      inputBusqueda.value = "";
      paginaActual = 1;
      renderTabla();
    } else {
      feligreses = [];
      renderTabla();
      mostrarAlerta(dataFeligreses.mensaje || "No se pudieron cargar los feligreses", "error");
    }
  } catch (err) {
    console.error("Error cargando datos iniciales:", err);
    mostrarAlerta("Error de conexión con la API", "error");
  }
}

/**
 * Carga los datos completos de UN feligrés (para modal)
 */
async function cargarFeligresPorId(id) {
    try {
        const respuesta = await fetch(`/api/feligres/feligreses/${id}`);
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
async function guardarFeligres(method, url, data) {
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
async function cambiarEstadoFeligres(idUsuario, estadoActual) {
    const nuevoEstado = !estadoActual;
    const confirmacion = confirm(`¿Seguro que deseas ${nuevoEstado ? 'activar' : 'desactivar'} esta cuenta?`);
    if (!confirmacion) return;

    try {
        const respuesta = await fetch(`/api/feligres/feligreses/${idUsuario}/estado`, {
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
 * Elimina un feligrés (y su usuario asociado)
 */
async function eliminarFeligres(idFeligres) {
    const f = feligreses.find((fel) => fel.idFeligres === idFeligres);
    if (!f) return;
    
    if (!confirm(`¿Seguro que deseas eliminar al feligrés "${f.nombreCompleto}"?\n\n¡ATENCIÓN! Esto eliminará también su cuenta de usuario y es irreversible.`)) return;

    try {
        const respuesta = await fetch(`/api/feligres/feligreses/${idFeligres}`, {
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

// Evento de 'input' para mostrar sugerencias
inputBusqueda.addEventListener("input", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  listaSugerencias.innerHTML = ""; // Limpiar sugerencias
  listaSugerencias.style.display = "none";

  if (termino.length === 0) {
    return;
  }

  const sugerencias = feligreses.filter(f => 
      f.nombreCompleto.toLowerCase().includes(termino) ||
      f.numDocFel.toLowerCase().includes(termino) ||
      f.email.toLowerCase().includes(termino)
  ).slice(0, 5); // Limitar a 5 sugerencias

  if (sugerencias.length === 0) {
    return;
  }

  sugerencias.forEach(f => {
    const item = document.createElement("li");
    item.textContent = `${f.nombreCompleto} (${f.numDocFel})`;
    item.onclick = () => {
      inputBusqueda.value = f.nombreCompleto; // Autocompletar
      listaSugerencias.style.display = "none"; // Ocultar
      document.getElementById("btn_buscar").click(); // Simular búsqueda
    };
    listaSugerencias.appendChild(item);
  });

  listaSugerencias.style.display = "block"; // Mostrar lista
});

// Ocultar sugerencias si se hace clic fuera
document.addEventListener("click", (e) => {
  if (e.target !== inputBusqueda) {
    listaSugerencias.style.display = "none";
  }
});

// Botón de Búsqueda (Filtro local)
document.getElementById("btn_buscar").addEventListener("click", () => {
  const termino = inputBusqueda.value.trim().toLowerCase();
  if (termino === "") {
    feligresesFiltrados = null;
  } else {
    feligresesFiltrados = feligreses.filter(f => 
      f.nombreCompleto.toLowerCase().includes(termino) ||
      f.numDocFel.toLowerCase().includes(termino) ||
      f.email.toLowerCase().includes(termino)
    );
  }
  paginaActual = 1;
  renderTabla();
  listaSugerencias.style.display = "none";
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