// --- CONFIGURACIÓN GENERAL ---
const API_URL = '/api/parroquia/datos';
const mapBounds = [[-7.5, -80.8], [-5.8, -79.0]];
const mapCenter = [-6.6, -79.8];
const zoomInicial = 10;

// --- ICONOS ---
const ChurchIcon = L.icon({
    iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});

const ChurchIconHighlight = L.icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
    iconSize: [50, 50],
    iconAnchor: [25, 50],
    popupAnchor: [0, -50]
});

// --- VARIABLES GLOBALES ---
let map, markerClusterGroup, markersByName = {};
let marcadorResaltado = null;

// --- ROL Y USUARIO ---
const rawRol = document.body.dataset.rol || '';
const rolUsuario = rawRol.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
const idUsuario = document.body.dataset.id;
const idParroquiaUsuario = document.body.dataset.parroquia;

// Debug en consola
console.log(`Rol detectado: "${rawRol}" -> Normalizado: "${rolUsuario}"`);

// --- FUNCIONES ---
function initMap() {
    map = L.map('gps', { maxBounds: mapBounds, minZoom: 9.5 }).setView(mapCenter, zoomInicial);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    markerClusterGroup = L.markerClusterGroup().addTo(map);
}

async function cargarParroquias() {
    try {
        markerClusterGroup.clearLayers();
        markersByName = {};

        const resp = await fetch(API_URL);
        const { datos } = await resp.json();
        if (!Array.isArray(datos)) throw new Error("Formato inválido");

        datos.forEach(p => {
            if (!p.latParroquia || !p.logParroquia) return;

            const mostrarBotonReserva = (rolUsuario === 'feligres' || rolUsuario === 'administrador') ? `
                <button onclick="mostrarInformacionParroquia('${p.idParroquia}')"
                    style="background:#00a135;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">
                    Más información
                </button>` : '';

            const popupContent = `
                <div style="font-family: Arial, sans-serif; max-width:250px;">
                    <h4 style="color:#007bff;margin:0">${p.nombParroquia}</h4>
                    <p style="color:#555;font-style:italic">${p.descripcionBreve || 'Sin descripción breve.'}</p>
                    <hr>
                    <p><strong>Dirección:</strong> ${p.direccion || 'No disponible'}</p>
                    <p><strong>Teléfono:</strong> ${p.telefonoContacto || 'No disponible'}</p>
                    <p><strong>Horario:</strong> ${p.horaAtencionInicial || ''} - ${p.horaAtencionFinal || 'Cerrado'}</p>
                    ${mostrarBotonReserva}
                </div>`;

            const marker = L.marker([p.latParroquia, p.logParroquia], { icon: ChurchIcon })
                .bindPopup(popupContent);

            markerClusterGroup.addLayer(marker);

            const nombreNorm = p.nombParroquia.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
            markersByName[nombreNorm] = { marker, id: p.idParroquia, nombre: p.nombParroquia };
        });

    } catch(e) {
        console.error("Error al cargar parroquias:", e);
    }
}

// --- FUNCION PARA BOTON "MAS INFORMACION" ---
function mostrarInformacionParroquia(idParroquia) {
    const entry = Object.values(markersByName).find(p => String(p.id) === String(idParroquia));
    if (entry) {
        sessionStorage.setItem('idParroquiaSeleccionada', entry.id);
        sessionStorage.setItem('nombreParroquiaSeleccionada', entry.nombre);
    }
    window.location.href = '/cliente/detalle_parroquia';
}

function restaurarParroquias() {
    markerClusterGroup.clearLayers();
    Object.values(markersByName).forEach(p => {
        p.marker.setIcon(ChurchIcon);
        markerClusterGroup.addLayer(p.marker);
    });
    marcadorResaltado = null;
}

function buscarParroquia(valor) {
    const valNorm = valor.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
    if (!valNorm) {
        restaurarParroquias();
        return;
    }

    const entry = markersByName[valNorm];
    if (!entry) {
        alert("No se encontró la parroquia.");
        return;
    }

    const { marker, id, nombre } = entry;

    sessionStorage.setItem('idParroquiaSeleccionada', id);
    sessionStorage.setItem('nombreParroquiaSeleccionada', nombre);

    if (marcadorResaltado && marcadorResaltado !== marker) {
        marcadorResaltado.setIcon(ChurchIcon);
    }
    marker.setIcon(ChurchIconHighlight);
    marcadorResaltado = marker;

    markerClusterGroup.clearLayers();
    marker.addTo(map);

    map.setView(marker.getLatLng(), 16, { animate: true });
    setTimeout(() => marker.openPopup(), 300);

    const input = document.getElementById('input-parroquia');
    if (input) input.value = nombre;
}

