const tabla = document.querySelector("#tablaDocumentos tbody");
const paginacion = document.getElementById("paginacionContainer");

const modalDetalle = crearModal();            
const modalFormulario = crearModalFormulario(); 

let usuarios = [];
let usuariosFiltrados = null;
let paginaActual = 1;
const elementosPorPagina = 10;
let ordenActual = { campo: null, ascendente: true };

// Normalizar usuario
function normalizarUsuario(u) {
    return {
        id: u.id,
        nombre: u.nombreCompleto.split(" ")[0] || "",
        apePat: u.nombreCompleto.split(" ")[1] || "",
        apeMat: u.nombreCompleto.split(" ")[2] || "",
        nombreCompleto: u.nombreCompleto,
        numDocFel: u.numDocFel,
        email: u.email,
        clave: u.clave || "",
        estado: u.estado === true || u.estado === 1,
        f_nacimiento: u.f_nacimiento,
        sexoPers: u.sexoPers,
        direccionPers: u.direccionPers,
        telefonoPers: u.telefonoPers,
        idTipoDocumento: u.idTipoDocumento || "",
        nombDocumento: u.nombDocumento || ""
    };
}

// Manejar fetch
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

// Cargar usuarios
const cargarUsuarios = async () => {
    try {
        const data = await manejarSolicitud("/api/usuario/feligres", {}, "Error al obtener usuarios");
        usuarios = Array.isArray(data.datos) ? data.datos.map(normalizarUsuario) : [];
        usuariosFiltrados = null;
        paginaActual = 1;
        renderTabla();
    } catch (err) {
        console.error("Error cargando usuarios:", err);
    }
};

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
            <td>${escapeHtml(usuario.nombre)} ${escapeHtml(usuario.apePat)} ${escapeHtml(usuario.apeMat)}</td>
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
                    <button class="btn ${botonColor} btn-sm" onclick="darDeBaja(${usuario.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
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
function crearModal() {
    const modalHTML = document.createElement("div");
    modalHTML.innerHTML = `
        <div class="modal" id="modalDetalle">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Detalle del usuario</h5>
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
                    <div class="modal-body" style="max-height:70vh; overflow-y:auto;">
                        <form id="formModalDocumento">
                            <div class="mb-2"><label>Nombre</label><input type="text" id="modalNombre" class="form-control"></div>
                            <div class="mb-2"><label>Apellido Paterno</label><input type="text" id="modalApePat" class="form-control"></div>
                            <div class="mb-2"><label>Apellido Materno</label><input type="text" id="modalApeMat" class="form-control"></div>
                            <div class="mb-2"><label>Documento</label><input type="text" id="modalNumDoc" class="form-control"></div>
                            <div class="mb-2"><label>Correo</label><input type="email" id="modalEmail" class="form-control"></div>
                            <div class="mb-2"><label>Contraseña</label><input type="password" id="modalClave" class="form-control"></div>
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
                            <div class="mb-2">
                                <label>Tipo documento</label>
                                <select id="modalNombDocumento" class="form-control">
                                    <!-- Opciones se llenarán dinámicamente -->
                                </select>
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

    // Cargar los tipos de documento al iniciar (agregar)
    cargarTiposDocumento();

    return document.getElementById("modalFormulario");
}

function abrirModal(modalId) { document.getElementById(modalId).classList.add('activo'); }
function cerrarModal(modalId) { document.getElementById(modalId).classList.remove('activo'); }

async function cargarTiposDocumento(usuario = null, modo = null) {
    try {
        const res = await fetch("/api/tipoDocumento/");
        if (!res.ok) throw new Error("Error al cargar tipos de documento");
        const data = await res.json();

        const select = document.getElementById("modalNombDocumento");
        select.innerHTML = '<option value="">Seleccione</option>';

        // Agregar todas las opciones
        data.forEach(d => {
            const option = document.createElement('option');
            option.value = d.nombre;
            option.textContent = d.nombre;
            select.appendChild(option);
        });

        // Seleccionar automáticamente el valor del usuario
        if (usuario && usuario.nombDocumento) {
            select.value = usuario.nombDocumento;  // Modo editar o ver
        } else if (modo === "agregar" && data.length > 0) {
            select.value = data[0].nombre; // Preselecciona el primer tipo de documento
        }

        // Bloquear solo si es modo "ver"
        select.disabled = (modo === "ver");

    } catch (err) {
        console.error(err);
        alert("No se pudieron cargar los tipos de documento");
    }
}

async function abrirModalFormulario(modo, usuario = null) {
    const titulo = document.getElementById("modalFormularioTitulo");
    const form = document.getElementById("formModalDocumento");
    const botonGuardar = document.getElementById("btnGuardar");

    form.reset();
    form.onsubmit = null;
    botonGuardar.style.display = "inline-block";

    const inputs = {
        nombre: document.getElementById("modalNombre"),
        apePat: document.getElementById("modalApePat"),
        apeMat: document.getElementById("modalApeMat"),
        numDocFel: document.getElementById("modalNumDoc"),
        email: document.getElementById("modalEmail"),
        clave: document.getElementById("modalClave"),
        f_nacimiento: document.getElementById("modalFNacimiento"),
        sexoPers: document.getElementById("modalSexo"),
        direccionPers: document.getElementById("modalDireccion"),
        telefonoPers: document.getElementById("modalTelefono"),
        idTipoDocumento: document.getElementById("modalNombDocumento")
    };

    // Habilitar inputs por defecto
    for (const key in inputs) inputs[key].disabled = false;

    // Cargar tipos de documento
    await cargarTiposDocumento(usuario, modo);

    if (modo === "agregar" || (modo === "editar" && usuario)) {
        titulo.textContent = modo === "agregar" ? "Agregar usuario" : "Editar usuario";
        inputs.clave.type = "text";

        if (modo === "editar" && usuario) {
            for (const key in inputs) {
                if (key !== "idTipoDocumento") {
                    inputs[key].value = usuario[key] ?? "";
                }
            }
            // Seleccionar opción correcta del select
            if (usuario.nombDocumento) {
                const existe = Array.from(inputs.idTipoDocumento.options)
                    .some(opt => opt.value === usuario.nombDocumento);
                if (existe) inputs.idTipoDocumento.value = usuario.nombDocumento;
            }
        }

        form.onsubmit = async e => {
            e.preventDefault();
            const u = {
                email: inputs.email.value.trim(),
                clave: inputs.clave.value.trim(),
                numDocFel: inputs.numDocFel.value.trim(),
                nombFel: inputs.nombre.value.trim(),
                apePatFel: inputs.apePat.value.trim(),
                apeMatFel: inputs.apeMat.value.trim(),
                f_nacimiento: inputs.f_nacimiento.value,
                sexoFel: inputs.sexoPers.value,
                direccionFel: inputs.direccionPers.value.trim(),
                telefonoFel: inputs.telefonoPers.value.trim(),
                idRol: 2,
                idTipoDocumento: inputs.idTipoDocumento.value
            };

            try {
                const url = modo === "agregar"
                    ? "/api/usuario/agregar_feligres"
                    : `/api/usuario/actualizar_feligres/${usuario.id}`;
                await manejarSolicitud(url, {
                    method: modo === "agregar" ? "POST" : "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(u)
                }, modo === "agregar" ? "Error al agregar usuario" : "Error al actualizar usuario");

                cargarUsuarios();
                cerrarModal("modalFormulario");
            } catch (err) { console.error(err); }
        };
    } else if (modo === "ver" && usuario) {
        titulo.textContent = "Detalle del usuario";
        // Inputs normales
        for (const key in inputs) {
            if (key !== "idTipoDocumento") {
                inputs[key].value = usuario[key] ?? "";
                inputs[key].disabled = true;
            }
        }
        // Select de tipo de documento
        if (usuario.nombDocumento) {
            const existe = Array.from(inputs.idTipoDocumento.options)
                .some(opt => opt.value === usuario.nombDocumento);
            if (existe) inputs.idTipoDocumento.value = usuario.nombDocumento;
        }
        inputs.idTipoDocumento.disabled = true;

        inputs.clave.type = "password";
        botonGuardar.onclick = e => { e.preventDefault(); cerrarModal("modalFormulario"); };
    }

    abrirModal("modalFormulario");
}





// Acciones individuales
function editarUsuario(id) { const u = usuarios.find(x => x.id === id); if(u) abrirModalFormulario("editar", u); }
function verDetalle(id) { const u = usuarios.find(x => x.id === id); if(u) abrirModalFormulario("ver", u); }
async function eliminarUsuario(id) {
    if(!confirm("¿Seguro de eliminar este usuario?")) return;
    try {
        await manejarSolicitud(`/api/usuario/eliminar_feligres/${id}`, { method: "DELETE" }, "Error al eliminar usuario");
        cargarUsuarios();
    } catch(err){}
}
async function darDeBaja(id) {
    try {
        const u = usuarios.find(x=>x.id===id);
        if(!u) return alert("Usuario no encontrado");
        const nuevoEstado = !u.estado;
        await manejarSolicitud(`/api/usuario/cambiar_estado_cuenta/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ estado: nuevoEstado })
        }, "Error al cambiar estado");
        u.estado = nuevoEstado;
        renderTabla();
    } catch(err){ console.error(err); alert("Error al actualizar estado"); }
}

