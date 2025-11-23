document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');

    if (!headerPlaceholder) {
        console.error('❌ No se encontró el placeholder del header');
        return;
    }

    // ============================================================
    // 1. CARGA DEL HTML ESTÁTICO (header.html)
    // ============================================================
    fetch('/static/templates/header.html')
        .then(response => {
            if (!response.ok) throw new Error('No se pudo cargar header.html');
            return response.text();
        })
        .then(data => {
            // Insertar el HTML en el DOM
            headerPlaceholder.innerHTML = data;

            // Referencias a elementos del DOM recién insertados
            const btnUsuario = headerPlaceholder.querySelector('#btn_usuario');
            const modalUsuario = headerPlaceholder.querySelector('#modal_usuario');
            const btnCerrarSesion = headerPlaceholder.querySelector('#btn_cerrar_sesion');
            const nombreEl = document.getElementById('header_nombre_usuario');
            const cargoEl = document.getElementById('header_cargo_usuario');

            // ============================================================
            // 2. LÓGICA VISUAL: MODAL DE USUARIO
            // ============================================================
            if (btnUsuario && modalUsuario) {
                // Abrir/Cerrar al hacer click en el icono
                btnUsuario.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation(); // Evita que el click se propague al document
                    modalUsuario.classList.toggle('mostrar');
                });

                // Cerrar si se hace click fuera del modal
                document.addEventListener('click', (e) => {
                    if (modalUsuario.classList.contains('mostrar') && 
                        !modalUsuario.contains(e.target) && 
                        !btnUsuario.contains(e.target)) {
                        modalUsuario.classList.remove('mostrar');
                    }
                });

                // Cerrar con tecla ESC
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        modalUsuario.classList.remove('mostrar');
                    }
                });
            }

            // ============================================================
            // 3. LÓGICA DE DATOS: OBTENER SESIÓN Y RELLENAR DATOS
            // ============================================================
            fetch('/api/auth/get_session_data', { credentials: 'same-origin' })
                .then(res => res.json())
                .then(userData => {
                    if (userData.success) {
                        if (nombreEl) nombreEl.textContent = userData.nombre;
                        if (cargoEl) cargoEl.textContent = userData.cargo;
                    } else {
                        // Si no hay sesión válida
                        if (nombreEl) nombreEl.textContent = "Visitante";
                        if (cargoEl) cargoEl.textContent = "Invitado";
                    }
                })
                .catch(err => {
                    console.error("Error al cargar datos de sesión:", err);
                    if (nombreEl) nombreEl.textContent = "Visitante";
                    if (cargoEl) cargoEl.textContent = "Invitado";
                });

            // ============================================================
            // 4. LOGOUT (CIERRE DE SESIÓN)
            // ============================================================
            if (btnCerrarSesion) {
                btnCerrarSesion.addEventListener('click', (e) => {
                    e.preventDefault(); // Prevenir comportamiento por defecto si es un link
                    // Usamos la ruta de API que es más robusta según tu segundo script
                    window.location.href = '/api/auth/cerrar_sesion';
                });
            }

        })
        .catch(error => {
            console.error('❌ Error crítico al cargar el header:', error);
            headerPlaceholder.innerHTML = "<div style='color: red; text-align: center; padding: 10px;'>Error de carga.</div>";
        });
});