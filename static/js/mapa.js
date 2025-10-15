// --- CONFIGURACIÓN GENERAL ---
const API_URL = '/api/parroquia/datos';
const GEOJSON_URL = '/static/data/peru_distrital_simple.geojson';
const DEPARTAMENTO_FILTRO = 'LAMBAYEQUE';

const mapBounds = [
    [-7.5, -80.8], // Suroeste
    [-5.8, -79.0]  // Noreste
];
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

// --- FUNCIÓN AUXILIAR ---
const normalizar = txt => (txt || '').trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ''); // quita tildes

// --- INICIALIZACIÓN DEL MAPA ---
function initMap() {
    map = L.map('gps', {
        maxBounds: mapBounds,
        minZoom: 9.5
    }).setView(mapCenter, zoomInicial);

    map.setMaxBounds(mapBounds);
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
                const colores = {
                    CHICLAYO: '#4CAF50',
                    'FERREÑAFE': '#E91E63',
                    LAMBAYEQUE: '#FFEB3B'
                };
                return {
                    fillColor: colores[f.properties.NOMBPROV] || '#3388ff',
                    weight: 1.5,
                    color: 'white',
                    fillOpacity: 0.7
                };
            },
            onEachFeature: (f, layer) => {
                layer.bindPopup(
                    `<b>Distrito:</b> ${f.properties.NOMBDIST}<br><b>Provincia:</b> ${f.properties.NOMBPROV}`
                );
            }
        }).addTo(map);

        setTimeout(() => map.invalidateSize(), 300);
    } catch (e) {
        console.error("Error al cargar GeoJSON:", e);
    }
}

// --- CARGAR PARROQUIAS DESDE API ---
async function cargarParroquias() {
    try {
        markerClusterGroup.clearLayers();
        markersByName = {};

        const resp = await fetch(API_URL);
        const { datos } = await resp.json();
        if (!Array.isArray(datos)) throw new Error("Formato de datos inválido");

        datos.forEach(p => {
            if (!p.latParroquia || !p.logParroquia) return;

            const popup = `
                <div style="font-family: Arial, sans-serif; max-width: 250px;">
                    <h4 style="color:#007bff;margin:0">${p.nombParroquia}</h4>
                    <p style="color:#555;font-style:italic">${p.descripcionBreve || 'Sin descripción breve.'}</p>
                    <hr>
                    <p><strong>Dirección:</strong> ${p.direccion || 'No disponible'}</p>
                    <p><strong>Teléfono:</strong> ${p.telefonoContacto || 'No disponible'}</p>
                    <p><strong>Horario:</strong> ${p.horaAtencionInicial || ''} - ${p.horaAtencionFinal || 'Cerrado'}</p>
                    <button onclick="mostrarDetallesParroquia('${p.idParroquia || ''}')"
                        style="background:#007bff;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">
                        Ver Detalles
                    </button>
                    <button onclick="mostrarCalendarioParroquia('${p.idParroquia || ''}')"
                        style="background:#00a135;color:#fff;border:none;padding:5px 10px;border-radius:5px;cursor:pointer;">
                        Ver calendario
                    </button>
                </div>`;

            const marker = L.marker([p.latParroquia, p.logParroquia], { icon: ChurchIcon })
                .bindPopup(popup);

            markerClusterGroup.addLayer(marker);
            markersByName[normalizar(p.nombParroquia)] = marker;
        });
    } catch (e) {
        console.error("Error al cargar parroquias:", e);
    }
}

// --- BUSCAR PARROQUIA ---
function buscarParroquia(nombre) {
    const marker = markersByName[normalizar(nombre)];
    if (!marker) {
        alert("No se encontró la parroquia.");
        console.warn("Disponibles:", Object.keys(markersByName));
        return;
    }

    const originalIcon = marker.options.icon;
    marker.setIcon(ChurchIconHighlight);
    map.setView(marker.getLatLng(), 16, { animate: true });
    marker.openPopup();
    setTimeout(() => marker.setIcon(originalIcon), 1200);
}


// --- DETALLES ---
function mostrarDetallesParroquia(id) {
    console.log(`Ver detalles de parroquia ID: ${id}`);

    // Guardamos el ID en localStorage
    localStorage.setItem('idParroquiaSeleccionada', id);

    // Redirigimos correctamente a la página dentro de la carpeta "site"
    window.location.href = '/cliente/detalle_parroquia';
}

function mostrarCalendarioParroquia(id) {
    console.log('Ver calendario de parroquia ID:${id}');
    localStorage.setItem('idParroquiaSeleccionada',id);
    window.location.href='/cliente/calendario';
}


// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', async () => {
    initMap();
    await cargarLimitesGeograficos();
    await cargarParroquias();

    const input = document.getElementById('input-parroquia');
    const boton = document.getElementById('btn-buscar');

    if (input && boton) {
        boton.addEventListener('click', () => buscarParroquia(input.value));
        input.addEventListener('keydown', e => e.key === 'Enter' && buscarParroquia(input.value));
    }
});