// Busqueda
const inputUsuario = document.getElementById("inputDocumento");
const btnBuscar = document.getElementById("btn_buscar");
btnBuscar.addEventListener("click", async () => {
    const termino = inputUsuario.value.trim();
    
    // Si está vacío, recargamos todos los usuarios
    if(!termino) { 
        usuariosFiltrados = null; 
        paginaActual = 1; 
        renderTabla(); 
        return; 
    }

    try {
        // Asegúrate que esta URL coincida con la ruta que creamos en el paso 2
        const res = await fetch(`/api/usuario/busqueda_feligres/${encodeURIComponent(termino)}`);
        
        if(!res.ok) throw new Error("Error en búsqueda");
        
        const data = await res.json();
        
        // Asignamos los datos encontrados a usuariosFiltrados
        usuariosFiltrados = Array.isArray(data.datos) ? data.datos.map(normalizarUsuario) : [];
        
        paginaActual = 1; 
        renderTabla(); // Volvemos a pintar la tabla
        
    } catch(err){ 
        console.error(err); 
        alert("Error al buscar usuario"); 
    }
});

// Orden tabla
document.querySelectorAll("#tablaDocumentos thead th").forEach((th, index)=>{
    th.style.cursor="pointer";
    th.addEventListener("click", ()=>{
        let campo = index===1?"nombreCompleto":null;
        if(!campo) return;
        if(ordenActual.campo===campo) ordenActual.ascendente=!ordenActual.ascendente;
        else { ordenActual.campo=campo; ordenActual.ascendente=true; }
        renderTabla();
    });
});
// ================== BLOQUE DE SUGERENCIAS (Estándar Referencia) ==================

