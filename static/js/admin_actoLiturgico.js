// ================== VARIABLES GLOBALES ==================
let actos = []; 
let actosFiltrados = null;
let actoEditandoId = null; 

const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");
let modalFormulario = null; 
let paginaActual = 1;
const elementosPorPagina = 7; 
let ordenActual = { campo: null, ascendente: true };

// ================== INICIALIZACIÓN ==================
document.addEventListener("DOMContentLoaded", () => {
    modalFormulario = crearModalFormulario(); 
    cargarActosDesdeAPI();

    document.getElementById("formDocumento").addEventListener("submit", (e) => {
        e.preventDefault();
        abrirModalFormulario("agregar");
    });
    
    const btnBuscar = document.getElementById("btn_buscar");
    btnBuscar.addEventListener("click", () => {
        const termino = inputBusqueda.value.trim().toLowerCase();
        actosFiltrados = termino === "" ? null : actos.filter((a) => a.nombActo.toLowerCase().includes(termino));
        paginaActual = 1;
        renderTabla();
    });

    document.body.addEventListener('change', function(e) {
        if (e.target.id === 'checkTestigo') {
            const spinner = document.getElementById('testigoCantidad');
            if (!spinner) return; 
            if (e.target.checked) {
                spinner.disabled = false;
                if (spinner.value === '0') spinner.value = 1; 
            } else {
                spinner.disabled = true;
                spinner.value = 0;
            }
        }
    });
    configurarSugerencias();
});

// ================== MANEJO DE DATOS Y API ==================
const manejarSolicitud = async (url, opciones = {}, mensajeError = "Error") => {
    try {
        const res = await fetch(url, opciones);
        const contentType = res.headers.get("content-type");
        if (!res.ok) {
            if (contentType && contentType.includes("application/json")) {
                const errData = await res.json();
                throw new Error(errData.mensaje || mensajeError);
            } else {
                throw new Error(`${mensajeError} (Error ${res.status})`);
            }
        }
        if (contentType && contentType.includes("application/json")) {
             return await res.json();
        } else {
            throw new Error("La respuesta no es JSON válido.");
        }
    } catch (err) {
        console.error(mensajeError, err);
        mostrarAlerta(err.message || "Error de conexión", "error");
        throw err;
    }
};

function normalizarActo(item) {
    return {
        idActo: item.idActo,
        nombActo: item.nombActo,
        descripcion: item.descripcion || "---",
        numParticipantes: item.numParticipantes,
        tipoParticipantes: item.tipoParticipantes,
        // Eliminado costoBase
        estadoActo: item.estadoActo === true || item.estadoActo === 1,
        imgActo: item.imgActo || "N/A"
    };
}

async function cargarActosDesdeAPI() {
    try {
        const data = await manejarSolicitud("/api/acto_liturgico/actos", {}, "Error al cargar actos");
        if (data.success && Array.isArray(data.datos)) {
            actos = data.datos.map(normalizarActo);
            actosFiltrados = null;
            inputBusqueda.value = "";
            paginaActual = 1;
            renderTabla();
        } else {
            actos = [];
            renderTabla();
        }
    } catch (err) { console.error("Fallo en cargarActosDesdeAPI:", err); }
}