function crearModalReserva() {
    const modal = document.createElement('div');
    modal.id = 'modal-confirmar';
    modal.style.cssText = `
        display:none; position:fixed; top:0; left:0;
        width:100%; height:100%; background:rgba(0,0,0,0.5);
        justify-content:center; align-items:center; z-index:9999;
    `;
    modal.innerHTML = `
        <div style="background:white;padding:20px;border-radius:10px;max-width:400px;width:90%;text-align:center;">
            <p id="modal-texto">¿Quieres esta parroquia?</p>
            <div style="margin-top:20px;display:flex;justify-content:space-around;">
                <button id="modal-si" style="padding:10px 20px;background:#007bff;color:white;border:none;border-radius:5px;cursor:pointer;">Sí</button>
                <button id="modal-no" style="padding:10px 20px;background:#dc3545;color:white;border:none;border-radius:5px;cursor:pointer;">No</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    return modal;
}

const modalReserva = crearModalReserva();
const modalTexto = document.getElementById('modal-texto');
const modalSi = document.getElementById('modal-si');
const modalNo = document.getElementById('modal-no');

function abrirModalReserva(nombre, id) {
    const rolesPermitidos = ['feligres', 'secretaria', 'sacerdote', 'administrador'];
    if (!rolesPermitidos.includes(rolUsuario)) {
        alert("Usted no puede hacer reservas.");
        return;
    }

    modalTexto.textContent = `¿Quieres esta parroquia: "${nombre}"?`;
    modalReserva.style.display = 'flex';

    modalSi.onclick = () => {
        sessionStorage.setItem('idParroquiaSeleccionada', id);
        sessionStorage.setItem('nombreParroquiaSeleccionada', nombre);
        window.location.href = `/cliente/reserva_acto`;
    };

    modalNo.onclick = () => { modalReserva.style.display = 'none'; };
}

modalReserva.addEventListener('click', e => {
    if (e.target === modalReserva) modalReserva.style.display = 'none';
});

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {

    // Permitir ver el mapa a todos los roles (feligres, secretaria, sacerdote, administrador)
    // Solo restringir la funcionalidad de hacer reservas
    const rolesPermitidosReserva = ['feligres', 'secretaria', 'sacerdote', 'administrador'];
    if (!rolesPermitidosReserva.includes(rolUsuario)) {
        console.warn(`Bloqueo de seguridad: Rol '${rolUsuario}' no autorizado.`);
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.innerHTML = `<p style="color:red;font-size:18px;text-align:center;margin-top:50px;">
                Acceso denegado. Rol detectado: ${rawRol}
            </p>`;
        }
        return;
    }

    initMap();
    await cargarParroquias();

    const input = document.getElementById('input-parroquia');

    // Restaurar selección previa
    const idGuardado = sessionStorage.getItem('idParroquiaSeleccionada');
    const nombreGuardado = sessionStorage.getItem('nombreParroquiaSeleccionada');
    if (idGuardado && nombreGuardado && input) {
        input.value = nombreGuardado;
        setTimeout(() => buscarParroquia(nombreGuardado), 600);
    }

    // AUTOCOMPLETADO FELIGRES
    if (rolUsuario === 'feligres' && input) {
        input.addEventListener('input', e => {
            const valor = e.target.value;
            const lista = document.getElementById('sugerencias');
            if (!lista) return;
            lista.innerHTML = '';
            if (!valor) {
                restaurarParroquias();
                return;
            }
            const valNorm = valor.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
            Object.values(markersByName)
                .filter(p => p.nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').includes(valNorm))
                .forEach(p => {
                    const li = document.createElement('li');
                    li.textContent = p.nombre;
                    li.style.cursor = 'pointer';
                    li.addEventListener('click', () => {
                        input.value = p.nombre;
                        lista.innerHTML = '';
                        buscarParroquia(p.nombre);
                    });
                    lista.appendChild(li);
                });
        });

        input.addEventListener('keydown', e => { if (e.key === 'Enter') buscarParroquia(input.value); });
        const btnBuscar = document.getElementById('btn-buscar');
        if (btnBuscar) btnBuscar.addEventListener('click', () => buscarParroquia(input.value));
    }

    // SECRETARIA Y SACERDOTE - seleccionar automáticamente su parroquia
    if ((rolUsuario === 'secretaria' || rolUsuario === 'sacerdote') && idParroquiaUsuario) {
        setTimeout(() => {
            const parroquia = Object.values(markersByName).find(p => String(p.id) === String(idParroquiaUsuario));
            if (parroquia) {
                buscarParroquia(parroquia.nombre);
                if (input) input.value = parroquia.nombre;
                // Guardar en sessionStorage automáticamente
                sessionStorage.setItem('idParroquiaSeleccionada', parroquia.id);
                sessionStorage.setItem('nombreParroquiaSeleccionada', parroquia.nombre);
                console.log(`✅ ${rolUsuario} - Parroquia cargada automáticamente: ${parroquia.nombre}`);
            } else {
                console.log(`No se encontró la parroquia asignada al ${rolUsuario} en el mapa.`);
            }
        }, 1000);
    }

    // BOTÓN SIGUIENTE
    const btnSiguiente = document.querySelector('.btn-siguiente');
    if (btnSiguiente) {
        btnSiguiente.addEventListener('click', () => {
            if (!marcadorResaltado) {
                alert("Selecciona una parroquia antes de continuar.");
                return;
            }
            abrirModalReserva(
                sessionStorage.getItem('nombreParroquiaSeleccionada'),
                sessionStorage.getItem('idParroquiaSeleccionada')
            );
        });
    }

    window.addEventListener('resize', () => { if (map) map.invalidateSize({ animate: true }); });
});
