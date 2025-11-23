document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');

    if (!headerPlaceholder) {
        console.error('❌ No se encontró el placeholder del header. Asegúrate de tener <div id="header-placeholder"></div> en tu HTML.');
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
            
            // Elementos de texto a actualizar
            const nombreEl = document.getElementById('header_nombre_usuario');
            const cargoEl = document.getElementById('header_cargo_usuario');
            const rolEl = document.getElementById('rol_actual'); // 💡 AGREGADO

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
                        if (rolEl) rolEl.textContent = userData.rol; // 💡 ACTUALIZACIÓN DEL ROL
                    } else {
                        // Si no hay sesión válida
                        if (nombreEl) nombreEl.textContent = "Visitante";
                        if (cargoEl) cargoEl.textContent = "Invitado";
                        if (rolEl) rolEl.textContent = "Invitado";
                    }
                })
                .catch(err => {
                    console.error("Error al cargar datos de sesión:", err);
                    if (nombreEl) nombreEl.textContent = "Visitante";
                });

            // ============================================================
            // 4. LOGOUT (CIERRE DE SESIÓN)
            // ============================================================
            if (btnCerrarSesion) {
                btnCerrarSesion.addEventListener('click', (e) => {
                    e.preventDefault(); 
                    window.location.href = '/api/auth/cerrar_sesion';
                });
            }

        })
        .catch(error => {
            console.error('❌ Error crítico al cargar el header:', error);
            headerPlaceholder.innerHTML = "<div style='color: red; text-align: center; padding: 10px;'>Error de carga del encabezado.</div>";
        });
});