// ================== RENDERIZADO ==================
function renderTabla() {
    tabla.innerHTML = "";
    const lista = actosFiltrados ?? actos;

    if (lista.length === 0) {
        tabla.innerHTML = '<tr><td colspan="6" style="text-align:center;">No hay actos litúrgicos para mostrar.</td></tr>';
        renderPaginacion(0);
        return;
    }

    if (ordenActual.campo) {
        lista.sort((a, b) => {
            const valA = a[ordenActual.campo] ? a[ordenActual.campo].toString().toLowerCase() : "";
            const valB = b[ordenActual.campo] ? b[ordenActual.campo].toString().toLowerCase() : "";
            if (valA < valB) return ordenActual.ascendente ? -1 : 1;
            if (valA > valB) return ordenActual.ascendente ? 1 : -1;
            return 0;
        });
    }

    const inicio = (paginaActual - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;
    const actosPagina = lista.slice(inicio, fin);

    actosPagina.forEach((acto) => {
        const esActivo = acto.estadoActo;
        const botonColor = esActivo ? "btn-orange" : "btn-success";
        const rotacion = esActivo ? "" : "transform: rotate(180deg);";
        const tituloBoton = esActivo ? 'Dar de baja' : 'Dar de alta';

        const fila = document.createElement("tr");
        // Se eliminó la celda de costoBase
        fila.innerHTML = `
            <td class="col-id">${acto.idActo}</td>
            <td class="col-nombre">${acto.nombActo}</td>
            <td class="col-descripcion">${acto.descripcion}</td>
            <td class="col-numParticipantes">${acto.numParticipantes}</td>
            <td class="col-tipoParticipantes">${acto.tipoParticipantes}</td>
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

function renderPaginacion(totalElementos) {
    paginacion.innerHTML = "";
    const totalPaginas = Math.ceil(totalElementos / elementosPorPagina);
    if (totalPaginas <= 1) return;

    const ul = document.createElement("ul");
    ul.className = "pagination";
    
    const crearItem = (num, activo, disabled, texto) => {
        const li = document.createElement("li");
        li.className = `page-item ${activo ? "active" : ""} ${disabled ? "disabled" : ""}`;
        const btn = document.createElement("button");
        btn.className = "page-link";
        let destino = num;
        if (texto === "<") destino = paginaActual - 1;
        if (texto === ">") destino = paginaActual + 1;
        if (!disabled) btn.onclick = () => cambiarPagina(destino);
        btn.innerHTML = texto || num;
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
    for (let i = start; i <= end; i++) ul.appendChild(crearItem(i, paginaActual === i));
    if (end < totalPaginas) {
        if (end < totalPaginas - 1) ul.appendChild(crearItem(null, false, true, "..."));
        ul.appendChild(crearItem(totalPaginas, paginaActual === totalPaginas));
    }
    ul.appendChild(crearItem(null, false, paginaActual === totalPaginas, ">"));
    paginacion.appendChild(ul);
}

function cambiarPagina(pagina) {
    const total = Math.ceil((actosFiltrados ?? actos).length / elementosPorPagina);
    if (pagina < 1 || pagina > total) return;
    paginaActual = pagina;
    renderTabla();
}

// ================== CRUD ==================
async function guardarActoAPI(evento) {
    evento.preventDefault();
    const form = document.getElementById('formModal');

    // Validación sin costo
    const nombre = document.getElementById('modalNombre').value;
    const img = document.getElementById('modalImgActo').value;

    if (!nombre || nombre.trim() === "" || !img) {
        mostrarAlerta("Por favor, complete nombre e imagen.", "error");
        return;
    }

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
        // Eliminado costoBase
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
    } catch (error) {}
}

async function cambiarEstadoActo(id, estadoActual) {
    const nuevoEstado = !estadoActual;
    if (!confirm(`¿Seguro que deseas cambiar el estado?`)) return;
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
    } catch (err) {}
}

async function eliminarActo(id) {
    if (!confirm(`¿Seguro que deseas eliminar este acto?`)) return;
    try {
        const res = await manejarSolicitud(`/api/acto_liturgico/actos/${id}`, { method: 'DELETE' }, "Error al eliminar");
        if (res.success) {
            mostrarAlerta(res.mensaje, "success");
            await cargarActosDesdeAPI();
        }
    } catch (err) {}
}

function editarActo(id) { abrirModalFormulario('editar', id); }
function verActo(id) { abrirModalFormulario('ver', id); }

// ================== MODALES ==================
function crearModalFormulario() {
    const modalContainer = document.createElement("div");
    // Se eliminó el input de Costo Base del HTML del modal
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
                    <div class="form-check"><input class="form-check-input" type="checkbox" value="Padre" id="checkPadre" name="participante"><label class="form-check-label" for="checkPadre">Padre</label></div>
                    <div class="form-check"><input class="form-check-input" type="checkbox" value="Madre" id="checkMadre" name="participante"><label class="form-check-label" for="checkMadre">Madre</label></div>
                    <div class="form-check"><input class="form-check-input" type="checkbox" value="Padrino" id="checkPadrino" name="participante"><label class="form-check-label" for="checkPadrino">Padrino</label></div>
                    <div class="form-check"><input class="form-check-input" type="checkbox" value="Madrina" id="checkMadrina" name="participante"><label class="form-check-label" for="checkMadrina">Madrina</label></div>
                    <hr style="margin: 8px 0;">
                    <div class="form-check"><input class="form-check-input" type="checkbox" value="Novio" id="checkNovio" name="participante"><label class="form-check-label" for="checkNovio">Novio</label></div>
                    <div class="form-check"><input class="form-check-input" type="checkbox" value="Novia" id="checkNovia" name="participante"><label class="form-check-label" for="checkNovia">Novia</label></div>
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
          <div class="modal-footer" id="modalFormularioFooter"></div>
        </div>
      </div>
    </div>`;
    document.body.appendChild(modalContainer);
    return document.getElementById("modalFormulario");
}

function abrirModal(id) { const modal = document.getElementById(id); if (modal) modal.classList.add("activo"); }
function cerrarModal(id) { 
    const modal = document.getElementById(id); 
    if (modal) modal.classList.remove("activo"); 
    const form = document.getElementById('formModal');
    if (form) form.classList.remove('was-validated');
}

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
        // Sin costoBase
        checkboxes: document.querySelectorAll('#participantesCheckboxes input'),
        testigoCantidad: document.getElementById('testigoCantidad'),
        modo: document.getElementById('modalMode')
    };

    campos.modo.value = modo;
    const esVista = (modo === 'ver');
    
    // Eliminado costoBase del array
    [campos.nombre, campos.descripcion, campos.imgActo, campos.testigoCantidad].forEach(el => el.disabled = esVista);
    
    campos.checkboxes.forEach(cb => {
        if (cb.id !== 'checkSacerdote') cb.disabled = esVista;
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
    } else { 
        let acto;
        try {
            const res = await manejarSolicitud(`/api/acto_liturgico/actos/${idActo}`, {}, "Error al cargar acto");
            if (!res.success) { cerrarModal("modalFormulario"); return; }
            acto = normalizarActo(res.datos);
        } catch (err) { cerrarModal("modalFormulario"); return; }

        campos.titulo.textContent = modo === 'editar' ? "Editar Acto Litúrgico" : "Detalle del Acto";
        actoEditandoId = acto.idActo; 
        
        campos.nombre.value = acto.nombActo;
        campos.descripcion.value = acto.descripcion === "---" ? "" : (acto.descripcion || "");
        campos.imgActo.value = acto.imgActo === "N/A" ? "" : (acto.imgActo || "");
        // Sin costoBase
        parsearYSetearParticipantes(acto.tipoParticipantes, esVista); 
    }
    abrirModal("modalFormulario");
}

// ================== HELPERS ==================
function compilarParticipantes() {
  const participantes = [];
  document.querySelectorAll('input[name="participante"]:checked').forEach((checkbox) => {
    participantes.push(checkbox.value);
  });
  const checkTestigo = document.getElementById('checkTestigo');
  const cantidadTestigos = document.getElementById('testigoCantidad').value || 0;
  if (checkTestigo.checked) {
    if (parseInt(cantidadTestigos, 10) > 0) participantes.push(`Testigo (${cantidadTestigos})`);
    else participantes.push('Testigo'); 
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
  document.querySelectorAll('input[name="participante"]').forEach(cb => {
      if (cb.id !== 'checkSacerdote') cb.checked = false;
  });
  document.getElementById('checkTestigo').checked = false;
  document.getElementById('testigoCantidad').value = 0;
  document.getElementById('testigoCantidad').disabled = true;
  document.getElementById('checkSacerdote').checked = true;

  if (!cadena) return;
  const partes = cadena.split(',').map(s => s.trim());

  partes.forEach(parte => {
    if (parte.startsWith('Testigo')) {
      document.getElementById('checkTestigo').checked = true;
      if (!esVista) document.getElementById('testigoCantidad').disabled = false;
      const matches = parte.match(/\((\d+)\)/); 
      if (matches && matches[1]) document.getElementById('testigoCantidad').value = matches[1];
      else document.getElementById('testigoCantidad').value = 1; 
    } else if (parte !== 'Sacerdote') {
      const checkbox = document.querySelector(`input[name="participante"][value="${parte}"]`);
      if (checkbox) checkbox.checked = true;
    }
  });
}

function mostrarAlerta(mensaje, tipo = "success") {
    const alerta = document.createElement("div");
    alerta.className = `alerta-toast ${tipo}`;
    alerta.textContent = mensaje;
    document.body.appendChild(alerta);
    setTimeout(() => alerta.classList.add("mostrar"), 10);
    setTimeout(() => { alerta.classList.remove("mostrar"); setTimeout(() => alerta.remove(), 500); }, 3000);
}

// ================== SUGERENCIAS ==================
const contenedorSugerencias = document.createElement("div");
contenedorSugerencias.id = "sugerenciasContainer";
document.body.appendChild(contenedorSugerencias);

function posicionarSugerencias() {
    if (!contenedorSugerencias || contenedorSugerencias.style.display === 'none' || !inputBusqueda) return;
    const rect = inputBusqueda.getBoundingClientRect(); 
    contenedorSugerencias.style.top = `${rect.bottom + window.scrollY}px`;
    contenedorSugerencias.style.left = `${rect.left + window.scrollX}px`;
    contenedorSugerencias.style.width = `${rect.width}px`; 
}

function configurarSugerencias() {
    if (!inputBusqueda) return; 
    inputBusqueda.addEventListener("input", () => {
        const termino = inputBusqueda.value.trim().toLowerCase();
        contenedorSugerencias.innerHTML = "";
        if (termino.length === 0) { contenedorSugerencias.style.display = "none"; return; }
        const sugerencias = actos.filter(a => a.nombActo.toLowerCase().startsWith(termino)).slice(0, 5); 
        if (sugerencias.length === 0) { contenedorSugerencias.style.display = "none"; return; }
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