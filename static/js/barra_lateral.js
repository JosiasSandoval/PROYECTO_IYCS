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
                .then(res => {
                    if (!res.ok) {
                        throw new Error(`HTTP ${res.status}`);
                    }
                    return res.json();
                })
                .then(sessionData => {
                    const rolUsuario = sessionData.rol_actual || sessionData.rol_sistema;
                    console.log("ROL DETECTADO:", rolUsuario);
                    if (rolUsuario) {
                        filtrarMenuPorRol(rolUsuario, barraPlaceholder);
                    } else {
                        console.warn("⚠ No se pudo obtener el rol del usuario");
                    }
                })
                .catch(err => {
                    console.error("Error al obtener rol:", err);
                    // Intentar obtener el rol desde el body dataset como fallback
                    const rolBody = document.body.dataset.rol;
                    if (rolBody) {
                        console.log("Usando rol del body dataset:", rolBody);
                        filtrarMenuPorRol(rolBody, barraPlaceholder);
                    }
                });


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

    // Normalizar el rol (case-insensitive)
    const rolNormalizado = rol.toLowerCase();

    // Primero ocultamos TODO
    const items = contenedor.querySelectorAll(
        ".feligres-only, .secretaria-only, .sacerdote-only, .admin-only"
    );
    items.forEach(i => i.style.display = "none");

    // También ocultar los grupos de menú que tienen clases de rol
    const gruposMenu = contenedor.querySelectorAll(".menu-grupo");
    gruposMenu.forEach(grupo => {
        if (grupo.classList.contains("admin-only") || 
            grupo.classList.contains("secretaria-only") || 
            grupo.classList.contains("sacerdote-only")) {
            grupo.style.display = "none";
        }
    });

    // Luego mostramos solo lo permitido según el rol
    switch (rolNormalizado) {
        case "feligres":
            mostrarItems(contenedor, ".feligres-only");
            break;

        case "secretaria":
            mostrarItems(contenedor, ".secretaria-only");
            // Secretaria también puede reservar y ver sus reservas
            mostrarItems(contenedor, ".feligres-only");
            // Mostrar grupos de menú para secretaria (verificar si contiene la clase secretaria-only)
            contenedor.querySelectorAll(".menu-grupo").forEach(grupo => {
                if (grupo.classList.contains("secretaria-only")) {
                    grupo.style.display = "block";
                }
            });
            break;

        case "sacerdote":
            mostrarItems(contenedor, ".sacerdote-only");
            // Mostrar grupos de menú para sacerdote (verificar si contiene la clase sacerdote-only)
            contenedor.querySelectorAll(".menu-grupo").forEach(grupo => {
                if (grupo.classList.contains("sacerdote-only")) {
                    grupo.style.display = "block";
                }
            });
            break;

        case "administrador":
            // Admin ve TODO
            items.forEach(i => i.style.display = "block");
            gruposMenu.forEach(g => g.style.display = "block");
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
