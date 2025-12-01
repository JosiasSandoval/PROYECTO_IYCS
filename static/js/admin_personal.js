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
        const botonColor = esActivo ? "btn-orange" : "btn-success";
        const rotacion = esActivo ? "" : "transform: rotate(180deg);";
        const tituloBoton = esActivo ? 'Dar de baja' : 'Dar de alta';


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
                    <button class="btn ${botonColor} btn-sm"  onclick="darDeBajaPersonal(${u.id})" title="${esActivo ? 'Dar de baja' : 'Dar de alta'}">
                        <img src="/static/img/flecha-hacia-abajo.png" alt="estado" style="${rotacion}; ">
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
