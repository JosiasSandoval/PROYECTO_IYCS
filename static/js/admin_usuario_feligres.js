// ================== VARIABLES GLOBALES ==================
let usuarios = []; // Para la lista principal de feligreses
let tiposDocumento = []; // Almacenará los tipos de documento
let usuariosFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

// Referencias del DOM
const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputDocumento");
// La 'listaSugerencias' se crea dinámicamente más abajo

// ================== FUNCIONES ==================

/**
 * Normaliza los datos de la API de feligreses
 */
function normalizarUsuario(u) {
    return {
        id: u.idFeligres, // ID de Feligrés
        idUsuario: u.idUsuario, // ID de Usuario (para estado/email)
        nombreCompleto: `${u.apePatFel} ${u.apeMatFel}, ${u.nombFel}`,
        numDocFel: u.numDocFel,
        email: u.email,
        estado: u.estadoCuenta === true || u.estadoCuenta === 1,
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
        alert(err.message || mensajeError);
        throw err;
    }
};

/**
 * Carga los datos iniciales (Tipos de Doc y Feligreses)
 */
async function cargarDatosIniciales() {
    try {
        // 1. Cargar Tipos de Documento (corregido)
        // Apunta a /api/tipoDocumento/documentos
        const dataTiposDoc = await manejarSolicitud("/api/tipoDocumento/documentos", {}, "Error al cargar tipos de documento");
        
        if (dataTiposDoc.success && Array.isArray(dataTiposDoc.datos)) {
            tiposDocumento = dataTiposDoc.datos;
        } else {
            throw new Error("Respuesta de API de Tipos de Documento no válida");
        }

        // 2. Cargar Feligreses (corregido)
        // Apunta a /api/feligres/feligreses
        const dataUsuarios = await manejarSolicitud("/api/feligres/feligreses", {}, "Error al obtener usuarios");
        
        usuarios = Array.isArray(dataUsuarios.datos) ? dataUsuarios.datos.map(normalizarUsuario) : [];
        usuariosFiltrados = null;
        paginaActual = 1;
        renderTabla();

    } catch (err) {
        console.error("Error cargando datos iniciales:", err);
    }
}

const escapeHtml = text =>
    String(text || "").replace(/[&<>]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char]));

// Render tabla
function renderTabla() {
    tabla.innerHTML = "";
    const lista = usuariosFiltrados ?? usuarios;

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
    const usuariosPagina = lista.slice(inicio, fin);

    usuariosPagina.forEach((usuario, index) => {
        const esActivo = usuario.estado;
        const botonColor = esActivo ? "btn-orange" : "btn-success";
        const rotacion = esActivo ? "" : "transform: rotate(180deg);";

        const fila = document.createElement("tr");
        fila.innerHTML = `
            <td>${inicio + index + 1}</td>
            <td>${escapeHtml(usuario.nombreCompleto)}</td>
            <td>${escapeHtml(usuario.numDocFel)}</td>
            <td>${escapeHtml(usuario.email)}</td>
            <td class="col-acciones">
                <div class="d-flex justify-content-center flex-wrap gap-1">
                    <button class="btn btn-info btn-sm" onclick="verDetalle(${usuario.id})" title="Ver">
                        <img src="/static/img/ojo.png" alt="ver">
                    </button>
                    <button class="btn btn-warning btn-sm" onclick="editarUsuario(${usuario.id})" title="Editar">
                        <img src="/static/img/lapiz.png" alt="editar">
                    </button>
                    <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${usuario.id}, ${usuario.idUsuario}, ${esActivo})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
                        <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}">
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="eliminarUsuario(${usuario.id})" title="Eliminar">
                        <img src="/static/img/x.png" alt="eliminar">
                    </button>
                </div>
            </td>
        `;
        tabla.appendChild(fila);
    });

    renderPaginacion();
}

// Render paginación
function renderPaginacion() {
    paginacion.innerHTML = "";
    const total = (usuariosFiltrados ?? usuarios).length;
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
}

function cambiarPagina(pagina) {
    const total = Math.ceil((usuariosFiltrados ?? usuarios).length / elementosPorPagina);
    if (pagina < 1 || pagina > total) return;
    paginaActual = pagina;
    renderTabla();
}

