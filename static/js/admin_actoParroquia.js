const tabla = document.querySelector("#tablaActosParroquia tbody");
const paginacion = document.getElementById("paginacionContainer");
const inputBusqueda = document.getElementById("inputBusqueda");

let datos = [];
let datosFiltrados = null;
let paginaActual = 1;
const elemPorPagina = 7;
let idEdicion = null;

let listaActos = [];
let listaParroquias = [];
let rolUsuarioActual = ""; 

document.addEventListener("DOMContentLoaded", () => {
    crearModalHTML(); 
    cargarCombos();   
    cargarDatos();    

    inputBusqueda.addEventListener("input", () => filtrar(inputBusqueda.value));
    
    // CORRECCIÓN: Prevenir el envío del form de búsqueda si dan Enter
    document.getElementById("formBusqueda").addEventListener("submit", (e) => e.preventDefault());

    document.getElementById("btn_buscar").addEventListener("click", () => filtrar(inputBusqueda.value));
    document.getElementById("btn_nuevo").addEventListener("click", () => abrirModal('agregar'));
    
    configurarSugerencias();
});

// ================== API & DATOS (MEJORADO) ==================
async function requestAPI(url, method = "GET", body = null) {
    try {
        const opts = { method, headers: { "Content-Type": "application/json" } };
        if (body) opts.body = JSON.stringify(body);
        
        const res = await fetch(url, opts);
        
        // CORRECCIÓN: Leer la respuesta como texto primero para evitar errores de JSON
        const text = await res.text(); 
        
        let data;
        try {
            data = JSON.parse(text); // Intentar convertir a JSON
        } catch (err) {
            // Si falla, es probable que el servidor devolvió un error HTML (500)
            console.error("Respuesta no es JSON:", text);
            throw new Error(`Error del servidor: ${res.statusText}`);
        }

        if (!res.ok) {
            throw new Error(data.error || data.mensaje || "Error en la solicitud");
        }
        return data;

    } catch (e) {
        console.error(e);
        alert(e.message); // Mostrar el error real
        return null;
    }
}

async function cargarCombos() {
    const res = await requestAPI("/api/acto_parroquia/combos");
    if (res) {
        listaActos = res.actos;
        listaParroquias = res.parroquias;
        rolUsuarioActual = res.rol_usuario;
        llenarSelectsModal();
    }
}

async function cargarDatos() {
    const res = await requestAPI("/api/acto_parroquia/");
    if (res) {
        datos = res;
        datosFiltrados = null;
        paginaActual = 1;
        renderTabla();
    }
}

