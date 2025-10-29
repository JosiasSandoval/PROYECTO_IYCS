// --- CONFIGURACIÓN GENERAL ---
const API_URL = '/api/parroquia/datos';
const GEOJSON_URL = '/static/data/peru_distrital_simple.geojson';
const DEPARTAMENTO_FILTRO = 'LAMBAYEQUE';

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

let map, markerClusterGroup, markersByName = {};

// --- INICIALIZACIÓN DEL MAPA ---
function initMap() {
    map = L.map('gps', { maxBounds: mapBounds, minZoom: 9.5 }).setView(mapCenter, zoomInicial);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);
    markerClusterGroup = L.markerClusterGroup().addTo(map);
}

// --- CARGAR LÍMITES DEPARTAMENTALES ---
async function cargarLimitesGeograficos() {
    try {
        const resp = await fetch(GEOJSON_URL);
        const data = await resp.json();
        L.geoJSON(data, {
            filter: f => f.properties.NOMBDEP === DEPARTAMENTO_FILTRO,
            style: f => {
                const colores = { CHICLAYO: '#4CAF50', FERREÑAFE: '#E91E63', LAMBAYEQUE: '#FFEB3B' };
                return { fillColor: colores[f.properties.NOMBPROV] || '#3388ff', weight: 1.5, color: 'white', fillOpacity: 0.7 };
            },
            onEachFeature: (f, layer) => {
                layer.bindPopup(`<b>Distrito:</b> ${f.properties.NOMBDIST}<br><b>Provincia:</b> ${f.properties.NOMBPROV}`);
            }
        }).addTo(map);
        setTimeout(() => map.invalidateSize(), 300);
    } catch(e) { console.error("Error al cargar GeoJSON:", e); }
}

// --- CARGAR PARROQUIAS ---
async function cargarParroquias() {
    try {
        markerClusterGroup.clearLayers();
        markersByName = {};
        const resp = await fetch(API_URL);
        const { datos } = await resp.json();
        if (!Array.isArray(datos)) throw new Error("Formato inválido");

        datos.forEach(p => {
            if (!p.latParroquia || !p.logParroquia) return;

            const popupContent = `
                <div style="font-family: Arial, sans-serif; max-width:250px;">
                    <h4 style="color:#007bff;margin:0">${p.nombParroquia}</h4>
                    <p style="color:#555;font-style:italic">${p.descripcionBreve || 'Sin descripción breve.'}</p>
                    <hr>
                    <p><strong>Dirección:</strong> ${p.direccion || 'No disponible'}</p>
                    <p><strong>Teléfono:</strong> ${p.telefonoContacto || 'No disponible'}</p>
                    <p><strong>Horario:</strong> ${p.horaAtencionInicial || ''} - ${p.horaAtencionFinal || 'Cerrado'}</p>
                    <button onclick="mostrarDetallesParroquia('${p.idParroquia}')"
                        style="background:#007bff;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">
                        Ver Detalles
                    </button>
                    <button onclick="mostrarCalendarioParroquia('${p.idParroquia}')"
                        style="background:#00a135;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">
                        Ver calendario
                    </button>
                </div>`;

            const marker = L.marker([p.latParroquia, p.logParroquia], { icon: ChurchIcon })
                .bindPopup(popupContent);

            markerClusterGroup.addLayer(marker);

            // Guardar el marcador usando el nombre EXACTO tal como está en BD
            markersByName[p.nombParroquia] = { marker, id: p.idParroquia, nombre: p.nombParroquia };
        });

    } catch(e) { console.error("Error al cargar parroquias:", e); }
}

// --- BUSCAR PARROQUIA EXACTA ---
let marcadorResaltado = null;

// Función para restaurar todos los marcadores
function restaurarParroquias() {
    markerClusterGroup.clearLayers();
    Object.values(markersByName).forEach(p => {
        p.marker.setIcon(ChurchIcon); // Restaurar icono normal
        markerClusterGroup.addLayer(p.marker);
    });
    marcadorResaltado = null;
}

