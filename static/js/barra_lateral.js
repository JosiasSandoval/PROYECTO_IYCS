// ============================================================
// BARRA LATERAL - CARGA DINÁMICA
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const barraPlaceholder = document.getElementById('barra_lateral-placeholder');
    if (!barraPlaceholder) {
        console.error('❌ No se encontró el placeholder de la barra lateral');
        return;
    }

    // 🔹 Cargar la barra lateral desde el template
    fetch('/static/templates/barra_lateral.html')
        .then(response => response.text())
        .then(data => {
            barraPlaceholder.innerHTML = data;

            // 🔹 Selecciona todos los botones desplegables dentro de la barra cargada
            const botonesDesplegables = barraPlaceholder.querySelectorAll(".boton-desplegable");

            botonesDesplegables.forEach((boton) => {
                boton.addEventListener("click", () => {
                    const submenu = boton.nextElementSibling;
                    if (submenu) {
                        submenu.classList.toggle("activo");
                        const flecha = boton.querySelector(".flecha");
                        if (flecha) {
                            flecha.textContent = submenu.classList.contains("activo") ? "▾" : "▸";
                        }
                    }
                });
            });
        })
        .catch(err => console.error("❌ Error al cargar la barra lateral:", err));
});
