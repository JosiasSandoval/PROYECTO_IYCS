// ================== VARIABLES GLOBALES ==================
let actos = []; // Se llenará desde la API
let actosFiltrados = null;
let actoEditandoId = null; // Para saber qué ID estamos editando

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");

// Referencia al modal (se crea al cargar)
let modalFormulario = null; 

let paginaActual = 1;
// --- CONFIGURACIÓN DE PAGINACIÓN ---
const elementosPorPagina = 7; // Mantenemos 5 para que con 6 registros aparezca la paginación

// Variable de ordenamiento
let ordenActual = { campo: null, ascendente: true };

// ================== INICIALIZACIÓN (DOM Cargado) ==================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Crear el HTML del modal en el DOM
    modalFormulario = crearModalFormulario(); 

    // 2. Cargar los actos desde la API al iniciar
    cargarActosDesdeAPI();

    // 3. Evento del formulario principal (Botón "Nuevo")
    document.getElementById("formDocumento").addEventListener("submit", (e) => {
        e.preventDefault();
        abrirModalFormulario("agregar");
    });
    
    // 4. Evento del botón de búsqueda
    const btnBuscar = document.getElementById("btn_buscar");
    btnBuscar.addEventListener("click", () => {
        const termino = inputBusqueda.value.trim().toLowerCase();
        actosFiltrados =
            termino === ""
                ? null
                : actos.filter((a) => a.nombActo.toLowerCase().includes(termino));
        paginaActual = 1;
        renderTabla();
    });

    // 5. Event listener para el checkbox de Testigos (dentro del modal)
    document.body.addEventListener('change', function(e) {
        if (e.target.id === 'checkTestigo') {
            const spinner = document.getElementById('testigoCantidad');
            if (!spinner) return; // Seguridad
            
            if (e.target.checked) {
                spinner.disabled = false;
                if (spinner.value === '0') {
                    spinner.value = 1; // Poner 1 por defecto
                }
            } else {
                spinner.disabled = true;
                spinner.value = 0;
            }
        }
    });

    // 6. Listener para el input de búsqueda (para sugerencias)
    configurarSugerencias();
});


// ================== MANEJO DE DATOS Y API ==================

/**
 * Manejador genérico de fetch para la API
 */
const manejarSolicitud = async (url, opciones = {}, mensajeError = "Error") => {
    try {
        const res = await fetch(url, opciones);
        const contentType = res.headers.get("content-type");

        if (!res.ok) {
             // Si la respuesta es JSON (un error de API), muéstralo
            if (contentType && contentType.includes("application/json")) {
                const errData = await res.json();
                throw new Error(errData.mensaje || mensajeError);
            } else {
                // Si la respuesta es HTML (un error 500 o 404 de Flask), muestra un error genérico
                throw new Error(`${mensajeError} (Error ${res.status}: ${res.statusText})`);
            }
        }
        
        // Si la respuesta es JSON (éxito), devuélvela
        if (contentType && contentType.includes("application/json")) {
             return await res.json();
        } else {
            // Si la respuesta no es JSON (inesperado), lanza error
            throw new Error("La respuesta del servidor no es un JSON válido.");
        }

    } catch (err) {
        console.error(mensajeError, err);
        mostrarAlerta(err.message || "Error de conexión", "error");
        throw err;
    }
};

/**
 * Normaliza los datos venidos de la API para que coincidan con el JS
 */
function normalizarActo(item) {
    return {
        idActo: item.idActo,
        nombActo: item.nombActo,
        descripcion: item.descripcion || "---",
        numParticipantes: item.numParticipantes,
        tipoParticipantes: item.tipoParticipantes,
        costoBase: parseFloat(item.costoBase).toFixed(2),
        estadoActo: item.estadoActo === true || item.estadoActo === 1,
        imgActo: item.imgActo || "N/A"
    };
}

/**
 * Carga todos los actos desde el backend.
 */