// 1. Crear el contenedor dinámicamente si no existe
const contenedorSugerencias = document.createElement("div");
contenedorSugerencias.id = "sugerenciasContainer";
document.body.appendChild(contenedorSugerencias);

// 2. Función para posicionar el menú flotante justo debajo del input
function posicionarSugerencias() {
    // Usamos la variable 'inputUsuario' que ya definiste en tu código original
    if (!contenedorSugerencias || contenedorSugerencias.style.display === 'none' || !inputUsuario) return;

    const rect = inputUsuario.getBoundingClientRect(); 

    // Calcula la posición absoluta en el DOCUMENTO
    contenedorSugerencias.style.top = `${rect.bottom + window.scrollY}px`;
    contenedorSugerencias.style.left = `${rect.left + window.scrollX}px`;
    contenedorSugerencias.style.width = `${rect.width}px`; 
}

// 3. Configurar la lógica de búsqueda y selección
function configurarSugerencias() {
    if (!inputUsuario) return; 
    
    inputUsuario.addEventListener("input", () => {
        const termino = inputUsuario.value.trim().toLowerCase();
        contenedorSugerencias.innerHTML = "";
        
        if (termino.length === 0) {
            contenedorSugerencias.style.display = "none";
            return;
        }

        // Filtramos sobre el array global 'usuarios' que ya tienes en tu código
        // Buscamos coincidencia en Nombre o Apellidos
        const sugerencias = usuarios.filter(u => {
            // Reconstruimos el nombre completo para la búsqueda
            const nombreCompleto = `${u.nombre} ${u.apePat} ${u.apeMat}`.toLowerCase();
            return nombreCompleto.includes(termino);
        }).slice(0, 5); // Limitamos a 5 resultados igual que la referencia

        if (sugerencias.length === 0) {
            contenedorSugerencias.style.display = "none";
            return;
        }

        sugerencias.forEach(u => {
            const item = document.createElement("div");
            item.className = "sugerencia-item";
            // Mostramos Nombre + DNI para diferenciar
            const textoMostrar = `${u.nombre} ${u.apePat} ${u.apeMat}`;
            item.textContent = textoMostrar;
            
            // Al hacer clic, SOLO llenamos el input
            item.onclick = () => {
                inputUsuario.value = textoMostrar;
                contenedorSugerencias.style.display = "none";
            };
            contenedorSugerencias.appendChild(item);
        });

        contenedorSugerencias.style.display = "block";
        posicionarSugerencias();
    });

    // Cerrar sugerencias al hacer clic fuera
    document.addEventListener("click", (e) => {
        if (contenedorSugerencias && !contenedorSugerencias.contains(e.target) && e.target !== inputUsuario) {
            contenedorSugerencias.style.display = "none";
        }
    });

    // Recalcular posición si cambia el tamaño de ventana o scroll
    window.addEventListener("resize", posicionarSugerencias);
    window.addEventListener("scroll", posicionarSugerencias, true);
}

// 4. Inicializar las sugerencias
// Llamamos a esta función para activar el sistema
configurarSugerencias();
// Botón agregar
document.getElementById("btn_guardar").addEventListener("click", ()=>abrirModalFormulario("agregar"));


// Carga inicial
cargarUsuarios();
