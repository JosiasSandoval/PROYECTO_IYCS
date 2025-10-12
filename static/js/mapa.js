// --- CONFIGURACIÓN DE RUTAS Y CONSTANTES ---
const API_URL = '/api/parroquia/datos'; 
const GEOJSON_URL = '/static/data/peru_distrital_simple.geojson'; 
const DEPARTAMENTO_FILTRO = 'LAMBAYEQUE'; 

// LÍMITES para centrar y bloquear la vista solo en Lambayeque
const BOUNDS_LAMBAYEQUE = [
    [-7.5, -80.8], // Suroeste
    [-5.8, -79.0]  // Noreste
];
const COORDENADAS_CENTRALES = [-6.6, -79.8]; 
// Ajustamos el zoom a 10.0 para un mejor encuadre inicial
const NIVEL_ZOOM_INICIAL = 10.0; 

// Inicialización del mapa
// Usamos el ID 'gps' y configuramos los límites de la vista
const map = L.map('gps', {
    maxBounds: BOUNDS_LAMBAYEQUE, 
    // Mantenemos el minZoom en 9.5 para flexibilidad si es necesario
    minZoom: 9.5 
}).setView(COORDENADAS_CENTRALES, NIVEL_ZOOM_INICIAL);

// Asegura que el límite se aplique al arrastrar
map.setMaxBounds(BOUNDS_LAMBAYEQUE); 

// Grupo para la agrupación de marcadores (clustering)
let markerClusterGroup = L.markerClusterGroup(); 

// Añade la capa base de OpenStreetMap
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 🛑 FUNCIÓN CLAVE: Forzar el reajuste del tamaño del mapa
function ajustarMapaAlContenedor() {
    // Usamos un pequeño retraso para asegurar que la grilla CSS esté estable
    setTimeout(() => {
        map.invalidateSize();
        console.log("Mapa ajustado al contenedor: invalidateSize aplicado.");
    }, 300);
}


// --- FUNCIONES DE ESTILO (Colorea por Provincia) ---
function stylePolygons(feature) {
    const provincia = feature.properties.NOMBPROV; 
    let color;
    
    if (provincia === 'CHICLAYO') {
        color = '#4CAF50'; // Verde
    } else if (provincia === 'FERREÑAFE') {
        color = '#E91E63'; // Rosado
    } else if (provincia === 'LAMBAYEQUE') {
        color = '#FFEB3B'; // Amarillo
    } else {
        color = '#3388ff';
    }

    return {
        fillColor: color,
        weight: 1.5,
        opacity: 1,
        color: 'white', 
        fillOpacity: 0.7 
    };
}


// --- 3. CARGA DE LÍMITES GEOGRÁFICOS (GeoJSON de Distritos) ---
async function cargarLimitesGeograficos() {
    try {
        const response = await fetch(GEOJSON_URL);
        if (!response.ok) {
            throw new Error(`Error al cargar el GeoJSON: ${response.status}. Revisa si el archivo está en /static/data/`);
        }
        
        const limitesGeoJson = await response.json();

        L.geoJSON(limitesGeoJson, {
            filter: function(feature, layer) {
                return feature.properties.NOMBDEP === DEPARTAMENTO_FILTRO; 
            },
            style: stylePolygons, 
            onEachFeature: function (feature, layer) {
                const nombreDistrito = feature.properties.NOMBDIST;
                const nombreProvincia = feature.properties.NOMBPROV;
                layer.bindPopup(`<b>Distrito:</b> ${nombreDistrito}<br><b>Provincia:</b> ${nombreProvincia}`);
            }
        }).addTo(map);

        cargarParroquias(); 
        
        // 🛑 LLAMADA CLAVE: Esto solucionará el problema del "cuadrado descuadrado"
        ajustarMapaAlContenedor(); 

    } catch (error) {
        console.error("Error al cargar los límites GeoJSON:", error);
    }
}


// --- 4. CARGA DE MARCADORES CON CLUSTERING ---
async function cargarParroquias() {
    markerClusterGroup.clearLayers();

    try {
        const response = await fetch(API_URL);
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}. ¿Está tu ruta /api/parroquia/datos funcionando?`);
        }
        
        const data = await response.json();
        
        data.datos.forEach(p => {
            const popupContent = `
                <b>${p.nombParroquia}</b><br>
                Distrito: ${p.nombDistrito}<br>
                Descripción: ${p.descripcionBreve}
            `;
            const marker = L.marker([p.latParroquia, p.logParroquia]).bindPopup(popupContent);
            
            markerClusterGroup.addLayer(marker);
        });

        if (!map.hasLayer(markerClusterGroup)) {
            map.addLayer(markerClusterGroup);
        }

    } catch (error) {
        console.error("No se pudo cargar la información de las parroquias:", error);
    }
}

// Inicia el proceso
cargarLimitesGeograficos();