async function cargarActosDesdeAPI() {
    try {
        // Esta es la URL que tu Python define: /acto_liturgico/actos
        const data = await manejarSolicitud("/api/acto_liturgico/actos", {}, "Error al cargar actos");
        
        if (data.success && Array.isArray(data.datos)) {
            actos = data.datos.map(normalizarActo); // Normaliza y guarda los datos
            actosFiltrados = null;
            inputBusqueda.value = "";
            paginaActual = 1;
            renderTabla();
        } else {
            actos = [];
            renderTabla();
        }
    } catch (err) {
        // El manejador ya mostró la alerta
        console.error("Fallo en cargarActosDesdeAPI:", err);
    }
}


// ================== RENDERIZADO DE TABLA Y PAGINACIÓN ==================

// Renderizar tabla
function renderTabla() {
    tabla.innerHTML = "";
    const lista = actosFiltrados ?? actos;

    if (lista.length === 0) {
        tabla.innerHTML = '<tr><td colspan="7" style="text-align:center;">No hay actos litúrgicos para mostrar.</td></tr>';
        renderPaginacion(0);
        return;
    }

    if (ordenActual.campo) {
        lista.sort((a, b) => {
            const campo = ordenActual.campo;
            const valorA = a[campo] ? a[campo].toString().toLowerCase() : "";
            const valorB = b[campo] ? b[campo].toString().toLowerCase() : "";
            if (valorA < valorB) return ordenActual.ascendente ? -1 : 1;
            if (valorA > valorB) return ordenActual.ascendente ? 1 : -1;
            return 0;
        });
    }

    const inicio = (paginaActual - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    const actosPagina = lista.slice(inicio, fin);

    actosPagina.forEach((acto, index) => {
        const esActivo = acto.estadoActo;
        const botonColor = esActivo ? "btn-orange" : "btn-success";
        const rotacion = esActivo ? "" : "transform: rotate(180deg);";
        const tituloBoton = esActivo ? 'Dar de baja' : 'Dar de alta';

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td class="col-id">${acto.idActo}</td>
            <td class="col-nombre">${acto.nombActo}</td>
            <td class="col-descripcion">${acto.descripcion}</td>
            <td class="col-numParticipantes">${acto.numParticipantes}</td>
            <td class="col-tipoParticipantes">${acto.tipoParticipantes}</td>
            <td class="col-precio">S/ ${acto.costoBase}</td>
            <td class="col-acciones">
                <div class="d-flex justify-content-center flex-wrap gap-1">
                    <button class="btn btn-info btn-sm" onclick="abrirModalFormulario('ver', ${acto.idActo})" title="Ver">
                        <img src="/static/img/ojo.png" alt="ver">
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="abrirModalFormulario('editar', ${acto.idActo})" title="Editar">
                        <img src="/static/img/lapiz.png" alt="editar">
                    </button>
                    <button class="btn ${botonColor} btn-sm" onclick="cambiarEstadoActo(${acto.idActo}, ${esActivo})" title="${tituloBoton}">
                        <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarActo(${acto.idActo})" title="Eliminar">
                        <img src="/static/img/x.png" alt="eliminar">
                    </button>
                </div>
            </td>
        `;
        tabla.appendChild(fila);
    });

    renderPaginacion(lista.length);
}

// Renderizar Paginación
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
        
        let paginaDestino = numero;
        if (texto === "<") paginaDestino = paginaActual - 1;
        if (texto === ">") paginaDestino = paginaActual + 1;

        if (!disabled) btn.onclick = () => cambiarPagina(paginaDestino);
        
        btn.innerHTML = texto || numero;
        li.appendChild(btn);
        return li;
    };
    ul.appendChild(crearItem(null, false, paginaActual === 1, "<"));
    
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

    ul.appendChild(crearItem(null, false, paginaActual === totalPaginas, ">"));
    paginacion.appendChild(ul);
}

// Cambiar Página
function cambiarPagina(pagina) {
    const totalPaginas = Math.ceil((actosFiltrados ?? actos).length / elementosPorPagina);
    if (pagina < 1 || pagina > totalPaginas) return;
    paginaActual = pagina;
    renderTabla();
}

// ================== CRUD (Acciones) ==================

/**
 * Guarda (Crea o Edita) un acto en la API.
 */
async function guardarActoAPI(evento) {
    evento.preventDefault();
    const form = document.getElementById('formModal');

    // Validación simple de campos
    const nombre = document.getElementById('modalNombre').value;
    const costo = document.getElementById('modalCostoBase').value;
    const img = document.getElementById('modalImgActo').value;

    if (!nombre || nombre.trim() === "" || !costo || !img) {
        mostrarAlerta("Por favor, complete todos los campos obligatorios (*).", "error");
        form.querySelectorAll('input[required]').forEach(input => {
            if (!input.value) input.style.borderColor = 'red'; 
        });
        return;
    }
     form.querySelectorAll('input[required]').forEach(input => {
        input.style.borderColor = '#ced4da';
    });

    const cadenaParticipantes = compilarParticipantes();
    if (cadenaParticipantes.length === 0) {
        mostrarAlerta('Debe seleccionar al menos un tipo de participante.', 'error');
        return;
    }
    
    const numeroParticipantes = calcularNumParticipantes();

    const data = {
        nombActo: nombre,
        descripcion: document.getElementById('modalDescripcion').value || null,
        imgActo: img,
        costoBase: parseFloat(costo),
        tipoParticipantes: cadenaParticipantes,
        numParticipantes: numeroParticipantes
    };

    const modo = document.getElementById('modalMode').value;
    let url = '/api/acto_liturgico/actos';
    let method = 'POST';

    if (modo === 'editar') {
        url = `/api/acto_liturgico/actos/${actoEditandoId}`;
        method = 'PUT';
    } else {
        // Al crear, se setea como activo por defecto en la BD
        data.estadoActo = true;
    }

    try {
        const result = await manejarSolicitud(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        }, "Error al guardar acto");

        if (result.success) {
            mostrarAlerta(result.mensaje, "success");
            cerrarModal('modalFormulario');
            cargarActosDesdeAPI(); 
        }
    } catch (error) {
        // El manejador ya mostró la alerta
    }
}

/**
 * Cambia el estado (Activo/Inactivo)
 */
async function cambiarEstadoActo(id, estadoActual) {
    const acto = actos.find(a => a.idActo === id);
    if (!acto) return;
    
    const nuevoEstado = !estadoActual;
    const confirmacion = confirm(`¿Seguro que deseas ${nuevoEstado ? 'activar' : 'desactivar'} el acto "${acto.nombActo}"?`);
    if (!confirmacion) return;

    try {
        const res = await manejarSolicitud(`/api/acto_liturgico/actos/${id}/estado`, {
            method: 'PATCH',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado }),
        }, "Error al cambiar estado");
        
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarActosDesdeAPI();
        }
    } catch (err) {
        // El manejador ya mostró la alerta
    }
}

/**
 * Elimina un acto
 */
async function eliminarActo(id) {
    const acto = actos.find(a => a.idActo === id);
    if (!acto) return;

    if (!confirm(`¿Seguro que deseas eliminar el acto litúrgico "${acto.nombActo}"?`)) return;

    try {
        const res = await manejarSolicitud(`/api/acto_liturgico/actos/${id}`, {
            method: 'DELETE',
        }, "Error al eliminar acto");
        
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarActosDesdeAPI();
        }
    } catch (err) {
        // El manejador ya mostró la alerta (ej. si está en uso)
    }
}

// Funciones para los botones de la tabla
function editarActo(id) {
    abrirModalFormulario('editar', id);
}
function verActo(id) {
    abrirModalFormulario('ver', id);
}

// ================== LÓGICA DE MODALES ==================

/**
 * Crea el HTML del modal avanzado en el DOM.
 */
function crearModalFormulario() {
    const modalContainer = document.createElement("div");
    modalContainer.innerHTML = `
    <div class="modal" id="modalFormulario">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="modalFormularioTitulo">Gestionar Acto Litúrgico</h5>
            <button type="button" class="btn-cerrar" onclick="cerrarModal('modalFormulario')">&times;</button>
          </div>
          <div class="modal-body">
            <form id="formModal" novalidate onsubmit="event.preventDefault();">
              <input type="hidden" id="modalMode" name="modalMode">
    
              <div class="row"> <div>
                  <div class="mb-3">
                    <label for="modalNombre" class="form-label">Nombre del Acto <span class="text-danger">*</span></label>
                    <input type="text" class="form-control" id="modalNombre" name="nombActo" required>
                  </div>
                  <div class="mb-3">
                    <label for="modalDescripcion" class="form-label">Descripción</label>
                    <textarea class="form-control" id="modalDescripcion" name="descripcion" rows="3"></textarea>
                  </div>
                  <div class="mb-3">
                    <label for="modalImgActo" class="form-label">URL de Imagen <span class="text-danger">*</span></label>
                    <input type="url" class="form-control" id="modalImgActo" name="imgActo" placeholder="https://ejemplo.com/imagen.jpg" required>
                  </div>
                  <div class="form-grid"> 
                    <div class="mb-3">
                      <label for="modalCostoBase" class="form-label">Costo Base (S/) <span class="text-danger">*</span></label>
                      <input type="number" class="form-control" id="modalCostoBase" name="costoBase" step="0.01" min="0" value="0.00" required>
                    </div>
                    </div>
                </div>
    
                <div>
                  <label class="form-label">Tipos de Participantes <span class="text-danger">*</span></label>
                  <div class="participantes-container" id="participantesCheckboxes">
                    
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" value="Beneficiario" id="checkBeneficiario" name="participante">
                      <label class="form-check-label" for="checkBeneficiario">Beneficiario</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" value="Sacerdote" id="checkSacerdote" name="participante" checked disabled>
                      <label class="form-check-label" for="checkSacerdote">Sacerdote</label>
                    </div>
                    <hr style="margin: 8px 0;">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" value="Padre" id="checkPadre" name="participante">
                      <label class="form-check-label" for="checkPadre">Padre</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" value="Madre" id="checkMadre" name="participante">
                      <label class="form-check-label" for="checkMadre">Madre</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" value="Padrino" id="checkPadrino" name="participante">
                      <label class="form-check-label" for="checkPadrino">Padrino</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" value="Madrina" id="checkMadrina" name="participante">
                      <label class="form-check-label" for="checkMadrina">Madrina</label>
                    </div>
                    <hr style="margin: 8px 0;">
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" value="Novio" id="checkNovio" name="participante">
                      <label class="form-check-label" for="checkNovio">Novio</label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" value="Novia" id="checkNovia" name="participante">
                      <label class="form-check-label" for="checkNovia">Novia</label>
                    </div>
                    <hr style="margin: 8px 0;">
                    <div class="testigo-row">
                      <div class="form-check" style="margin-bottom: 0;">
                        <input class="form-check-input" type="checkbox" value="Testigo" id="checkTestigo" name="participante-special">
                        <label class="form-check-label" for="checkTestigo">Testigo(s)</label>
                      </div>
                      <input type="number" class="form-control" id="testigoCantidad" min="0" value="0">
                    </div>
    
                  </div>
                </div>
              </div>
    
            </form>
          </div>
          <div class="modal-footer" id="modalFormularioFooter">
             </div>
        </div>
      </div>
    </div>
    `;
    document.body.appendChild(modalContainer);
    return document.getElementById("modalFormulario");
}

// Tu función original para abrir el modal
function abrirModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add("activo");
}

// Tu función original para cerrar el modal
function cerrarModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove("activo");
    const form = document.getElementById('formModal');
    if (form) {
        form.classList.remove('was-validated');
        form.querySelectorAll('input[required]').forEach(input => {
            input.style.borderColor = '#ced4da'; // Restaura borde
        });
    }
}

/**
 * Abre el modal y lo configura para "agregar", "editar" o "ver".
 */
async function abrirModalFormulario(modo, idActo = null) {
    const form = document.getElementById("formModal");
    const footer = document.getElementById("modalFormularioFooter");
    footer.innerHTML = "";
    form.reset();
    form.classList.remove('was-validated');

    const campos = {
        titulo: document.getElementById("modalFormularioTitulo"),
        nombre: document.getElementById("modalNombre"),
        descripcion: document.getElementById('modalDescripcion'),
        imgActo: document.getElementById('modalImgActo'),
        costoBase: document.getElementById('modalCostoBase'),
        checkboxes: document.querySelectorAll('#participantesCheckboxes input'),
        testigoCantidad: document.getElementById('testigoCantidad'),
        modo: document.getElementById('modalMode')
    };

    campos.modo.value = modo;
    const esVista = (modo === 'ver');
    
    [campos.nombre, campos.descripcion, campos.imgActo, campos.costoBase, campos.testigoCantidad].forEach(el => el.disabled = esVista);
    
    campos.checkboxes.forEach(cb => {
        if (cb.id !== 'checkSacerdote') { 
            cb.disabled = esVista;
        }
    });

    const btnCerrar = document.createElement("button");
    btnCerrar.type = "button";
    btnCerrar.className = "btn-modal btn-modal-secondary";
    btnCerrar.textContent = "Cerrar";
    btnCerrar.onclick = () => cerrarModal("modalFormulario");
    footer.appendChild(btnCerrar);

    if (!esVista) {
        const btnGuardar = document.createElement("button");
        btnGuardar.type = "button"; 
        btnGuardar.id = "btnGuardarSubmit"; 
        btnGuardar.className = "btn-modal btn-modal-primary";
        btnGuardar.textContent = "Guardar";
        btnGuardar.onclick = guardarActoAPI; 
        footer.appendChild(btnGuardar);
    }

    if (modo === "agregar") {
        campos.titulo.textContent = "Agregar Acto Litúrgico";
        actoEditandoId = null;
        parsearYSetearParticipantes("", esVista); 

    } else { // 'editar' o 'ver'
        let acto;
        try {
            const res = await manejarSolicitud(`/api/acto_liturgico/actos/${idActo}`, {}, "Error al cargar acto");
            if (!res.success) {
                cerrarModal("modalFormulario");
                return;
            }
            acto = normalizarActo(res.datos);
            
        } catch (err) {
            cerrarModal("modalFormulario");
            return;
        }

        campos.titulo.textContent = modo === 'editar' ? "Editar Acto Litúrgico" : "Detalle del Acto";
        actoEditandoId = acto.idActo; 
        
        // Poblar datos
        campos.nombre.value = acto.nombActo;
        campos.descripcion.value = acto.descripcion === "---" ? "" : (acto.descripcion || "");
        campos.imgActo.value = acto.imgActo === "N/A" ? "" : (acto.imgActo || "");
        campos.costoBase.value = acto.costoBase;
        parsearYSetearParticipantes(acto.tipoParticipantes, esVista); 
    }

    abrirModal("modalFormulario");
}


// ================== HELPERS DEL MODAL ==================

function compilarParticipantes() {
  const participantes = [];
  document.querySelectorAll('input[name="participante"]:checked').forEach((checkbox) => {
    participantes.push(checkbox.value);
  });
  
  const checkTestigo = document.getElementById('checkTestigo');
  const cantidadTestigos = document.getElementById('testigoCantidad').value || 0;
  if (checkTestigo.checked) {
    if (parseInt(cantidadTestigos, 10) > 0) {
      participantes.push(`Testigo (${cantidadTestigos})`);
    } else {
      participantes.push('Testigo'); 
    }
  }
  return participantes.join(',');
}

function calcularNumParticipantes() {
  let total = 0;
  total += document.querySelectorAll('input[name="participante"]:checked').length;
  
  const checkTestigo = document.getElementById('checkTestigo');
  if (checkTestigo.checked) {
    const cantidadTestigos = document.getElementById('testigoCantidad').value || 0;
    total += parseInt(cantidadTestigos, 10);
  }
  return total;
}

function parsearYSetearParticipantes(cadena, esVista = false) {
  // 1. Resetear todos los checkboxes EXCEPTO el de Sacerdote
  document.querySelectorAll('input[name="participante"]').forEach(cb => {
      if (cb.id !== 'checkSacerdote') {
          cb.checked = false;
      }
  });
  document.getElementById('checkTestigo').checked = false;
  document.getElementById('testigoCantidad').value = 0;
  document.getElementById('testigoCantidad').disabled = true;

  // 2. Asegurarse de que Sacerdote esté SIEMPRE marcado
  document.getElementById('checkSacerdote').checked = true;

  if (!cadena) return;
  const partes = cadena.split(',').map(s => s.trim());

  partes.forEach(parte => {
    if (parte.startsWith('Testigo')) {
      document.getElementById('checkTestigo').checked = true;
      if (!esVista) { 
        document.getElementById('testigoCantidad').disabled = false;
      }
      const matches = parte.match(/\((\d+)\)/); 
      if (matches && matches[1]) {
        document.getElementById('testigoCantidad').value = matches[1];
      } else {
        document.getElementById('testigoCantidad').value = 1; 
      }
    } else if (parte !== 'Sacerdote') { // Ignorar Sacerdote (ya está marcado)
      const checkbox = document.querySelector(`input[name="participante"][value="${parte}"]`);
      if (checkbox) {
        checkbox.checked = true;
      }
    }
  });
}

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

// ================== BLOQUE DE SUGERENCIAS ==================

const contenedorSugerencias = document.createElement("div");
contenedorSugerencias.id = "sugerenciasContainer";
document.body.appendChild(contenedorSugerencias);
function posicionarSugerencias() {
    if (!contenedorSugerencias || contenedorSugerencias.style.display === 'none' || !inputBusqueda) return;

    const rect = inputBusqueda.getBoundingClientRect(); 

    // Calcula la posición absoluta en el DOCUMENTO
    contenedorSugerencias.style.top = `${rect.bottom + window.scrollY}px`;
    contenedorSugerencias.style.left = `${rect.left + window.scrollX}px`;
    contenedorSugerencias.style.width = `${rect.width}px`; 
}

function configurarSugerencias() {
    if (!inputBusqueda) return; 
    
    inputBusqueda.addEventListener("input", () => {
        const termino = inputBusqueda.value.trim().toLowerCase();
        contenedorSugerencias.innerHTML = "";
        
        if (termino.length === 0) {
            contenedorSugerencias.style.display = "none";
            return;
        }

        const sugerencias = actos.filter(a => 
            a.nombActo.toLowerCase().startsWith(termino)
        ).slice(0, 5); 

        if (sugerencias.length === 0) {
            contenedorSugerencias.style.display = "none";
            return;
        }

        sugerencias.forEach(a => {
            const item = document.createElement("div");
            item.className = "sugerencia-item";
            item.textContent = a.nombActo;
            
            item.onclick = () => {
                inputBusqueda.value = a.nombActo;
                contenedorSugerencias.style.display = "none";
            };
            contenedorSugerencias.appendChild(item);
        });

        contenedorSugerencias.style.display = "block";
        posicionarSugerencias();
    });

    document.addEventListener("click", (e) => {
        if (contenedorSugerencias && !contenedorSugerencias.contains(e.target) && e.target !== inputBusqueda) {
            contenedorSugerencias.style.display = "none";
        }
    });
    window.addEventListener("resize", posicionarSugerencias);
    window.addEventListener("scroll", posicionarSugerencias, true);
}