// --- BUSCAR PARROQUIA INSENSIBLE A MAYÚSCULAS/TILDES ---
function buscarParroquia(valor) {
    const valNorm = valor.trim().toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, '');

    // Restaurar si el input está vacío
    if (!valNorm) {
        restaurarParroquias();
        return;
    }

    const entry = Object.values(markersByName).find(p => 
        p.nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '') === valNorm
    );

    if (!entry) {
        alert("No se encontró la parroquia.");
        return;
    }

    const { marker, id, nombre } = entry;

    localStorage.setItem('idParroquiaSeleccionada', id);

    // Restaurar marcador previo resaltado
    if (marcadorResaltado && marcadorResaltado !== marker) {
        marcadorResaltado.setIcon(ChurchIcon);
    }

    // Resaltar marcador actual
    marker.setIcon(ChurchIconHighlight);
    marcadorResaltado = marker;

    // Mostrar solo este marcador
    markerClusterGroup.clearLayers();
    marker.addTo(map);

    map.setView(marker.getLatLng(), 16, { animate: true });
    setTimeout(() => marker.openPopup(), 300);

    const input = document.getElementById('input-parroquia');
    if (input) input.value = nombre;
}

// --- AUTOCOMPLETADO ---
function actualizarSugerencias(valor) {
    const lista = document.getElementById('sugerencias');
    lista.innerHTML = '';
    if (!valor) {
        restaurarParroquias(); // Restaurar si input está vacío
        return;
    }

    const valNorm = valor.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '');
    
    const coincidencias = Object.values(markersByName).filter(p => 
        p.nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '').includes(valNorm)
    );

    coincidencias.forEach(p => {
        const li = document.createElement('li');
        li.textContent = p.nombre;
        li.classList.add('sugerencia-item');
        li.style.cursor = 'pointer';
        li.addEventListener('click', () => {
            document.getElementById('input-parroquia').value = p.nombre;
            lista.innerHTML = '';
            buscarParroquia(p.nombre);
        });
        lista.appendChild(li);
    });
}

// --- OCULTAR SUGERENCIAS AL CLIC FUERA ---
document.addEventListener('click', e => {
    const lista = document.getElementById('sugerencias');
    const input = document.getElementById('input-parroquia');
    if (!input.contains(e.target) && !lista.contains(e.target)) lista.innerHTML = '';
});

// --- DETALLES / CALENDARIO ---
function mostrarDetallesParroquia(id) {
    localStorage.setItem('idParroquiaSeleccionada', id);
    window.location.href = '/cliente/detalle_parroquia';
}
function mostrarCalendarioParroquia(id) {
    localStorage.setItem('idParroquiaSeleccionada', id);
    window.location.href = '/cliente/calendario';
}

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await cargarLimitesGeograficos();
    await cargarParroquias();

    const input = document.getElementById('input-parroquia');
    const btnBuscar = document.getElementById('btn-buscar');

    if (input) {
        input.addEventListener('input', e => actualizarSugerencias(e.target.value));
        input.addEventListener('keydown', e => { if (e.key === 'Enter') buscarParroquia(input.value); });
    }

    if (btnBuscar) {
        btnBuscar.addEventListener('click', () => { if (input.value.trim() !== '') buscarParroquia(input.value); });
    }

    window.addEventListener('resize', () => { if (map) map.invalidateSize({ animate: true }); });
});

// --- MODAL DINÁMICO ---
function crearModalReserva() {
    const modal = document.createElement('div');
    modal.id = 'modal-confirmar';
    modal.style.cssText = `
        display:none;
        position:fixed;
        top:0; left:0;
        width:100%; height:100%;
        background:rgba(0,0,0,0.5);
        justify-content:center;
        align-items:center;
        z-index:9999;
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
    modalTexto.textContent = `¿Quieres esta parroquia: "${nombre}"?`;
    modalReserva.style.display = 'flex';

    modalSi.onclick = () => {
        localStorage.setItem('idParroquiaSeleccionada', id);
        // Pasar al siguiente step o HTML
        window.location.href = 'reserva_acto';// Cambia por tu ruta real
    };

    modalNo.onclick = () => {
        modalReserva.style.display = 'none';
    };
}

// Cerrar modal si se hace click fuera
modalReserva.addEventListener('click', e => {
    if (e.target === modalReserva) modalReserva.style.display = 'none';
});

// --- BOTÓN SIGUIENTE RESERVA ---
const btnSiguiente = document.querySelector('.btn-siguiente');
if (btnSiguiente) {
    btnSiguiente.addEventListener('click', () => {
        const input = document.getElementById('input-parroquia');
        const nombreParroquia = input.value.trim();

        if (!nombreParroquia) {
            alert("Selecciona una parroquia antes de continuar.");
            return;
        }

        // Buscar parroquia en markersByName (objeto cargado en mapa.js)
        const entry = Object.values(markersByName).find(p =>
            p.nombre.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '') ===
            nombreParroquia.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, '')
        );

        if (!entry) {
            alert("Parroquia no encontrada. Selecciona una de las sugerencias.");
            return;
        }

        abrirModalReserva(entry.nombre, entry.id);
    });
}