// ----- MODAL -----
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
                    <div class="modal-body" style="max-height:70vh; overflow-y:auto;">
                        <form id="formModalDocumento">
                            <div class="mb-2"><label>Nombre</label><input type="text" id="modalNombre" class="form-control" required></div>
                            <div class="mb-2"><label>Apellido Paterno</label><input type="text" id="modalApePat" class="form-control" required></div>
                            <div class="mb-2"><label>Apellido Materno</label><input type="text" id="modalApeMat" class="form-control" required></div>
                            <div class="mb-2"><label>Tipo documento</label>
                                <select id="modalNombDocumento" class="form-control" required>
                                    <option value="">Cargando...</option>
                                </select>
                            </div>
                            <div class="mb-2"><label>Número Documento</label><input type="text" id="modalNumDoc" class="form-control" required></div>
                            <div class="mb-2"><label>Correo</label><input type="email" id="modalEmail" class="form-control" required></div>
                            <div class="mb-2" id="campoClave"><label>Contraseña</label><input type="password" id="modalClave" class="form-control" required></div>
                            <div class="mb-2"><label>Fecha nacimiento</label><input type="date" id="modalFNacimiento" class="form-control"></div>
                            <div class="mb-2"><label>Sexo</label>
                                <select id="modalSexo" class="form-control">
                                    <option value="">Seleccione</option>
                                    <option value="M">Masculino</option>
                                    <option value="F">Femenino</option>
                                </select>
                            </div>
                            <div class="mb-2"><label>Dirección</label><input type="text" id="modalDireccion" class="form-control"></div>
                            <div class="mb-2"><label>Teléfono</label><input type="text" id="modalTelefono" class="form-control"></div>
                            
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

// Inicializar el modal (solo una vez)
const modalFeligres = crearModalFormulario();

function abrirModal(modalId) { document.getElementById(modalId).classList.add('activo'); }
function cerrarModal(modalId) { document.getElementById(modalId).classList.remove('activo'); }

/**
 * Rellena el <select> de Tipos de Documento
 * Usa la variable global 'tiposDocumento'
 */
function popularTiposDocumentoSelect(idSeleccionado = null, modo = null) {
    const select = document.getElementById("modalNombDocumento");
    select.innerHTML = '<option value="">Seleccione</option>';
    
    // Filtra solo los activos
    tiposDocumento.filter(d => d.estadoDocumento === true).forEach(d => {
        const option = document.createElement('option');
        option.value = d.idTipoDocumento; 
        option.textContent = d.nombDocumento;
        select.appendChild(option);
    });
    
    if (idSeleccionado) {
        select.value = idSeleccionado;
    }

    select.disabled = (modo === "ver");
}

/**
 * Carga los detalles completos de un feligrés (para modal)
 */
async function cargarUsuarioPorId(id) {
    try {
        const res = await manejarSolicitud(`/api/feligres/feligreses/${id}`, {}, "Error al cargar detalle");
        return res.datos; 
    } catch (err) { 
        return null;
    }
}

/**
 * Abre el modal para Agregar, Editar o Ver
 */
async function abrirModalFormulario(modo, usuarioId = null) {
    if (tiposDocumento.length === 0) {
        alert("Error: Los tipos de documento no se cargaron. Intente recargar la página.");
        return;
    }

    const titulo = document.getElementById("modalFormularioTitulo");
    const form = document.getElementById("formModalDocumento");
    const botonGuardar = document.getElementById("btnGuardar");
    const campoClave = document.getElementById("campoClave");

    form.reset(); 
    form.onsubmit = null;
    botonGuardar.style.display = "inline-block";

    const inputs = {
        nombFel: document.getElementById("modalNombre"),
        apePatFel: document.getElementById("modalApePat"),
        apeMatFel: document.getElementById("modalApeMat"),
        numDocFel: document.getElementById("modalNumDoc"),
        email: document.getElementById("modalEmail"),
        clave: document.getElementById("modalClave"),
        f_nacimiento: document.getElementById("modalFNacimiento"),
        sexoFel: document.getElementById("modalSexo"),
        direccionFel: document.getElementById("modalDireccion"),
        telefonoFel: document.getElementById("modalTelefono"),
        idTipoDocumento: document.getElementById("modalNombDocumento")
    };

    for (const key in inputs) inputs[key].disabled = false;
    
    let usuario = null;

    if (modo === "agregar") {
        titulo.textContent = "Agregar usuario";
        campoClave.style.display = "block";
        inputs.clave.required = true;
        popularTiposDocumentoSelect(null, modo); 
        
    } else if (modo === "editar" || modo === "ver") {
        
        usuario = await cargarUsuarioPorId(usuarioId);
        if (!usuario) return;

        titulo.textContent = modo === "editar" ? "Editar usuario" : "Detalle del usuario";
        campoClave.style.display = "none";
        inputs.clave.required = false;

        popularTiposDocumentoSelect(usuario.idTipoDocumento, modo);

        inputs.nombFel.value = usuario.nombFel;
        inputs.apePatFel.value = usuario.apePatFel;
        inputs.apeMatFel.value = usuario.apeMatFel;
        inputs.numDocFel.value = usuario.numDocFel;
        inputs.email.value = usuario.email;
        inputs.f_nacimiento.value = usuario.f_nacimiento ? usuario.f_nacimiento.split('T')[0] : "";
        inputs.sexoFel.value = usuario.sexoFel || "";
        inputs.direccionFel.value = usuario.direccionFel || "";
        inputs.telefonoFel.value = usuario.telefonoFel || "";
        inputs.idTipoDocumento.value = usuario.idTipoDocumento;

        if (modo === "ver") {
            for (const key in inputs) inputs[key].disabled = true;
            botonGuardar.style.display = "none";
        }
    }

    // === INICIO DE LA LÓGICA DE GUARDADO (Corregida con rutas de API) ===
    form.onsubmit = async e => {
        e.preventDefault();
        
        const data = {
            email: inputs.email.value.trim(),
            clave: inputs.clave.value.trim(),
            numDocFel: inputs.numDocFel.value.trim(),
            nombFel: inputs.nombFel.value.trim(),
            apePatFel: inputs.apePatFel.value.trim(),
            apeMatFel: inputs.apeMatFel.value.trim(),
            f_nacimiento: inputs.f_nacimiento.value || null,
            sexoFel: inputs.sexoFel.value || null,
            direccionFel: inputs.direccionFel.value.trim() || null,
            telefonoFel: inputs.telefonoFel.value.trim() || null,
            idTipoDocumento: inputs.idTipoDocumento.value
        };

        try {
            if (modo === "agregar") {
                // RUTA CORREGIDA
                await manejarSolicitud("/api/feligres/feligreses", { 
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                }, "Error al agregar usuario");
            } else if (modo === "editar") {
                data.idUsuario = usuario.idUsuario; 
                // RUTA CORREGIDA
                await manejarSolicitud(`/api/feligres/feligreses/${usuarioId}`, { 
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(data)
                }, "Error al actualizar usuario");
            }

            // Esto SÍ se ejecutará
            cargarDatosIniciales(); 
            cerrarModal("modalFormulario");
        } catch (err) { 
            console.error(err); 
            // El alert() ya lo muestra manejarSolicitud
        }
    };
    // === FIN DE LA LÓGICA DE GUARDADO ===

    abrirModal("modalFormulario");
}

