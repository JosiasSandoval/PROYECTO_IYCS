// ============================================================
// BARRA LATERAL - CARGA DINÁMICA + FILTRADO POR ROL
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

            // =====================================================
            // 1️⃣ OBTENER ROL DESDE LA SESIÓN Y FILTRAR
            // =====================================================
            fetch('/api/auth/get_session_data', { credentials: 'same-origin' })
                .then(res => res.json())
                .then(sessionData => {
                    const rolUsuario = sessionData.rol_actual;
                    console.log("ROL DETECTADO:", rolUsuario);
                    filtrarMenuPorRol(rolUsuario, barraPlaceholder);
                })
                .catch(err => console.error("Error al obtener rol:", err));


            // =====================================================
            // 2️⃣ ACTIVAR LOS DESPLEGABLES
            // =====================================================
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


// ============================================================
// FUNCIÓN: OCULTAR ELEMENTOS SEGÚN ROL
// ============================================================

function filtrarMenuPorRol(rol, contenedor) {
    if (!rol) {
        console.warn("⚠ No se recibió rol, no se filtrará nada.");
        return;
    }

    console.log("Filtrando menú para rol:", rol);

    // Primero ocultamos TODO
    const items = contenedor.querySelectorAll(
        ".feligres-only, .secretaria-only, .sacerdote-only, .admin-only"
    );
    items.forEach(i => i.style.display = "none");

    // Luego mostramos solo lo permitido
    switch (rol) {
        case "Feligres":
            mostrarItems(contenedor, ".feligres-only");
            break;

        case "Secretaria":
            mostrarItems(contenedor, ".secretaria-only");
            // Secretaria también puede reservar y ver sus reservas
            mostrarItems(contenedor, ".feligres-only");
            break;

        case "Sacerdote":
            mostrarItems(contenedor, ".sacerdote-only");
            // Sacerdote NO ve feligres-only ni secretaria-only
            break;

        case "Administrador":
            // Admin ve TODO
            items.forEach(i => i.style.display = "block");
            break;

        default:
            console.warn("⚠ Rol no reconocido:", rol);
    }
}


// ============================================================
// FUNCIÓN AUXILIAR PARA MOSTRAR ITEMS
// ============================================================

function mostrarItems(contenedor, selector) {
    contenedor.querySelectorAll(selector).forEach(i => {
        i.style.display = "block";
    });
}
