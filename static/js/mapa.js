const mapaHTML=document.getElementById('mapa')
const ubicacionHTML=document.getElementById('gps')
const detalleParroquia=document.querySelector('.detalle')
document.addEventListener('DOMContentLoaded',async(e)=>{
    const api_mapa='/api/parroquia/datos'
    const mapa = L.map(MAP_CONTAINER_ID).setView([-9.19, -75.01], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(mapa);

    
})