// Acciones individuales (Actualizadas a las nuevas rutas)
function editarUsuario(id) { abrirModalFormulario("editar", id); }
function verDetalle(id) { abrirModalFormulario("ver", id); }

async function eliminarUsuario(id) {
    if(!confirm("¿Seguro de eliminar este usuario?")) return;
    try {
        // RUTA CORREGIDA
        await manejarSolicitud(`/api/feligres/feligreses/${id}`, { method: "DELETE" }, "Error al eliminar usuario");
        cargarDatosIniciales(); // Refresca la tabla
    } catch(err){}
}

async function darDeBaja(idFeligres, idUsuario, estadoActual) {
    try {
        const nuevoEstado = !estadoActual;
        
        // RUTA CORREGIDA
        await manejarSolicitud(`/api/feligres/feligreses/${idUsuario}/estado`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estadoCuenta: nuevoEstado })
        }, "Error al cambiar estado");
        
        cargarDatosIniciales(); // Refresca la tabla
    } catch(err){ console.error(err); }
}

// Busqueda (Filtro local)
const btnBuscar = document.getElementById("btn_buscar");
btnBuscar.addEventListener("click", () => {
    const termino = inputBusqueda.value.trim().toLowerCase();
    if(!termino) { 
        usuariosFiltrados = null; 
    } else {
        usuariosFiltrados = usuarios.filter(u => 
            u.nombreCompleto.toLowerCase().includes(termino) ||
            u.numDocFel.toLowerCase().includes(termino) ||
            u.email.toLowerCase().includes(termino)
        );
    }
    paginaActual = 1; 
    renderTabla();
    contenedorSugerencias.style.display = "none"; // Ocultar sugerencias al buscar
});

// Orden tabla
document.querySelectorAll("#tablaDocumentos thead th").forEach((th, index)=>{
    th.style.cursor="pointer";
    th.addEventListener("click", ()=>{
        let campo = index === 1 ? "nombreCompleto" : (index === 2 ? "numDocFel" : (index === 3 ? "email" : null));
        if(!campo) return;
        if(ordenActual.campo === campo) {
            ordenActual.ascendente = !ordenActual.ascendente;
        } else { 
            ordenActual.campo = campo; 
            ordenActual.ascendente = true; 
        }
        renderTabla();
    });
});

// Botón agregar
document.getElementById("btn_guardar").addEventListener("click", (e) => {
    e.preventDefault();
    abrirModalFormulario("agregar");
});
document.getElementById("formDocumento").addEventListener("submit", (e) => e.preventDefault());


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

    const sugerencias = usuarios.filter(u => 
        // Busca solo por el inicio del 'nombreCompleto' (Apellidos)
        u.nombreCompleto.toLowerCase().startsWith(termino)
    ).slice(0, 5); // Limitar a 5 sugerencias

    if (sugerencias.length === 0) {
        contenedorSugerencias.style.display = "none";
        return;
    }

    sugerencias.forEach(u => {
        const item = document.createElement("div");
        item.className = "sugerencia-item"; // Usar la clase del CSS
        item.textContent = `${u.nombreCompleto} (${u.numDocFel})`; 
        
        item.onclick = () => {
            inputBusqueda.value = u.nombreCompleto;
            contenedorSugerencias.style.display = "none";
            btnBuscar.click(); // Simular clic
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


// Carga inicial
document.addEventListener("DOMContentLoaded", () => {
    cargarDatosIniciales();
});