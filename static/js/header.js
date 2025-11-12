// ============================================================
// HEADER GENERAL - CARGA Y CONFIGURACIÓN DEL MODAL USUARIO
// ============================================================

document.addEventListener('DOMContentLoaded', () => {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) {
        console.error('❌ No se encontró el placeholder del header');
        return;
    }

    // 🔹 Cargar el header (común para todos los HTML)
    fetch('/static/templates/header.html')
        .then(response => response.text())
        .then(data => {
            headerPlaceholder.innerHTML = data;

            // ✅ Referencias después de cargar el header
            const btnUsuario = headerPlaceholder.querySelector('#btn_usuario');
            const modalUsuario = headerPlaceholder.querySelector('#modal_usuario');
            const btnCerrarSesion = headerPlaceholder.querySelector('#btn_cerrar_sesion');

            // ==========================
            // 🔸 Modal Usuario
            // ==========================
            if (btnUsuario && modalUsuario) {
                btnUsuario.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    modalUsuario.classList.toggle('mostrar');
                });

                // Cerrar el modal si se hace clic fuera
                document.addEventListener('click', (e) => {
                    if (!modalUsuario.contains(e.target) && !btnUsuario.contains(e.target)) {
                        modalUsuario.classList.remove('mostrar');
                    }
                });

                // Cerrar el modal con la tecla Esc
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape') {
                        modalUsuario.classList.remove('mostrar');
                    }
                });
            }

            // ==========================
            // 🔸 Cerrar Sesión
            // ==========================
            if (btnCerrarSesion) {
                btnCerrarSesion.addEventListener('click', () => {
                    window.location.href = '/cerrar_sesion';
                });
            }

        })
        .catch(error => console.error('❌ Error al cargar el header:', error));
});