// ================== TABLA ==================
function renderTabla() {
    tabla.innerHTML = "";
    const lista = datosFiltrados || datos;
    if (lista.length === 0) {
        tabla.innerHTML = '<tr><td colspan="7" style="text-align:center">No hay datos registrados</td></tr>';
        paginacion.innerHTML = "";
        return;
    }
    const inicio = (paginaActual - 1) * elemPorPagina;
    const items = lista.slice(inicio, inicio + elemPorPagina);
    
    items.forEach((d, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td class="col-id">${inicio + i + 1}</td>
            <td>${d.nombActo}</td>
            <td>${d.nombParroquia}</td>
            <td class="col-dia">${d.diaSemana}</td>
            <td class="col-hora">${d.horaInicio}</td>
            <td class="col-costo">${d.costoBase.toFixed(2)}</td>
            <td class="col-acciones">
                <div style="display:flex; justify-content:center; gap:5px;">
                    <button class="btn btn-info" onclick="ver(${d.id})" title="Ver detalle">
                        <img src="/static/img/ojo.png" alt="ver">
                    </button>
                    <button class="btn btn-warning" onclick="editar(${d.id})" title="Editar">
                        <img src="/static/img/lapiz.png" alt="editar">
                    </button>
                    <button class="btn btn-danger" onclick="eliminar(${d.id})" title="Eliminar">
                        <img src="/static/img/x.png" alt="eliminar">
                    </button>
                </div>
            </td>
        `;
        tabla.appendChild(tr);
    });
    renderPaginacion(lista.length);
}

function renderPaginacion(total) {
    paginacion.innerHTML = "";
    const pags = Math.ceil(total / elemPorPagina);
    if (pags <= 1) return;

    const ul = document.createElement("ul");
    ul.className = "pagination";

    // Helper para crear botones (normales o desactivados)
    const crearLi = (contenido, pageNum, claseExtra = "") => {
        const li = document.createElement("li");
        li.className = `page-item ${claseExtra}`;
        
        // Si es "...", lo mostramos como texto sin acción
        if (contenido === "...") {
            li.innerHTML = `<span class="page-link" style="color:#6c757d; cursor:default;">...</span>`;
        } else {
            // Botones normales
            li.innerHTML = `<button class="page-link">${contenido}</button>`;
            if (pageNum) {
                li.onclick = () => { paginaActual = pageNum; renderTabla(); };
            }
        }
        return li;
    };

    // 1. Botón "Anterior" (&laquo;)
    ul.appendChild(crearLi("&laquo;", paginaActual - 1, paginaActual === 1 ? "disabled" : ""));

    // 2. Lógica de Paginación Inteligente
    // delta = cuántos números mostrar a los lados de la página actual
    const delta = 1; 

    for (let i = 1; i <= pags; i++) {
        // Casos para MOSTRAR el número:
        // 1. Es la primera página (1)
        // 2. Es la última página (pags)
        // 3. Está dentro del rango vecino (actual - delta  A  actual + delta)
        if (i === 1 || i === pags || (i >= paginaActual - delta && i <= paginaActual + delta)) {
            ul.appendChild(crearLi(i, i, i === paginaActual ? "active" : ""));
        } 
        // Casos para MOSTRAR LOS PUNTOS (...):
        // Solo agregamos "..." si hay un hueco justo antes del rango vecino
        else if (i === paginaActual - delta - 1) {
            ul.appendChild(crearLi("...", null, "disabled"));
        }
        // O si hay un hueco justo después del rango vecino
        else if (i === paginaActual + delta + 1) {
            ul.appendChild(crearLi("...", null, "disabled"));
        }
    }

    // 3. Botón "Siguiente" (&raquo;)
    ul.appendChild(crearLi("&raquo;", paginaActual + 1, paginaActual === pags ? "disabled" : ""));

    paginacion.appendChild(ul);
}

// ================== BUSQUEDA ==================
function filtrar(txt) {
    txt = txt.toLowerCase().trim();
    if (!txt) { datosFiltrados = null; } 
    else {
        datosFiltrados = datos.filter(d => d.nombActo.toLowerCase().startsWith(txt));
    }
    paginaActual = 1;
    renderTabla();
    document.getElementById("sugerenciasContainer").style.display = "none";
}

function configurarSugerencias() {
    const cont = document.createElement("div");
    cont.id = "sugerenciasContainer";
    inputBusqueda.parentNode.appendChild(cont);
    
    inputBusqueda.addEventListener("input", () => {
        const txt = inputBusqueda.value.toLowerCase().trim();
        cont.innerHTML = "";
        if (!txt) { cont.style.display = "none"; return; }
        
        const sugs = datos.filter(d => d.nombActo.toLowerCase().startsWith(txt)).slice(0, 5);
        if (sugs.length === 0) { cont.style.display = "none"; return; }
        
        sugs.forEach(s => {
            const div = document.createElement("div");
            div.className = "sugerencia-item";
            div.textContent = s.nombActo; 
            div.onclick = () => { inputBusqueda.value = s.nombActo; filtrar(s.nombActo); };
            cont.appendChild(div);
        });
        cont.style.display = "block";
    });
    document.addEventListener("click", (e) => { if (!cont.contains(e.target) && e.target !== inputBusqueda) cont.style.display = "none"; });
}

// ================== MODAL & CRUD ==================
function crearModalHTML() {
    const div = document.createElement("div");
    // CORRECCIÓN: Se agrega onsubmit="event.preventDefault()" al form
    // CORRECCIÓN: Los botones tienen type="button" para no enviar form
    div.innerHTML = `
    <div id="modalForm" class="modal">
        <div class="modal-dialog">
            <div class="modal-header">
                <h5 id="modalTitulo">Programar Acto</h5>
                <button class="btn-icon" onclick="cerrarModal()" style="width:30px;height:30px;">&times;</button>
            </div>
            <div class="modal-body">
                <form id="formAP" onsubmit="event.preventDefault()">
                    <label>Acto Litúrgico</label>
                    <select id="selActo" class="form-control"></select>
                    
                    <label>Parroquia</label>
                    <select id="selParroquia" class="form-control"></select>
                    
                    <label>Día Semana</label>
                    <select id="selDia" class="form-control">
                        <option value="Lun">Lunes</option>
                        <option value="Mar">Martes</option>
                        <option value="Mié">Miércoles</option>
                        <option value="Jue">Jueves</option>
                        <option value="Vie">Viernes</option>
                        <option value="Sáb">Sábado</option>
                        <option value="Dom">Domingo</option>
                    </select>

                    <label>Hora Inicio</label>
                    <input type="time" id="inpHora" class="form-control">

                    <label>Costo Base (S/)</label>
                    <input type="number" id="inpCosto" class="form-control" step="0.01" min="0">
                </form>
            </div>
            <div class="modal-footer" id="modalFooter">
                <button type="button" class="btn-modal btn-secondary" onclick="cerrarModal()">Cancelar</button>
                <button type="button" class="btn-modal btn-primary" id="btnGuardarModal" onclick="guardar()">Guardar</button>
            </div>
        </div>
    </div>`;
    document.body.appendChild(div);
}

function llenarSelectsModal() {
    const selA = document.getElementById("selActo");
    const selP = document.getElementById("selParroquia");
    selA.innerHTML = ""; selP.innerHTML = "";
    listaActos.forEach(a => selA.add(new Option(a.nombre, a.id)));
    listaParroquias.forEach(p => selP.add(new Option(p.nombre, p.id)));
}

function abrirModal(modo, obj = null) {
    const modal = document.getElementById("modalForm");
    const titulo = document.getElementById("modalTitulo");
    const btnGuardar = document.getElementById("btnGuardarModal");
    const form = document.getElementById("formAP");
    
    // Resetear estados
    const inputs = form.querySelectorAll("input, select");
    inputs.forEach(el => el.disabled = false);
    btnGuardar.style.display = "inline-block";

    if (modo === 'agregar') {
        idEdicion = null;
        titulo.textContent = "Nueva Programación";
        form.reset();
    } else if (modo === 'editar' && obj) {
        idEdicion = obj.id;
        titulo.textContent = "Editar Programación";
        cargarDatosModal(obj);
    } else if (modo === 'ver' && obj) {
        titulo.textContent = "Detalle Programación";
        cargarDatosModal(obj);
        inputs.forEach(el => el.disabled = true);
        btnGuardar.style.display = "none";
    }

    const selParroquia = document.getElementById("selParroquia");
    if (rolUsuarioActual && rolUsuarioActual !== "Administrador") {
        if (listaParroquias.length > 0) selParroquia.value = listaParroquias[0].id;
        selParroquia.disabled = true; 
    }

    modal.classList.add("activo");
}

function cargarDatosModal(obj) {
    document.getElementById("selActo").value = obj.idActo;
    document.getElementById("selParroquia").value = obj.idParroquia;
    document.getElementById("selDia").value = obj.diaSemana; 
    document.getElementById("inpHora").value = obj.horaInicio;
    document.getElementById("inpCosto").value = obj.costoBase;
}

function cerrarModal() {
    document.getElementById("modalForm").classList.remove("activo");
}

// Helpers para botones
window.editar = function(id) {
    const obj = datos.find(x => x.id === id);
    if (obj) abrirModal('editar', obj);
};

window.ver = function(id) {
    const obj = datos.find(x => x.id === id);
    if (obj) abrirModal('ver', obj);
};

window.eliminar = async function(id) {
    if (!confirm("¿Eliminar permanentemente esta programación?")) return;
    const res = await requestAPI(`/api/acto_parroquia/eliminar/${id}`, "DELETE");
    if (res) cargarDatos();
};

window.guardar = async function() {
    const body = {
        idActo: document.getElementById("selActo").value,
        idParroquia: document.getElementById("selParroquia").value,
        dia: document.getElementById("selDia").value,
        hora: document.getElementById("inpHora").value,
        costo: document.getElementById("inpCosto").value
    };

    if (!body.idActo || !body.idParroquia || !body.hora || !body.costo) {
        alert("Complete todos los campos"); return;
    }

    let url = "/api/acto_parroquia/guardar";
    let method = "POST";

    if (idEdicion) {
        url = `/api/acto_parroquia/actualizar/${idEdicion}`;
        method = "PUT";
    }

    const res = await requestAPI(url, method, body);
    if (res) {
        cerrarModal();
        cargarDatos();
    }
};